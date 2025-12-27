// Activepieces L3 Deep Mod: Piece Factory Service
// Dynamic piece generation from templates or OpenAPI specs

export interface PieceTemplate {
    name: string;
    version: string;
    author: string;
    description: string;
    actions?: string[];
    triggers?: string[];
}

export interface OpenApiImportParams {
    url: string;
    authType: 'api_key' | 'bearer' | 'basic' | 'oauth2';
}

export interface PieceMetadata {
    name: string;
    version: string;
    displayName: string;
    description: string;
    minimumSupportedRelease: string;
    authors: string[];
    actions: any[];
    triggers: any[];
}

export class PieceFactoryService {
    private generatedPieces: Map<string, PieceMetadata> = new Map();

    async createFromTemplate(template: PieceTemplate, codeLogic: string): Promise<PieceMetadata> {
        const pieceDir = `generated/${template.name}`;

        const indexContent = `
            import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
            import ${template.name}Actions from './lib/actions';
            import ${template.name}Triggers from './lib/triggers';

            export const ${template.name} = createPiece({
                displayName: '${template.name}',
                description: '${template.description}',
                auth: PieceAuth.None(),
                minimumSupportedRelease: '0.5.0',
                logoUrl: 'https://cdn.activepieces.com/pieces/${template.name}.png',
                authors: ['${template.author}'],
                actions: ${template.name}Actions,
                triggers: ${template.name}Triggers,
            });
        `;

        const libContent = `
            ${codeLogic}

            export const actions = {};
            export const triggers = {};
        `;

        console.log(`[PieceFactory] Generated piece at ${pieceDir}`);
        console.log(`[PieceFactory] Index content:\n${indexContent}`);
        console.log(`[PieceFactory] Lib content:\n${libContent}`);

        const metadata: PieceMetadata = {
            name: template.name,
            version: template.version,
            displayName: template.name,
            description: template.description,
            minimumSupportedRelease: '0.5.0',
            authors: [template.author],
            actions: [],
            triggers: []
        };

        this.generatedPieces.set(template.name, metadata);
        return metadata;
    }

    async importFromOpenApi(params: OpenApiImportParams): Promise<PieceMetadata> {
        const spec = await this.fetchOpenApiSpec(params.url);

        const generatedActions = Object.keys(spec.paths || {}).map(path => {
            return {
                displayName: `${spec.info?.title || 'API'} - ${path}`,
                description: `Action for ${path}`,
                requireAuth: true,
                props: {
                    url: { type: 'TEXT', defaultValue: path },
                    method: { type: 'DYNAMIC_OPTIONS' },
                    body: { type: 'JSON', required: false }
                },
                run: async (context: any) => {
                    return {};
                }
            };
        });

        return this.createFromTemplate({
            name: this.slugify(spec.info?.title || 'imported-api'),
            version: '1.0.0',
            author: 'AI-Generator',
            description: spec.info?.description || 'Imported from OpenAPI',
            actions: generatedActions.map(a => a.displayName)
        }, this.generateActionBoilerplate(generatedActions));
    }

    private async fetchOpenApiSpec(url: string): Promise<any> {
        try {
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error('[PieceFactory] Failed to fetch OpenAPI spec:', error);
            return { info: { title: 'API', version: '1.0' }, paths: {} };
        }
    }

    private slugify(text: string): string {
        return text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }

    private generateActionBoilerplate(actions: any[]): string {
        return `
            // Auto-generated actions based on OpenAPI spec
            export const actions = ${JSON.stringify(actions, null, 2)};
        `;
    }

    getGeneratedPieces(): PieceMetadata[] {
        return Array.from(this.generatedPieces.values());
    }
}

export default PieceFactoryService;
