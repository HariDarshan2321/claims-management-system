import { Claim, ClaimStatus, ClaimCategory, ClaimPriority, AuditEntry } from '../models/claim';
import { AgentOrchestrator } from '../agents/claimAgents';

export class ClaimService {
  private agentOrchestrator = new AgentOrchestrator();
  private claims: Map<string, Claim> = new Map();

  async submitClaim(claimData: {
    customerId: string;
    orderNumber: string;
    productId: string;
    description: string;
    category: ClaimCategory;
    images?: string[];
    attachments?: string[];
    estimatedValue: number;
  }): Promise<Claim> {
    const claimId = this.generateClaimId();
    const now = new Date();

    const claim: Claim = {
      id: claimId,
      customerId: claimData.customerId,
      orderNumber: claimData.orderNumber,
      productId: claimData.productId,
      description: claimData.description,
      category: claimData.category,
      priority: this.calculateInitialPriority(claimData),
      status: ClaimStatus.SUBMITTED,
      submissionDate: now,
      images: claimData.images || [],
      attachments: claimData.attachments || [],
      estimatedValue: claimData.estimatedValue,
      slaDeadline: this.calculateSLADeadline(claimData.category, claimData.estimatedValue),
      tags: [],
      metadata: {},
      auditTrail: [{
        timestamp: now,
        action: 'claim_submitted',
        userId: 'system',
        details: { submissionMethod: 'api' }
      }],
      createdAt: now,
      updatedAt: now
    };

    this.claims.set(claimId, claim);

    // Trigger AI processing asynchronously
    this.processClaimAsync(claim);

    return claim;
  }

  async getClaim(claimId: string): Promise<Claim | null> {
    return this.claims.get(claimId) || null;
  }

  async getAllClaims(): Promise<Claim[]> {
    return Array.from(this.claims.values());
  }

  async updateClaimStatus(claimId: string, status: ClaimStatus, userId: string): Promise<Claim | null> {
    const claim = this.claims.get(claimId);
    if (!claim) return null;

    claim.status = status;
    claim.updatedAt = new Date();
    claim.auditTrail.push({
      timestamp: new Date(),
      action: 'status_updated',
      userId,
      details: { newStatus: status }
    });

    this.claims.set(claimId, claim);
    return claim;
  }

  async approveClaim(claimId: string, userId: string, resolution: {
    type: 'remake' | 'refund' | 'partial_credit' | 'replacement';
    amount?: number;
    description: string;
  }): Promise<Claim | null> {
    const claim = this.claims.get(claimId);
    if (!claim) return null;

    claim.status = ClaimStatus.APPROVED;
    claim.resolution = {
      ...resolution,
      approvedBy: userId,
      customerNotified: false
    };
    claim.updatedAt = new Date();
    claim.auditTrail.push({
      timestamp: new Date(),
      action: 'claim_approved',
      userId,
      details: { resolution }
    });

    this.claims.set(claimId, claim);

    // Trigger resolution workflow
    await this.executeResolution(claim);

    return claim;
  }

