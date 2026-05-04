import Database from "better-sqlite3";
import path from "path";
import { mkdirSync } from "fs";

const DATA_DIR = process.env.REASONINGBANK_DATA_DIR ?? path.join(process.env.HOME ?? ".", ".reasoningbank");
mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "trajectories.db");

export const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS trajectories (
    id TEXT PRIMARY KEY,
    agent_id TEXT,
    task_description TEXT NOT NULL,
    steps TEXT NOT NULL,            -- JSON array of {action, result, timestamp}
    outcome TEXT CHECK(outcome IN ('success', 'failure', 'partial')) NOT NULL,
    score REAL DEFAULT 0,           -- 0-1 quality score, higher = more useful
    tags TEXT DEFAULT '[]',         -- JSON array of string tags
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE INDEX IF NOT EXISTS idx_trajectories_outcome ON trajectories(outcome);
  CREATE INDEX IF NOT EXISTS idx_trajectories_score ON trajectories(score DESC);
  CREATE INDEX IF NOT EXISTS idx_trajectories_created ON trajectories(created_at DESC);

  CREATE TABLE IF NOT EXISTS trajectory_sessions (
    id TEXT PRIMARY KEY,
    agent_id TEXT,
    task_description TEXT NOT NULL,
    steps TEXT NOT NULL DEFAULT '[]',
    started_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);
