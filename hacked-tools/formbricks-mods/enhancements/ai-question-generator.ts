// Formbricks L3 Deep Mod: AI Question Generator
// LLM-powered form question creation

export interface AIConfig {
  apiKey: string;
  provider: 'openai' | 'anthropic' | 'custom';
  model?: string;
  baseUrl?: string;
}

export interface GenerationContext {
  surveyGoal: string;
  targetAudience: string;
  brandTone: 'professional' | 'casual' | 'technical';
  existingQuestions?: string[];
  language?: string;
}

export interface QuestionSuggestion {
  id: string;
  text: string;
  type: 'open' | 'multiple_choice' | 'rating' | 'date' | 'dropdown';
  description?: string;
  choices?: string[];
  rationale: string;
}

export interface SurveyOptimization {
  score: number;
  suggestions: string[];
}

export class AIQuestionGenerator {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  async generateQuestions(context: GenerationContext, count: number = 5): Promise<QuestionSuggestion[]> {
    const prompt = this.buildPrompt(context, count);

    try {
      const response = await this.callLLM(prompt);
      return this.parseLLMResponse(response);
    } catch (error) {
      console.error("Failed to generate questions:", error);
      throw new Error("AI Generation Failed");
    }
  }

  async optimizeSurvey(questions: string[]): Promise<SurveyOptimization> {
    const prompt = `
      You are an expert survey methodologist. Analyze the following list of survey questions for clarity, bias, and length.
      Questions: ${JSON.stringify(questions)}

      Return a JSON object with:
      - "score": a number from 0-100 representing the quality of the survey.
      - "suggestions": an array of strings with specific advice to improve questions.
    `;

    try {
      const responseText = await this.callLLM(prompt);
      return JSON.parse(responseText) as SurveyOptimization;
    } catch (e) {
      return { score: 50, suggestions: ["Could not analyze survey automatically."] };
    }
  }

  private buildPrompt(context: GenerationContext, count: number): string {
    const languageContext = context.language && context.language !== 'en'
      ? ` Translate and localize all questions to the language with ISO code: ${context.language}.`
      : '';

    return `
      You are an expert survey designer. Create ${count} survey questions for a form with the following details:
      - Goal: ${context.surveyGoal}
      - Target Audience: ${context.targetAudience}
      - Tone: ${context.brandTone}
      ${languageContext}

      Return a strictly valid JSON array of objects. Each object must have:
      - "text": The question text.
      - "type": One of [open, multiple_choice, rating, date, dropdown].
      - "choices": (Required if type is multiple_choice or dropdown) An array of 4 options.
      - "rationale": A brief explanation of why this question is relevant.

      Do not include markdown formatting. Just the raw JSON.
    `;
  }

  private async callLLM(prompt: string): Promise<string> {
    if (this.config.provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-4',
          messages: [{ role: 'system', content: prompt }],
          temperature: 0.7
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    }

    throw new Error("Provider not implemented");
  }

  private parseLLMResponse(text: string): QuestionSuggestion[] {
    try {
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);

      return parsed.map((q: any, idx: number) => ({
        id: `ai-gen-${Date.now()}-${idx}`,
        text: q.text,
        type: q.type,
        description: q.description || "",
        choices: q.choices || [],
        rationale: q.rationale
      }));
    } catch (e) {
      console.error("JSON Parsing error", e);
      throw new Error("Failed to parse AI response");
    }
  }
}

export default AIQuestionGenerator;
