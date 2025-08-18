import { getProjectDataProvider } from '../config/dataProvider';
import { ProjectService } from './ProjectService';

// 프로젝트 데이터 제공자 인스턴스 생성
const projectDataProvider = getProjectDataProvider();

// 프로젝트 서비스 인스턴스 생성
export const projectService = new ProjectService(projectDataProvider);

// 모든 서비스 export
export { ProjectService } from './ProjectService';
export { LocalStorageProjectProvider } from './dataProviders/LocalStorageProjectProvider';
export { MEngineService } from './MEngineService';
export { TableSchemaService } from './TableSchemaService';
export { MParser } from './MParser';
