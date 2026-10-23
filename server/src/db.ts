import pg from 'pg'
import { DATABASE_URL } from './config.js'
import { logger } from './logger.js'

// Bound every wait so a slow or unreachable database fails requests instead of hanging them.
export const pool = DATABASE_URL
  ? new pg.Pool({
    connectionString: DATABASE_URL,
    connectionTimeoutMillis: 5000,
    statement_timeout: 10_000,
    query_timeout: 15_000,
  })
  : null

pool?.on('error', (err) => logger.error({ err }, 'Postgres pool error'))

/** Idempotent schema setup, run on every server start. */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS players (
  id                  text PRIMARY KEY,
  username            text NOT NULL UNIQUE,
  wins                integer NOT NULL DEFAULT 0,
  losses              integer NOT NULL DEFAULT 0,
  win_tower_built     integer NOT NULL DEFAULT 0,
  win_tower_destroyed integer NOT NULL DEFAULT 0,
  win_resources       integer NOT NULL DEFAULT 0,
  win_forfeit         integer NOT NULL DEFAULT 0,
  created             timestamptz NOT NULL DEFAULT now()
);

-- Profile URLs are case-sensitive, but "Bev" and "bev" shouldn't be two players.
CREATE UNIQUE INDEX IF NOT EXISTS players_username_lower_idx ON players (lower(username));

CREATE TABLE IF NOT EXISTS game_results (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  winner     text NOT NULL REFERENCES players(id),
  loser      text NOT NULL REFERENCES players(id),
  win_reason text,
  turn_count integer,
  created    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS game_results_winner_idx ON game_results (winner, created DESC);
CREATE INDEX IF NOT EXISTS game_results_loser_idx  ON game_results (loser, created DESC);

CREATE TABLE IF NOT EXISTS card_plays (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  game        uuid NOT NULL REFERENCES game_results(id) ON DELETE CASCADE,
  player      text NOT NULL REFERENCES players(id),
  card_name   text NOT NULL,
  card_color  text,
  action      text NOT NULL,
  turn_number integer,
  sequence    integer
);
CREATE INDEX IF NOT EXISTS card_plays_game_idx ON card_plays (game, turn_number, sequence);
`

// The server starts alongside the database after a deploy, so losing the boot
// race is normal — retry until the first successful migration.
const CONNECT_RETRY_MS = 5 * 1000

export async function initDb(): Promise<void> {
  if (!pool) {
    logger.warn('DATABASE_URL not set — stats and profiles disabled')
    return
  }
  for (;;) {
    try {
      await pool.query(SCHEMA)
      logger.info('Connected to Postgres')
      return
    } catch (err) {
      logger.error({ err }, `Postgres migration failed — retrying in ${CONNECT_RETRY_MS / 1000}s`)
      await new Promise((r) => setTimeout(r, CONNECT_RETRY_MS))
    }
  }
}

export interface Player {
  id: string
  username: string
}

/** The towers player for an auth user, or null until they've chosen a name. */
export async function findPlayer(id: string): Promise<Player | null> {
  if (!pool) throw new Error('Database not configured')
  const { rows } = await pool.query<Player>('SELECT id, username FROM players WHERE id = $1', [id])
  return rows[0] ?? null
}

/** Whether a registered player already has this name, ignoring case. */
export async function isUsernameTaken(username: string): Promise<boolean> {
  if (!pool) return false
  const { rows } = await pool.query('SELECT 1 FROM players WHERE lower(username) = lower($1)', [username])
  return rows.length > 0
}

/** Create the player for an auth user. Returns null when the name is taken. */
export async function createPlayer(id: string, username: string): Promise<Player | null> {
  if (!pool) throw new Error('Database not configured')
  const { rows } = await pool.query<Player>(
    `INSERT INTO players (id, username) VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING id, username`,
    [id, username],
  )
  // A conflict on id means this user already has a player (e.g. a double submit).
  return rows[0] ?? await findPlayer(id)
}
