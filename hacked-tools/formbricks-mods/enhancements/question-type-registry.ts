// Formbricks L3 Deep Mod: Question Type Registry
// Plugin system for custom question types

export interface IQuestionType {
  typeIdentifier: string;
  label: string;
  icon: string;
  configurationSchema: Record<string, 'string' | 'number' | 'boolean' | 'object'>;
  defaultConfig: Record<string, any>;
  renderComponent?: string;
}

export interface ValidationRule {
  validate: (value: any, config: any) => boolean;
  errorMessage: string;
}

export class QuestionTypeRegistry {
  private static instance: QuestionTypeRegistry;
  private registry: Map<string, IQuestionType> = new Map();
  private validators: Map<string, ValidationRule[]> = new Map();

  private constructor() {
    this.registerDefaultTypes();
  }

  static getInstance(): QuestionTypeRegistry {
    if (!QuestionTypeRegistry.instance) {
      QuestionTypeRegistry.instance = new QuestionTypeRegistry();
    }
    return QuestionTypeRegistry.instance;
  }

  registerType(questionType: IQuestionType): void {
    if (this.registry.has(questionType.typeIdentifier)) {
      throw new Error(`Question type ${questionType.typeIdentifier} is already registered.`);
    }
    this.registry.set(questionType.typeIdentifier, questionType);
    console.log(`Registered custom type: ${questionType.label}`);
  }

  getType(typeIdentifier: string): IQuestionType | undefined {
    return this.registry.get(typeIdentifier);
  }

  listTypes(): IQuestionType[] {
    return Array.from(this.registry.values());
  }

  addValidator(typeIdentifier: string, rule: ValidationRule): void {
    const rules = this.validators.get(typeIdentifier) || [];
    rules.push(rule);
    this.validators.set(typeIdentifier, rules);
  }

  validate(typeIdentifier: string, value: any, config: any): { isValid: boolean; errors: string[] } {
    const rules = this.validators.get(typeIdentifier);
    const errors: string[] = [];

    if (!rules) return { isValid: true, errors: [] };

    rules.forEach(rule => {
      if (!rule.validate(value, config)) {
        errors.push(rule.errorMessage);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  exportRegistry(): string {
    const data = Array.from(this.registry.values());
    return JSON.stringify(data, null, 2);
  }

  importRegistry(jsonString: string): void {
    try {
      const types: IQuestionType[] = JSON.parse(jsonString);
      types.forEach(t => this.registerType(t));
    } catch (e) {
      console.error("Failed to import registry", e);
      throw new Error("Invalid JSON for registry import");
    }
  }

  private registerDefaultTypes(): void {
    const textType: IQuestionType = {
      typeIdentifier: 'text',
      label: 'Long Text',
      icon: '📝',
      configurationSchema: { placeholder: 'string', maxLength: 'number' },
      defaultConfig: { placeholder: 'Type your answer...', maxLength: 1000 }
    };
    this.registerType(textType);

    this.addValidator('text', {
      validate: (val, conf) => !val || val.length <= (conf?.maxLength || 1000),
      errorMessage: 'Answer is too long.'
    });
  }
}

export const initCustomRegistry = () => {
  const registry = QuestionTypeRegistry.getInstance();

  registry.registerType({
    typeIdentifier: 'custom-nps',
    label: 'Custom NPS',
    icon: '🚀',
    configurationSchema: {
      color: 'string',
      minLabel: 'string',
      maxLabel: 'string'
    },
    defaultConfig: {
      color: '#000000',
      minLabel: 'Not likely',
      maxLabel: 'Very likely'
    }
  });

  registry.addValidator('custom-nps', {
    validate: (val) => typeof val === 'number' && val >= 0 && val <= 10,
    errorMessage: 'Score must be between 0 and 10.'
  });
};

export default QuestionTypeRegistry;
