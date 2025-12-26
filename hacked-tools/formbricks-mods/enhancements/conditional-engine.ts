/**
 * Formbricks Enhancement: Conditional Logic Engine
 *
 * Features:
 * - Show/hide questions based on answers
 * - Nested AND/OR logic groups
 * - Multiple operators (equals, contains, greater_than, etc.)
 */

export type AnswerValue = string | number | boolean | string[];

export interface AnswerRecord {
  questionId: string;
  value: AnswerValue;
}

export enum LogicalOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
}

export interface Condition {
  id: string;
  questionId: string;
  operator: LogicalOperator;
  value: AnswerValue;
}

export interface LogicGroup {
  id: string;
  type: 'AND' | 'OR';
  conditions: Condition[];
  children?: LogicGroup[];
}

export interface FormField {
  id: string;
  type: 'input' | 'payment' | 'textarea' | 'select' | 'radio' | 'checkbox';
  label: string;
  isVisible?: boolean;
  visibilityLogic?: LogicGroup;
}

export class ConditionalEngine {
  /**
   * Evaluates visibility for all fields based on current answers
   */
  evaluateVisibility(
    fields: FormField[],
    answers: AnswerRecord[]
  ): FormField[] {
    const answerMap = new Map(answers.map(a => [a.questionId, a.value]));

    return fields.map(field => {
      if (!field.visibilityLogic) {
        return { ...field, isVisible: true };
      }

      const isVisible = this.evaluateLogicGroup(field.visibilityLogic, answerMap);
      return { ...field, isVisible };
    });
  }

  /**
   * Recursively evaluates nested logic groups
   */
  private evaluateLogicGroup(
    group: LogicGroup,
    answers: Map<string, AnswerValue>
  ): boolean {
    const { type, conditions, children } = group;

    const conditionResults = conditions.map(c => this.evaluateCondition(c, answers));
    const childResults = (children || []).map(child =>
      this.evaluateLogicGroup(child, answers)
    );

    const allResults = [...conditionResults, ...childResults];

    return type === 'AND'
      ? allResults.every(r => r === true)
      : allResults.some(r => r === true);
  }

  /**
   * Evaluates a single condition
   */
  private evaluateCondition(
    condition: Condition,
    answers: Map<string, AnswerValue>
  ): boolean {
    const userValue = answers.get(condition.questionId);

    switch (condition.operator) {
      case LogicalOperator.EQUALS:
        return userValue == condition.value;

      case LogicalOperator.NOT_EQUALS:
        return userValue != condition.value;

      case LogicalOperator.CONTAINS:
        if (Array.isArray(userValue)) {
          return userValue.includes(condition.value as string);
        }
        return typeof userValue === 'string' &&
               userValue.includes(condition.value as string);

      case LogicalOperator.GREATER_THAN:
        return Number(userValue) > Number(condition.value);

      case LogicalOperator.LESS_THAN:
        return Number(userValue) < Number(condition.value);

      case LogicalOperator.IS_EMPTY:
        return !userValue ||
               (Array.isArray(userValue) && userValue.length === 0) ||
               userValue === '';

      case LogicalOperator.IS_NOT_EMPTY:
        return !!userValue &&
               (!Array.isArray(userValue) || userValue.length > 0) &&
               userValue !== '';

      default:
        return false;
    }
  }
}

// Example usage
const engine = new ConditionalEngine();

const fields: FormField[] = [
  { id: 'q1', type: 'radio', label: 'Are you a business?' },
  {
    id: 'q2',
    type: 'input',
    label: 'Company name',
    visibilityLogic: {
      id: 'logic1',
      type: 'AND',
      conditions: [
        { id: 'c1', questionId: 'q1', operator: LogicalOperator.EQUALS, value: 'yes' }
      ]
    }
  }
];

const answers: AnswerRecord[] = [
  { questionId: 'q1', value: 'yes' }
];

const result = engine.evaluateVisibility(fields, answers);
// q2.isVisible === true because q1 === 'yes'
