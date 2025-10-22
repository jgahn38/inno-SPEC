import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { TableField } from '@inno-spec/shared';

export class WebSocketService {
  private static instance: WebSocketService;
  private io: SocketIOServer | null = null;

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // 테넌트별 룸에 조인
      socket.on('join-tenant', (tenantId: string) => {
        socket.join(`tenant-${tenantId}`);
        console.log(`Client ${socket.id} joined tenant: ${tenantId}`);
      });

      // 필드 정의 관련 룸에 조인
      socket.on('join-field-definitions', (tenantId: string) => {
        socket.join(`field-definitions-${tenantId}`);
        console.log(`Client ${socket.id} joined field definitions room for tenant: ${tenantId}`);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  // 필드 정의 생성 알림
  public notifyFieldDefinitionCreated(tenantId: string, field: TableField): void {
    if (this.io) {
      this.io.to(`field-definitions-${tenantId}`).emit('field-definition-created', field);
      console.log(`Notified field definition created: ${field.id} for tenant: ${tenantId}`);
    }
  }

  // 필드 정의 업데이트 알림
  public notifyFieldDefinitionUpdated(tenantId: string, field: TableField): void {
    if (this.io) {
      this.io.to(`field-definitions-${tenantId}`).emit('field-definition-updated', field);
      console.log(`Notified field definition updated: ${field.id} for tenant: ${tenantId}`);
    }
  }

  // 필드 정의 삭제 알림
  public notifyFieldDefinitionDeleted(tenantId: string, fieldId: string): void {
    if (this.io) {
      this.io.to(`field-definitions-${tenantId}`).emit('field-definition-deleted', { fieldId });
      console.log(`Notified field definition deleted: ${fieldId} for tenant: ${tenantId}`);
    }
  }

  // 필드 순서 변경 알림
  public notifyFieldDefinitionOrderChanged(tenantId: string, fields: TableField[]): void {
    if (this.io) {
      this.io.to(`field-definitions-${tenantId}`).emit('field-definition-order-changed', fields);
      console.log(`Notified field definition order changed for tenant: ${tenantId}`);
    }
  }

  // 테이블 스키마 생성 알림
  public notifyTableSchemaCreated(tenantId: string, schema: any): void {
    if (this.io) {
      this.io.to(`tenant-${tenantId}`).emit('table-schema-created', schema);
      console.log(`Notified table schema created: ${schema.id} for tenant: ${tenantId}`);
    }
  }

  // 테이블 스키마 업데이트 알림
  public notifyTableSchemaUpdated(tenantId: string, schema: any): void {
    if (this.io) {
      this.io.to(`tenant-${tenantId}`).emit('table-schema-updated', schema);
      console.log(`Notified table schema updated: ${schema.id} for tenant: ${tenantId}`);
    }
  }

  // 테이블 스키마 삭제 알림
  public notifyTableSchemaDeleted(tenantId: string, schemaId: string): void {
    if (this.io) {
      this.io.to(`tenant-${tenantId}`).emit('table-schema-deleted', { schemaId });
      console.log(`Notified table schema deleted: ${schemaId} for tenant: ${tenantId}`);
    }
  }

  public getIO(): SocketIOServer | null {
    return this.io;
  }
}
