import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
let dbPath = path.resolve(process.cwd(), 'wrapped.db');

if (isServerless) {
  const tmpDbPath = path.join('/tmp', 'wrapped.db');
  if (!fs.existsSync(tmpDbPath)) {
    const possibleSeedPaths = [
      path.resolve(process.cwd(), 'wrapped.db'),
      path.resolve(process.cwd(), 'Wrapped', 'wrapped.db'),
      path.join(process.cwd(), '..', 'wrapped.db'),
    ];
    for (const seedPath of possibleSeedPaths) {
      if (fs.existsSync(seedPath)) {
        try {
          fs.copyFileSync(seedPath, tmpDbPath);
          break;
        } catch (e) {
          console.warn('[db] Falha ao copiar seed:', e.message);
        }
      }
    }
  }
  dbPath = tmpDbPath;
}

const db = new DatabaseSync(dbPath);

// Ativar modo WAL para alta performance e concorrência
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA synchronous = NORMAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Criação das Tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    spotify_id TEXT UNIQUE NOT NULL,
    display_name TEXT,
    email TEXT,
    avatar_url TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TEXT NOT NULL,
    timezone TEXT DEFAULT 'UTC',
    last_sync_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS artists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    genres TEXT DEFAULT '[]',
    image_url TEXT,
    popularity INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    album_id TEXT NOT NULL,
    album_name TEXT NOT NULL,
    album_image_url TEXT,
    duration_ms INTEGER NOT NULL,
    explicit INTEGER DEFAULT 0,
    popularity INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS track_artists (
    track_id TEXT NOT NULL,
    artist_id TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    PRIMARY KEY (track_id, artist_id),
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS audio_features (
    track_id TEXT PRIMARY KEY,
    danceability REAL NOT NULL,
    energy REAL NOT NULL,
    valence REAL NOT NULL,
    acousticness REAL NOT NULL,
    instrumentalness REAL NOT NULL,
    speechiness REAL NOT NULL,
    liveness REAL NOT NULL,
    tempo REAL NOT NULL,
    loudness REAL NOT NULL,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS play_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    track_id TEXT NOT NULL,
    played_at TEXT NOT NULL,
    ms_played INTEGER NOT NULL,
    source TEXT DEFAULT 'RECENTLY_PLAYED',
    UNIQUE (user_id, track_id, played_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_play_logs_user_played ON play_logs (user_id, played_at);
  CREATE INDEX IF NOT EXISTS idx_play_logs_track ON play_logs (track_id);
  CREATE INDEX IF NOT EXISTS idx_track_artists_artist ON track_artists (artist_id);
`);

export default db;

