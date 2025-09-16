export interface Bridge {
    id: string;
    name: string;
    displayName: string;
    description: string;
    type: 'concrete' | 'steel' | 'composite';
    length: number;
    width: number;
    spanCount: number;
    height: number;
    constructionYear: number;
    location: string;
    status: 'active' | 'inactive' | 'maintenance';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateBridgeRequest {
    name: string;
    displayName: string;
    description: string;
    type: 'concrete' | 'steel' | 'composite';
    length: number;
    width: number;
    spanCount: number;
    height: number;
    constructionYear: number;
    location: string;
    status: 'active' | 'inactive' | 'maintenance';
}
export interface UpdateBridgeRequest {
    id: string;
    name?: string;
    displayName?: string;
    description?: string;
    type?: 'concrete' | 'steel' | 'composite';
    length?: number;
    width?: number;
    spanCount?: number;
    height?: number;
    constructionYear?: number;
    location?: string;
    status?: 'active' | 'inactive' | 'maintenance';
    isActive?: boolean;
}
//# sourceMappingURL=Bridge.d.ts.map