# reasoningbank

> Episodic memory for AI agents: store what worked, retrieve it next run.

[![npm](https://img.shields.io/npm/v/reasoningbank)](https://npmjs.com/package/reasoningbank)
[![CI](https://github.com/cyberranger93/reasoningbank/actions/workflows/ci.yml/badge.svg)](https://github.com/cyberranger93/reasoningbank/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

![reasoningbank demo](assets/demo.gif)

AI agents often repeat mistakes because each run starts from scratch. `reasoningbank` records task trajectories, outcomes, and useful steps, then returns relevant past experience before the next run starts.

It is not a vector database and it does not require fine-tuning. It is a small local service for agent builders who want durable, inspectable learning loops without native database dependencies.

## Quick Start

```bash
git clone https://github.com/cyberranger93/reasoningbank.git
cd reasoningbank
npm install
npm run build
npm start
```

The server starts on `http://localhost:8001`.

## TypeScript SDK

```typescript
import { ReasoningBank } from "./dist/sdk.js";

const rb = new ReasoningBank();

const hints = await rb.suggest("research LLM pricing options");
const session = await rb.start("research LLM pricing options");

await rb.step(session, "searched provider docs", "found pricing tables");
await rb.step(session, "compared context windows", "short-context calls are cheapest");
await rb.end(session, { outcome: "success", score: 0.9, tags: ["pricing"] });
```

## Python SDK

The lightweight Python SDK lives in `sdk/python`:

```python
from reasoningbank import ReasoningBank

rb = ReasoningBank()
session = rb.start("research LLM pricing options")
rb.step(session, "searched provider docs", "found pricing tables")
rb.end(session, outcome="success", score=0.9)
```

## REST API

```bash
POST /trajectory/start
{"task_description": "research LLM pricing", "agent_id": "optional"}

POST /trajectory/step
{"session_id": "...", "action": "searched docs", "result": "found 5 providers"}

POST /trajectory/end
{"session_id": "...", "outcome": "success", "score": 0.9}

POST /suggest
{"task_description": "compare LLM pricing", "limit": 5}

GET /stats
```

## How It Works

```text
Run 1:  agent runs task -> steps recorded -> outcome stored
Run 2:  agent asks /suggest -> similar successful steps return
Run 3+: prompts include proven patterns before the agent acts
```

By default, matching uses lightweight keyword overlap so the repo is easy to understand and run locally. The API boundary is intentionally simple so vector search, embeddings, or team-hosted storage can be added later without changing agent integrations.

## Why This vs Alternatives

| Capability | reasoningbank | RAG | Fine-tuning | Prompt-only memory |
|---|---|---|---|---|
| Stores decisions and outcomes | Yes | No | Mixed | Mixed |
| Persists across sessions | Yes | Yes | Yes | No |
| Cross-agent sharing | Yes | Mixed | Yes | No |
| Local SQLite default | Yes | Mixed | No | Yes |
| Works with any LLM | Yes | Yes | No | Yes |

## Data

Data is stored locally at `~/.reasoningbank/trajectories.json`. Override it with:

```bash
$env:REASONINGBANK_DATA_DIR = "C:\\tmp\\reasoningbank"
npm start
```

## Roadmap

- [ ] Embedding-backed retrieval adapter
- [ ] MCP server wrapper
- [ ] Evaluation harness showing success rate across repeated runs
- [ ] Hosted team mode with project-level namespaces
- [ ] Demo GIF and launch video

## Contributing

PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
