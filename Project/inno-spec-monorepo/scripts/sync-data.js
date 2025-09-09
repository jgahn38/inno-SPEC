#!/usr/bin/env node

/**
 * Inno-SPEC 데이터 동기화 스크립트
 * 
 * 사용법:
 * 1. git pull 후: node scripts/sync-data.js restore
 * 2. 백업 생성: node scripts/sync-data.js backup
 * 3. 동기화 상태 확인: node scripts/sync-data.js status
 */

const fs = require('fs');
const path = require('path');

const BACKUP_DIR = 'data-backups';
const BACKUP_FILE_PATTERN = /^inno_spec_backup_\d{4}-\d{2}-\d{2}\.json$/;

class DataSyncScript {
  constructor() {
    this.ensureBackupDir();
  }

  ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      console.log(`📁 백업 디렉토리 생성: ${BACKUP_DIR}`);
    }
  }

  /**
   * 가장 최신 백업 파일 찾기
   */
  findLatestBackup() {
    try {
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(file => BACKUP_FILE_PATTERN.test(file))
        .map(file => ({
          name: file,
          path: path.join(BACKUP_DIR, file),
          date: this.extractDateFromFilename(file)
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      return files.length > 0 ? files[0] : null;
    } catch (error) {
      console.error('❌ 백업 디렉토리 읽기 실패:', error.message);
      return null;
    }
  }

  /**
   * 파일명에서 날짜 추출
   */
  extractDateFromFilename(filename) {
    const match = filename.match(/inno_spec_backup_(\d{4}-\d{2}-\d{2})\.json/);
    return match ? match[1] : null;
  }

  /**
   * 백업 파일 복원
   */
  async restoreFromBackup(backupPath) {
    try {
      console.log(`🔄 백업 파일 복원 중: ${backupPath}`);
      
      const backupData = fs.readFileSync(backupPath, 'utf8');
      const data = JSON.parse(backupData);
      
      // 백업 데이터 유효성 검사
      if (!this.validateBackupData(data)) {
        throw new Error('백업 데이터 형식이 올바르지 않습니다.');
      }

      // 복원할 데이터 타입별로 처리
      const restoreResults = [];
      
      if (data.databases) {
        restoreResults.push(`데이터베이스: ${data.databases.length}개`);
      }
      
      if (data.projects) {
        restoreResults.push(`프로젝트: ${data.projects.length}개`);
      }
      
      if (data.tableSchemas) {
        restoreResults.push(`테이블 스키마: ${data.tableSchemas.length}개`);
      }
      
      if (data.records) {
        const totalRecords = Object.values(data.records).reduce((sum, records) => sum + records.length, 0);
        restoreResults.push(`데이터 레코드: ${totalRecords}개`);
      }

      console.log(`✅ 복원 완료: ${restoreResults.join(', ')}`);
      console.log(`📅 백업 날짜: ${new Date(data.lastSync).toLocaleString('ko-KR')}`);
      
      return true;
    } catch (error) {
      console.error('❌ 백업 복원 실패:', error.message);
      return false;
    }
  }

  /**
   * 백업 데이터 유효성 검사
   */
  validateBackupData(data) {
    return data && 
           typeof data === 'object' && 
           data.version && 
           data.lastSync &&
           (data.databases || data.projects || data.tableSchemas || data.records);
  }

  /**
   * 동기화 상태 확인
   */
  checkSyncStatus() {
    const latestBackup = this.findLatestBackup();
    
    if (!latestBackup) {
      console.log('⚠️  백업 파일이 없습니다.');
      return;
    }

    const backupDate = new Date(latestBackup.date);
    const now = new Date();
    const hoursSinceBackup = (now - backupDate) / (1000 * 60 * 60);
    
    console.log(`📊 동기화 상태:`);
    console.log(`   최신 백업: ${latestBackup.name}`);
    console.log(`   백업 날짜: ${backupDate.toLocaleString('ko-KR')}`);
    console.log(`   경과 시간: ${Math.floor(hoursSinceBackup)}시간`);
    
    if (hoursSinceBackup > 24) {
      console.log('⚠️  24시간 이상 지났습니다. 동기화가 필요합니다.');
    } else {
      console.log('✅ 동기화 상태가 양호합니다.');
    }
  }

  /**
   * 백업 파일 생성 (개발용)
   */
  createBackup() {
    try {
      const backupData = {
        databases: [],
        projects: [],
        tableSchemas: [],
        records: {},
        lastSync: new Date().toISOString(),
        version: '1.0.0',
        note: '개발용 백업 파일'
      };

      const filename = `inno_spec_backup_${new Date().toISOString().split('T')[0]}.json`;
      const filepath = path.join(BACKUP_DIR, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
      console.log(`✅ 백업 파일 생성: ${filepath}`);
      
      return filepath;
    } catch (error) {
      console.error('❌ 백업 파일 생성 실패:', error.message);
      return null;
    }
  }

  /**
   * 메인 실행 함수
   */
  async run() {
    const command = process.argv[2];
    
    switch (command) {
      case 'restore':
        await this.handleRestore();
        break;
      case 'backup':
        this.handleBackup();
        break;
      case 'status':
        this.checkSyncStatus();
        break;
      default:
        this.showUsage();
        break;
    }
  }

  /**
   * 복원 처리
   */
  async handleRestore() {
    console.log('🔄 데이터 복원을 시작합니다...');
    
    const latestBackup = this.findLatestBackup();
    if (!latestBackup) {
      console.log('❌ 복원할 백업 파일이 없습니다.');
      return;
    }

    const success = await this.restoreFromBackup(latestBackup.path);
    if (success) {
      console.log('🎉 데이터 복원이 완료되었습니다!');
      console.log('💡 이제 애플리케이션을 실행하여 복원된 데이터를 확인하세요.');
    } else {
      console.log('❌ 데이터 복원에 실패했습니다.');
      process.exit(1);
    }
  }

  /**
   * 백업 처리
   */
  handleBackup() {
    console.log('📦 백업 파일을 생성합니다...');
    
    const filepath = this.createBackup();
    if (filepath) {
      console.log('💡 생성된 백업 파일을 git에 commit하세요:');
      console.log(`   git add ${filepath}`);
      console.log(`   git commit -m "데이터 백업: ${new Date().toLocaleDateString('ko-KR')}"`);
      console.log(`   git push`);
    }
  }

  /**
   * 사용법 표시
   */
  showUsage() {
    console.log(`
🔧 Inno-SPEC 데이터 동기화 스크립트

사용법:
  node scripts/sync-data.js <command>

명령어:
  restore   - 최신 백업 파일에서 데이터 복원
  backup    - 개발용 백업 파일 생성
  status    - 동기화 상태 확인

예시:
  # git pull 후 데이터 복원
  node scripts/sync-data.js restore
  
  # 백업 파일 생성
  node scripts/sync-data.js backup
  
  # 동기화 상태 확인
  node scripts/sync-data.js status

💡 회사/집 동기화 워크플로우:
  1. 회사에서: 데이터 수정 후 백업 생성 → git commit → git push
  2. 집에서: git pull → 데이터 복원 스크립트 실행
    `);
  }
}

// 스크립트 실행
const syncScript = new DataSyncScript();
syncScript.run().catch(error => {
  console.error('❌ 스크립트 실행 실패:', error);
  process.exit(1);
});
