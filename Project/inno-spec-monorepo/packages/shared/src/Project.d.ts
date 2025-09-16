import type { Bridge } from './Bridge';
export interface Project {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    status: 'active' | 'archived' | 'deleted';
    category: string;
    tags: string[];
    metadata?: Record<string, any>;
    bridges?: Bridge[];
    createdBy: string;
    assignedTo?: string;
}
export interface CreateProjectRequest {
    id: string;
    name: string;
    description: string;
    category: string;
    tags?: string[];
    metadata?: Record<string, any>;
}
export interface UpdateProjectRequest {
    id: string;
    name?: string;
    description?: string;
    category?: string;
    tags?: string[];
    status?: 'active' | 'archived' | 'deleted';
    metadata?: Record<string, any>;
}
//# sourceMappingURL=Project.d.ts.map