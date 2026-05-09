# Launch Notes

## Positioning

Agents are amnesiac. `reasoningbank` gives them durable, inspectable experience without retraining.

## LinkedIn Post

I shipped `reasoningbank`, a local service that records AI agent trajectories and retrieves useful past steps before the next run.

The problem is simple: agents repeat mistakes because every run starts cold. Fine-tuning is expensive, and RAG retrieves documents rather than decisions. `reasoningbank` stores what the agent tried, whether it worked, and what to reuse next time.

Repo: https://github.com/cyberranger93/reasoningbank

Attach: `assets/social-card.png` or `assets/demo.gif`

## Show HN Draft

Title: Show HN: reasoningbank - episodic memory for AI agents

I built `reasoningbank` because my agents kept making the same mistakes across runs.

It is a local Node/SQLite service that records task trajectories, outcomes, and useful steps. Before a new task starts, agents call `/suggest` and get relevant past experience to include in context. The first implementation uses lightweight keyword overlap so the mechanism is easy to inspect, with vector retrieval planned as an adapter.

GitHub: https://github.com/cyberranger93/reasoningbank

Attach: `assets/demo.gif`
