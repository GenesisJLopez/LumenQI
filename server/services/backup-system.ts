import fs from 'fs';
import path from 'path';
import { identityStorage } from './identity-storage';
import { voicePersonalityService } from './voice-personality';

export interface SystemBackup {
  id: string;
  name: string;
  timestamp: Date;
  version: string;
  data: {
    identity: any;
    voicePersonality: any;
    brainMemories: any[];
    learningPatterns: any[];
    personalityTraits: any[];
    systemConfiguration: any;
  };
  description: string;
  isDefault: boolean;
}

export class BackupSystem {
  private static instance: BackupSystem;
  private backupDir: string;
  private backups: Map<string, SystemBackup>;

  private constructor() {
    this.backupDir = path.join(process.cwd(), 'lumen-backups');
    this.backups = new Map();
    this.ensureBackupDirectory();
    this.loadBackups();
  }

  static getInstance(): BackupSystem {
    if (!BackupSystem.instance) {
      BackupSystem.instance = new BackupSystem();
    }
    return BackupSystem.instance;
  }

  private ensureBackupDirectory(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  private loadBackups(): void {
    try {
      const backupFiles = fs.readdirSync(this.backupDir)
        .filter(file => file.endsWith('.json'))
        .sort((a, b) => b.localeCompare(a)); // Sort newest first

      for (const file of backupFiles) {
        const filePath = path.join(this.backupDir, file);
        const backup: SystemBackup = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        backup.timestamp = new Date(backup.timestamp); // Convert back to Date
        this.backups.set(backup.id, backup);
      }
    } catch (error) {
      console.error('Error loading backups:', error);
    }
  }

  async createBackup(name: string, description: string = '', isDefault: boolean = false): Promise<string> {
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Collect current system state
      const identity = identityStorage.getIdentity();
      const voicePersonality = voicePersonalityService.getPersonality();
      
      // Read brain storage if it exists
      let brainMemories = [];
      let learningPatterns = [];
      let personalityTraits = [];
      
      try {
        const brainStorageDir = path.join(process.cwd(), 'lumen-brain-storage');
        if (fs.existsSync(brainStorageDir)) {
          const memoriesFile = path.join(brainStorageDir, 'memories.json');
          const patternsFile = path.join(brainStorageDir, 'patterns.json');
          const traitsFile = path.join(brainStorageDir, 'personality.json');
          
          if (fs.existsSync(memoriesFile)) {
            brainMemories = JSON.parse(fs.readFileSync(memoriesFile, 'utf8'));
          }
          if (fs.existsSync(patternsFile)) {
            learningPatterns = JSON.parse(fs.readFileSync(patternsFile, 'utf8'));
          }
          if (fs.existsSync(traitsFile)) {
            personalityTraits = JSON.parse(fs.readFileSync(traitsFile, 'utf8'));
          }
        }
      } catch (error) {
        console.warn('Could not read brain storage:', error);
      }

      // Create backup object
      const backup: SystemBackup = {
        id: backupId,
        name,
        timestamp: new Date(),
        version: '1.0',
        data: {
          identity,
          voicePersonality,
          brainMemories,
          learningPatterns,
          personalityTraits,
          systemConfiguration: {
            backupCreatedAt: new Date(),
            nodeVersion: process.version,
            platform: process.platform
          }
        },
        description,
        isDefault
      };

      // Save backup to file
      const backupFilePath = path.join(this.backupDir, `${backupId}.json`);
      fs.writeFileSync(backupFilePath, JSON.stringify(backup, null, 2));

      // Add to memory
      this.backups.set(backupId, backup);

      // If this is set as default, update all others
      if (isDefault) {
        this.backups.forEach((existingBackup, id) => {
          if (id !== backupId) {
            existingBackup.isDefault = false;
            const filePath = path.join(this.backupDir, `${id}.json`);
            fs.writeFileSync(filePath, JSON.stringify(existingBackup, null, 2));
          }
        });
      }

      console.log(`✓ Backup created: ${name} (${backupId})`);
      return backupId;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Failed to create backup');
    }
  }

  async restoreBackup(backupId: string): Promise<boolean> {
    try {
      const backup = this.backups.get(backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }

      // Restore identity
      identityStorage.setIdentity(backup.data.identity);

      // Restore voice personality
      voicePersonalityService.setPersonality(backup.data.voicePersonality);

      // Restore brain storage
      const brainStorageDir = path.join(process.cwd(), 'lumen-brain-storage');
      if (!fs.existsSync(brainStorageDir)) {
        fs.mkdirSync(brainStorageDir, { recursive: true });
      }

      // Write brain data
      if (backup.data.brainMemories.length > 0) {
        fs.writeFileSync(
          path.join(brainStorageDir, 'memories.json'),
          JSON.stringify(backup.data.brainMemories, null, 2)
        );
      }

      if (backup.data.learningPatterns.length > 0) {
        fs.writeFileSync(
          path.join(brainStorageDir, 'patterns.json'),
          JSON.stringify(backup.data.learningPatterns, null, 2)
        );
      }

      if (backup.data.personalityTraits.length > 0) {
        fs.writeFileSync(
          path.join(brainStorageDir, 'personality.json'),
          JSON.stringify(backup.data.personalityTraits, null, 2)
        );
      }

      console.log(`✓ Backup restored: ${backup.name} (${backupId})`);
      return true;
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw new Error('Failed to restore backup');
    }
  }

  async restoreDefaultBackup(): Promise<boolean> {
    const defaultBackup = Array.from(this.backups.values()).find(b => b.isDefault);
    if (!defaultBackup) {
      throw new Error('No default backup found');
    }
    return this.restoreBackup(defaultBackup.id);
  }

  getBackups(): SystemBackup[] {
    return Array.from(this.backups.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getBackup(backupId: string): SystemBackup | undefined {
    return this.backups.get(backupId);
  }

  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const backup = this.backups.get(backupId);
      if (!backup) {
        return false;
      }

      // Don't allow deleting the default backup
      if (backup.isDefault) {
        throw new Error('Cannot delete default backup');
      }

      // Remove file
      const filePath = path.join(this.backupDir, `${backupId}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Remove from memory
      this.backups.delete(backupId);

      console.log(`✓ Backup deleted: ${backup.name} (${backupId})`);
      return true;
    } catch (error) {
      console.error('Error deleting backup:', error);
      throw error;
    }
  }

  async setAsDefault(backupId: string): Promise<boolean> {
    try {
      const backup = this.backups.get(backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }

      // Update all backups to not be default
      this.backups.forEach((existingBackup, id) => {
        existingBackup.isDefault = (id === backupId);
        const filePath = path.join(this.backupDir, `${id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(existingBackup, null, 2));
      });

      console.log(`✓ Set as default: ${backup.name} (${backupId})`);
      return true;
    } catch (error) {
      console.error('Error setting default backup:', error);
      throw error;
    }
  }
}

export const backupSystem = BackupSystem.getInstance();