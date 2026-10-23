import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import crypto from 'node:crypto'
import { SERVER_PORT, CLIENT_ORIGIN } from './config.js'
import { logger } from './logger.js'
import { RoomManager } from './roomManager.js'
import { TurnManager } from './turnManager.js'
import { registerLobbyHandlers } from './handlers/lobbyHandlers.js'
import { registerGameHandlers } from './handlers/gameHandlers.js'
import { registerProfileRoutes } from './routes/profile.js'
import { initDb, ensurePlayer, pool } from './db.js'
import { getSession, sessionUser, signOut } from './auth.js'

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

const roomManager = new RoomManager()
const turnManager = new TurnManager()

/** Health check endpoint. */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

registerProfileRoutes(app)

/** The signed-in player, or null. The browser sends the shared bevsoft.com auth cookie. */
app.get('/api/me', async (req, res) => {
  res.set('cache-control', 'no-store')
  try {
    const { user, setCookies } = await getSession(req.headers.cookie)
    for (const cookie of setCookies) res.append('set-cookie', cookie)
    if (!user) return void res.json(null)
    if (!pool) return void res.status(503).json({ message: 'Accounts unavailable' })
    res.json(await ensurePlayer(user))
  } catch (err) {
    logger.error({ err }, 'Failed to resolve session')
    res.status(502).json({ message: 'Sign-in is temporarily unavailable' })
  }
})

/** Same-origin sign-out, so the browser never calls the auth service cross-origin. */
app.post('/api/auth/sign-out', async (req, res) => {
  if (req.headers.origin !== CLIENT_ORIGIN) return void res.status(403).json({ message: 'Forbidden' })
  try {
    for (const cookie of await signOut(req.headers.cookie)) res.append('set-cookie', cookie)
    res.json({ success: true })
  } catch (err) {
    logger.error({ err }, 'Sign-out failed')
    res.status(502).json({ message: 'Sign-out is temporarily unavailable' })
  }
})

/**
 * Socket.IO middleware — resolve the player from the handshake's auth cookie.
 * On success `socket.data.userId` is the auth user ID; connections without a
 * valid session are still allowed (stats just won't be recorded).
 */
io.use(async (socket, next) => {
  try {
    const user = await sessionUser(socket.request.headers.cookie)
    if (user) socket.data.userId = (await ensurePlayer(user)).id
  } catch (err) {
    logger.warn({ err }, 'Could not resolve socket session — continuing unauthenticated')
  }
  next()
})

io.on('connection', (socket) => {
  // Assign a unique player ID to each connection
  socket.data.playerId = crypto.randomUUID()

  logger.info({ socketId: socket.id, playerId: socket.data.playerId }, 'Client connected')

  registerLobbyHandlers(io, socket, roomManager, turnManager)
  registerGameHandlers(io, socket, roomManager, turnManager)
})

httpServer.listen(SERVER_PORT, () => {
  logger.info({ port: SERVER_PORT, cors: CLIENT_ORIGIN }, 'Two Towers server started')
})

// Migrate the database after the server is listening (non-blocking)
void initDb()
