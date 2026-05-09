import { store } from "./db.js";
import { v4 as uuid } from "uuid";
import { scoreTextOverlap, tokenize } from "./scoring.js";

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
  store.createSession({
    id,
    agent_id: agentId ?? null,
    task_description: taskDescription,
    steps: [],
    started_at: Date.now(),
  });
  return id;
}

// Append a step to an in-progress session
export function addStep(sessionId: string, action: string, result: string): void {
  const session = store.getSession(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);
  const steps: Step[] = session.steps;
  steps.push({ action, result, timestamp: Date.now() });
  store.updateSessionSteps(sessionId, steps);
}

// Finalize a session → save as trajectory
export function endSession(
  sessionId: string,
  outcome: "success" | "failure" | "partial",
  score: number = 0.5,
  tags: string[] = []
): Trajectory {
  const session = store.getSession(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  const id = uuid();
  const created_at = Date.now();

  store.createTrajectory({
    id,
    agent_id: session.agent_id,
    task_description: session.task_description,
    steps: session.steps,
    outcome,
    score,
    tags,
    created_at,
  });
  store.deleteSession(sessionId);

  return {
    id,
    agent_id: session.agent_id ?? undefined,
    task_description: session.task_description,
    steps: session.steps,
    outcome,
    score,
    tags,
    created_at,
  };
}

// Retrieve relevant past trajectories for a given task description
// Simple keyword overlap scoring — swap for vector similarity when you want upgrade
export function suggest(taskDescription: string, limit: number = 5): SuggestResult[] {
  const words = tokenize(taskDescription);

  // Fetch successful + partial trajectories, score by keyword overlap
  const candidates = store.listTrajectoryCandidates(100);

  const scored = candidates.map((row) => {
    const similarity = scoreTextOverlap(taskDescription, row.task_description);
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
    relevant_steps: r.steps.filter((s) =>
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
  return store.stats();
}
