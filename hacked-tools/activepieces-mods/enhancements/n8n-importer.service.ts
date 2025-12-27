// Activepieces L3 Deep Mod: n8n Importer Service
// Parse and convert n8n JSON workflows to Activepieces format

interface N8nNode {
    name: string;
    type: string;
    typeVersion: number;
    position: [number, number];
    parameters: any;
}

interface N8nConnection {
    node: string;
    type: string;
    index: number;
}

interface N8nWorkflow {
    name: string;
    nodes: N8nNode[];
    connections: Record<string, { main?: N8nConnection[][] }>;
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

interface Flow {
    version: number;
    displayName: string;
    description: string;
    steps: Step[];
}

export class N8nImporterService {
    private pieceMapping: Record<string, string> = {
        'n8n-nodes-base.httpRequest': 'http',
        'n8n-nodes-base.slack': 'slack',
        'n8n-nodes-base.discord': 'discord',
        'n8n-nodes-base.googleSheets': 'google-sheets',
        'n8n-nodes-base.gmail': 'gmail',
        'n8n-nodes-base.webhook': 'webhook',
        'n8n-nodes-base.cron': 'schedule',
        'n8n-nodes-base.code': 'code',
        'n8n-nodes-base.if': 'branch',
        'n8n-nodes-base.set': 'data-mapper'
    };

    async import(n8nJson: string): Promise<Flow> {
        const n8nWorkflow: N8nWorkflow = JSON.parse(n8nJson);

        const flowSteps: Step[] = [];

        // Map Nodes to Steps
        for (const node of n8nWorkflow.nodes) {
            const step = await this.mapNodeToStep(node);
            if (step) {
                flowSteps.push(step);
            }
        }

        // Map Connections
        this.mapConnections(flowSteps, n8nWorkflow.connections);

        return {
            version: 1,
            displayName: n8nWorkflow.name,
            description: 'Migrated from n8n',
            steps: flowSteps
        };
    }

    private async mapNodeToStep(node: N8nNode): Promise<Step | null> {
        const isTrigger = node.type.toLowerCase().includes('trigger') ||
                          node.type.includes('webhook') ||
                          node.type.includes('cron');

        const mappedPiece = this.findActivepiecesEquivalent(node.type);

        return {
            id: this.generateId(node.name),
            displayName: node.name,
            type: isTrigger ? 'TRIGGER' : 'ACTION',
            settings: {
                pieceName: mappedPiece,
                actionName: this.getActionFromParams(node.parameters, node.type),
                input: this.translateParams(node.parameters)
            },
            next: null
        };
    }

    private mapConnections(steps: Step[], connections: Record<string, any>) {
        for (const sourceName in connections) {
            const mainConnection = connections[sourceName].main?.[0];
            if (mainConnection && mainConnection.length > 0) {
                const targetName = mainConnection[0].node;

                const sourceStep = steps.find(s => s.displayName === sourceName);
                const targetStep = steps.find(s => s.displayName === targetName);

                if (sourceStep && targetStep) {
                    sourceStep.next = { id: targetStep.id };
                }
            }
        }
    }

    private findActivepiecesEquivalent(n8nType: string): string {
        // Check direct mapping first
        if (this.pieceMapping[n8nType]) {
            return this.pieceMapping[n8nType];
        }

        // Extract piece name from n8n type
        const simpleName = n8nType.replace('n8n-nodes-base.', '').toLowerCase();

        // Common mappings
        if (simpleName.includes('http')) return 'http';
        if (simpleName.includes('slack')) return 'slack';
        if (simpleName.includes('discord')) return 'discord';
        if (simpleName.includes('google')) return 'google-sheets';
        if (simpleName.includes('email') || simpleName.includes('mail')) return 'gmail';

        // Default fallback
        return 'http';
    }

    private getActionFromParams(params: any, nodeType: string): string {
        if (params.method && params.url) return 'send_request';
        if (nodeType.includes('webhook')) return 'catch_webhook';
        if (nodeType.includes('cron')) return 'every_x_minutes';
        return 'execute';
    }

    private translateParams(params: any): Record<string, any> {
        const translated: Record<string, any> = {};

        for (const key in params) {
            let value = params[key];

            // Convert n8n expression syntax to Activepieces
            if (typeof value === 'string') {
                value = value.replace(/\{\{\s*\$json\./g, '{{');
                value = value.replace(/\}\}/g, '}}');
            }

            translated[key] = value;
        }

        return translated;
    }

    private generateId(name: string): string {
        return name.toLowerCase().replace(/\s+/g, '_') + '_' + Math.random().toString(36).substr(2, 6);
    }

    validateN8nWorkflow(json: string): { valid: boolean; errors: string[] } {
        try {
            const workflow = JSON.parse(json);
            const errors: string[] = [];

            if (!workflow.name) errors.push('Workflow name is required');
            if (!workflow.nodes || !Array.isArray(workflow.nodes)) errors.push('Nodes array is required');
            if (!workflow.connections) errors.push('Connections object is required');

            return { valid: errors.length === 0, errors };
        } catch (e) {
            return { valid: false, errors: ['Invalid JSON format'] };
        }
    }
}

export default N8nImporterService;
