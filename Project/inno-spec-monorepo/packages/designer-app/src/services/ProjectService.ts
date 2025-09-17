import { IProjectDataProvider, Project, CreateProjectRequest, UpdateProjectRequest } from '@inno-spec/shared';

export class ProjectService {
  constructor(private dataProvider: IProjectDataProvider) {}
  
  /**
   * 모든 활성 프로젝트를 가져옵니다
   */
  async getAllProjects(): Promise<Project[]> {
    try {
      return await this.dataProvider.getProjects();
    } catch (error) {
      console.error('Failed to get projects:', error);
      throw new Error('프로젝트 목록을 가져오는데 실패했습니다.');
    }
  }
  
  /**
   * 특정 ID의 프로젝트를 가져옵니다
   */
  async getProjectById(id: string): Promise<Project | null> {
    try {
      return await this.dataProvider.getProjectById(id);
    } catch (error) {
      console.error(`Failed to get project ${id}:`, error);
      throw new Error('프로젝트를 가져오는데 실패했습니다.');
    }
  }
  
  /**
   * 새 프로젝트를 생성합니다
   */
  async createProject(request: CreateProjectRequest): Promise<Project> {
    try {
      // 유효성 검사
      this.validateCreateProjectRequest(request);
      
      // 프로젝트 생성
      const project = await this.dataProvider.createProject(request);
      
      return project;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw new Error('프로젝트 생성에 실패했습니다.');
    }
  }
  
  /**
   * 기존 프로젝트를 업데이트합니다
   */
  async updateProject(request: UpdateProjectRequest): Promise<Project> {
    try {
      // 유효성 검사
      this.validateUpdateProjectRequest(request);
      
      // 기존 프로젝트 확인
      const existingProject = await this.dataProvider.getProjectById(request.id);
      if (!existingProject) {
        throw new Error('프로젝트를 찾을 수 없습니다.');
      }
      
      // 프로젝트 업데이트
      const updatedProject = await this.dataProvider.updateProject(request);
      
      return updatedProject;
    } catch (error) {
      console.error('Failed to update project:', error);
      throw new Error('프로젝트 업데이트에 실패했습니다.');
    }
  }
  
  /**
   * 프로젝트를 삭제합니다 (soft delete)
   */
  async deleteProject(id: string): Promise<void> {
    try {
      // 기존 프로젝트 확인
      const existingProject = await this.dataProvider.getProjectById(id);
      if (!existingProject) {
        throw new Error('프로젝트를 찾을 수 없습니다.');
      }
      
      // 프로젝트 삭제
      await this.dataProvider.deleteProject(id);
    } catch (error) {
      console.error(`Failed to delete project ${id}:`, error);
      throw new Error('프로젝트 삭제에 실패했습니다.');
    }
  }
  
  /**
   * 삭제된 프로젝트를 복원합니다
   */
  async restoreProject(id: string): Promise<void> {
    try {
      await this.dataProvider.restoreProject(id);
    } catch (error) {
      console.error(`Failed to restore project ${id}:`, error);
      throw new Error('프로젝트 복원에 실패했습니다.');
    }
  }
  
  /**
   * 프로젝트를 완전히 삭제합니다 (hard delete)
   */
  async hardDeleteProject(id: string): Promise<void> {
    try {
      await this.dataProvider.hardDeleteProject(id);
    } catch (error) {
      console.error(`Failed to hard delete project ${id}:`, error);
      throw new Error('프로젝트 완전 삭제에 실패했습니다.');
    }
  }
  
  /**
   * 프로젝트 검색 (이름, 설명, 태그 기반)
   */
  async searchProjects(query: string): Promise<Project[]> {
    try {
      const allProjects = await this.dataProvider.getProjects();
      
      if (!query.trim()) {
        return allProjects;
      }
      
      const lowerQuery = query.toLowerCase();
      return allProjects.filter(project => 
        project.name.toLowerCase().includes(lowerQuery) ||
        project.description.toLowerCase().includes(lowerQuery) ||
        project.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      console.error('Failed to search projects:', error);
      throw new Error('프로젝트 검색에 실패했습니다.');
    }
  }
  
  /**
   * 카테고리별 프로젝트 필터링
   */
  async getProjectsByCategory(category: string): Promise<Project[]> {
    try {
      const allProjects = await this.dataProvider.getProjects();
      return allProjects.filter(project => project.category === category);
    } catch (error) {
      console.error(`Failed to get projects by category ${category}:`, error);
      throw new Error('카테고리별 프로젝트 조회에 실패했습니다.');
    }
  }
  
  /**
   * 프로젝트 생성 요청 유효성 검사
   */
  private validateCreateProjectRequest(request: CreateProjectRequest): void {
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('프로젝트 이름은 필수입니다.');
    }
    
    if (request.name.trim().length > 100) {
      throw new Error('프로젝트 이름은 100자를 초과할 수 없습니다.');
    }
    
    if (!request.description || request.description.trim().length === 0) {
      throw new Error('프로젝트 설명은 필수입니다.');
    }
    
    if (request.description.trim().length > 500) {
      throw new Error('프로젝트 설명은 500자를 초과할 수 없습니다.');
    }
    
    if (!request.category || request.category.trim().length === 0) {
      throw new Error('프로젝트 카테고리는 필수입니다.');
    }
  }
  
  /**
   * 프로젝트 업데이트 요청 유효성 검사
   */
  private validateUpdateProjectRequest(request: UpdateProjectRequest): void {
    if (request.name !== undefined && request.name.trim().length === 0) {
      throw new Error('프로젝트 이름은 비워둘 수 없습니다.');
    }
    
    if (request.name !== undefined && request.name.trim().length > 100) {
      throw new Error('프로젝트 이름은 100자를 초과할 수 없습니다.');
    }
    
    if (request.description !== undefined && request.description.trim().length === 0) {
      throw new Error('프로젝트 설명은 비워둘 수 없습니다.');
    }
    
    if (request.description !== undefined && request.description.trim().length > 500) {
      throw new Error('프로젝트 설명은 500자를 초과할 수 없습니다.');
    }
  }
}
