
export interface Milestone {
  text: string;
  completed: boolean;
}

export interface Receipt {
  id: string;
  hash: string;
  timestamp: number;
  deadline: string;
  content: string;
  creator: string;
  walletAddress: string;
  txHash?: string;
  isAnonymous: boolean;
  isRevealed: boolean;
  witnessStatement?: string;
  category: 'Personal' | 'Work' | 'Financial' | 'Fitness' | 'Other';
  status: 'active' | 'fulfilled' | 'voided';
  sealUrl?: string;
  milestones?: string[];
}

export type ViewState = 'wall' | 'create' | 'verify' | 'stats' | 'personal' | 'deploy';

export interface VerificationResult {
  match: boolean;
  receipt?: Receipt;
}
