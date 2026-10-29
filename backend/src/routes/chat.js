const { randomUUID } = require("node:crypto");
const db = require("../../data/connection.js");
const { sendMessageToUser } = require("../chatHandler.js");


function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}
function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });
}
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

async function isEitherBlocked(userA, userB) {
  const row = await dbGet(
    `
    SELECT 1
    FROM blocks
    WHERE (blocker_id = ? AND blocked_id = ?)
       OR (blocker_id = ? AND blocked_id = ?)
    LIMIT 1
  `,
    [userA, userB, userB, userA]
  );
  return !!row;
}

module.exports = [
  {
    method: "POST",
    url: "/api/chat",
    handler: async (request, reply) => {
      if (!request.isAuthenticated) return reply.send({ success: false, code: 1 });

      try {
        const { targetId } = request.body;
        const currentUserId = request.user.userId;

        if (!currentUserId || !targetId) {
          return reply.code(200).send({ success: false, error: "Utilisateurs non spécifiés" });
        }
        if (currentUserId === targetId) {
          return reply
            .code(200)
            .send({ success: false, error: "Impossible de créer une conversation avec soi-même" });
        }

        const existingConv = await dbGet(
          `
          SELECT c.id, c.type
          FROM conversations c
          JOIN conversation_members m1 ON c.id = m1.conversation_id
          JOIN conversation_members m2 ON c.id = m2.conversation_id
          WHERE c.type = 'private'
          AND m1.user_id = ?
          AND m2.user_id = ?
        `,
          [currentUserId, targetId]
        );

        let convId;
        let type = "private";

        if (existingConv) {
          convId = existingConv.id;
          type = existingConv.type;
        } else {
          convId = randomUUID();
          await dbRun(`INSERT INTO conversations (id, type) VALUES (?, ?)`, [convId, type]);

          await dbRun(`INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)`, [
            convId,
            currentUserId,
          ]);
          await dbRun(`INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)`, [
            convId,
            targetId,
          ]);
        }

        const users = await dbAll(
          `
          SELECT u.id, u.username, u.hue
          FROM users u
          JOIN conversation_members cm ON cm.user_id = u.id
          WHERE cm.conversation_id = ?
        `,
          [convId]
        );

        const messages = await dbAll(
          `
          SELECT m.id, m.sender_id, m.content, m.created_at, u.username, m.type, m.read
          FROM messages m
          JOIN users u ON u.id = m.sender_id
          WHERE m.conversation_id = ?
          ORDER BY m.created_at ASC
        `,
          [convId]
        );

        const blocked = await isEitherBlocked(currentUserId, targetId);

        return reply.code(200).send({
          success: true,
          data: { convId, type, users, messages, blocked },
        });
      } catch (err) {
        request.log.error(err);
        return reply
          .code(500)
          .send({ error: "Erreur serveur lors de la création de la conversation" });
      }
    },
  },

  {
    method: "GET",
    url: "/api/chat/:id",
    handler: async (request, reply) => {
      if (!request.isAuthenticated) return reply.code(200).send({ success: false, code: 1 });

      const convId = request.params.id;
      const currentUserId = request.user.userId;

      if (!convId) {
        return reply.code(200).send({ success: false, message: "ConvId manquant" });
      }

      try {
        const conversation = await dbGet(
          `
          SELECT c.id, c.type
          FROM conversations c
          LEFT JOIN conversation_members cm ON c.id = cm.conversation_id AND cm.user_id = ?
          WHERE c.id = ?
          AND (c.type = 'public' OR cm.user_id IS NOT NULL)
        `,
          [currentUserId, convId]
        );

        if (!conversation) {
          return reply.code(200).send({ success: false, message: "La conversation n'existe pas" });
        }

        const users = await dbAll(
          `
          SELECT u.id, u.username, u.hue
          FROM users u
          JOIN conversation_members cm ON cm.user_id = u.id
          WHERE cm.conversation_id = ?
        `,
          [convId]
        );

        const messages = await dbAll(
          `
          SELECT m.id, m.sender_id, m.content, m.created_at, m.type, u.username, m.read
          FROM messages m
          JOIN users u ON u.id = m.sender_id
          WHERE m.conversation_id = ?
          ORDER BY m.created_at ASC
        `,
          [convId]
        );

        let blocked = false;
        if (conversation.type === "private") {
          const other = users.find((u) => u.id !== currentUserId);
          if (other) blocked = await isEitherBlocked(currentUserId, other.id);
        }

        return reply.code(200).send({
          success: true,
          data: {
            convId: conversation.id,
            type: conversation.type,
            users,
            messages,
            blocked,
          },
        });
      } catch (err) {
        request.log.error(err);
        return reply
          .code(500)
          .send({ success: false, message: "Erreur serveur lors de la récupération de la conversation" });
      }
    },
  },

    {
    method: "POST",
    url: "/api/chat/block",
    handler: async (request, reply) => {
        if (!request.isAuthenticated) return reply.code(200).send({ success: false, code: 1 });

        const myUserId = request.user.userId;
        const { convId } = request.body;

        if (!convId) {
        return reply.code(200).send({ success: false, message: "Id de conversation manquant" });
        }

        const targetUser = await dbGet(
        `
        SELECT u.id, u.username
        FROM conversation_members cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.conversation_id = ? AND cm.user_id != ?
        `,
        [convId, myUserId]
        );

        if (!targetUser) {
        return reply.code(200).send({ success: false, message: "Conversation invalide" });
        }

        const existing = await dbGet(
        `SELECT id FROM blocks WHERE blocker_id = ? AND blocked_id = ?`,
        [myUserId, targetUser.id]
        );

        if (existing) {
        return reply.code(200).send({
            success: true,
            data: { convId, userId: targetUser.id, username: targetUser.username, blocked: true, already: true }
        });
        }

        await dbRun(
          `INSERT INTO blocks (id, blocker_id, blocked_id) VALUES (?, ?, ?)`,
          [randomUUID(), myUserId, targetUser.id]
        );

        const msgId = randomUUID();
        const payload = JSON.stringify({
          kind: "block",
          blockerId: myUserId,
          blockedId: targetUser.id,
        });

        await dbRun(
          `INSERT INTO messages (id, conversation_id, sender_id, content, type)
          VALUES (?,?,?,?, 'system')`,
          [msgId, convId, myUserId, payload]
        );

        sendMessageToUser(targetUser.id, {
          scope: "chat",
          type: "blocked",
          convId,
          blocked: true,
        });

        sendMessageToUser(myUserId, {
          scope: "chat",
          type: "blocked",
          convId,
          blocked: true,
        });

        return reply.code(200).send({
          success: true,
          data: {
            convId,
            userId: targetUser.id,
            username: targetUser.username,
            blocked: true,
          },
        });
      } 
    },


  {
    method: "GET",
    url: "/api/chat/me",
    handler: async (request, reply) => {
      if (!request.isAuthenticated) return reply.code(200).send({ success: false, code: 1 });
      const myUserId = request.user.userId;

      try {
        const privateConvs = await dbAll(
          `
          SELECT c.id, c.type, u.username as name
          FROM conversations c
          JOIN conversation_members me ON c.id = me.conversation_id
          JOIN conversation_members other ON c.id = other.conversation_id
          JOIN users u ON other.user_id = u.id
          WHERE c.type = 'private'
            AND me.user_id = ?
            AND other.user_id != ?
        `,
          [myUserId, myUserId]
        );

        const publicConvs = await dbAll(
          `
          SELECT id, type, created_at, name
          FROM conversations
          WHERE type = 'public'
        `
        );

        return reply.code(200).send({
          success: true,
          data: [...publicConvs, ...privateConvs],
        });
      } catch (err) {
        console.error(err);
        return reply.code(500).send({ success: false, error: "Erreur serveur" });
      }
    },
  },
];
