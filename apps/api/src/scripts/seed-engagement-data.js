import { makeAdminClient } from '../lib/supa.js';

const supa = makeAdminClient();

async function seedEngagementData() {
  try {
    console.log('🌱 Seeding engagement data...');

    // Get all deals and coupons
    const [dealsResult, couponsResult] = await Promise.all([
      supa.from('deals').select('id').eq('status', 'approved'),
      supa.from('coupons').select('id').eq('status', 'approved')
    ]);

    const deals = dealsResult.data || [];
    const coupons = couponsResult.data || [];

    console.log(`Found ${deals.length} deals and ${coupons.length} coupons`);

    // Update deals with random engagement data
    for (const deal of deals) {
      const ups = Math.floor(Math.random() * 100);
      const downs = Math.floor(Math.random() * 20);
      const comments_count = Math.floor(Math.random() * 50);
      const views_count = Math.floor(Math.random() * 1000);
      const saves_count = Math.floor(Math.random() * 30);

      await supa
        .from('deals')
        .update({
          ups,
          downs,
          comments_count,
          views_count,
          saves_count
        })
        .eq('id', deal.id);
    }

    // Update coupons with random engagement data
    for (const coupon of coupons) {
      const ups = Math.floor(Math.random() * 80);
      const downs = Math.floor(Math.random() * 15);
      const comments_count = Math.floor(Math.random() * 40);
      const views_count = Math.floor(Math.random() * 800);
      const saves_count = Math.floor(Math.random() * 25);

      await supa
        .from('coupons')
        .update({
          ups,
          downs,
          comments_count,
          views_count,
          saves_count
        })
        .eq('id', coupon.id);
    }

    console.log('✅ Engagement data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding engagement data:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedEngagementData();
}

export { seedEngagementData };






