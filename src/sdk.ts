export interface StartOptions {
  agent_id?: string;
}

export interface EndOptions {
  outcome: "success" | "failure" | "partial";
  score?: number;
  tags?: string[];
}

export interface ReasoningBankOptions {
  host?: string;
  fetchImpl?: typeof fetch;
}

export class ReasoningBank {
  private readonly host: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ReasoningBankOptions = {}) {
    this.host = (options.host ?? "http://localhost:8001").replace(/\/$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async start(task_description: string, options: StartOptions = {}): Promise<string> {
    const response = await this.post<{ session_id: string }>("/trajectory/start", {
      task_description,
      agent_id: options.agent_id,
    });
    return response.session_id;
  }

  async step(session_id: string, action: string, result: string): Promise<void> {
    await this.post("/trajectory/step", { session_id, action, result });
  }

  async end(session_id: string, options: EndOptions): Promise<unknown> {
    return this.post("/trajectory/end", {
      session_id,
      outcome: options.outcome,
      score: options.score ?? 0.5,
      tags: options.tags ?? [],
    });
  }

  async suggest(task_description: string, limit = 5): Promise<unknown[]> {
    const response = await this.post<{ suggestions: unknown[] }>("/suggest", {
      task_description,
      limit,
    });
    return response.suggestions;
  }

  async stats(): Promise<unknown> {
    const response = await this.fetchImpl(`${this.host}/stats`);
    if (!response.ok) {
      throw new Error(`ReasoningBank request failed: ${response.status}`);
    }
    return response.json();
  }

  private async post<T = unknown>(path: string, body: unknown): Promise<T> {
    const response = await this.fetchImpl(`${this.host}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`ReasoningBank request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }
}
