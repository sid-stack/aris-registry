export interface RFPDocument {
  id: string;
  name: string;
  content: string;
  type: 'RFP' | 'SOW' | 'QA' | 'Other';
}

export interface ComplianceRequirement {
  id: string;
  requirement: string;
  source: string;
  status: 'Meets' | 'Partially Meets' | 'Does Not Meet' | 'Not Applicable' | 'unknown';
  strategy: string;
  evidence?: string;
  reviewer?: string;
}

export interface KeyDetail {
  id: string;
  type: 'Red Flag' | 'Evaluation Criteria' | 'Win Theme' | 'Constraint';
  detail: string;
  source: string;
  impact: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}

export type View = 'workspace' | 'compliance' | 'proposal' | 'analysis' | 'settings';
