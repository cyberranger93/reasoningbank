#!/usr/bin/env node
import express from "express";
import { z } from "zod";
import { startSession, addStep, endSession, suggest, getStats } from "./trajectories.js";

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT ?? "8001");

// Health
app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "0.1.0" });
});

// Stats
app.get("/stats", (_req, res) => {
  res.json(getStats());
});

// Start a trajectory session
app.post("/trajectory/start", (req, res) => {
  try {
    const { agent_id, task_description } = z.object({
      agent_id: z.string().optional(),
      task_description: z.string().min(1),
    }).parse(req.body);

    const session_id = startSession(agent_id, task_description);
    res.json({ session_id });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// Add a step to an active session
app.post("/trajectory/step", (req, res) => {
  try {
    const { session_id, action, result } = z.object({
      session_id: z.string(),
      action: z.string().min(1),
      result: z.string(),
    }).parse(req.body);

    addStep(session_id, action, result);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// End a session and save trajectory
app.post("/trajectory/end", (req, res) => {
  try {
    const { session_id, outcome, score, tags } = z.object({
      session_id: z.string(),
      outcome: z.enum(["success", "failure", "partial"]),
      score: z.number().min(0).max(1).optional(),
      tags: z.array(z.string()).optional(),
    }).parse(req.body);

    const trajectory = endSession(session_id, outcome, score, tags);
    res.json(trajectory);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// Suggest relevant past trajectories
app.post("/suggest", (req, res) => {
  try {
    const { task_description, limit } = z.object({
      task_description: z.string().min(1),
      limit: z.number().int().min(1).max(20).optional(),
    }).parse(req.body);

    const results = suggest(task_description, limit ?? 5);
    res.json({ suggestions: results, count: results.length });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.error(`ReasoningBank running on http://localhost:${PORT}`);
  console.error(`Data: ${process.env.REASONINGBANK_DATA_DIR ?? "~/.reasoningbank"}`);
});
