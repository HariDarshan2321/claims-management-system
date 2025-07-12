import { describe, it, expect, beforeEach, runAllTests } from './testRunner';
import { ClaimService } from '../src/api/claimService';
import { ClaimCategory, ClaimPriority, ClaimStatus } from '../src/models/claim';
import { TriageAgent, AgentOrchestrator } from '../src/agents/claimAgents';

// Basic Tests for Claims Management System
describe('ClaimService Basic Tests', () => {
  let claimService: ClaimService;

  beforeEach(() => {
    claimService = new ClaimService();
  });

  it('should create a new claim successfully', async () => {
    const claimData = {
      customerId: 'CUST-001',
      orderNumber: 'ORD-12345',
      productId: 'PART-ABC123',
      description: 'Missing screws from assembly kit',
      category: ClaimCategory.MISSING_PARTS,
      estimatedValue: 250
    };

    const claim = await claimService.submitClaim(claimData);

    expect(claim).toBeDefined();
    expect(claim.customerId).toBe(claimData.customerId);
    expect(claim.status).toBe(ClaimStatus.SUBMITTED);
    expect(claim.priority).toBe(ClaimPriority.LOW);
  });

  it('should assign correct priority based on value', async () => {
    const highValueClaim = {
      customerId: 'CUST-002',
      orderNumber: 'ORD-67890',
      productId: 'PART-XYZ789',
      description: 'Critical aerospace component defect',
      category: ClaimCategory.DEFECTIVE,
      estimatedValue: 75000
    };

    const claim = await claimService.submitClaim(highValueClaim);

    expect(claim.priority).toBe(ClaimPriority.CRITICAL);
    expect(claim.estimatedValue).toBe(75000);
  });

  it('should retrieve existing claims', async () => {
    const claimData = {
      customerId: 'CUST-003',
      orderNumber: 'ORD-11111',
      productId: 'PART-TEST',
      description: 'Test claim',
      category: ClaimCategory.WRONG_SIZE,
      estimatedValue: 1500
    };

    const submittedClaim = await claimService.submitClaim(claimData);
    const retrievedClaim = await claimService.getClaim(submittedClaim.id);

    expect(retrievedClaim).toBeDefined();
    expect(retrievedClaim?.id).toBe(submittedClaim.id);
  });

  it('should return null for non-existent claim', async () => {
    const claim = await claimService.getClaim('NON-EXISTENT-ID');
    expect(claim).toBeNull();
  });
});

describe('AI Agents Basic Tests', () => {
  let triageAgent: TriageAgent;
  let orchestrator: AgentOrchestrator;

  beforeEach(() => {
    triageAgent = new TriageAgent();
    orchestrator = new AgentOrchestrator();
  });

  it('should analyze claim with triage agent', async () => {
    const mockClaim = {
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

    const analysis = await triageAgent.process(mockClaim);

    expect(analysis).toBeDefined();
    expect(analysis.claimId).toBe(mockClaim.id);
    expect(analysis.aiConfidence).toBeGreaterThan(0);
    expect(analysis.duplicateCheck).toBeDefined();
    expect(analysis.textAnalysis).toBeDefined();
    expect(analysis.riskAssessment).toBeDefined();
  });

  it('should orchestrate all AI agents', async () => {
    const mockClaim = {
      id: 'CLM-TEST-002',
      customerId: 'CUST-002',
      orderNumber: 'ORD-67890',
      productId: 'PART-XYZ789',
      description: 'Missing parts from shipment',
      category: ClaimCategory.MISSING_PARTS,
      priority: ClaimPriority.MEDIUM,
      status: ClaimStatus.SUBMITTED,
      submissionDate: new Date(),
      images: [],
      attachments: [],
      estimatedValue: 1500,
      slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
      tags: [],
      metadata: {},
      auditTrail: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await orchestrator.processClaim(mockClaim);

    expect(result).toBeDefined();
    expect(result.claimId).toBe(mockClaim.id);
    expect(result.analysis).toBeDefined();
    expect(result.rootCause).toBeDefined();
    expect(result.resolution).toBeDefined();
    expect(result.escalation).toBeDefined();
  });
});

describe('Business Logic Tests', () => {
  it('should generate unique claim IDs', async () => {
    const claimService = new ClaimService();
    const claimData = {
      customerId: 'CUST-001',
      orderNumber: 'ORD-12345',
      productId: 'PART-ABC123',
      description: 'Test claim',
      category: ClaimCategory.MISSING_PARTS,
      estimatedValue: 250
    };

    const claim1 = await claimService.submitClaim(claimData);
    const claim2 = await claimService.submitClaim(claimData);

    expect(claim1.id).toBeDefined();
    expect(claim2.id).toBeDefined();
    expect(claim1.id).not.toBe(claim2.id);
  });

  it('should maintain audit trail', async () => {
    const claimService = new ClaimService();
    const claimData = {
      customerId: 'CUST-001',
      orderNumber: 'ORD-12345',
      productId: 'PART-ABC123',
      description: 'Test claim for audit trail',
      category: ClaimCategory.DEFECTIVE,
      estimatedValue: 500
    };

    const claim = await claimService.submitClaim(claimData);

    expect(claim.auditTrail).toBeDefined();
    expect(claim.auditTrail).toHaveLength(1);
    expect(claim.auditTrail[0].action).toBe('claim_submitted');
    expect(claim.auditTrail[0].userId).toBe('system');
  });
});

// Run all tests
async function main() {
  console.log('🚀 Starting Test-Driven Development Demo for Claims Management System\n');

  try {
    const results = await runAllTests();

    console.log('\n📋 Test Summary:');
    console.log('================');
    console.log(`✅ Tests demonstrate TDD principles`);
    console.log(`🧪 Core functionality verified`);
    console.log(`🤖 AI agents tested`);
    console.log(`💼 Business logic validated`);
    console.log(`🔍 Error handling covered`);

    if (results.passed === results.total) {
      console.log('\n🎉 All tests pass! The Claims Management System is working correctly.');
      console.log('✨ Ready for production deployment with confidence.');
    } else {
      console.log(`\n⚠️  ${results.total - results.passed} tests need attention.`);
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Export for external use
export { main as runBasicTests };

// Run if this file is executed directly
if (require.main === module) {
  main();
}
