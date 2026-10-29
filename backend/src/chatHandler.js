const db = require('../data/connection.js');
const clients = new Map();

function addChatUser(userId,socket) {
	const oldSocket = clients.get(userId)

	if(oldSocket) {
		oldSocket.close(4002, "New connection")
	}

	clients.set(userId, socket)
}

function deleteChatUser(userId) {
	if (clients.get(userId))
		clients.delete(userId)
}

function getSocket(userId) {
	return clients.get(userId);
}

function getEntriesSocket() {
	return clients.entries();
}

function sendMessageToUser(userId, data) {
	const socket = clients.get(userId)
	if (socket && socket.readyState === 1) {
		socket.send(JSON.stringify(data))
	}
}

async function sendUpdateToUsers(username, userId) {
    try {
        const rows = await new Promise((resolve, reject) => {
            db.all(`
				SELECT 
					other.conversation_id as convId, 
					other.user_id as targetUserId
				FROM conversation_members AS me
				JOIN conversation_members AS other 
					ON me.conversation_id = other.conversation_id
				WHERE me.user_id = ? 
				AND other.user_id != ?
		`, [userId, userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        for (const row of rows) {
            const payload = {
                scope: 'chat',
                type: 'update',
                newUsername: username,
                convId: row.convId,
                userId: userId
            };
            sendMessageToUser(row.targetUserId, payload);
        }

    } catch (err) {
        console.error("Erreur lors de la notification de changement de nom:", err);
    }
}

async function handleTypingNotifications(userId, data) {
	const client = clients.get(userId)

	if (!client) {
		return
	}
	try {
		const conv = await new Promise((resolve, reject) => {
			db.get(`SELECT *
					FROM conversations c
					WHERE c.id = ? AND c.type = 'private'`, [data.convId], (err, convId) => {
						if (err) reject(err)
						else resolve(convId)
					})
		})
		if (!conv) {
			return
		}
		const row = await new Promise((resolve, reject) => {
			db.all(`SELECT cm.user_id AS id
					FROM conversation_members cm
					WHERE cm.conversation_id = ?
					AND cm.user_id != ?`
					, [data.convId, userId], (err, rows) => {
					if (err) reject(err)
					
					if (!rows || rows.length === 0) return resolve(null);

					const ids = rows.map(row => row.id);

					resolve({reciever_ids: ids});
				})
		})
		if (!row) {

		}

		toSend = {
			...data,
			userId
		}
		row.reciever_ids.forEach(id => {
			const socketToSend = clients.get(id)
			if (socketToSend && socketToSend.readyState === 1) {
				socketToSend.send(JSON.stringify(toSend))
			}
		});
	} catch (err) {
		console.log("handleTypingNotifications error:", err)
	}
}

function dbGet(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
  });
}

async function isEitherBlocked(userA, userB) {
  const row = await dbGet(`
    SELECT 1
    FROM blocks
    WHERE (blocker_id = ? AND blocked_id = ?)
       OR (blocker_id = ? AND blocked_id = ?)
    LIMIT 1
  `, [userA, userB, userB, userA]);
  return !!row;
}


const MAX_DM_LEN = 256;

function isValidMessageContent(content) {
  return typeof content === "string" && content.length >= 1 && content.length <= MAX_DM_LEN;
}

async function handleMessageInChat (userId, data) {
	if (!isValidMessageContent(data.content)) 
    	return;
	const client = clients.get(userId)
	if (!client) {
		return
	}
	try {
		const conv = await new Promise((resolve, reject) => {
			db.get(`SELECT *
					FROM conversations c
					WHERE c.id = ? AND c.type = 'private'`, [data.convId], (err, convId) => {
						if (err) reject(err)
						else resolve(convId)
					})
		})
		if (!conv) {
			return
		}
		const row = await new Promise((resolve, reject) => {
			db.all(`SELECT u.username AS username, cm.user_id AS id
					FROM users u
					JOIN conversation_members cm ON cm.conversation_id = ?
					WHERE u.id = ?
					AND cm.user_id != ?`
					, [data.convId, userId, userId], (err, rows) => {
					if (err) reject(err)
					
					if (!rows || rows.length === 0) return resolve(null);

					const username = rows[0].username;
					const ids = rows.map(row => row.id);

					resolve({
						sender_username: username,
						reciever_ids: ids
					});
				})
		})

		if (row.reciever_ids.length === 1) {
			const otherId = row.reciever_ids[0];
			const blocked = await isEitherBlocked(userId, otherId);
			if (blocked) {
			sendMessageToUser(userId, {
				scope: "chat",
				type: "blocked",
				convId: data.convId,
				blocked: true,
				rejectedId: data.id,
				message: "Impossible d’envoyer : utilisateur bloqué"
			});
			return;
			}

		}

		const toSend = {
			...data,
			sender_username: row.sender_username,
			sender_id: userId
		}
		row.reciever_ids.forEach(id => {
			const socketToSend = clients.get(id)
			if (socketToSend && socketToSend.readyState === 1) {
				socketToSend.send(JSON.stringify(toSend))
			}
		});

		await new Promise((resolve, reject) => {
			db.run(`INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?,?,?,?)`, [data.id, data.convId, userId, data.content], function(error) {
				if (error) return reject(error)
				resolve(this.lastID)
			});
		});

	} catch (error) {
		console.error("handleMessageInChat error:", error);
	}

}

function handleReadMessages(userId, parsed) {
	const convId = parsed.convId
	if (!convId)
		return
	db.run(`
		UPDATE messages SET read = 1
		WHERE conversation_id = ? AND sender_id != ?
		`, [convId, userId], (err) => {
			if (err)
				console.error(err)
		}
	)

	db.all(`
		SELECT user_id
		FROM conversation_members
		WHERE conversation_id = ?
		`, [convId], (err, rows) => {
			if (err)
				console.log(err)
			if (!rows) return
			const msg = {
				scope: 'chat',
				type: 'read',
				convId: convId,
				reader: userId
			}
			rows.forEach(row => {
				if (row.user_id !== userId) {
					sendMessageToUser(row.user_id, msg)
				}
			})
		}
	)
}


async function broadcastGameNotif(convId, leftId, rightId, gameId) {
	let firstUsername
	let secondUsername
	try{
		const rows = await new Promise((resolve, reject) => {
            db.all(
                `SELECT id, username FROM users WHERE id IN (?, ?)`,
                [leftId, rightId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });

		const userMap = {};
        rows.forEach(u => userMap[u.id] = u.username);

        firstUsername = userMap[leftId];
        secondUsername = userMap[rightId];
		if (!firstUsername || !secondUsername)
			return
	} catch (err) {
        console.error("Erreur SQL:", err);
    }
	const msg = {
		scope: 'chat',
		type: 'notification',
		convId: convId,
		content: gameId,
		player1_username: firstUsername,
		player2_username: secondUsername
	}
	for (const userId of clients.keys()) {
		sendMessageToUser(userId, msg)
	}
}

function chatHandler(parsed, user) {
	if (parsed.type === 'message') {
		handleMessageInChat(user.userId, parsed);
	}
	else if (parsed.type === 'writing') {
		handleTypingNotifications(user.userId, parsed);
	}
	else if (parsed.type === 'read') {
		handleReadMessages(user.userId, parsed)
	}
}

module.exports = {
  addChatUser,
  deleteChatUser,
  getEntriesSocket,
  sendMessageToUser,
  broadcastGameNotif,
  chatHandler,
  sendUpdateToUsers
};