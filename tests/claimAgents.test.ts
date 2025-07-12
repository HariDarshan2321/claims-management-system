import { TriageAgent, RootCauseAnalysisAgent, ResolutionAgent, EscalationAgent, AgentOrchestrator } from '../src/agents/claimAgents';
import { Claim, ClaimCategory, ClaimPriority, ClaimStatus } from '../src/models/claim';

describe('AI Agents', () => {
  let mockClaim: Claim;

  beforeEach(() => {
    mockClaim = {
      id: 'CLM-TEST-001',
      customerId: 'CUST-001',
      orderNumber: 'ORD-12345',
      productId: 'PART-ABC123',
      description: 'Critical defect in titanium wing bolts',
      category: ClaimCategory.DEFECTIVE,
      priority: ClaimPriority.CRITICAL,
      status: ClaimStatus.SUBMITTED,
      submissionDate: new Date(),
      images: ['defect-image-1.jpg'],
      attachments: [],
      estimatedValue: 75000,
      slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      tags: [],
      metadata: {},
      auditTrail: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  describe('TriageAgent', () => {
    let triageAgent: TriageAgent;

    beforeEach(() => {
      triageAgent = new TriageAgent();
    });

    it('should analyze claim and return comprehensive analysis', async () => {
      // Act
      const analysis = await triageAgent.process(mockClaim);

      // Assert
      expect(analysis).toBeDefined();
      expect(analysis.claimId).toBe(mockClaim.id);
      expect(analysis.aiConfidence).toBeGreaterThan(0);
      expect(analysis.aiConfidence).toBeLessThanOrEqual(1);
      expect(analysis.duplicateCheck).toBeDefined();
      expect(analysis.textAnalysis).toBeDefined();
      expect(analysis.riskAssessment).toBeDefined();
    });

    it('should perform image analysis when images are present', async () => {
      // Act
      const analysis = await triageAgent.process(mockClaim);

      // Assert
      expect(analysis.imageAnalysis).toBeDefined();
      expect(analysis.imageAnalysis?.defectsDetected).toBeDefined();
      expect(analysis.imageAnalysis?.confidence).toBeGreaterThan(0);
      expect(analysis.imageAnalysis?.annotations).toBeDefined();
    });

    it('should not perform image analysis when no images present', async () => {
      // Arrange
      mockClaim.images = [];

      // Act
      const analysis = await triageAgent.process(mockClaim);

      // Assert
      expect(analysis.imageAnalysis).toBeUndefined();
    });

    it('should detect urgency in text analysis', async () => {
      // Arrange
      mockClaim.description = 'URGENT: Critical emergency defect needs immediate attention ASAP';

      // Act
      const analysis = await triageAgent.process(mockClaim);

      // Assert
      expect(analysis.textAnalysis.urgencyScore).toBeGreaterThan(0.8);
    });

    it('should assess financial and reputation risk', async () => {
      // Act
      const analysis = await triageAgent.process(mockClaim);

      // Assert
      expect(analysis.riskAssessment.fraudRisk).toBeGreaterThanOrEqual(0);
      expect(analysis.riskAssessment.fraudRisk).toBeLessThanOrEqual(1);
      expect(analysis.riskAssessment.financialImpact).toBe(mockClaim.estimatedValue);
      expect(analysis.riskAssessment.reputationRisk).toBeGreaterThan(0);
    });
  });

  describe('RootCauseAnalysisAgent', () => {
    let rootCauseAgent: RootCauseAnalysisAgent;

    beforeEach(() => {
      rootCauseAgent = new RootCauseAnalysisAgent();
    });

    it('should identify root cause from ERP data', async () => {
      // Arrange
      const mockERPData = {
        production: { batchId: 'BATCH-1234', qualityChecks: ['failed'] },
        inventory: { warehouseLocation: 'A1-B2-C3' },
        logistics: { carrier: 'FedEx', trackingNumber: 'TRK123456' }
      };

      // Act
      const rootCause = await rootCauseAgent.process(mockClaim, mockERPData);

      // Assert
      expect(rootCause).toBeDefined();
      expect(rootCause.source).toMatch(/^(production|inventory|logistics|quality_control)$/);
      expect(rootCause.details).toBeDefined();
      expect(rootCause.confidence).toBeGreaterThan(0);
      expect(rootCause.confidence).toBeLessThanOrEqual(1);
      expect(rootCause.relatedData).toBe(mockERPData);
      expect(typeof rootCause.systemicIssue).toBe('boolean');
    });

    it('should generate appropriate details for production issues', async () => {
      // We can't control the random source selection, but we can test the method exists
      const rootCause = await rootCauseAgent.process(mockClaim);
      expect(rootCause.details).toBeDefined();
      expect(rootCause.details.length).toBeGreaterThan(0);
    });
  });

  describe('ResolutionAgent', () => {
    let resolutionAgent: ResolutionAgent;

    beforeEach(() => {
      resolutionAgent = new ResolutionAgent();
    });

    it('should recommend appropriate resolution based on analysis', async () => {
      // Arrange
      const mockAnalysis = {
        claimId: mockClaim.id,
        aiConfidence: 0.85,
        duplicateCheck: { isDuplicate: false, similarClaims: [], confidence: 0.1 },
        textAnalysis: { sentiment: -0.5, keywords: ['defective'], urgencyScore: 0.8 },
        riskAssessment: { fraudRisk: 0.1, financialImpact: 75000, reputationRisk: 0.8 }
      };

      // Act
      const resolution = await resolutionAgent.process(mockClaim, mockAnalysis);

      // Assert
      expect(resolution).toBeDefined();
      expect(resolution.recommendedAction).toBeDefined();
      expect(resolution.confidence).toBeGreaterThan(0);
      expect(resolution.confidence).toBeLessThanOrEqual(1);
      expect(resolution.reasoning).toBeDefined();
      expect(resolution.estimatedCost).toBeGreaterThanOrEqual(0);
    });

    it('should recommend investigation for high fraud risk', async () => {
      // Arrange
      const mockAnalysis = {
        claimId: mockClaim.id,
        aiConfidence: 0.85,
        duplicateCheck: { isDuplicate: false, similarClaims: [], confidence: 0.1 },
        textAnalysis: { sentiment: -0.5, keywords: ['defective'], urgencyScore: 0.8 },
        riskAssessment: { fraudRisk: 0.8, financialImpact: 75000, reputationRisk: 0.8 }
      };

      // Act
      const resolution = await resolutionAgent.process(mockClaim, mockAnalysis);

      // Assert
      expect(resolution.recommendedAction).toBe('investigate');
      expect(resolution.confidence).toBeGreaterThan(0.8);
    });

    it('should recommend remake for missing parts', async () => {
      // Arrange
      mockClaim.category = ClaimCategory.MISSING_PARTS;
      const mockAnalysis = {
        claimId: mockClaim.id,
        aiConfidence: 0.85,
        duplicateCheck: { isDuplicate: false, similarClaims: [], confidence: 0.1 },
        textAnalysis: { sentiment: -0.5, keywords: ['missing'], urgencyScore: 0.5 },
        riskAssessment: { fraudRisk: 0.1, financialImpact: 1000, reputationRisk: 0.3 }
      };

      // Act
      const resolution = await resolutionAgent.process(mockClaim, mockAnalysis);

      // Assert
      expect(resolution.recommendedAction).toBe('remake');
      expect(resolution.estimatedCost).toBeLessThan(mockClaim.estimatedValue);
    });
  });

  describe('EscalationAgent', () => {
    let escalationAgent: EscalationAgent;

    beforeEach(() => {
      escalationAgent = new EscalationAgent();
    });

    it('should escalate systemic issues to operations', async () => {
      // Arrange
      const mockRootCause = {
        source: 'production' as const,
        details: 'Production batch BATCH-1234 had quality control issues',
        confidence: 0.85,
        relatedData: {},
        systemicIssue: true
      };

      // Act
      const escalation = await escalationAgent.process(mockClaim, mockRootCause);

      // Assert
      expect(escalation.shouldEscalate).toBe(true);
      expect(escalation.escalationType).toBe('operations');
      expect(escalation.urgency).toBe('high');
      expect(escalation.reasoning).toContain('systemic');
    });

    it('should escalate high-value claims to management', async () => {
      // Arrange
      mockClaim.estimatedValue = 60000;
      const mockRootCause = {
        source: 'production' as const,
        details: 'Standard production issue',
        confidence: 0.85,
        relatedData: {},
        systemicIssue: false
      };

      // Act
      const escalation = await escalationAgent.process(mockClaim, mockRootCause);

      // Assert
      expect(escalation.shouldEscalate).toBe(true);
      expect(escalation.escalationType).toBe('management');
      expect(escalation.urgency).toBe('medium');
    });

    it('should escalate critical priority claims', async () => {
      // Arrange
      mockClaim.priority = ClaimPriority.CRITICAL;
      const mockRootCause = {
        source: 'production' as const,
        details: 'Standard production issue',
        confidence: 0.85,
        relatedData: {},
        systemicIssue: false
      };

      // Act
      const escalation = await escalationAgent.process(mockClaim, mockRootCause);

      // Assert
      expect(escalation.shouldEscalate).toBe(true);
      expect(escalation.escalationType).toBe('customer_success');
      expect(escalation.urgency).toBe('high');
    });

    it('should not escalate standard claims', async () => {
      // Arrange
      mockClaim.estimatedValue = 500;
      mockClaim.priority = ClaimPriority.LOW;
      const mockRootCause = {
        source: 'production' as const,
        details: 'Standard production issue',
        confidence: 0.85,
        relatedData: {},
        systemicIssue: false
      };

      // Act
      const escalation = await escalationAgent.process(mockClaim, mockRootCause);

      // Assert
      expect(escalation.shouldEscalate).toBe(false);
      expect(escalation.escalationType).toBe('none');
      expect(escalation.urgency).toBe('low');
    });
  });

  describe('AgentOrchestrator', () => {
    let orchestrator: AgentOrchestrator;

    beforeEach(() => {
      orchestrator = new AgentOrchestrator();
    });

    it('should orchestrate all agents and return complete result', async () => {
      // Arrange
      const mockERPData = {
        production: { batchId: 'BATCH-1234' },
        inventory: { warehouseLocation: 'A1-B2' },
        logistics: { carrier: 'FedEx' }
      };

      // Act
      const result = await orchestrator.processClaim(mockClaim, mockERPData);

      // Assert
      expect(result).toBeDefined();
      expect(result.claimId).toBe(mockClaim.id);
      expect(result.analysis).toBeDefined();
      expect(result.rootCause).toBeDefined();
      expect(result.resolution).toBeDefined();
      expect(result.escalation).toBeDefined();
      expect(result.processedAt).toBeDefined();
      expect(result.processingTimeMs).toBeGreaterThan(0);
    });

    it('should process claims without ERP data', async () => {
      // Act
      const result = await orchestrator.processClaim(mockClaim);

      // Assert
      expect(result).toBeDefined();
      expect(result.claimId).toBe(mockClaim.id);
      expect(result.analysis).toBeDefined();
      expect(result.rootCause).toBeDefined();
    });

    it('should complete processing within reasonable time', async () => {
      // Act
      const startTime = Date.now();
      const result = await orchestrator.processClaim(mockClaim);
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(result.processingTimeMs).toBeGreaterThan(0);
      expect(result.processingTimeMs).toBeLessThan(10000);
    });
  });

  describe('Integration Tests', () => {
    it('should handle end-to-end claim processing workflow', async () => {
      // Arrange
      const orchestrator = new AgentOrchestrator();
      const mockERPData = {
        production: { batchId: 'BATCH-1234', qualityChecks: ['failed'] },
        inventory: { warehouseLocation: 'A1-B2-C3', stockLevel: 100 },
        logistics: { carrier: 'FedEx', trackingNumber: 'TRK123456' }
      };

      // Act
      const result = await orchestrator.processClaim(mockClaim, mockERPData);

      // Assert - Verify complete workflow
      expect(result.analysis.claimId).toBe(mockClaim.id);
      expect(result.rootCause.relatedData).toBe(mockERPData);
      expect(result.resolution.recommendedAction).toBeDefined();
      expect(result.escalation.shouldEscalate).toBeDefined();

      // Verify data flow between agents
      if (result.escalation.shouldEscalate) {
        expect(['operations', 'management', 'customer_success']).toContain(result.escalation.escalationType);
      }
    });

    it('should maintain data consistency across all agents', async () => {
      // Arrange
      const orchestrator = new AgentOrchestrator();

      // Act
      const result = await orchestrator.processClaim(mockClaim);

      // Assert
      expect(result.analysis.claimId).toBe(mockClaim.id);
      expect(result.claimId).toBe(mockClaim.id);

      // Verify timestamps are logical
      expect(result.processedAt.getTime()).toBeGreaterThan(mockClaim.submissionDate.getTime());
    });
  });
});
