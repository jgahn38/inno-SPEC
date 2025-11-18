import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { MariaDBConnection } from './database/mariadb-connection';
import { mariaDBScreenService } from './services/MariaDBScreenService';
import { mariaDBLNBService } from './services/MariaDBLNBService';
import { mariaDBProjectService } from './services/MariaDBProjectService';
import { mariaDBDatabaseService } from './services/MariaDBDatabaseService';
import { mariaDBTableSchemaService } from './services/MariaDBTableSchemaService';
import { mariaDBVariableService } from './services/MariaDBVariableService';
import { mariaDBProjectCategoryService } from './services/MariaDBProjectCategoryService';
import fieldDefinitionsRouter from './routes/field-definitions.js';

// 환경 변수 로드
dotenv.config();

// MariaDB 사용 명시
process.env.USE_MARIADB = 'true';

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS 설정 - 모든 origin 허용 (개발 환경)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-user-id']
}));
app.use(compression());
// Only log errors and important requests
app.use(morgan('combined', {
  skip: function (req, res) {
    // Skip successful GET requests to reduce log noise
    return res.statusCode < 400 && req.method === 'GET';
  }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 데이터베이스 연결 초기화
const db = MariaDBConnection.getInstance();

// 헬스 체크 엔드포인트
app.get('/health', async (req, res) => {
  try {
    const isConnected = await db.testConnection();
    res.json({
      success: true,
      message: 'API Server is running',
      database: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'API Server is running but database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// 화면 관련 API
app.get('/api/screens', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const screens = await mariaDBScreenService.getAllScreens(tenantId);
    res.json({
      success: true,
      data: screens
    });
  } catch (error) {
    console.error('Error fetching screens:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch screens'
    });
  }
});

app.get('/api/screens/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const screen = await mariaDBScreenService.getScreenById(req.params.id, tenantId);
    
    if (!screen) {
      return res.status(404).json({
        success: false,
        error: 'Screen not found'
      });
    }
    
    res.json({
      success: true,
      data: screen
    });
  } catch (error) {
    console.error('Error fetching screen:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch screen'
    });
  }
});

app.post('/api/screens', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const newScreen = await mariaDBScreenService.createScreen(req.body, tenantId);
    
    res.status(201).json({
      success: true,
      data: newScreen
    });
  } catch (error) {
    console.error('Error creating screen:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create screen'
    });
  }
});

app.put('/api/screens/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const updatedScreen = await mariaDBScreenService.updateScreen(req.params.id, req.body, tenantId);
    
    if (!updatedScreen) {
      return res.status(404).json({
        success: false,
        error: 'Screen not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedScreen
    });
  } catch (error) {
    console.error('Error updating screen:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update screen'
    });
  }
});

app.delete('/api/screens/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const deleted = await mariaDBScreenService.deleteScreen(req.params.id, tenantId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Screen not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Screen deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting screen:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete screen'
    });
  }
});

// 프로젝트 관련 API
app.get('/api/projects', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const projects = await mariaDBProjectService.getAllProjects(tenantId);
    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects'
    });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const project = await mariaDBProjectService.getProjectById(req.params.id, tenantId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project'
    });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const userId = req.headers['x-user-id'] as string || 'default-user';
    const newProject = await mariaDBProjectService.createProject(req.body, tenantId, userId);
    
    res.status(201).json({
      success: true,
      data: newProject
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project'
    });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const updatedProject = await mariaDBProjectService.updateProject(
      { id: req.params.id, ...req.body },
      tenantId
    );
    
    if (!updatedProject) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedProject
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project'
    });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const deleted = await mariaDBProjectService.deleteProject(req.params.id, tenantId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete project'
    });
  }
});

app.get('/api/projects/category/:category', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const projects = await mariaDBProjectService.getProjectsByCategory(req.params.category, tenantId);
    
    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Error fetching projects by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects by category'
    });
  }
});

// Databases 관련 API
app.get('/api/databases', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const databases = await mariaDBDatabaseService.getAllDatabases(tenantId);
    res.json({
      success: true,
      data: databases
    });
  } catch (error) {
    console.error('Error fetching databases:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch databases'
    });
  }
});

app.get('/api/databases/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const database = await mariaDBDatabaseService.getDatabaseById(req.params.id, tenantId);
    
    if (!database) {
      return res.status(404).json({
        success: false,
        error: 'Database not found'
      });
    }
    
    res.json({
      success: true,
      data: database
    });
  } catch (error) {
    console.error('Error fetching database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch database'
    });
  }
});

app.get('/api/databases/category/:category', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const databases = await mariaDBDatabaseService.getDatabasesByCategory(req.params.category, tenantId);
    
    res.json({
      success: true,
      data: databases
    });
  } catch (error) {
    console.error('Error fetching databases by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch databases by category'
    });
  }
});

