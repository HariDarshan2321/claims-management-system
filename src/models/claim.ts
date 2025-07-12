export interface Claim {
  id: string;
  customerId: string;
  orderNumber: string;
  productId: string;
  description: string;
  category: ClaimCategory;
  priority: ClaimPriority;
  status: ClaimStatus;
  submissionDate: Date;
  images: string[];
  attachments: string[];
  estimatedValue: number;
  actualValue?: number;
  rootCause?: RootCause;
  resolution?: Resolution;
  slaDeadline: Date;
  assignedTo?: string;
  tags: string[];
  metadata: Record<string, any>;
  auditTrail: AuditEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export enum ClaimCategory {
  MISSING_PARTS = 'missing_parts',
  WRONG_SIZE = 'wrong_size',
  DEFECTIVE = 'defective',
  DAMAGED_SHIPPING = 'damaged_shipping',
  QUALITY_ISSUE = 'quality_issue',
  OTHER = 'other'
}

export enum ClaimPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ClaimStatus {
  SUBMITTED = 'submitted',
  TRIAGED = 'triaged',
  ANALYZING = 'analyzing',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated'
}

export interface RootCause {
  source: 'production' | 'inventory' | 'logistics' | 'quality_control';
  details: string;
  confidence: number;
  relatedData: Record<string, any>;
  systemicIssue: boolean;
}

export interface Resolution {
  type: 'remake' | 'refund' | 'partial_credit' | 'replacement';
  amount?: number;
  description: string;
  approvedBy: string;
  executedAt?: Date;
  customerNotified: boolean;
}

export interface AuditEntry {
  timestamp: Date;
  action: string;
  userId: string;
  details: Record<string, any>;
  ipAddress?: string;
}

export interface ClaimAnalysis {
  claimId: string;
  aiConfidence: number;
  duplicateCheck: {
    isDuplicate: boolean;
    similarClaims: string[];
    confidence: number;
  };
  imageAnalysis?: {
    defectsDetected: string[];
    confidence: number;
    annotations: any[];
  };
  textAnalysis: {
    sentiment: number;
    keywords: string[];
    urgencyScore: number;
  };
  riskAssessment: {
    fraudRisk: number;
    financialImpact: number;
    reputationRisk: number;
  };
}
