import { Claim, ClaimAnalysis, ClaimCategory, ClaimPriority, RootCause } from '../models/claim';

export interface AIAgent {
  name: string;
  process(claim: Claim, context?: any): Promise<any>;
}

export class TriageAgent implements AIAgent {
  name = 'TriageAgent';

  async process(claim: Claim): Promise<ClaimAnalysis> {
    // Simulate AI-powered triage analysis
    const analysis: ClaimAnalysis = {
      claimId: claim.id,
      aiConfidence: 0.85,
      duplicateCheck: await this.checkDuplicates(claim),
      imageAnalysis: claim.images.length > 0 ? await this.analyzeImages(claim.images) : undefined,
      textAnalysis: await this.analyzeText(claim.description),
      riskAssessment: await this.assessRisk(claim)
    };

    return analysis;
  }

  private async checkDuplicates(claim: Claim) {
    // Simulate ML-based duplicate detection
    const similarity = Math.random();
    return {
      isDuplicate: similarity > 0.8,
      similarClaims: similarity > 0.8 ? ['claim-123', 'claim-456'] : [],
      confidence: similarity
    };
  }

  private async analyzeImages(images: string[]) {
    // Simulate computer vision analysis
    const defects = ['scratch', 'dent', 'missing_component'];
    return {
      defectsDetected: defects.slice(0, Math.floor(Math.random() * 3) + 1),
      confidence: 0.92,
      annotations: [
        { type: 'defect', bbox: [100, 100, 200, 200], confidence: 0.95 }
      ]
    };
  }

  private async analyzeText(description: string) {
    // Simulate NLP analysis
    const urgencyKeywords = ['urgent', 'critical', 'emergency', 'asap'];
    const urgencyScore = urgencyKeywords.some(keyword =>
      description.toLowerCase().includes(keyword)
    ) ? 0.9 : 0.3;

    return {
      sentiment: Math.random() * 2 - 1, // -1 to 1
      keywords: ['defective', 'missing', 'wrong_size'],
      urgencyScore
    };
  }

  private async assessRisk(claim: Claim) {
    return {
      fraudRisk: Math.random() * 0.3, // Low fraud risk simulation
      financialImpact: claim.estimatedValue,
      reputationRisk: claim.estimatedValue > 10000 ? 0.8 : 0.3
    };
  }
}

export class RootCauseAnalysisAgent implements AIAgent {
  name = 'RootCauseAnalysisAgent';

  async process(claim: Claim, erpData?: any): Promise<RootCause> {
    // Simulate correlation with ERP data
    const sources = ['production', 'inventory', 'logistics', 'quality_control'] as const;
    const randomSource = sources[Math.floor(Math.random() * sources.length)];

    const rootCause: RootCause = {
      source: randomSource,
      details: await this.generateRootCauseDetails(claim, randomSource, erpData),
      confidence: 0.78,
      relatedData: erpData || {},
      systemicIssue: Math.random() > 0.8 // 20% chance of systemic issue
    };

    return rootCause;
  }

  private async generateRootCauseDetails(claim: Claim, source: string, erpData?: any): Promise<string> {
    const templates = {
      production: `Production batch ${this.generateBatchId()} had quality control issues during manufacturing on ${new Date().toISOString().split('T')[0]}`,
      inventory: `Inventory discrepancy detected in warehouse location ${this.generateLocation()}. Wrong part picked during fulfillment.`,
      logistics: `Shipping damage occurred during transit with carrier ${this.generateCarrier()}. Package handling issue identified.`,
      quality_control: `QC checkpoint failed to detect defect in final inspection. Inspector ${this.generateInspectorId()} missed critical measurement variance.`
    };

    return templates[source as keyof typeof templates];
  }

