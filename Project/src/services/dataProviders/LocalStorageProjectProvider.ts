import { IProjectDataProvider } from '../../types';
import { Project, CreateProjectRequest, UpdateProjectRequest } from '../../types';

export class LocalStorageProjectProvider implements IProjectDataProvider {
  private readonly STORAGE_KEY = 'inno_spec_projects';
  
  constructor() {
    this.initializeDefaultProjects();
  }
  
  private initializeDefaultProjects(): void {
    const existing = localStorage.getItem(this.STORAGE_KEY);
    if (!existing) {
      const defaultProjects: Project[] = [
        {
          id: 'project-1',
          name: '기본 프로젝트 1',
          description: '기본 프로젝트 설명입니다.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active',
          category: 'general',
          tags: ['기본', '샘플'],
          metadata: {},
          bridges: [
            {
              id: 'bridge-1',
              name: '교량 A',
              description: '기본 교량',
              type: 'concrete',
              length: 35,
              width: 8,
              spanCount: 3,
              height: 2.5,
              constructionYear: 2020,
              location: '서울시',
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        },
        {
          id: 'project-2',
          name: '기본 프로젝트 2',
          description: '두 번째 기본 프로젝트입니다.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active',
          category: 'general',
          tags: ['기본', '샘플'],
          metadata: {},
          bridges: [
            {
              id: 'bridge-2',
              name: '교량 B',
              description: '두 번째 기본 교량',
              type: 'steel',
              length: 40,
              width: 10,
              spanCount: 4,
              height: 3.0,
              constructionYear: 2019,
              location: '부산시',
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        },
        {
          id: 'project-3',
          name: '기본 프로젝트 3',
          description: '세 번째 기본 프로젝트입니다.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active',
          category: 'general',
          tags: ['기본', '샘플'],
          metadata: {},
          bridges: [
            {
              id: 'bridge-3',
              name: '교량 C',
              description: '세 번째 기본 교량',
              type: 'composite',
              length: 45,
              width: 12,
              spanCount: 5,
              height: 3.5,
              constructionYear: 2021,
              location: '대구시',
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        }
      ];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(defaultProjects));
    }
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
  
  private generateId(): string {
    return `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
    console.log('LocalStorageProjectProvider.createProject called with:', request);
    
    const projects = this.getProjectsFromStorage();
    console.log('Current projects in storage:', projects);
    
    const now = new Date().toISOString();
    
    const newProject: Project = {
      id: this.generateId(),
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
          description: '새로 생성된 교량입니다.',
          type: 'concrete',
          length: 30,
          width: 8,
          spanCount: 2,
          height: 2.5,
          constructionYear: new Date().getFullYear(),
          location: '위치 미정',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    };
    
    console.log('New project object created:', newProject);
    
    projects.push(newProject);
    console.log('Project added to array, total projects:', projects.length);
    
    this.saveProjectsToStorage(projects);
    console.log('Projects saved to localStorage');
    
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
