// Activepieces L3 Deep Mod: AI Flow Builder Service
// Natural language to flow graph conversion

interface LlmProvider {
    chat(params: { messages: { role: string; content: string }[] }): Promise<{ content: string }>;
}

interface Flow {
    version: number;
    displayName?: string;
    description?: string;
    steps?: Step[];
}

interface Step {
    id: string;
    displayName: string;
    type: string;
    settings: {
        pieceName: string;
        actionName: string;
        input: Record<string, any>;
    };
    next: { id: string } | null;
}

export interface FlowSuggestion {
    flow: Partial<Flow>;
    explanation: string;
}

export class AiFlowBuilderService {
    private openai: LlmProvider;
    private anthropic: LlmProvider;

    constructor(openaiKey: string, anthropicKey: string) {
        this.openai = this.createMockProvider();
        this.anthropic = this.createMockProvider();
    }

    private createMockProvider(): LlmProvider {
        return {
            chat: async (params) => {
                // Mock response for demonstration
                return {
                    content: JSON.stringify({
                        steps: [
                            { name: 'trigger', type: 'trigger', piece: 'webhook', action: 'receive' },
                            { name: 'process', type: 'action', piece: 'code', action: 'execute' }
                        ],
                        connections: [
                            { source: 'trigger', target: 'process' }
                        ]
                    })
                };
            }
        };
    }

    async buildFlowFromPrompt(userPrompt: string, availablePieces: string[]): Promise<FlowSuggestion> {
        const systemPrompt = `
            You are an expert workflow automation architect.
            Your goal is to convert user intent into a JSON flow definition for Activepieces.

            Available Pieces: ${availablePieces.join(', ')}.

            Output a JSON object with the following structure:
            {
                "steps": [
                    { "name": "step_name", "type": "action/trigger", "piece": "piece_name", "action": "action_name" }
                ],
                "connections": [
                    { "source": "step1", "target": "step2" }
                ]
            }
        `;

        const response = await this.anthropic.chat({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        });

        try {
            const rawFlow = JSON.parse(response.content);
            const flow = this.translateToActivepiecesSchema(rawFlow);

            return {
                flow,
                explanation: `Created a flow with ${flow.steps?.length || 0} steps based on: "${userPrompt}"`
            };
        } catch (e) {
            throw new Error('Failed to parse LLM response into valid flow.');
        }
    }

    async suggestNextSteps(currentFlow: Flow): Promise<string[]> {
        const prompt = `
            Analyze this partial workflow and suggest the next logical 2 steps.
            Workflow: ${JSON.stringify(currentFlow)}.
            Return only a JSON array of strings describing the actions.
        `;

        const response = await this.openai.chat({
            messages: [{ role: 'user', content: prompt }]
        });

        try {
            return JSON.parse(response.content);
        } catch {
            return ['Add error handling', 'Send notification'];
        }
    }

    private translateToActivepiecesSchema(llmOutput: any): Partial<Flow> {
        const steps: Step[] = (llmOutput.steps || []).map((s: any) => ({
            id: Math.random().toString(36).substring(7),
            displayName: s.name,
            type: s.type,
            settings: {
                pieceName: s.piece,
                actionName: s.action,
                input: {}
            },
            next: null
        }));

        // Map connections
        for (const conn of llmOutput.connections || []) {
            const sourceStep = steps.find(s => s.displayName === conn.source);
            const targetStep = steps.find(s => s.displayName === conn.target);
            if (sourceStep && targetStep) {
                sourceStep.next = { id: targetStep.id };
            }
        }

        return {
            version: 1,
            steps: steps,
        };
    }
}

export default AiFlowBuilderService;
