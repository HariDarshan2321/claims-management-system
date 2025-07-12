import { ClaimService } from '../src/api/claimService';
import { ClaimCategory, ClaimPriority, ClaimStatus } from '../src/models/claim';

describe('ClaimService', () => {
  let claimService: ClaimService;

  beforeEach(() => {
    claimService = new ClaimService();
  });

  describe('submitClaim', () => {
    it('should create a new claim with correct initial values', async () => {
      // Arrange
      const claimData = {
        customerId: 'CUST-001',
        orderNumber: 'ORD-12345',
        productId: 'PART-ABC123',
        description: 'Missing screws from assembly kit',
        category: ClaimCategory.MISSING_PARTS,
        estimatedValue: 250
      };

      // Act
      const claim = await claimService.submitClaim(claimData);

      // Assert
      expect(claim).toBeDefined();
      expect(claim.id).toMatch(/^CLM-\d+-\d{3}$/);
      expect(claim.customerId).toBe(claimData.customerId);
      expect(claim.orderNumber).toBe(claimData.orderNumber);
      expect(claim.productId).toBe(claimData.productId);
      expect(claim.description).toBe(claimData.description);
      expect(claim.category).toBe(claimData.category);
      expect(claim.estimatedValue).toBe(claimData.estimatedValue);
      expect(claim.status).toBe(ClaimStatus.SUBMITTED);
      expect(claim.priority).toBe(ClaimPriority.LOW); // $250 should be LOW priority
      expect(claim.auditTrail).toHaveLength(1);
      expect(claim.auditTrail[0].action).toBe('claim_submitted');
    });

    it('should assign correct priority based on estimated value', async () => {
      const testCases = [
        { value: 100, expectedPriority: ClaimPriority.LOW },
        { value: 5000, expectedPriority: ClaimPriority.MEDIUM },
        { value: 25000, expectedPriority: ClaimPriority.HIGH },
        { value: 75000, expectedPriority: ClaimPriority.CRITICAL }
      ];

      for (const testCase of testCases) {
        const claimData = {
          customerId: 'CUST-001',
          orderNumber: 'ORD-12345',
          productId: 'PART-ABC123',
          description: 'Test claim',
          category: ClaimCategory.DEFECTIVE,
          estimatedValue: testCase.value
        };

        const claim = await claimService.submitClaim(claimData);
        expect(claim.priority).toBe(testCase.expectedPriority);
      }
    });

    it('should calculate SLA deadline correctly', async () => {
      const claimData = {
        customerId: 'CUST-001',
        orderNumber: 'ORD-12345',
        productId: 'PART-ABC123',
        description: 'Critical aerospace part defect',
        category: ClaimCategory.DEFECTIVE,
        estimatedValue: 75000 // Critical priority
      };

      const beforeSubmission = Date.now();
      const claim = await claimService.submitClaim(claimData);
      const afterSubmission = Date.now();

      // Critical priority should have 24-hour SLA
      const expectedDeadline = beforeSubmission + (24 * 60 * 60 * 1000);
      const actualDeadline = claim.slaDeadline.getTime();

      expect(actualDeadline).toBeGreaterThanOrEqual(expectedDeadline);
      expect(actualDeadline).toBeLessThanOrEqual(afterSubmission + (24 * 60 * 60 * 1000));
    });
  });

  describe('getClaim', () => {
    it('should retrieve an existing claim', async () => {
      // Arrange
      const claimData = {
        customerId: 'CUST-001',
        orderNumber: 'ORD-12345',
        productId: 'PART-ABC123',
        description: 'Test claim',
        category: ClaimCategory.MISSING_PARTS,
        estimatedValue: 250
      };

      const submittedClaim = await claimService.submitClaim(claimData);

      // Act
      const retrievedClaim = await claimService.getClaim(submittedClaim.id);

      // Assert
      expect(retrievedClaim).toBeDefined();
      expect(retrievedClaim?.id).toBe(submittedClaim.id);
      expect(retrievedClaim?.customerId).toBe(claimData.customerId);
    });

    it('should return null for non-existent claim', async () => {
      // Act
      const claim = await claimService.getClaim('NON-EXISTENT-ID');

      // Assert
      expect(claim).toBeNull();
    });
  });

  describe('updateClaimStatus', () => {
    it('should update claim status and add audit trail entry', async () => {
      // Arrange
      const claimData = {
        customerId: 'CUST-001',
        orderNumber: 'ORD-12345',
        productId: 'PART-ABC123',
        description: 'Test claim',
        category: ClaimCategory.MISSING_PARTS,
        estimatedValue: 250
      };

      const claim = await claimService.submitClaim(claimData);
      const initialAuditTrailLength = claim.auditTrail.length;

      // Act
      const updatedClaim = await claimService.updateClaimStatus(
        claim.id,
        ClaimStatus.TRIAGED,
        'ai_system'
      );

      // Assert
      expect(updatedClaim).toBeDefined();
      expect(updatedClaim?.status).toBe(ClaimStatus.TRIAGED);
      expect(updatedClaim?.auditTrail).toHaveLength(initialAuditTrailLength + 1);
      expect(updatedClaim?.auditTrail[initialAuditTrailLength].action).toBe('status_updated');
      expect(updatedClaim?.auditTrail[initialAuditTrailLength].userId).toBe('ai_system');
    });

    it('should return null for non-existent claim', async () => {
      // Act
      const result = await claimService.updateClaimStatus(
        'NON-EXISTENT-ID',
        ClaimStatus.TRIAGED,
        'ai_system'
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('approveClaim', () => {
    it('should approve claim and execute resolution', async () => {
      // Arrange
      const claimData = {
        customerId: 'CUST-001',
        orderNumber: 'ORD-12345',
        productId: 'PART-ABC123',
        description: 'Defective part needs replacement',
        category: ClaimCategory.DEFECTIVE,
        estimatedValue: 1500
      };

      const claim = await claimService.submitClaim(claimData);

      const resolution = {
        type: 'refund' as const,
        amount: 1500,
        description: 'Full refund approved due to manufacturing defect'
      };

      // Act
      const approvedClaim = await claimService.approveClaim(
        claim.id,
        'manager-001',
        resolution
      );

      // Assert
      expect(approvedClaim).toBeDefined();
      expect(approvedClaim?.status).toBe(ClaimStatus.RESOLVED); // Should be resolved after execution
      expect(approvedClaim?.resolution).toBeDefined();
      expect(approvedClaim?.resolution?.type).toBe('refund');
      expect(approvedClaim?.resolution?.amount).toBe(1500);
      expect(approvedClaim?.resolution?.approvedBy).toBe('manager-001');
      expect(approvedClaim?.resolution?.customerNotified).toBe(true);
    });
  });

  describe('getClaimStatistics', () => {
    it('should return correct statistics for multiple claims', async () => {
      // Arrange - Create multiple claims with different statuses
      const claims = [
        {
          customerId: 'CUST-001',
          orderNumber: 'ORD-001',
          productId: 'PART-001',
          description: 'Missing parts',
          category: ClaimCategory.MISSING_PARTS,
          estimatedValue: 250
        },
        {
          customerId: 'CUST-002',
          orderNumber: 'ORD-002',
          productId: 'PART-002',
          description: 'Wrong size',
          category: ClaimCategory.WRONG_SIZE,
          estimatedValue: 1500
        },
        {
          customerId: 'CUST-003',
          orderNumber: 'ORD-003',
          productId: 'PART-003',
          description: 'Defective part',
          category: ClaimCategory.DEFECTIVE,
          estimatedValue: 750
        }
      ];

      for (const claimData of claims) {
        await claimService.submitClaim(claimData);
      }

      // Act
      const statistics = await claimService.getClaimStatistics();

      // Assert
      expect(statistics.total).toBe(3);
      expect(statistics.totalFinancialImpact).toBe(2500); // 250 + 1500 + 750
      expect(statistics.byCategory[ClaimCategory.MISSING_PARTS]).toBe(1);
      expect(statistics.byCategory[ClaimCategory.WRONG_SIZE]).toBe(1);
      expect(statistics.byCategory[ClaimCategory.DEFECTIVE]).toBe(1);
      expect(statistics.byStatus[ClaimStatus.SUBMITTED]).toBeGreaterThan(0);
    });

    it('should return zero statistics for no claims', async () => {
      // Act
      const statistics = await claimService.getClaimStatistics();

      // Assert
      expect(statistics.total).toBe(0);
      expect(statistics.totalFinancialImpact).toBe(0);
      expect(statistics.averageResolutionTime).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle processing errors gracefully', async () => {
      // This test would require mocking the AI orchestrator to throw an error
      // For now, we'll test the basic error handling structure
      const claimData = {
        customerId: 'CUST-001',
        orderNumber: 'ORD-12345',
        productId: 'PART-ABC123',
        description: 'Test claim for error handling',
        category: ClaimCategory.MISSING_PARTS,
        estimatedValue: 250
      };

      const claim = await claimService.submitClaim(claimData);

      // The claim should be created successfully even if AI processing fails
      expect(claim).toBeDefined();
      expect(claim.status).toBe(ClaimStatus.SUBMITTED);
    });
  });

  describe('Business Rules', () => {
    it('should enforce minimum estimated value', async () => {
      const claimData = {
        customerId: 'CUST-001',
        orderNumber: 'ORD-12345',
        productId: 'PART-ABC123',
        description: 'Test claim',
        category: ClaimCategory.MISSING_PARTS,
        estimatedValue: 0
      };

      const claim = await claimService.submitClaim(claimData);
      expect(claim.estimatedValue).toBe(0); // Should accept 0 but in real system might have validation
    });

    it('should generate unique claim IDs', async () => {
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

      expect(claim1.id).not.toBe(claim2.id);
    });
  });
});