app.post('/api/databases', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const newDatabase = await mariaDBDatabaseService.createDatabase(req.body, tenantId);
    
    res.status(201).json({
      success: true,
      data: newDatabase
    });
  } catch (error) {
    console.error('Error creating database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create database'
    });
  }
});

app.put('/api/databases/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const updatedDatabase = await mariaDBDatabaseService.updateDatabase(
      { id: req.params.id, ...req.body },
      tenantId
    );
    
    if (!updatedDatabase) {
      return res.status(404).json({
        success: false,
        error: 'Database not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedDatabase
    });
  } catch (error) {
    console.error('Error updating database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update database'
    });
  }
});

app.delete('/api/databases/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const deleted = await mariaDBDatabaseService.deleteDatabase(req.params.id, tenantId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Database not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Database deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete database'
    });
  }
});

// Database Records 관련 API
app.get('/api/databases/:databaseId/records', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const records = await mariaDBDatabaseService.getRecordsByDatabaseId(req.params.databaseId, tenantId);
    
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('Error fetching database records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch database records'
    });
  }
});

app.get('/api/databases/records/:recordId', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const record = await mariaDBDatabaseService.getRecordById(req.params.recordId, tenantId);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Record not found'
      });
    }
    
    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Error fetching database record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch database record'
    });
  }
});

app.post('/api/databases/:databaseId/records', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const newRecord = await mariaDBDatabaseService.createRecord(req.params.databaseId, req.body, tenantId);
    
    res.status(201).json({
      success: true,
      data: newRecord
    });
  } catch (error) {
    console.error('Error creating database record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create database record'
    });
  }
});

app.post('/api/databases/:databaseId/records/bulk', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const records = await mariaDBDatabaseService.bulkCreateRecords(req.params.databaseId, req.body.records, tenantId);
    
    res.status(201).json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('Error bulk creating database records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk create database records'
    });
  }
});

app.put('/api/databases/records/:recordId', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const updatedRecord = await mariaDBDatabaseService.updateRecord(req.params.recordId, req.body, tenantId);
    
    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        error: 'Record not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedRecord
    });
  } catch (error) {
    console.error('Error updating database record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update database record'
    });
  }
});

app.delete('/api/databases/records/:recordId', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const deleted = await mariaDBDatabaseService.deleteRecord(req.params.recordId, tenantId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Record not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting database record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete database record'
    });
  }
});

// Table Schemas 관련 API
app.get('/api/table-schemas', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const schemas = await mariaDBTableSchemaService.getAllTableSchemas(tenantId);
    res.json({
      success: true,
      data: schemas
    });
  } catch (error) {
    console.error('Error fetching table schemas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch table schemas'
    });
  }
});

app.get('/api/table-schemas/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const schema = await mariaDBTableSchemaService.getTableSchemaById(req.params.id, tenantId);
    
    if (!schema) {
      return res.status(404).json({
        success: false,
        error: 'Table schema not found'
      });
    }
    
    res.json({
      success: true,
      data: schema
    });
  } catch (error) {
    console.error('Error fetching table schema:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch table schema'
    });
  }
});

app.get('/api/table-schemas/name/:name', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const schema = await mariaDBTableSchemaService.getTableSchemaByName(req.params.name, tenantId);
    
    if (!schema) {
      return res.status(404).json({
        success: false,
        error: 'Table schema not found'
      });
    }
    
    res.json({
      success: true,
      data: schema
    });
  } catch (error) {
    console.error('Error fetching table schema by name:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch table schema'
    });
  }
});

app.post('/api/table-schemas', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const newSchema = await mariaDBTableSchemaService.createTableSchema(req.body, tenantId);
    
    res.status(201).json({
      success: true,
      data: newSchema
    });
  } catch (error) {
    console.error('Error creating table schema:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create table schema'
    });
  }
});

app.put('/api/table-schemas/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const updatedSchema = await mariaDBTableSchemaService.updateTableSchema(
      { id: req.params.id, ...req.body },
      tenantId
    );
    
    if (!updatedSchema) {
      return res.status(404).json({
        success: false,
        error: 'Table schema not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedSchema
    });
  } catch (error) {
    console.error('Error updating table schema:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update table schema'
    });
  }
});

app.delete('/api/table-schemas/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const deleted = await mariaDBTableSchemaService.deleteTableSchema(req.params.id, tenantId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Table schema not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Table schema deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting table schema:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete table schema'
    });
  }
});

// Variables 관련 API
app.get('/api/variables', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const variables = await mariaDBVariableService.getAllVariables(tenantId);
    res.json({
      success: true,
      data: variables
    });
  } catch (error) {
    console.error('Error fetching variables:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch variables'
    });
  }
});

app.get('/api/variables/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const variable = await mariaDBVariableService.getVariableById(req.params.id, tenantId);
    
    if (!variable) {
      return res.status(404).json({
        success: false,
        error: 'Variable not found'
      });
    }
    
    res.json({
      success: true,
      data: variable
    });
  } catch (error) {
    console.error('Error fetching variable:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch variable'
    });
  }
});

