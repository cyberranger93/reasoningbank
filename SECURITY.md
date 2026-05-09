# Security Policy

`reasoningbank` stores agent trajectories locally by default. Trajectories may contain prompts, tool outputs, URLs, file paths, or other sensitive data depending on how agents are instrumented.

## Safe Usage

- Do not record secrets, API keys, tokens, or private customer data.
- Use `REASONINGBANK_DATA_DIR` to keep project data isolated.
- Review stored trajectories before sharing a database or demo.

## Reporting Issues

Open a private security advisory on GitHub if you find a vulnerability. Include reproduction steps, impact, and suggested mitigation if known.
