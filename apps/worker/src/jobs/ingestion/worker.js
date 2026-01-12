import { Worker } from 'bullmq'
import { connection } from '../../lib/queue.js'
import { SOURCES } from '../sources/registry.js'
import { fetchRSSDeals } from '../fetchers/rssFetcher.js'
import { processDeal } from '../processors/dealProcessor.js'

/**
 * Ingestion worker - processes deals from various sources
 */
export async function startIngestionWorker() {
    const worker = new Worker(
        'ingestion',
        async (job) => {
            const { sourceKey, config } = job.data

            console.log(`\n📥 Processing job: ${sourceKey}`)

            try {
                // Fetch deals from source
                let rawDeals = []

                switch (config.type) {
                    case 'rss':
                        rawDeals = await fetchRSSDeals(config.config)
                        break

                    case 'api':
                        // Dynamic import of API fetchers
                        const fetcher = await import(config.fetcher)
                        rawDeals = await fetcher.default(config.config)
                        break

                    default:
                        throw new Error(`Unknown source type: ${config.type}`)
                }

                console.log(`  Found ${rawDeals.length} potential deals`)

                // Process each deal
                const results = {
                    created: 0,
                    updated: 0,
                    skipped: 0,
                    errors: 0
                }

                for (const rawDeal of rawDeals) {
                    const result = await processDeal(rawDeal, sourceKey)

                    if (result.action === 'created') results.created++
                    else if (result.action === 'updated') results.updated++
                    else if (result.action === 'skipped') results.skipped++
                    else if (result.action === 'error') results.errors++
                }

                console.log(`✅ ${sourceKey} complete:`, results)

                return results

            } catch (error) {
                console.error(`❌ Error processing ${sourceKey}:`, error.message)
                throw error
            }
        },
        {
            connection,
            concurrency: 3, // Process 3 jobs in parallel
            limiter: {
                max: 10,
                duration: 1000 // Max 10 jobs per second
            }
        }
    )

    worker.on('completed', (job, result) => {
        console.log(`✅ Job ${job.id} completed:`, result)
    })

    worker.on('failed', (job, err) => {
        console.error(`❌ Job ${job?.id} failed:`, err.message)
    })

    console.log('🚀 Ingestion worker started')

    return worker
}
