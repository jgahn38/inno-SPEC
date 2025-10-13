import { MariaDBConnection } from '../database/mariadb-connection';
import { Project, CreateProjectRequest, UpdateProjectRequest } from '@inno-spec/shared';
import { v4 as uuidv4 } from 'uuid';

export class MariaDBProjectService {
  private db: MariaDBConnection;

  constructor() {
    this.db = MariaDBConnection.getInstance();
  }

  private generateId(): string {
    return uuidv4();
  }

  async getAllProjects(tenantId: string): Promise<Project[]> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT p.*, 
         (SELECT JSON_ARRAYAGG(
           JSON_OBJECT(
             'id', b.id,
             'name', b.name,
             'description', b.description,
             'projectId', b.projectId,
             'isActive', b.isActive,
             'createdAt', b.createdAt,
             'updatedAt', b.updatedAt,
             'tenantId', b.tenantId
           )
         ) FROM bridges b WHERE b.projectId = p.id AND b.tenantId = ?) as bridges
         FROM projects p
         WHERE p.tenantId = ? 
         ORDER BY p.createdAt DESC`,
        [tenantId, tenantId]
      );
      
      const projects = rows as any[];
      return projects.map(row => ({
        ...row,
        bridges: row.bridges ? JSON.parse(row.bridges) : []
      })) as Project[];
    } finally {
      connection.release();
    }
  }

  async getProjectById(id: string, tenantId: string): Promise<Project | null> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT p.*, 
         (SELECT JSON_ARRAYAGG(
           JSON_OBJECT(
             'id', b.id,
             'name', b.name,
             'description', b.description,
             'projectId', b.projectId,
             'isActive', b.isActive,
             'createdAt', b.createdAt,
             'updatedAt', b.updatedAt,
             'tenantId', b.tenantId
           )
         ) FROM bridges b WHERE b.projectId = p.id AND b.tenantId = ?) as bridges
         FROM projects p
         WHERE p.id = ? AND p.tenantId = ?`,
        [tenantId, id, tenantId]
      );
      
      const projects = rows as any[];
      if (projects.length === 0) return null;
      
      const project = projects[0];
      return {
        ...project,
        bridges: project.bridges ? JSON.parse(project.bridges) : []
      } as Project;
    } finally {
      connection.release();
    }
  }

  async createProject(request: CreateProjectRequest, tenantId: string, userId: string): Promise<Project> {
    const connection = await this.db.getPool().getConnection();
    try {
      const now = new Date();
      const mysqlDateTime = now.toISOString().slice(0, 19).replace('T', ' ');
      
      const newProject: Project = {
        id: request.id || this.generateId(),
        tenantId,
        name: request.name,
        description: request.description,
        category: request.category,
        categoryId: request.metadata?.categoryId,
        tags: request.tags || [],
        metadata: request.metadata || {},
        status: 'active',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        createdBy: userId,
        bridges: []
      };

      await connection.execute(
        `INSERT INTO projects 
         (id, name, description, category, categoryId, tags, metadata, status, createdAt, updatedAt, tenantId, createdBy, assignedTo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newProject.id,
          newProject.name,
          newProject.description,
          newProject.category,
          newProject.categoryId || null,
          JSON.stringify(newProject.tags),
          JSON.stringify(newProject.metadata),
          newProject.status,
          mysqlDateTime,
          mysqlDateTime,
          newProject.tenantId,
          newProject.createdBy,
          newProject.assignedTo || null
        ]
      );

      return newProject;
    } finally {
      connection.release();
    }
  }

  async updateProject(request: UpdateProjectRequest, tenantId: string): Promise<Project | null> {
    const connection = await this.db.getPool().getConnection();
    try {
      const existingProject = await this.getProjectById(request.id, tenantId);
      if (!existingProject) return null;

      const now = new Date();
      const mysqlDateTime = now.toISOString().slice(0, 19).replace('T', ' ');

      const updatedProject: Project = {
        ...existingProject,
        name: request.name ?? existingProject.name,
        description: request.description ?? existingProject.description,
        category: request.category ?? existingProject.category,
        tags: request.tags ?? existingProject.tags,
        status: request.status ?? existingProject.status,
        metadata: request.metadata ? { ...existingProject.metadata, ...request.metadata } : existingProject.metadata,
        updatedAt: now.toISOString()
      };

      await connection.execute(
        `UPDATE projects 
         SET name = ?, description = ?, category = ?, tags = ?, status = ?, metadata = ?, updatedAt = ?
         WHERE id = ? AND tenantId = ?`,
        [
          updatedProject.name,
          updatedProject.description,
          updatedProject.category,
          JSON.stringify(updatedProject.tags),
          updatedProject.status,
          JSON.stringify(updatedProject.metadata),
          mysqlDateTime,
          request.id,
          tenantId
        ]
      );

      return updatedProject;
    } finally {
      connection.release();
    }
  }

  async deleteProject(id: string, tenantId: string): Promise<boolean> {
    const connection = await this.db.getPool().getConnection();
    try {
      const now = new Date();
      const mysqlDateTime = now.toISOString().slice(0, 19).replace('T', ' ');
      
      // Soft delete - status를 'deleted'로 변경
      const [result] = await connection.execute(
        `UPDATE projects 
         SET status = 'deleted', updatedAt = ?
         WHERE id = ? AND tenantId = ?`,
        [mysqlDateTime, id, tenantId]
      );
      return (result as any).affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async getProjectsByCategory(category: string, tenantId: string): Promise<Project[]> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT p.*, 
         (SELECT JSON_ARRAYAGG(
           JSON_OBJECT(
             'id', b.id,
             'name', b.name,
             'description', b.description,
             'projectId', b.projectId,
             'isActive', b.isActive,
             'createdAt', b.createdAt,
             'updatedAt', b.updatedAt,
             'tenantId', b.tenantId
           )
         ) FROM bridges b WHERE b.projectId = p.id AND b.tenantId = ?) as bridges
         FROM projects p
         WHERE p.category = ? AND p.tenantId = ? AND p.status != 'deleted'
         ORDER BY p.createdAt DESC`,
        [tenantId, category, tenantId]
      );
      
      const projects = rows as any[];
      return projects.map(row => ({
        ...row,
        bridges: row.bridges ? JSON.parse(row.bridges) : []
      })) as Project[];
    } finally {
      connection.release();
    }
  }
}

export const mariaDBProjectService = new MariaDBProjectService();

