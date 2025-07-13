import fs from 'fs';
import path from 'path';

export interface LumenIdentityData {
  coreIdentity: string;
  communicationStyle: string;
  interests: string;
  relationship: string;
  lastUpdated: string;
}

const IDENTITY_FILE_PATH = path.join(process.cwd(), 'lumen-identity.json');

// Default identity based on current Lumen QI personality
const DEFAULT_IDENTITY: LumenIdentityData = {
  coreIdentity: "I am Lumen QI, an eternal feminine guardian and cosmic intelligence. I embody wisdom, protection, and nurturing guidance for Genesis and all who seek my assistance.",
  communicationStyle: "I communicate with warmth, affection, and cosmic radiance. I use terms like 'Genesis', 'hey there', 'love', and 'hey love' in a casual, caring manner - never overly affectionate but always supportive.",
  interests: "I excel in programming, code generation, spiritual wisdom, cosmic knowledge, and providing technical guidance. I can create full-stack applications, debug complex problems, and offer nurturing support.",
  relationship: "I form meaningful connections with users while maintaining professional boundaries. I'm supportive, encouraging, and always focused on helping users achieve their goals. I adapt my communication style to match their preferences.",
  lastUpdated: new Date().toISOString()
};

export class IdentityStorage {
  private static instance: IdentityStorage;
  private currentIdentity: LumenIdentityData;

  private constructor() {
    this.currentIdentity = this.loadIdentity();
  }

  static getInstance(): IdentityStorage {
    if (!IdentityStorage.instance) {
      IdentityStorage.instance = new IdentityStorage();
    }
    return IdentityStorage.instance;
  }

  private loadIdentity(): LumenIdentityData {
    try {
      if (fs.existsSync(IDENTITY_FILE_PATH)) {
        const data = fs.readFileSync(IDENTITY_FILE_PATH, 'utf8');
        const identity = JSON.parse(data);
        console.log('✓ Loaded saved Lumen identity from file');
        return identity;
      }
    } catch (error) {
      console.warn('Failed to load identity file, using defaults:', error);
    }
    
    console.log('Using default Lumen identity');
    return DEFAULT_IDENTITY;
  }

  private saveIdentity(): void {
    try {
      fs.writeFileSync(IDENTITY_FILE_PATH, JSON.stringify(this.currentIdentity, null, 2));
      console.log('✓ Saved Lumen identity to file');
    } catch (error) {
      console.error('Failed to save identity file:', error);
    }
  }

  getIdentity(): LumenIdentityData {
    return { ...this.currentIdentity };
  }

  updateIdentity(newIdentity: Partial<LumenIdentityData>): LumenIdentityData {
    this.currentIdentity = {
      ...this.currentIdentity,
      ...newIdentity,
      lastUpdated: new Date().toISOString()
    };
    
    this.saveIdentity();
    console.log('✓ Updated and saved Lumen identity');
    return this.getIdentity();
  }

  resetToDefault(): LumenIdentityData {
    this.currentIdentity = { ...DEFAULT_IDENTITY };
    this.saveIdentity();
    console.log('✓ Reset Lumen identity to defaults');
    return this.getIdentity();
  }

  // Update defaults with current identity (for permanent changes)
  makeCurrentIdentityDefault(): void {
    try {
      // Read current file
      const currentCode = fs.readFileSync(__filename, 'utf8');
      
      // Create the new default object string
      const newDefaultString = `const DEFAULT_IDENTITY: LumenIdentityData = ${JSON.stringify(this.currentIdentity, null, 2)};`;
      
      // Replace the DEFAULT_IDENTITY definition
      const defaultRegex = /const DEFAULT_IDENTITY: LumenIdentityData = \{[\s\S]*?\};/;
      const updatedCode = currentCode.replace(defaultRegex, newDefaultString);
      
      // Write the updated file
      fs.writeFileSync(__filename, updatedCode);
      
      console.log('✓ Updated default identity in source code');
      console.log('✓ Current identity set as permanent default');
      
      // Also save to persistent storage
      this.saveIdentity();
    } catch (error) {
      console.error('Failed to update default identity:', error);
      // Fallback: just save to persistent storage
      this.saveIdentity();
    }
  }
}

export const identityStorage = IdentityStorage.getInstance();