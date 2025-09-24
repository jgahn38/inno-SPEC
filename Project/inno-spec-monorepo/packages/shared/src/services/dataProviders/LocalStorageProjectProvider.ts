import { IProjectDataProvider, Project, CreateProjectRequest, UpdateProjectRequest } from '@inno-spec/shared';

export class LocalStorageProjectProvider implements IProjectDataProvider {
  private readonly STORAGE_KEY = 'inno_spec_projects';
  
  constructor() {
    // 샘플 프로젝트 초기화 제거 - 데이터 동기화 관리에서 관리
  }
  

  
  private getProjectsFromStorage(): Project[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to parse projects from localStorage:', error);
      return [];
    }
  }
  
  private saveProjectsToStorage(projects: Project[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error('Failed to save projects to localStorage:', error);
    }
  }
  
  
  async getProjects(): Promise<Project[]> {
    const projects = this.getProjectsFromStorage();
    return projects.filter(p => p.status !== 'deleted');
  }
  
  async getProjectById(id: string): Promise<Project | null> {
    const projects = this.getProjectsFromStorage();
    const project = projects.find(p => p.id === id && p.status !== 'deleted');
    return project || null;
  }
  
  async createProject(request: CreateProjectRequest): Promise<Project> {
    const projects = this.getProjectsFromStorage();
    
    // ID 중복 검사
    const existingProject = projects.find(p => p.id === request.id);
    if (existingProject) {
      throw new Error(`프로젝트 ID '${request.id}'가 이미 존재합니다. 다른 ID를 사용해주세요.`);
    }
    
    const now = new Date().toISOString();
    
    const newProject: any = {
      id: request.id,
      name: request.name,
      description: request.description,
      createdAt: now,
      updatedAt: now,
      status: 'active',
      category: request.category,
      tags: request.tags || [],
      metadata: request.metadata || {},
      bridges: [
        {
          id: `bridge-${Date.now()}`,
          name: '새 교량',
          displayName: '새 교량',
          description: '새로 생성된 교량입니다.',
          type: 'concrete',
          length: 30,
          width: 8,
          spanCount: 2,
          height: 2.5,
          constructionYear: new Date().getFullYear(),
          location: '위치 미정',
          status: 'active',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    };
    
    projects.push(newProject);
    this.saveProjectsToStorage(projects);
    
    return newProject;
  }
  
  async updateProject(request: UpdateProjectRequest): Promise<Project> {
    const projects = this.getProjectsFromStorage();
    const projectIndex = projects.findIndex(p => p.id === request.id);
    
    if (projectIndex === -1) {
      throw new Error(`Project with id ${request.id} not found`);
    }
    
    const updatedProject: Project = {
      ...projects[projectIndex],
      ...request,
      updatedAt: new Date().toISOString()
    };
    
    projects[projectIndex] = updatedProject;
    this.saveProjectsToStorage(projects);
    
    return updatedProject;
  }
  
  async deleteProject(id: string): Promise<void> {
    const projects = this.getProjectsFromStorage();
    const projectIndex = projects.findIndex(p => p.id === id);
    
    if (projectIndex === -1) {
      throw new Error(`Project with id ${id} not found`);
    }
    
    projects[projectIndex].status = 'deleted';
    projects[projectIndex].updatedAt = new Date().toISOString();
    
    this.saveProjectsToStorage(projects);
  }
  
  async restoreProject(id: string): Promise<void> {
    const projects = this.getProjectsFromStorage();
    const projectIndex = projects.findIndex(p => p.id === id);
    
    if (projectIndex === -1) {
      throw new Error(`Project with id ${id} not found`);
    }
    
    projects[projectIndex].status = 'active';
    projects[projectIndex].updatedAt = new Date().toISOString();
    
    this.saveProjectsToStorage(projects);
  }
  
  async hardDeleteProject(id: string): Promise<void> {
    const projects = this.getProjectsFromStorage();
    const filteredProjects = projects.filter(p => p.id !== id);
    
    if (filteredProjects.length === projects.length) {
      throw new Error(`Project with id ${id} not found`);
    }
    
    this.saveProjectsToStorage(filteredProjects);
  }
}
