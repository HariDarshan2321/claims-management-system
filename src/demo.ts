import { ClaimService } from './api/claimService';
import { ClaimCategory } from './models/claim';

class ClaimsManagementDemo {
  private claimService = new ClaimService();

  async runDemo() {
    console.log('🏭 WayTOO Claims Management System Demo');
    console.log('=====================================\n');

    // Demo scenario 1: High-value critical claim
    console.log('📋 Scenario 1: High-Value Critical Manufacturing Defect');
    console.log('-------------------------------------------------------');
    const criticalClaim = await this.claimService.submitClaim({
      customerId: 'AEROSPACE-001',
      orderNumber: 'ORD-AIRCRAFT-5000',
      productId: 'WING-BOLT-M12-TITANIUM',
      description: 'Critical defect found in titanium wing bolts - 0.5mm variance in thread pitch detected during pre-flight inspection. This could ground entire aircraft fleet of 5,000 units.',
      category: ClaimCategory.DEFECTIVE,
      estimatedValue: 75000,
      images: ['defect-image-1.jpg', 'measurement-report.jpg']
    });

    console.log(`✅ Claim ${criticalClaim.id} submitted`);
    console.log(`   Priority: ${criticalClaim.priority}`);
    console.log(`   SLA Deadline: ${criticalClaim.slaDeadline.toISOString()}`);
    console.log('   🤖 AI processing initiated...\n');

    // Wait for AI processing
    await this.waitForProcessing(3000);

    // Demo scenario 2: Missing parts claim
    console.log('📋 Scenario 2: Missing Parts - Standard Order');
    console.log('---------------------------------------------');
    const missingPartsClaim = await this.claimService.submitClaim({
      customerId: 'AUTOMOTIVE-002',
      orderNumber: 'ORD-ENGINE-BLOCK-789',
      productId: 'GASKET-SET-V8-PREMIUM',
      description: 'Missing 4 head gaskets from engine rebuild kit. Customer unable to complete engine assembly.',
      category: ClaimCategory.MISSING_PARTS,
      estimatedValue: 450,
      attachments: ['packing-list.pdf', 'order-confirmation.pdf']
    });

    console.log(`✅ Claim ${missingPartsClaim.id} submitted`);
    console.log(`   Priority: ${missingPartsClaim.priority}`);
    console.log('   🤖 AI processing initiated...\n');

    await this.waitForProcessing(2000);

    // Demo scenario 3: Wrong size claim
    console.log('📋 Scenario 3: Wrong Size - Precision Components');
    console.log('------------------------------------------------');
    const wrongSizeClaim = await this.claimService.submitClaim({
      customerId: 'PRECISION-003',
      orderNumber: 'ORD-BEARING-ASSEMBLY-456',
      productId: 'BEARING-RACE-INNER-25MM',
      description: 'Received 24mm inner bearing races instead of specified 25mm. Tolerance critical for high-speed applications.',
      category: ClaimCategory.WRONG_SIZE,
      estimatedValue: 2800,
      images: ['measurement-caliper.jpg']
    });

    console.log(`✅ Claim ${wrongSizeClaim.id} submitted`);
    console.log(`   Priority: ${wrongSizeClaim.priority}`);
    console.log('   🤖 AI processing initiated...\n');

    await this.waitForProcessing(4000);

    // Show final statistics
    await this.showStatistics();

    // Demonstrate manual approval workflow
    await this.demonstrateApprovalWorkflow();
  }

  private async waitForProcessing(ms: number): Promise<void> {
    const steps = ['Triage Analysis', 'Root Cause Analysis', 'Resolution Recommendation', 'Escalation Assessment'];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, ms / steps.length));
      console.log(`   ⚡ ${steps[i]} completed`);
    }
    console.log('   ✅ AI processing completed\n');
  }

  private async showStatistics(): Promise<void> {
    console.log('📊 System Analytics Dashboard');
    console.log('============================');

    const stats = await this.claimService.getClaimStatistics();

    console.log(`📈 Total Claims: ${stats.total}`);
    console.log(`✅ Resolved: ${stats.byStatus.resolved || 0}`);
    console.log(`⏳ Pending: ${stats.byStatus.pending_approval || 0}`);
    console.log(`🚨 Escalated: ${stats.byStatus.escalated || 0}`);
    console.log(`💰 Total Financial Impact: $${stats.totalFinancialImpact.toLocaleString()}`);
    console.log(`⚡ Average Resolution Time: ${Math.round(stats.averageResolutionTime / (1000 * 60 * 60))} hours`);

    console.log('\n📋 Claims by Category:');
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      console.log(`   ${category.replace('_', ' ')}: ${count}`);
    });
    console.log('');
  }

  private async demonstrateApprovalWorkflow(): Promise<void> {
    console.log('👤 Manual Approval Workflow Demo');
    console.log('================================');

    const claims = await this.claimService.getAllClaims();
    const pendingClaim = claims.find(c => c.status === 'pending_approval');

    if (pendingClaim) {
      console.log(`🔍 Reviewing claim ${pendingClaim.id}`);
      console.log(`   Customer: ${pendingClaim.customerId}`);
      console.log(`   Issue: ${pendingClaim.description}`);
      console.log(`   AI Recommendation: ${pendingClaim.metadata.aiRecommendation?.recommendedAction || 'N/A'}`);
      console.log(`   Confidence: ${Math.round((pendingClaim.metadata.aiRecommendation?.confidence || 0) * 100)}%`);

      // Simulate manager approval
      console.log('\n👨‍💼 Claim Manager Decision: APPROVED');
      await this.claimService.approveClaim(pendingClaim.id, 'manager-001', {
        type: 'refund',
        amount: pendingClaim.estimatedValue,
        description: 'Approved based on AI recommendation and manual review'
      });

      console.log(`✅ Claim ${pendingClaim.id} approved and resolved`);
      console.log('📧 Customer notification sent');
      console.log('💳 Refund processed');
    }

    console.log('\n🎯 Demo completed successfully!');
    console.log('=====================================');
    console.log('Key Features Demonstrated:');
    console.log('• AI-powered claim triage and analysis');
    console.log('• Automated root cause detection');
    console.log('• Intelligent resolution recommendations');
    console.log('• Escalation for systemic issues');
    console.log('• Real-time analytics and reporting');
    console.log('• Human-in-the-loop approval workflow');
    console.log('• End-to-end audit trail');
  }
}

// Run the demo
async function main() {
  const demo = new ClaimsManagementDemo();
  await demo.runDemo();
}

if (require.main === module) {
  main().catch(console.error);
}

export { ClaimsManagementDemo };
