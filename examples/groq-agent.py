"""
Example: Groq agent loop wired to ReasoningBank.
Run this 5 times on the same task — watch success rate improve.

Requirements:
  pip install groq reasoningbank
  reasoningbank  # start the server in another terminal
"""
import os
from groq import Groq
from reasoningbank import ReasoningBank

groq_client = Groq(api_key=os.environ["GROQ_API_KEY"])
rb = ReasoningBank()

TASK = "Research the top 3 LLM providers by price and write a comparison table"

def run_agent(task: str, hints: list) -> tuple[str, bool]:
    system = "You are a research agent. Be concise and accurate."
    if hints:
        hint_text = "\n\nLearning from past runs:\n" + "\n".join(
            f"- Step that worked: {s['action']} → {s['result']}"
            for h in hints[:2]
            for s in h.get("relevant_steps", [])[:3]
        )
        system += hint_text

    messages = [{"role": "user", "content": task}]
    steps = []

    for _ in range(3):  # max 3 turns
        response = groq_client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[{"role": "system", "content": system}] + messages,
            max_tokens=512,
        )
        reply = response.choices[0].message.content
        messages.append({"role": "assistant", "content": reply})
        steps.append(("agent_response", reply[:200]))

        if "comparison table" in reply.lower() and "|" in reply:
            return reply, True  # Task complete

    return messages[-1]["content"], False


def main():
    for run_num in range(1, 6):
        print(f"\n--- Run {run_num} ---")

        # Get hints from past successful runs
        hints = rb.suggest(TASK, limit=3)
        print(f"Hints from past runs: {len(hints)}")

        # Start tracking
        session = rb.start(TASK, agent_id="groq-demo")

        result, success = run_agent(TASK, hints)

        rb.step(session, "completed_research", result[:200])
        rb.end(session, outcome="success" if success else "partial", score=0.9 if success else 0.4)

        print(f"Outcome: {'✅ success' if success else '⚠ partial'}")
        stats = rb.stats()
        print(f"Bank stats: {stats['total']} trajectories, {stats['success']} successes")


if __name__ == "__main__":
    main()
