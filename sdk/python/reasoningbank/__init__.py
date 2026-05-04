"""
ReasoningBank Python SDK
Wire into any Python agent loop in ~10 lines.

Usage:
    from reasoningbank import ReasoningBank

    rb = ReasoningBank()  # assumes localhost:8001

    session = rb.start("search for hotels in NYC under $200")

    rb.step(session, "searched Google", "found 12 results")
    rb.step(session, "filtered by price", "3 options remain")

    rb.end(session, outcome="success", score=0.9)

    # Next time, before running a similar task:
    hints = rb.suggest("find affordable hotels in Manhattan")
    # hints contains steps that worked before
"""
import requests
from typing import Optional


class ReasoningBank:
    def __init__(self, host: str = "http://localhost:8001"):
        self.host = host.rstrip("/")

    def start(self, task_description: str, agent_id: Optional[str] = None) -> str:
        """Start a trajectory session. Returns session_id."""
        resp = requests.post(f"{self.host}/trajectory/start", json={
            "task_description": task_description,
            "agent_id": agent_id,
        }, timeout=5)
        resp.raise_for_status()
        return resp.json()["session_id"]

    def step(self, session_id: str, action: str, result: str) -> None:
        """Record a step in the active session."""
        requests.post(f"{self.host}/trajectory/step", json={
            "session_id": session_id,
            "action": action,
            "result": result,
        }, timeout=5).raise_for_status()

    def end(
        self,
        session_id: str,
        outcome: str = "success",
        score: float = 0.5,
        tags: Optional[list] = None,
    ) -> dict:
        """Finalize session and persist trajectory. Returns full trajectory dict."""
        resp = requests.post(f"{self.host}/trajectory/end", json={
            "session_id": session_id,
            "outcome": outcome,
            "score": score,
            "tags": tags or [],
        }, timeout=5)
        resp.raise_for_status()
        return resp.json()

    def suggest(self, task_description: str, limit: int = 5) -> list:
        """Retrieve relevant past trajectories for a task."""
        resp = requests.post(f"{self.host}/suggest", json={
            "task_description": task_description,
            "limit": limit,
        }, timeout=5)
        resp.raise_for_status()
        return resp.json()["suggestions"]

    def stats(self) -> dict:
        """Get overall stats: total trajectories, success rate, avg score."""
        return requests.get(f"{self.host}/stats", timeout=5).json()
