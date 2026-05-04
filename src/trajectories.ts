import { db } from "./db.js";
import { v4 as uuid } from "uuid";

export interface Step {
  action: string;
  result: string;
  timestamp: number;
}

export interface Trajectory {
  id: string;
  agent_id?: string;
  task_description: string;
  steps: Step[];
  outcome: "success" | "failure" | "partial";
  score: number;
  tags: string[];
  created_at: number;
}

export interface SuggestResult {
  trajectory_id: string;
  task_description: string;
  outcome: string;
  score: number;
  relevant_steps: Step[];
  similarity_hint: string;
}

// Start a new trajectory session — returns session ID to track steps
export function startSession(agentId: string | undefined, taskDescription: string): string {
  const id = uuid();
  db.prepare(`
    INSERT INTO trajectory_sessions (id, agent_id, task_description, steps)
    VALUES (?, ?, ?, '[]')
  `).run(id, agentId ?? null, taskDescription);
  return id;
}

// Append a step to an in-progress session
export function addStep(sessionId: string, action: string, result: string): void {
  const session = db.prepare("SELECT steps FROM trajectory_sessions WHERE id = ?").get(sessionId) as { steps: string } | undefined;
  if (!session) throw new Error(`Session ${sessionId} not found`);
  const steps: Step[] = JSON.parse(session.steps);
  steps.push({ action, result, timestamp: Date.now() });
  db.prepare("UPDATE trajectory_sessions SET steps = ? WHERE id = ?").run(JSON.stringify(steps), sessionId);
}

// Finalize a session → save as trajectory
export function endSession(
  sessionId: string,
  outcome: "success" | "failure" | "partial",
  score: number = 0.5,
  tags: string[] = []
): Trajectory {
  const session = db.prepare("SELECT * FROM trajectory_sessions WHERE id = ?").get(sessionId) as {
    id: string; agent_id: string; task_description: string; steps: string;
  } | undefined;
  if (!session) throw new Error(`Session ${sessionId} not found`);

  const id = uuid();
  db.prepare(`
    INSERT INTO trajectories (id, agent_id, task_description, steps, outcome, score, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, session.agent_id, session.task_description, session.steps, outcome, score, JSON.stringify(tags));

  db.prepare("DELETE FROM trajectory_sessions WHERE id = ?").run(sessionId);

  return {
    id,
    agent_id: session.agent_id,
    task_description: session.task_description,
    steps: JSON.parse(session.steps),
    outcome,
    score,
    tags,
    created_at: Date.now(),
  };
}

// Retrieve relevant past trajectories for a given task description
// Simple keyword overlap scoring — swap for vector similarity when you want upgrade
export function suggest(taskDescription: string, limit: number = 5): SuggestResult[] {
  const words = taskDescription.toLowerCase().split(/\W+/).filter((w) => w.length > 3);

  // Fetch successful + partial trajectories, score by keyword overlap
  const candidates = db.prepare(`
    SELECT id, task_description, outcome, score, steps
    FROM trajectories
    WHERE outcome IN ('success', 'partial')
    ORDER BY score DESC, created_at DESC
    LIMIT 100
  `).all() as Array<{ id: string; task_description: string; outcome: string; score: number; steps: string }>;

  const scored = candidates.map((row) => {
    const rowWords = row.task_description.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const overlap = words.filter((w) => rowWords.includes(w)).length;
    const similarity = overlap / Math.max(words.length, rowWords.length, 1);
    return { ...row, similarity };
  });

  const top = scored
    .filter((r) => r.similarity > 0)
    .sort((a, b) => b.similarity * b.score - a.similarity * a.score)
    .slice(0, limit);

  return top.map((r) => ({
    trajectory_id: r.id,
    task_description: r.task_description,
    outcome: r.outcome,
    score: r.score,
    relevant_steps: (JSON.parse(r.steps) as Step[]).filter((s) =>
      words.some((w) => s.action.toLowerCase().includes(w) || s.result.toLowerCase().includes(w))
    ),
    similarity_hint: `${Math.round(r.similarity * 100)}% keyword overlap`,
  }));
}

export function getStats(): {
  total: number;
  success: number;
  failure: number;
  partial: number;
  avg_score: number;
} {
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN outcome = 'success' THEN 1 ELSE 0 END) as success,
      SUM(CASE WHEN outcome = 'failure' THEN 1 ELSE 0 END) as failure,
      SUM(CASE WHEN outcome = 'partial' THEN 1 ELSE 0 END) as partial,
      AVG(score) as avg_score
    FROM trajectories
  `).get() as { total: number; success: number; failure: number; partial: number; avg_score: number };
  return stats;
}
