/**
 * Local Data Service - Checklist Azura
 * This simulates the Supabase structure using LocalStorage.
 */

const STORAGE_KEYS = {
  ORGANIZATIONS: 'azura_orgs',
  PROFILES: 'azura_profiles',
  TEMPLATES: 'azura_templates',
  SUBMISSIONS: 'azura_submissions'
};

const getLocal = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

export interface ChecklistItem {
  id: string;
  label: string;
  type: 'boolean' | 'numeric' | 'photo' | 'text';
  isMandatory: boolean;
  minValue?: number;
  maxValue?: number;
}

export interface NonConformityResult {
  isConform: boolean;
  level: 'ok' | 'alert';
  message?: string;
}

export const dataService = {
  // Organizations
  getOrganizations: () => getLocal(STORAGE_KEYS.ORGANIZATIONS),
  
  // Profiles
  getProfiles: (orgId?: string) => {
    const profiles = getLocal(STORAGE_KEYS.PROFILES);
    return orgId ? profiles.filter((p: any) => p.organization_id === orgId) : profiles;
  },
  saveProfile: (profile: any) => {
    const profiles = getLocal(STORAGE_KEYS.PROFILES);
    const index = profiles.findIndex((p: any) => p.uid === profile.uid);
    if (index > -1) profiles[index] = { ...profiles[index], ...profile };
    else profiles.push(profile);
    setLocal(STORAGE_KEYS.PROFILES, profiles);
    return profile;
  },

  // Templates
  getTemplates: (orgId: string) => {
    return getLocal(STORAGE_KEYS.TEMPLATES).filter((t: any) => t.organization_id === orgId);
  },
  saveTemplate: (template: any) => {
    const templates = getLocal(STORAGE_KEYS.TEMPLATES);
    const id = template.id || Math.random().toString(36).substr(2, 9);
    const newTemplate = { ...template, id };
    const index = templates.findIndex((t: any) => t.id === id);
    if (index > -1) templates[index] = newTemplate;
    else templates.push(newTemplate);
    setLocal(STORAGE_KEYS.TEMPLATES, templates);
    return newTemplate;
  },

  // Logic for Non-Conformity Trigger
  evaluateResponse: (item: ChecklistItem, value: any): NonConformityResult => {
    if (item.type === 'numeric') {
      const numValue = parseFloat(value);
      if (item.minValue !== undefined && numValue < item.minValue) {
        return { isConform: false, level: 'alert', message: `Valor abaixo do mínimo (${item.minValue})` };
      }
      if (item.maxValue !== undefined && numValue > item.maxValue) {
        return { isConform: false, level: 'alert', message: `Valor acima do máximo (${item.maxValue})` };
      }
    }
    if (item.type === 'boolean' && value === false) {
      // For food safety, 'No' usually triggers an alert if it was a mandatory check
      return { isConform: false, level: 'alert', message: 'Item de conformidade não atendido' };
    }
    return { isConform: true, level: 'ok' };
  },

  // Submissions
  getSubmissions: (orgId: string) => {
    return getLocal(STORAGE_KEYS.SUBMISSIONS).filter((s: any) => s.organization_id === orgId);
  },
  saveSubmission: (submission: any) => {
    const subs = getLocal(STORAGE_KEYS.SUBMISSIONS);
    const id = Math.random().toString(36).substr(2, 9);
    
    // Check for alerts in responses to set final status
    const hasAlert = Object.values(submission.responses).some((r: any) => r.isConform === false);
    
    const newSub = { 
      ...submission, 
      id, 
      status: hasAlert ? 'alert' : 'completed',
      completed_at: new Date().toISOString() 
    };
    
    subs.push(newSub);
    setLocal(STORAGE_KEYS.SUBMISSIONS, subs);
    return newSub;
  }
};
