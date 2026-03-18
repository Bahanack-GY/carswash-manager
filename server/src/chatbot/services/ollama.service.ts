import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface OllamaGenerateResponse {
  response: string;
  done: boolean;
}

@Injectable()
export class OllamaService implements OnModuleInit {
  private readonly logger = new Logger(OllamaService.name);
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = config.get<string>('OLLAMA_BASE_URL', 'http://localhost:11434');
    this.model = config.get<string>('OLLAMA_MODEL', 'qwen2.5:7b');
  }

  async onModuleInit() {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (res.ok) {
        const data = (await res.json()) as { models?: { name: string }[] };
        const models = data.models?.map((m) => m.name) ?? [];
        if (models.some((m) => m.startsWith(this.model.split(':')[0]))) {
          this.logger.log(`Ollama connected. Model "${this.model}" available.`);
        } else {
          this.logger.warn(
            `Ollama connected but model "${this.model}" not found. Available: ${models.join(', ')}. Run: ollama pull ${this.model}`,
          );
        }
      }
    } catch {
      this.logger.warn(
        `Cannot reach Ollama at ${this.baseUrl}. Chatbot will be unavailable until Ollama is running.`,
      );
    }
  }

  async generate(prompt: string, temperature = 0.3): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature,
            top_p: 0.6,
            top_k: 20,
            repeat_penalty: 1.1,
            num_predict: 1024,
            stop: ['\n\n', '```', 'User:'],
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Ollama returned ${res.status}: ${body}`);
      }

      const data = (await res.json()) as OllamaGenerateResponse;
      return (data.response ?? '').trim();
    } finally {
      clearTimeout(timeout);
    }
  }
}
