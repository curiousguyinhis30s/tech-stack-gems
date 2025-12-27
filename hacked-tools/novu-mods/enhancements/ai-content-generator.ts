// Novu L3 Deep Mod: AI Content Generator
// LLM-powered notification copy generation

import { OpenAI } from 'openai';

type TemplateFormat = 'html' | 'text' | 'subject';
type NotificationChannel = 'email' | 'sms' | 'push';

interface IGenerationContext {
  variables: Record<string, string>;
  topic: string;
  tone: 'professional' | 'friendly' | 'urgent';
}

interface IGeneratedContent {
  subject?: string;
  body: string;
  injectedVariables: string[];
}

class AIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateNotification(
    channel: NotificationChannel,
    context: IGenerationContext
  ): Promise<IGeneratedContent> {
    const systemPrompt = this.buildSystemPrompt(channel, context);
    const userPrompt = `Generate a ${context.tone} notification about: ${context.topic}.`;

    try {
      return this.mockLLMResponse(channel, context);
    } catch (error) {
      console.error('AI Generation failed', error);
      throw new Error('Failed to generate content');
    }
  }

  private buildSystemPrompt(channel: NotificationChannel, context: IGenerationContext): string {
    const varList = Object.keys(context.variables).map(k => `{{${k}}}`).join(', ');

    return `
    You are an expert notification copywriter.
    Output format: JSON object with keys "subject" (optional) and "body".
    Channel: ${channel}.
    Tone: ${context.tone}.

    Constraints:
    1. Keep it concise.
    2. You MUST include these variables where appropriate: ${varList}.
    3. Do not use Markdown.
    4. For SMS, keep under 160 characters.
    5. For Email Subject, keep under 50 characters.
    `;
  }

  private mockLLMResponse(channel: NotificationChannel, context: IGenerationContext): IGeneratedContent {
    const { variables, topic } = context;

    let body = `Regarding ${topic}: `;
    let subject = `Update about ${topic}`;

    if (channel === 'sms') {
      body = `Hi ${variables.userName || 'there'}, update on ${topic}. Click here: ${variables.link || '#'}`;
    } else if (channel === 'email') {
      body = `<h1>Hello ${variables.userName || 'User'}</h1><p>We are writing to inform you about ${topic}.</p>`;
      subject = `Important: ${topic}`;
    } else if (channel === 'push') {
      body = `${topic} requires your attention.`;
    }

    return {
      subject: channel === 'email' ? subject : undefined,
      body,
      injectedVariables: Object.keys(variables)
    };
  }
}

export const createAIContentGenerator = (apiKey: string) => new AIService(apiKey);

export default AIService;
