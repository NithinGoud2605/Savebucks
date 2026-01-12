import { supabase, logError } from '../../../lib/supabase.js'
import stringSimilarity from 'string-similarity'

/**
 * Match or create company for incoming deals
 * Uses fuzzy matching to find existing companies
 */
export async function matchCompany(merchantName) {
    if (!merchantName || merchantName === 'Unknown') {
        return null
    }

    const cleanName = merchantName.trim()

    // Try exact match first (case-insensitive)
    const { data: exactMatch } = await supabase
        .from('companies')
        .select('id, name, slug')
        .ilike('name', cleanName)
        .single()

    if (exactMatch) {
        return exactMatch
    }

    // Try slug match
    const slug = createSlug(cleanName)
    const { data: slugMatch } = await supabase
        .from('companies')
        .select('id, name, slug')
        .eq('slug', slug)
        .single()

    if (slugMatch) {
        return slugMatch
    }

    // Fuzzy match against existing companies
    const { data: allCompanies } = await supabase
        .from('companies')
        .select('id, name, slug')
        .limit(500) // Reasonable limit for fuzzy matching

    if (allCompanies && allCompanies.length > 0) {
        const matches = stringSimilarity.findBestMatch(
            cleanName.toLowerCase(),
            allCompanies.map(c => c.name.toLowerCase())
        )

        // If similarity > 80%, use existing company
        if (matches.bestMatch.rating > 0.8) {
            return allCompanies[matches.bestMatchIndex]
        }
    }

    // Create new company if no match found
    try {
        const { data: newCompany, error } = await supabase
            .from('companies')
            .insert({
                name: cleanName,
                slug,
                status: 'pending', // Admin review needed
                is_verified: false
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating company:', error)
            return null
        }

        console.log(`Created new company: ${cleanName}`)
        return newCompany

    } catch (error) {
        await logError('company_matcher', error, { merchantName: cleanName })
        return null
    }
}

/**
 * Create URL-friendly slug
 */
function createSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}
