import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

export interface StoredStep {
  action: string;
  result: string;
  timestamp: number;
}

export interface StoredSession {
  id: string;
  agent_id: string | null;
  task_description: string;
  steps: StoredStep[];
  started_at: number;
}

export interface StoredTrajectory {
  id: string;
  agent_id: string | null;
  task_description: string;
  steps: StoredStep[];
  outcome: "success" | "failure" | "partial";
  score: number;
  tags: string[];
  created_at: number;
}

interface ReasoningBankData {
  sessions: StoredSession[];
  trajectories: StoredTrajectory[];
}

const DATA_DIR =
  process.env.REASONINGBANK_DATA_DIR ??
  path.join(process.env.HOME ?? process.env.USERPROFILE ?? ".", ".reasoningbank");
mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "trajectories.json");

function readData(): ReasoningBankData {
  try {
    return JSON.parse(readFileSync(DB_PATH, "utf-8")) as ReasoningBankData;
  } catch {
    return { sessions: [], trajectories: [] };
  }
}

function writeData(data: ReasoningBankData): void {
  writeFileSync(DB_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

export const store = {
  createSession(session: StoredSession): void {
    const data = readData();
    data.sessions.push(session);
    writeData(data);
  },

  getSession(id: string): StoredSession | undefined {
    return readData().sessions.find((session) => session.id === id);
  },

  updateSessionSteps(id: string, steps: StoredStep[]): void {
    const data = readData();
    const session = data.sessions.find((item) => item.id === id);
    if (!session) {
      throw new Error(`Session ${id} not found`);
    }
    session.steps = steps;
    writeData(data);
  },

  deleteSession(id: string): void {
    const data = readData();
    data.sessions = data.sessions.filter((session) => session.id !== id);
    writeData(data);
  },

  createTrajectory(trajectory: StoredTrajectory): void {
    const data = readData();
    data.trajectories.push(trajectory);
    writeData(data);
  },

  listTrajectoryCandidates(limit = 100): StoredTrajectory[] {
    return readData()
      .trajectories.filter((trajectory) => ["success", "partial"].includes(trajectory.outcome))
      .sort((a, b) => b.score - a.score || b.created_at - a.created_at)
      .slice(0, limit);
  },

  stats(): {
    total: number;
    success: number;
    failure: number;
    partial: number;
    avg_score: number;
  } {
    const trajectories = readData().trajectories;
    const total = trajectories.length;
    const success = trajectories.filter((item) => item.outcome === "success").length;
    const failure = trajectories.filter((item) => item.outcome === "failure").length;
    const partial = trajectories.filter((item) => item.outcome === "partial").length;
    const avg_score =
      total === 0 ? 0 : trajectories.reduce((sum, item) => sum + item.score, 0) / total;

    return { total, success, failure, partial, avg_score };
  },
};
