import { ClaimService } from '../src/api/claimService';
import { ClaimCategory, ClaimStatus } from '../src/models/claim';

async function demonstrateClaimStatusFlow() {
  console.log('🔍 Demonstrating Why Claims Go to "Pending Approval"\n');

  const claimService = new ClaimService();

  // Test Case 1: Low-value claim (might get auto-approved)
  console.log('📋 Test Case 1: Low-Value Claim ($500)');
  const lowValueClaim = await claimService.submitClaim({
    customerId: 'CUST-001',
    orderNumber: 'ORD-12345',
    productId: 'PART-ABC123',
    description: 'Minor defect in small component',
    category: ClaimCategory.DEFECTIVE,
    estimatedValue: 500
  });

  // Wait for AI processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  const processedLowValue = await claimService.getClaim(lowValueClaim.id);
  console.log(`   Status: ${processedLowValue?.status}`);
  console.log(`   Reason: ${processedLowValue?.status === ClaimStatus.PENDING_APPROVAL ? 'AI confidence < 90% OR requires human review' : 'Auto-approved due to high confidence + low value'}`);

  // Test Case 2: High-value claim (will definitely need approval)
  console.log('\n📋 Test Case 2: High-Value Claim ($15,000)');
  const highValueClaim = await claimService.submitClaim({
    customerId: 'CUST-002',
    orderNumber: 'ORD-67890',
    productId: 'PART-XYZ789',
    description: 'Critical aerospace component failure',
    category: ClaimCategory.DEFECTIVE,
    estimatedValue: 15000
  });

  // Wait for AI processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  const processedHighValue = await claimService.getClaim(highValueClaim.id);
  console.log(`   Status: ${processedHighValue?.status}`);
  console.log(`   Reason: High-value claims (>$1000) ALWAYS require human approval for financial control`);

  // Test Case 3: Critical priority claim
  console.log('\n📋 Test Case 3: Critical Priority Claim ($75,000)');
  const criticalClaim = await claimService.submitClaim({
    customerId: 'CUST-003',
    orderNumber: 'ORD-99999',
    productId: 'PART-CRITICAL',
    description: 'Mission-critical component complete failure',
    category: ClaimCategory.DEFECTIVE,
    estimatedValue: 75000
  });

  // Wait for AI processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  const processedCritical = await claimService.getClaim(criticalClaim.id);
  console.log(`   Status: ${processedCritical?.status}`);
  console.log(`   Reason: Critical claims may be escalated or require executive approval`);

  console.log('\n💡 Summary: Why Claims Go to "Pending Approval"');
  console.log('=================================================');
  console.log('✅ Financial Control: High-value claims (>$1000) need human approval');
  console.log('✅ AI Confidence: Only >90% confidence claims can be auto-approved');
  console.log('✅ Risk Management: Complex cases require human judgment');
  console.log('✅ Compliance: Audit trail requires human oversight for significant claims');
  console.log('✅ Business Logic: Better to be cautious than approve invalid claims');

  console.log('\n🔧 Auto-Approval Criteria (ALL must be met):');
  console.log('   • AI Confidence > 90%');
  console.log('   • Claim Value < $1,000');
  console.log('   • No fraud risk detected');
  console.log('   • Standard claim category');
}

// Run the demonstration
demonstrateClaimStatusFlow().catch(console.error);
