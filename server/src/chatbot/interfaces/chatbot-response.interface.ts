export interface ChatbotResponse {
  success: boolean;
  message: string | null;
  data?: Record<string, unknown>[];
  sql?: string;
}
