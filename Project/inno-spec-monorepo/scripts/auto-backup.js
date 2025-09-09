#!/usr/bin/env node

/**
 * 자동 백업 스크립트
 * 백업 데이터를 data-backups 폴더에 자동으로 저장
 */

const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '..', 'data-backups');

class AutoBackup {
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
   * 백업 데이터를 파일로 저장
   */
  saveBackup(backupData, filename = null) {
    try {
      if (!filename) {
        const date = new Date().toISOString().split('T')[0];
        const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
        filename = `inno_spec_backup_${date}_${time}.json`;
      }

      const filepath = path.join(BACKUP_DIR, filename);
      
      // 백업 데이터를 파일로 저장
      fs.writeFileSync(filepath, backupData, 'utf8');
      
      console.log(`✅ 백업 파일 저장 완료: ${filepath}`);
      return { success: true, filepath, filename };
      
    } catch (error) {
      console.error('❌ 백업 파일 저장 실패:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 백업 파일 목록 조회
   */
  getBackupFiles() {
    try {
      if (!fs.existsSync(BACKUP_DIR)) {
        return [];
      }

      const files = fs.readdirSync(BACKUP_DIR)
        .filter(file => file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(BACKUP_DIR, file),
          size: fs.statSync(path.join(BACKUP_DIR, file)).size,
          modified: fs.statSync(path.join(BACKUP_DIR, file)).mtime
        }))
        .sort((a, b) => b.modified - a.modified);

      return files;
    } catch (error) {
      console.error('❌ 백업 파일 목록 조회 실패:', error.message);
      return [];
    }
  }

  /**
   * 오래된 백업 파일 정리 (30일 이상)
   */
  cleanupOldBackups(daysToKeep = 30) {
    try {
      const files = this.getBackupFiles();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      let deletedCount = 0;
      files.forEach(file => {
        if (file.modified < cutoffDate) {
          fs.unlinkSync(file.path);
          console.log(`🗑️ 오래된 백업 파일 삭제: ${file.name}`);
          deletedCount++;
        }
      });

      if (deletedCount > 0) {
        console.log(`✅ ${deletedCount}개의 오래된 백업 파일이 정리되었습니다.`);
      } else {
        console.log('✅ 정리할 오래된 백업 파일이 없습니다.');
      }

      return deletedCount;
    } catch (error) {
      console.error('❌ 백업 파일 정리 실패:', error.message);
      return 0;
    }
  }

  /**
   * 백업 상태 확인
   */
  getBackupStatus() {
    const files = this.getBackupFiles();
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    return {
      totalFiles: files.length,
      totalSize: this.formatBytes(totalSize),
      latestBackup: files.length > 0 ? files[0] : null,
      backupDir: BACKUP_DIR
    };
  }

  /**
   * 바이트를 읽기 쉬운 형태로 변환
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// CLI 명령어 처리
if (require.main === module) {
  const autoBackup = new AutoBackup();
  const command = process.argv[2];

  switch (command) {
    case 'status':
      const status = autoBackup.getBackupStatus();
      console.log('📊 백업 상태:');
      console.log(`   총 백업 파일: ${status.totalFiles}개`);
      console.log(`   총 크기: ${status.totalSize}`);
      console.log(`   백업 디렉토리: ${status.backupDir}`);
      if (status.latestBackup) {
        console.log(`   최신 백업: ${status.latestBackup.name} (${status.latestBackup.modified.toLocaleString('ko-KR')})`);
      }
      break;

    case 'cleanup':
      const deletedCount = autoBackup.cleanupOldBackups();
      console.log(`🧹 정리 완료: ${deletedCount}개 파일 삭제`);
      break;

    case 'list':
      const files = autoBackup.getBackupFiles();
      console.log('📋 백업 파일 목록:');
      files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name} (${autoBackup.formatBytes(file.size)}) - ${file.modified.toLocaleString('ko-KR')}`);
      });
      break;

    default:
      console.log(`
🔧 자동 백업 스크립트

사용법:
  node scripts/auto-backup.js <command>

명령어:
  status    - 백업 상태 확인
  cleanup   - 오래된 백업 파일 정리 (30일 이상)
  list      - 백업 파일 목록 조회

예시:
  node scripts/auto-backup.js status
  node scripts/auto-backup.js cleanup
  node scripts/auto-backup.js list
      `);
      break;
  }
}

module.exports = AutoBackup;
