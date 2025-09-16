import type { Project, CreateProjectRequest, UpdateProjectRequest } from './Project';
export interface IProjectDataProvider {
    /**
     * 모든 프로젝트 목록을 가져옵니다
     */
    getProjects(): Promise<Project[]>;
    /**
     * 특정 ID의 프로젝트를 가져옵니다
     */
    getProjectById(id: string): Promise<Project | null>;
    /**
     * 새 프로젝트를 생성합니다
     */
    createProject(request: CreateProjectRequest): Promise<Project>;
    /**
     * 기존 프로젝트를 업데이트합니다
     */
    updateProject(request: UpdateProjectRequest): Promise<Project>;
    /**
     * 프로젝트를 삭제합니다 (soft delete)
     */
    deleteProject(id: string): Promise<void>;
    /**
     * 프로젝트를 복원합니다
     */
    restoreProject(id: string): Promise<void>;
    /**
     * 프로젝트를 완전히 삭제합니다 (hard delete)
     */
    hardDeleteProject(id: string): Promise<void>;
}
//# sourceMappingURL=IProjectDataProvider.d.ts.map