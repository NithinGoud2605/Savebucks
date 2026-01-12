import { supabase } from '../../lib/supabase.js'
import { queues } from '../../lib/queue.js'

/**
 * Setup expiry check scheduler
 * Runs every hour to mark and cleanup expired deals/coupons
 */
export async function setupExpiryScheduler() {
    await queues.cleanup.add(
        'check-expired',
        {},
        {
            repeat: { pattern: '0 * * * *' }, // Every hour at minute 0
            jobId: 'expiry-checker' // Prevent duplicates
        }
    )

    console.log('✅ Expiry scheduler set up')
}

/**
 * Check and process expired deals
 */
export async function checkExpiredDeals() {
    const now = new Date().toISOString()

    try {
        // Mark deals as expired
        const { data: expired, error: expireError } = await supabase
            .from('deals')
            .update({
                status: 'expired',
                updated_at: now
            })
            .lt('expires_at', now)
            .in('status', ['approved', 'pending'])
            .select('id, title')

        if (expireError) throw expireError

        const expiredCount = expired?.length || 0
        if (expiredCount > 0) {
            console.log(`✅ Marked ${expiredCount} deals as expired`)
        }

        // Delete very old expired deals (60+ days)
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()

        const { data: deleted, error: deleteError } = await supabase
            .from('deals')
            .delete()
            .eq('status', 'expired')
            .lt('updated_at', sixtyDaysAgo)
            .select('id')

        if (deleteError) throw deleteError

        const deletedCount = deleted?.length || 0
        if (deletedCount > 0) {
            console.log(`🗑️  Deleted ${deletedCount} old expired deals`)
        }

        return { expired: expiredCount, deleted: deletedCount }

    } catch (error) {
        console.error('Error checking expired deals:', error)
        throw error
    }
}

/**
 * Check and process expired coupons
 */
export async function checkExpiredCoupons() {
    const now = new Date().toISOString()

    try {
        const { data: expired, error } = await supabase
            .from('coupons')
            .update({
                status: 'expired',
                updated_at: now
            })
            .lt('expires_at', now)
            .in('status', ['approved', 'pending'])
            .select('id')

        if (error) throw error

        const expiredCount = expired?.length || 0
        if (expiredCount > 0) {
            console.log(`✅ Marked ${expiredCount} coupons as expired`)
        }

        // Delete old expired coupons (90+ days for coupons)
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

        const { data: deleted } = await supabase
            .from('coupons')
            .delete()
            .eq('status', 'expired')
            .lt('updated_at', ninetyDaysAgo)
            .select('id')

        const deletedCount = deleted?.length || 0
        if (deletedCount > 0) {
            console.log(`🗑️  Deleted ${deletedCount} old expired coupons`)
        }

        return { expired: expiredCount, deleted: deletedCount }

    } catch (error) {
        console.error('Error checking expired coupons:', error)
        throw error
    }
}

/**
 * Run all expiry checks
 */
export async function runExpiryChecks() {
    console.log('🔍 Running expiry checks...')

    const [deals, coupons] = await Promise.all([
        checkExpiredDeals(),
        checkExpiredCoupons()
    ])

    console.log('✅ Expiry checks complete:', { deals, coupons })
    return { deals, coupons }
}
