
const { randomUUID } = require('node:crypto');
const { createGame,  deleteGame} = require('../gameHandler.js');
const { sendMessageToUser } = require('../chatHandler.js');
const db = require('../../data/connection.js');
const { rejects } = require('node:assert');
const { resolve } = require('node:dns');

module.exports = [
  {
    method: 'POST',
    url: '/api/games/create/public',
    handler: (request, reply) => {
      if (!request.isAuthenticated)
          return reply.send({success: false, code: 1})
      try {
        let token = randomUUID();
        const ok = createGame(token);
        if (!ok) {
          return reply.code(400).send({ error: 'Impossible de créer la partie' });
        }
        return reply.send({ success: true, data: token });
      } catch (err) {request.log.error(err);}
  }
  },
  {
    method: 'POST',
    url: '/api/games/join',
    handler: (request, reply) => {
      if (!request.isAuthenticated)
        return reply.code(200).send({success: false, code: 1})
      try {
        const gameId = request.body.gameId
        const myUserId = request.user.userId
        db.get(`SELECT id, player1_id, player2_id, created_at, status,
                  (SELECT COUNT(*) FROM matches m
                  WHERE (m.player1_id = ? OR m.player2_id = ?)
                  AND m.status = 'playing' AND m.id != ?) as player1_nb_game
                FROM matches
                WHERE id = ?`, [myUserId, myUserId, gameId, gameId], (err, row) => {
                  if (err) {
                    request.log.error(err);
                    return reply.code(500).send({ error: 'Erreur serveur' });
                  }
                  if (!row || !row.id) {
                    return reply.code(200).send({ success: false, error: "L'invitation a expiré", code: 404 });
                  }
                  if (row.player1_nb_game > 0) {
                      return reply.code(200).send({ success: false, error: "Vous avez déjà rejoint une partie", code: 3});
                  }
                  if (row.status === 'finished' || row.status === 'abandoned') {
                    return reply.code(200).send({ success: false, error: 'La partie est terminée', code: 4});
                  }
                  const created_at = new Date(row.created_at + 'Z')
                  const diff = Date.now() - created_at
                  if (diff > (30 * 1000) && row.status === 'waiting') {
                    db.run('DELETE FROM matches WHERE id = ?', [gameId])
                    deleteGame(gameId)
                    return reply.code(200).send({ success:false, code: 410, error: "L'invitation a expiré"})
                  }
                  const userId1 = row.player1_id
                  const userId2 = row.player2_id
                  if (userId1 && !userId2) {
                    db.run(`
                        UPDATE matches
                        SET player2_id = ?
                        WHERE id = ? AND player2_id IS NULL`,
                        [myUserId, gameId], function (err) {
                          if (err) {
                            request.log.error(err);
                            return reply.code(500).send({ error: "Erreur serveur" });
                          }
                          if (this.changes === 0) {
                            return reply.code(200).send({ success: false, code: 5, error: "La partie est complète"});
                          }
                          return reply.code(200).send({ success: true });
                        })
                  }
                  if (userId1 === myUserId || userId2 === myUserId) {
                    return reply.code(200).send({success: true})
                  }
                  return reply.code(200).send({success:false, code: 5, error: "La partie est complète"})
                })
      } catch (err) {request.log.error(err)}
    }
  },
  {
    method: 'POST',
    url: '/api/games/invite',
    handler: async (request, reply) => {
      if (!request.isAuthenticated)
        return reply.send({success: false, code: 1})
      const convId = request.body.convId;
      const senderId = request.user.userId;
      let senderUsername = request.user.username;

      try{
        if (!convId) {
          return reply.send({ success: false, code: 2})
        }

        const gameId = randomUUID()
        const targetUser = await new Promise((resolve, reject) => {
          db.get(`
            SELECT u.id, u.username 
            FROM conversation_members cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.conversation_id = ? AND cm.user_id != ?
            LIMIT 1
            `, [convId, senderId], (err, row) => {
              if (err) reject(err)
              else resolve(row)
            })
        })

        if (!targetUser) {
          return reply.send({success: false, code: 4})
        }
        const targetUserId = targetUser.id;

        const existingMatch = await new Promise((resolve, reject) => {
          db.get(`
            SELECT id FROM matches 
            WHERE ((player1_id = ? AND player2_id = ?) OR 
              (player1_id = ? AND player2_id = ?))
            AND status IN ('waiting', 'playing')
          `, [senderId, targetUserId, targetUserId, senderId], (err, row) => {
            if (err) reject(err)
            else resolve(row)
          })
        })
        if (existingMatch) {
          return reply.send({success:false, code: 5})
        }

        await new Promise((resolve, reject) => {
          db.serialize(() => {
            db.run(`
              INSERT INTO matches (id, player1_id, player2_id, score1, score2, status) 
              VALUES (?, ?, ?, 0, 0, 'waiting')
            `, [gameId, senderId, targetUserId], function(err) {
              if (err) return reject(err);
            })

            db.run(`
              INSERT INTO messages (id, conversation_id, sender_id, content, type)
              VALUES (?, ?, ?, ?, 'invite')`, [randomUUID(), convId, senderId, gameId], function(err) {
                if (err) return reject(err)
                resolve();
              })
          })
        })

        const payload = {
          scope: 'chat',
          type: 'invite',
          convId: convId,
          sender_id: senderId,
          sender_username: senderUsername,
          content: gameId
        }
        sendMessageToUser(targetUserId, payload)
        const data = {
          gameId,
          sender_id: senderId,
          sender_username: senderUsername,
          status: 'waiting'
        }
        return reply.code(200).send({success:true, data})

      } catch (err) {
        console.log(err)
        return reply.code(500).send({ error: 'Erreur serveur' });
      }
    },
  },
];