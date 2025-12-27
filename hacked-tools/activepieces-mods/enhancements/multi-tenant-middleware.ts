// Activepieces L3 Deep Mod: Multi-Tenant Middleware
// Express middleware for tenant isolation, branding, and rate limiting

import { Request, Response, NextFunction } from 'express';

export interface TenantContext {
    id: string;
    brandingConfig: BrandingConfig;
    rateLimit: number;
}

export interface BrandingConfig {
    logoUrl?: string;
    primaryColor?: string;
    theme?: 'light' | 'dark';
}

declare global {
    namespace Express {
        interface Request {
            tenant?: TenantContext;
        }
    }
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Mock tenant database
const tenantDatabase: Record<string, any> = {
    'tenant-001': {
        id: 'tenant-001',
        plan: 'enterprise',
        branding: {
            logoUrl: 'https://example.com/logo.png',
            primaryColor: '#4F46E5',
            theme: 'dark'
        }
    },
    'tenant-002': {
        id: 'tenant-002',
        plan: 'starter',
        branding: {
            logoUrl: null,
            primaryColor: '#10B981',
            theme: 'light'
        }
    }
};

export class MultiTenantMiddleware {
    static async handle(req: Request, res: Response, next: NextFunction) {
        const tenantId = req.headers['x-tenant-id'] as string;

        if (!tenantId) {
            return res.status(400).json({ error: 'X-Tenant-Id header missing' });
        }

        // Fetch Tenant Config
        const tenant = tenantDatabase[tenantId];

        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // Inject Context
        req.tenant = {
            id: tenant.id,
            brandingConfig: {
                logoUrl: tenant.branding?.logoUrl,
                primaryColor: tenant.branding?.primaryColor,
                theme: tenant.branding?.theme || 'light'
            },
            rateLimit: tenant.plan === 'enterprise' ? 10000 : 1000
        };

        // Apply Rate Limiting
        if (!MultiTenantMiddleware.checkRateLimit(req.tenant.id, req.tenant.rateLimit)) {
            return res.status(429).json({ error: 'Rate limit exceeded for tenant' });
        }

        res.locals.tenant = req.tenant;
        next();
    }

    private static checkRateLimit(tenantId: string, limit: number): boolean {
        const now = Date.now();
        const window = 60000; // 1 minute

        const record = rateLimitMap.get(tenantId);

        if (!record || now > record.resetTime + window) {
            rateLimitMap.set(tenantId, { count: 1, resetTime: now });
            return true;
        }

        if (record.count >= limit) {
            return false;
        }

        record.count++;
        return true;
    }

    static getBrandingForTenant(tenantId: string): BrandingConfig | null {
        const tenant = tenantDatabase[tenantId];
        return tenant?.branding || null;
    }
}

export const multiTenantMiddleware = MultiTenantMiddleware.handle;
export default MultiTenantMiddleware;