app.get('/api/variables/category/:category', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const variables = await mariaDBVariableService.getVariablesByCategory(req.params.category, tenantId);
    
    res.json({
      success: true,
      data: variables
    });
  } catch (error) {
    console.error('Error fetching variables by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch variables by category'
    });
  }
});

app.get('/api/variables/scope/:scope', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const variables = await mariaDBVariableService.getVariablesByScope(req.params.scope, tenantId);
    
    res.json({
      success: true,
      data: variables
    });
  } catch (error) {
    console.error('Error fetching variables by scope:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch variables by scope'
    });
  }
});

app.post('/api/variables', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const newVariable = await mariaDBVariableService.createVariable(req.body, tenantId);
    
    res.status(201).json({
      success: true,
      data: newVariable
    });
  } catch (error) {
    console.error('Error creating variable:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create variable'
    });
  }
});

app.put('/api/variables/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const updatedVariable = await mariaDBVariableService.updateVariable(
      { id: req.params.id, ...req.body },
      tenantId
    );
    
    if (!updatedVariable) {
      return res.status(404).json({
        success: false,
        error: 'Variable not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedVariable
    });
  } catch (error) {
    console.error('Error updating variable:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update variable'
    });
  }
});

app.delete('/api/variables/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const deleted = await mariaDBVariableService.deleteVariable(req.params.id, tenantId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Variable not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Variable deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting variable:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete variable'
    });
  }
});

// Project Categories 관련 API
app.get('/api/project-categories', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const categories = await mariaDBProjectCategoryService.getAllCategories(tenantId);
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching project categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project categories'
    });
  }
});

app.get('/api/project-categories/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const category = await mariaDBProjectCategoryService.getCategoryById(req.params.id, tenantId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Project category not found'
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching project category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project category'
    });
  }
});

app.post('/api/project-categories', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const newCategory = await mariaDBProjectCategoryService.createCategory(req.body, tenantId);
    
    res.status(201).json({
      success: true,
      data: newCategory
    });
  } catch (error) {
    console.error('Error creating project category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project category'
    });
  }
});

app.put('/api/project-categories/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const updatedCategory = await mariaDBProjectCategoryService.updateCategory(
      { id: req.params.id, ...req.body },
      tenantId
    );
    
    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        error: 'Project category not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedCategory
    });
  } catch (error) {
    console.error('Error updating project category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project category'
    });
  }
});

app.delete('/api/project-categories/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const deleted = await mariaDBProjectCategoryService.deleteCategory(req.params.id, tenantId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Project category not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Project category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete project category'
    });
  }
});

app.post('/api/project-categories/reorder', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const success = await mariaDBProjectCategoryService.reorderCategories(req.body.categoryOrders, tenantId);
    
    res.json({
      success,
      message: success ? 'Categories reordered successfully' : 'Failed to reorder categories'
    });
  } catch (error) {
    console.error('Error reordering project categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reorder project categories'
    });
  }
});

// LNB 관련 API
app.get('/api/lnb', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    await mariaDBLNBService.createDefaultLNBConfig(tenantId); // 기본 설정 생성
    const lnbConfigs = await mariaDBLNBService.getAllLNBConfigs(tenantId);
    
    res.json({
      success: true,
      data: lnbConfigs
    });
  } catch (error) {
    console.error('Error fetching LNB configs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch LNB configs'
    });
  }
});

app.get('/api/lnb/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const lnbConfig = await mariaDBLNBService.getLNBConfigById(req.params.id, tenantId);
    
    if (!lnbConfig) {
      return res.status(404).json({
        success: false,
        error: 'LNB config not found'
      });
    }
    
    res.json({
      success: true,
      data: lnbConfig
    });
  } catch (error) {
    console.error('Error fetching LNB config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch LNB config'
    });
  }
});

app.post('/api/lnb', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const newConfig = await mariaDBLNBService.createLNBConfig(req.body, tenantId);
    
    res.status(201).json({
      success: true,
      data: newConfig
    });
  } catch (error) {
    console.error('Error creating LNB config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create LNB config'
    });
  }
});

app.put('/api/lnb/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const updatedConfig = await mariaDBLNBService.updateLNBConfig(req.params.id, req.body, tenantId);
    
    if (!updatedConfig) {
      return res.status(404).json({
        success: false,
        error: 'LNB config not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedConfig
    });
  } catch (error) {
    console.error('Error updating LNB config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update LNB config'
    });
  }
});

app.delete('/api/lnb/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const deleted = await mariaDBLNBService.deleteLNBConfig(req.params.id, tenantId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'LNB config not found'
      });
    }
    
    res.json({
      success: true,
      message: 'LNB config deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting LNB config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete LNB config'
    });
  }
});

// 필드 정의 관련 API
app.use('/api/field-definitions', fieldDefinitionsRouter);

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// 에러 핸들러
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 MariaDB API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🗄️  Database: MariaDB`);
});

export default app;