  private generateBatchId(): string {
    return `BATCH-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  }

  private generateLocation(): string {
    return `A${Math.floor(Math.random() * 10)}-${Math.floor(Math.random() * 20)}-${Math.floor(Math.random() * 50)}`;
  }

  private generateCarrier(): string {
    const carriers = ['FedEx', 'UPS', 'DHL', 'USPS'];
    return carriers[Math.floor(Math.random() * carriers.length)];
  }

  private generateInspectorId(): string {
    return `QC${Math.floor(Math.random() * 100).toString().padStart(3, '0')}`;
  }
}

export class ResolutionAgent implements AIAgent {
  name = 'ResolutionAgent';

  async process(claim: Claim, analysis: ClaimAnalysis): Promise<{
    recommendedAction: string;
    confidence: number;
    reasoning: string;
    estimatedCost: number;
  }> {
    const recommendation = await this.generateRecommendation(claim, analysis);
    return recommendation;
  }

  private async generateRecommendation(claim: Claim, analysis: ClaimAnalysis) {
    // AI-driven resolution recommendation logic
    let action = 'refund';
    let confidence = 0.7;
    let reasoning = 'Standard refund recommended';
    let estimatedCost = claim.estimatedValue;

    if (analysis.riskAssessment.fraudRisk > 0.7) {
      action = 'investigate';
      confidence = 0.9;
      reasoning = 'High fraud risk detected, requires manual investigation';
      estimatedCost = 0;
    } else if (claim.category === ClaimCategory.MISSING_PARTS) {
      action = 'remake';
      confidence = 0.85;
      reasoning = 'Missing parts can be easily replaced, more cost-effective than refund';
      estimatedCost = claim.estimatedValue * 0.3; // Cost of parts only
    } else if (analysis.imageAnalysis && analysis.imageAnalysis.confidence > 0.9) {
      action = 'replacement';
      confidence = 0.8;
      reasoning = 'Clear visual evidence of defect, replacement warranted';
      estimatedCost = claim.estimatedValue * 0.8; // Replacement cost
    } else if (claim.estimatedValue < 100) {
      action = 'partial_credit';
      confidence = 0.75;
      reasoning = 'Low value claim, partial credit maintains customer satisfaction';
      estimatedCost = claim.estimatedValue * 0.5;
    }

    return {
      recommendedAction: action,
      confidence,
      reasoning,
      estimatedCost
    };
  }
}

export class EscalationAgent implements AIAgent {
  name = 'EscalationAgent';

  async process(claim: Claim, rootCause: RootCause): Promise<{
    shouldEscalate: boolean;
    escalationType: string;
    urgency: string;
    reasoning: string;
  }> {
    const escalation = await this.evaluateEscalation(claim, rootCause);
    return escalation;
  }

  private async evaluateEscalation(claim: Claim, rootCause: RootCause) {
    let shouldEscalate = false;
    let escalationType = 'none';
    let urgency = 'low';
    let reasoning = 'No escalation required';

    // Systemic issue detection
    if (rootCause.systemicIssue) {
      shouldEscalate = true;
      escalationType = 'operations';
      urgency = 'high';
      reasoning = 'Systemic issue detected that may affect multiple orders';
    }

    // High value claims
    else if (claim.estimatedValue > 50000) {
      shouldEscalate = true;
      escalationType = 'management';
      urgency = 'medium';
      reasoning = 'High value claim requires management approval';
    }

    // Critical priority claims
    else if (claim.priority === ClaimPriority.CRITICAL) {
      shouldEscalate = true;
      escalationType = 'customer_success';
      urgency = 'high';
      reasoning = 'Critical priority claim requires immediate attention';
    }

    return {
      shouldEscalate,
      escalationType,
      urgency,
      reasoning
    };
  }
}

export class AgentOrchestrator {
  private triageAgent = new TriageAgent();
  private rootCauseAgent = new RootCauseAnalysisAgent();
  private resolutionAgent = new ResolutionAgent();
  private escalationAgent = new EscalationAgent();

  async processClaim(claim: Claim, erpData?: any) {
    console.log(`🤖 Starting AI processing for claim ${claim.id}`);

    // Step 1: Triage Analysis
    console.log('📊 Running triage analysis...');
    const analysis = await this.triageAgent.process(claim);

    // Step 2: Root Cause Analysis
    console.log('🔍 Performing root cause analysis...');
    const rootCause = await this.rootCauseAgent.process(claim, erpData);

    // Step 3: Resolution Recommendation
    console.log('💡 Generating resolution recommendation...');
    const resolution = await this.resolutionAgent.process(claim, analysis);

    // Step 4: Escalation Assessment
    console.log('⚠️ Evaluating escalation requirements...');
    const escalation = await this.escalationAgent.process(claim, rootCause);

    const result = {
      claimId: claim.id,
      analysis,
      rootCause,
      resolution,
      escalation,
      processedAt: new Date(),
      processingTimeMs: Math.floor(Math.random() * 5000) + 1000 // Simulate processing time
    };

    console.log(`✅ AI processing completed for claim ${claim.id}`);
    return result;
  }
}