  private async processClaimAsync(claim: Claim): Promise<void> {
    try {
      // Simulate ERP data retrieval
      const erpData = await this.getERPData(claim);

      // Run AI processing
      const aiResult = await this.agentOrchestrator.processClaim(claim, erpData);

      // Update claim with AI insights
      claim.status = ClaimStatus.TRIAGED;
      claim.rootCause = aiResult.rootCause;
      claim.metadata.aiAnalysis = aiResult.analysis;
      claim.metadata.aiRecommendation = aiResult.resolution;
      claim.updatedAt = new Date();
      claim.auditTrail.push({
        timestamp: new Date(),
        action: 'ai_processing_completed',
        userId: 'ai_system',
        details: {
          processingTimeMs: aiResult.processingTimeMs,
          confidence: aiResult.analysis.aiConfidence
        }
      });

      // Handle escalation if needed
      if (aiResult.escalation.shouldEscalate) {
        claim.status = ClaimStatus.ESCALATED;
        claim.auditTrail.push({
          timestamp: new Date(),
          action: 'claim_escalated',
          userId: 'ai_system',
          details: aiResult.escalation
        });

        await this.notifyEscalation(claim, aiResult.escalation);
      } else if (aiResult.resolution.confidence > 0.9 && claim.estimatedValue < 1000) {
        // Auto-approve low-value, high-confidence claims
        await this.autoApproveClaim(claim, aiResult.resolution);
      } else {
        // Route to human review
        claim.status = ClaimStatus.PENDING_APPROVAL;
        await this.notifyClaimManager(claim, aiResult);
      }

      this.claims.set(claim.id, claim);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error processing claim ${claim.id}:`, error);
      claim.status = ClaimStatus.ESCALATED;
      claim.auditTrail.push({
        timestamp: new Date(),
        action: 'processing_error',
        userId: 'system',
        details: { error: errorMessage }
      });
      this.claims.set(claim.id, claim);
    }
  }

  private async getERPData(claim: Claim): Promise<any> {
    // Simulate ERP data retrieval
    return {
      production: {
        batchId: `BATCH-${Math.floor(Math.random() * 10000)}`,
        productionDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        qualityChecks: Math.random() > 0.8 ? ['failed'] : ['passed']
      },
      inventory: {
        warehouseLocation: `A${Math.floor(Math.random() * 10)}-${Math.floor(Math.random() * 20)}`,
        stockLevel: Math.floor(Math.random() * 1000),
        lastMovement: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      },
      logistics: {
        carrier: ['FedEx', 'UPS', 'DHL'][Math.floor(Math.random() * 3)],
        trackingNumber: `TRK${Math.floor(Math.random() * 1000000)}`,
        deliveryDate: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000)
      }
    };
  }

  private async autoApproveClaim(claim: Claim, recommendation: any): Promise<void> {
    claim.status = ClaimStatus.APPROVED;
    claim.resolution = {
      type: recommendation.recommendedAction,
      amount: recommendation.estimatedCost,
      description: `Auto-approved: ${recommendation.reasoning}`,
      approvedBy: 'ai_system',
      customerNotified: false
    };
    claim.auditTrail.push({
      timestamp: new Date(),
      action: 'auto_approved',
      userId: 'ai_system',
      details: { confidence: recommendation.confidence }
    });

    await this.executeResolution(claim);
  }

  private async executeResolution(claim: Claim): Promise<void> {
    if (!claim.resolution) return;

    // Simulate resolution execution
    console.log(`🔧 Executing resolution for claim ${claim.id}: ${claim.resolution.type}`);

    switch (claim.resolution.type) {
      case 'refund':
        await this.processRefund(claim);
        break;
      case 'remake':
        await this.scheduleRemake(claim);
        break;
      case 'replacement':
        await this.scheduleReplacement(claim);
        break;
      case 'partial_credit':
        await this.processPartialCredit(claim);
        break;
    }

    claim.resolution.executedAt = new Date();
    claim.status = ClaimStatus.RESOLVED;
    claim.auditTrail.push({
      timestamp: new Date(),
      action: 'resolution_executed',
      userId: 'system',
      details: { resolutionType: claim.resolution.type }
    });

    await this.notifyCustomer(claim);
    claim.resolution.customerNotified = true;
  }

  private async processRefund(claim: Claim): Promise<void> {
    console.log(`💰 Processing refund of $${claim.resolution?.amount} for claim ${claim.id}`);
    // Integrate with payment system
  }

  private async scheduleRemake(claim: Claim): Promise<void> {
    console.log(`🔄 Scheduling remake for claim ${claim.id}`);
    // Integrate with production system
  }

  private async scheduleReplacement(claim: Claim): Promise<void> {
    console.log(`📦 Scheduling replacement for claim ${claim.id}`);
    // Integrate with inventory system
  }

  private async processPartialCredit(claim: Claim): Promise<void> {
    console.log(`💳 Processing partial credit of $${claim.resolution?.amount} for claim ${claim.id}`);
    // Integrate with accounting system
  }

  private async notifyCustomer(claim: Claim): Promise<void> {
    console.log(`📧 Notifying customer ${claim.customerId} about claim ${claim.id} resolution`);
    // Integrate with notification system
  }

  private async notifyClaimManager(claim: Claim, aiResult: any): Promise<void> {
    console.log(`👤 Notifying claim manager about claim ${claim.id} requiring review`);
    // Integrate with task management system
  }

  private async notifyEscalation(claim: Claim, escalation: any): Promise<void> {
    console.log(`🚨 Escalating claim ${claim.id} to ${escalation.escalationType}`);
    // Integrate with escalation system
  }

  private generateClaimId(): string {
    return `CLM-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  }

  private calculateInitialPriority(claimData: any): ClaimPriority {
    if (claimData.estimatedValue > 50000) return ClaimPriority.CRITICAL;
    if (claimData.estimatedValue > 10000) return ClaimPriority.HIGH;
    if (claimData.estimatedValue > 1000) return ClaimPriority.MEDIUM;
    return ClaimPriority.LOW;
  }

  private calculateSLADeadline(category: ClaimCategory, value: number): Date {
    let hours = 72; // Default 3 days

    if (value > 50000) hours = 24; // 1 day for high-value
    else if (value > 10000) hours = 48; // 2 days for medium-value

    if (category === ClaimCategory.MISSING_PARTS) hours = Math.min(hours, 48);

    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  // Analytics and reporting methods
  async getClaimStatistics(): Promise<{
    total: number;
    byStatus: Record<ClaimStatus, number>;
    byCategory: Record<ClaimCategory, number>;
    averageResolutionTime: number;
    totalFinancialImpact: number;
  }> {
    const claims = Array.from(this.claims.values());

    const byStatus = {} as Record<ClaimStatus, number>;
    const byCategory = {} as Record<ClaimCategory, number>;
    let totalValue = 0;
    let resolvedClaims = 0;
    let totalResolutionTime = 0;

    claims.forEach(claim => {
      byStatus[claim.status] = (byStatus[claim.status] || 0) + 1;
      byCategory[claim.category] = (byCategory[claim.category] || 0) + 1;
      totalValue += claim.actualValue || claim.estimatedValue;

      if (claim.status === ClaimStatus.RESOLVED && claim.resolution?.executedAt) {
        resolvedClaims++;
        totalResolutionTime += claim.resolution.executedAt.getTime() - claim.submissionDate.getTime();
      }
    });

    return {
      total: claims.length,
      byStatus,
      byCategory,
      averageResolutionTime: resolvedClaims > 0 ? totalResolutionTime / resolvedClaims : 0,
      totalFinancialImpact: totalValue
    };
  }
}
