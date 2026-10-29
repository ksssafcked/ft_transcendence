const { gameHandler, setUserDisconnected } = require('./gameHandler');
const { addChatUser, deleteChatUser, getEntriesSocket, sendMessageToUser, chatHandler } = require('./chatHandler.js');
const fastify = require('fastify')({ logger: true });
const db = require('../data/connection.js');
const fastifyCookie = require('@fastify/cookie');
const fastifyJwt = require('@fastify/jwt');
const cors = require('@fastify/cors');
const formbody = require('@fastify/formbody');
const multipart = require('@fastify/multipart'); 
const fastifyStatic = require('@fastify/static');
const path = require('path');


console.log("Server started!");

fastify.register(cors, {
  origin: "http://localhost:8443",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
});

fastify.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET, 
});

fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET,
  cookie: {
    cookieName: 'access_token',
    signed: false,
  },
});

fastify.register(formbody);

fastify.register(multipart); 

fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../public'),
  prefix: '/public/',
});

fastify.decorate('authenticate', async function (request, reply) {
  try {
    await request.jwtVerify();
    const { userId } = request.user;
    const userExists = await new Promise((resolve, reject) => {
      db.get("SELECT id, username, email, hue FROM users WHERE id = ?", [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!userExists) {
      reply.clearCookie('access_token');
      return false
    }
    request.user = {
      userId: userExists.id,
      username: userExists.username,
      email: userExists.email,
      hue: userExists.hue
    }
    return true;
  } catch (err) {
    reply.clearCookie('access_token');
    return false
  }
});

const publicPaths = [
  '/api/login',
  '/api/signin',
  '/api/public'
];

fastify.addHook('preValidation', async (request, reply) => {
  const path = request.routeOptions.url || request.url;

  if (publicPaths.includes(path)) {
    return;
  }
  request.isAuthenticated = await fastify.authenticate(request, reply)
});

fastify.addContentTypeParser(
  'application/json',
  { parseAs: 'string' },
  function (req, body, done) {
    try {
      const json = JSON.parse(body)
      done(null, json)
    } catch (err) {
      done(err, undefined)
    }
  }
);

const routes = require('./routes');
routes.forEach(route => fastify.route(route));

const fastifyPlugin = require('fastify-plugin');

async function websocketManager(fastify) {
  await fastify.register(require('@fastify/websocket'));


  fastify.get('/api/ws', { 
    websocket: true
    }, async (connection, req) => {

    const ws = connection.socket;
    let user
    if (!req.isAuthenticated) {
      ws.close(4001, "Not auth")
      return
    }
    else {
      user = req.user
      
      ws.isAlive = true

      addChatUser(user.userId, ws)
      const authMsg = {scope: 'sys',type: "auth"}
      sendMessageToUser(user.userId, authMsg)
    }

    ws.on('pong', () => {
      ws.isAlive = true
    })

    ws.on('close', (code, reason) => {
      if (user)
        setUserDisconnected(user.userId)
    })
    ws.on('message', message => {
      try {
        const parsed = JSON.parse(message);
        const {scope} = parsed;

        if (scope === 'sys') {
          
        } else if (scope === 'game') {
          gameHandler(parsed, user)
        } else if (scope === 'chat') {
          chatHandler(parsed, user)
        }
      } catch (err){
        console.log("Failed in message handler:", err)
      }
    });
    
  });
} 

const interval = setInterval(() => {
  const socketEntries = getEntriesSocket()
  for (const [userId, socket] of socketEntries) {
    if (socket.isAlive === false) {
      deleteChatUser(userId);
      return socket.terminate();
    }
    socket.isAlive = false;
    socket.ping();
  };
}, 30000);

fastify.register(websocketManager);

fastify.addHook('onClose', (instance, done) => {
  clearInterval(interval);
  done();
});

const start = async () => {
  try {
    await fastify.listen({ port: 4000, host: '0.0.0.0' });
    console.log(`Backend Fastify running on port 4000`);
    db.run(`DELETE FROM matches WHERE status IN ('waiting', 'playing')`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
