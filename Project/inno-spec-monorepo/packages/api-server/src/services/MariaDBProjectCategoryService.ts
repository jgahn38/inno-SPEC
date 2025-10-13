import { MariaDBConnection } from '../database/mariadb-connection';
import { ProjectCategory, CreateProjectCategoryRequest, UpdateProjectCategoryRequest } from '@inno-spec/shared';
import { v4 as uuidv4 } from 'uuid';

export class MariaDBProjectCategoryService {
  private db: MariaDBConnection;

  constructor() {
    this.db = MariaDBConnection.getInstance();
  }

  private generateId(): string {
    return uuidv4();
  }

  async getAllCategories(tenantId: string): Promise<ProjectCategory[]> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM project_categories WHERE tenantId = ? ORDER BY `order` ASC',
        [tenantId]
      );
      
      const categories = rows as any[];
      return categories.map(row => ({
        ...row,
        isActive: Boolean(row.isActive)
      })) as ProjectCategory[];
    } finally {
      connection.release();
    }
  }

  async getCategoryById(id: string, tenantId: string): Promise<ProjectCategory | null> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM project_categories WHERE id = ? AND tenantId = ?',
        [id, tenantId]
      );
      
      const categories = rows as any[];
      if (categories.length === 0) return null;
      
      const category = categories[0];
      return {
        ...category,
        isActive: Boolean(category.isActive)
      } as ProjectCategory;
    } finally {
      connection.release();
    }
  }

  async getCategoryByName(name: string, tenantId: string): Promise<ProjectCategory | null> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM project_categories WHERE name = ? AND tenantId = ?',
        [name, tenantId]
      );
      
      const categories = rows as any[];
      if (categories.length === 0) return null;
      
      const category = categories[0];
      return {
        ...category,
        isActive: Boolean(category.isActive)
      } as ProjectCategory;
    } finally {
      connection.release();
    }
  }

  async createCategory(request: CreateProjectCategoryRequest, tenantId: string): Promise<ProjectCategory> {
    const connection = await this.db.getPool().getConnection();
    try {
      const now = new Date();
      const mysqlDateTime = now.toISOString().slice(0, 19).replace('T', ' ');
      
      const newCategory: ProjectCategory = {
        id: this.generateId(),
        name: request.name,
        displayName: request.displayName,
        description: request.description,
        color: request.color,
        icon: request.icon,
        order: request.order,
        isActive: request.isActive ?? true,
        createdAt: now,
        updatedAt: now
      };

      await connection.execute(
        `INSERT INTO project_categories 
         (id, name, displayName, description, color, icon, \`order\`, isActive, createdAt, updatedAt, tenantId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newCategory.id,
          newCategory.name,
          newCategory.displayName,
          newCategory.description,
          newCategory.color,
          newCategory.icon,
          newCategory.order,
          newCategory.isActive,
          mysqlDateTime,
          mysqlDateTime,
          tenantId
        ]
      );

      return newCategory;
    } finally {
      connection.release();
    }
  }

  async updateCategory(request: UpdateProjectCategoryRequest, tenantId: string): Promise<ProjectCategory | null> {
    const connection = await this.db.getPool().getConnection();
    try {
      const existingCategory = await this.getCategoryById(request.id, tenantId);
      if (!existingCategory) return null;

      const now = new Date();
      const mysqlDateTime = now.toISOString().slice(0, 19).replace('T', ' ');

      const updatedCategory: ProjectCategory = {
        ...existingCategory,
        name: request.name ?? existingCategory.name,
        displayName: request.displayName ?? existingCategory.displayName,
        description: request.description ?? existingCategory.description,
        color: request.color ?? existingCategory.color,
        icon: request.icon ?? existingCategory.icon,
        order: request.order ?? existingCategory.order,
        isActive: request.isActive ?? existingCategory.isActive,
        updatedAt: now
      };

      await connection.execute(
        `UPDATE project_categories 
         SET name = ?, displayName = ?, description = ?, color = ?, icon = ?, \`order\` = ?, isActive = ?, updatedAt = ?
         WHERE id = ? AND tenantId = ?`,
        [
          updatedCategory.name,
          updatedCategory.displayName,
          updatedCategory.description,
          updatedCategory.color,
          updatedCategory.icon,
          updatedCategory.order,
          updatedCategory.isActive,
          mysqlDateTime,
          request.id,
          tenantId
        ]
      );

      return updatedCategory;
    } finally {
      connection.release();
    }
  }

  async deleteCategory(id: string, tenantId: string): Promise<boolean> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [result] = await connection.execute(
        'DELETE FROM project_categories WHERE id = ? AND tenantId = ?',
        [id, tenantId]
      );
      return (result as any).affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async updateCategoryOrder(categoryId: string, newOrder: number, tenantId: string): Promise<boolean> {
    const connection = await this.db.getPool().getConnection();
    try {
      const now = new Date();
      const mysqlDateTime = now.toISOString().slice(0, 19).replace('T', ' ');
      
      const [result] = await connection.execute(
        'UPDATE project_categories SET `order` = ?, updatedAt = ? WHERE id = ? AND tenantId = ?',
        [newOrder, mysqlDateTime, categoryId, tenantId]
      );
      return (result as any).affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async reorderCategories(categoryOrders: { id: string; order: number }[], tenantId: string): Promise<boolean> {
    const connection = await this.db.getPool().getConnection();
    try {
      await connection.beginTransaction();

      const now = new Date();
      const mysqlDateTime = now.toISOString().slice(0, 19).replace('T', ' ');

      for (const { id, order } of categoryOrders) {
        await connection.execute(
          'UPDATE project_categories SET `order` = ?, updatedAt = ? WHERE id = ? AND tenantId = ?',
          [order, mysqlDateTime, id, tenantId]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export const mariaDBProjectCategoryService = new MariaDBProjectCategoryService();

