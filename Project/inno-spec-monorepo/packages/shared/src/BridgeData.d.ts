export interface BridgeSpecsData {
    id: string;
    bridgeId: string;
    totalLength: number;
    totalWidth: number;
    deckHeight: number;
    girderHeight: number;
    spanLengths: number[];
    spanCount: number;
    concreteStrength: number;
    steelStrength: number;
    deadLoad: number;
    liveLoad: number;
    designYear: number;
    designCode: string;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface StructureStatusData {
    id: string;
    bridgeId: string;
    overallCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    structuralIntegrity: 'intact' | 'minor_damage' | 'moderate_damage' | 'severe_damage';
    damages: Array<{
        id: string;
        location: string;
        type: string;
        severity: 'minor' | 'moderate' | 'severe';
        description: string;
        inspectionDate: Date;
        repairRequired: boolean;
    }>;
    inspections: Array<{
        id: string;
        date: Date;
        inspector: string;
        condition: string;
        findings: string;
        recommendations: string;
    }>;
    repairs: Array<{
        id: string;
        date: Date;
        type: string;
        description: string;
        cost: number;
        contractor: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
}
export interface BearingStatusData {
    id: string;
    bridgeId: string;
    bearingType: 'elastomeric' | 'pot' | 'roller' | 'sliding' | 'fixed' | 'expansion';
    bearings: Array<{
        id: string;
        location: string;
        type: string;
        size: string;
        capacity: number;
        condition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
        installationDate: Date;
        lastInspection: Date;
        notes: string;
    }>;
    overallCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    inspections: Array<{
        id: string;
        date: Date;
        inspector: string;
        findings: string;
        recommendations: string;
    }>;
    replacements: Array<{
        id: string;
        date: Date;
        reason: string;
        oldBearing: string;
        newBearing: string;
        cost: number;
    }>;
    createdAt: Date;
    updatedAt: Date;
}
export interface SectionData {
    id: string;
    bridgeId: string;
    sectionType: string;
    dimensions: Record<string, number>;
    materials: Array<{
        id: string;
        name: string;
        type: string;
        properties: Record<string, number>;
    }>;
    reinforcements: Array<{
        id: string;
        type: string;
        location: string;
        properties: Record<string, number>;
    }>;
    drawingData: {
        svgPath: string;
        viewBox: string;
        annotations: Array<{
            id: string;
            x: number;
            y: number;
            text: string;
            type: 'dimension' | 'label' | 'note';
        }>;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface BridgeData {
    id: string;
    bridgeId: string;
    projectId: string;
    bridgeSpecs: BridgeSpecsData | null;
    structureStatus: StructureStatusData | null;
    bearingStatus: BearingStatusData | null;
    sectionData: SectionData | null;
    lastModified: Date;
    createdBy: string;
    updatedBy: string;
}
export interface CreateBridgeDataRequest {
    bridgeId: string;
    projectId: string;
    dataType: 'bridgeSpecs' | 'structureStatus' | 'bearingStatus' | 'sectionData';
    data: Partial<BridgeSpecsData | StructureStatusData | BearingStatusData | SectionData>;
}
export interface UpdateBridgeDataRequest {
    id: string;
    dataType: 'bridgeSpecs' | 'structureStatus' | 'bearingStatus' | 'sectionData';
    data: Partial<BridgeSpecsData | StructureStatusData | BearingStatusData | SectionData>;
}
export interface GetBridgeDataRequest {
    bridgeId: string;
    projectId: string;
    dataType?: 'bridgeSpecs' | 'structureStatus' | 'bearingStatus' | 'sectionData';
}
//# sourceMappingURL=BridgeData.d.ts.map