import { queues } from '../lib/queue.js'
import { SOURCES, getEnabledSources } from './sources/registry.js'

/**
 * Setup scheduled jobs for all enabled sources
 */
export async function setupScheduledJobs() {
    console.log('⏰ Setting up scheduled ingestion jobs...\n')

    const enabledSources = getEnabledSources()

    for (const source of enabledSources) {
        await queues.ingestion.add(
            `fetch-${source.key}`,
            {
                sourceKey: source.key,
                config: source
            },
            {
                repeat: { pattern: source.schedule },
                jobId: `scheduled-${source.key}` // Prevent duplicates
            }
        )

        console.log(`  ✅ ${source.key} scheduled (${source.schedule})`)
    }

    console.log(`\n✅ ${enabledSources.length} sources scheduled\n`)
}

/**
 * Trigger immediate ingestion for a specific source
 */
export async function triggerIngestion(sourceKey) {
    const source = SOURCES[sourceKey]

    if (!source) {
        throw new Error(`Unknown source: ${sourceKey}`)
    }

    if (!source.enabled) {
        throw new Error(`Source ${sourceKey} is not enabled`)
    }

    const job = await queues.ingestion.add(
        `manual-${sourceKey}`,
        {
            sourceKey,
            config: source
        }
    )

    console.log(`✅ Triggered ${sourceKey} ingestion (Job ID: ${job.id})`)
    return job
}

/**
 * Trigger ingestion for all enabled sources
 */
export async function triggerAllSources() {
    const enabledSources = getEnabledSources()

    const jobs = await Promise.all(
        enabledSources.map(source => triggerIngestion(source.key))
    )

    console.log(`✅ Triggered ${jobs.length} source ingestion jobs`)
    return jobs
}
