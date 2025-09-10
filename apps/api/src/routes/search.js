import express from 'express'
import { makeAdminClient } from '../lib/supa.js'

const supabase = makeAdminClient()

const router = express.Router()

// Helper function to parse hashtags from search query
function parseHashtags(text) {
  const hashtagRegex = /#[\w-]+/g
  return Array.from(new Set(
    (text.match(hashtagRegex) || [])
      .map(m => m.replace(/^[^#]*#/, '').toLowerCase().replace(/[^a-z0-9-_]/g, ''))
      .filter(slug => slug.length > 0)
  ))
}

// Helper function to get tag IDs from slugs
async function getTagIdsFromSlugs(slugs) {
  if (!slugs || slugs.length === 0) return []
  
  const { data: tags } = await supabase
    .from('tags')
    .select('id, slug')
    .in('slug', slugs)
  
  return (tags || []).map(t => t.id)
}

// Comprehensive search endpoint for all entities
router.get('/', async (req, res) => {
  try {
    const {
      q: searchQuery,
      type = 'all', // 'deals', 'coupons', 'users', 'companies', 'categories', 'all'
      category,
      company,
      tags: tagSlugs,
      min_price,
      max_price,
      min_discount,
      has_coupon,
      coupon_type,
      featured,
      sort = 'relevance',
      page = 1,
      limit = 20
    } = req.query

    const offset = (page - 1) * limit
    const results = {
      deals: [],
      coupons: [],
      users: [],
      companies: [],
      categories: [],
      total_deals: 0,
      total_coupons: 0,
      total_users: 0,
      total_companies: 0,
      total_categories: 0,
      total_results: 0,
      search_query: searchQuery,
      filters_applied: {}
    }

    // Parse hashtags from search query
    let hashtagSlugs = []
    if (searchQuery && /#/.test(searchQuery)) {
      hashtagSlugs = parseHashtags(searchQuery)
    }

    // Combine hashtags with explicit tag filters
    const allTagSlugs = [...new Set([...(tagSlugs ? tagSlugs.split(',') : []), ...hashtagSlugs])]
    const tagIds = await getTagIdsFromSlugs(allTagSlugs)

    // Build base filters
    const baseFilters = {
      category,
      company,
      min_price: min_price ? parseFloat(min_price) : null,
      max_price: max_price ? parseFloat(max_price) : null,
      min_discount: min_discount ? parseInt(min_discount) : null,
      has_coupon: has_coupon === 'true',
      featured: featured === 'true',
      tag_ids: tagIds
    }

    console.log('Search query:', searchQuery, 'Type:', type, 'Filters:', baseFilters)

    // Search deals if requested
    if (type === 'all' || type === 'deals') {
      try {
        // Use a simpler approach - get all deals first, then filter
        let dealsQuery = supabase
          .from('deals')
          .select(`
            id, title, url, price, merchant, created_at, approved_at, status,
            description, image_url, deal_images, featured_image, coupon_code, coupon_type, 
            discount_percentage, discount_amount, original_price, expires_at, category_id, 
            deal_type, is_featured, views_count, clicks_count, submitter_id,
            categories(name, slug),
            companies(name, slug, logo_url, is_verified),
            profiles!submitter_id(id, handle, avatar_url, karma, role),
            deal_tags(tags(id, name, slug, color, category))
          `)
          .eq('status', 'approved')

        // Apply search query with fuzzy matching including tags
        if (searchQuery) {
          const cleanQuery = searchQuery.replace(/#[\w-]+/g, '').trim().toLowerCase()
          if (cleanQuery) {
            // Special case: if searching for "coupon", "coupons", "discount", "discounts", "deal", "deals"
            // return all deals since they're all relevant
            const genericTerms = ['coupon', 'coupons', 'discount', 'discounts', 'deal', 'deals', 'offer', 'offers', 'promo', 'promotion']
            
            if (genericTerms.includes(cleanQuery)) {
              // Don't add any search conditions - return all deals
              console.log(`Generic search term "${cleanQuery}" detected - returning all deals`)
            } else {
              // Try exact matches first, then fuzzy matches including tags
              const searchTerms = cleanQuery.split(' ').filter(term => term.length > 2)
              let searchConditions = []
              
              // Exact matches in deal content
              searchConditions.push(`title.ilike.%${cleanQuery}%`)
              searchConditions.push(`description.ilike.%${cleanQuery}%`)
              searchConditions.push(`merchant.ilike.%${cleanQuery}%`)
              
              // Fuzzy matches for individual words in deal content
              searchTerms.forEach(term => {
                searchConditions.push(`title.ilike.%${term}%`)
                searchConditions.push(`description.ilike.%${term}%`)
                searchConditions.push(`merchant.ilike.%${term}%`)
              })
              
              // Tag matching - search for deals that have tags matching the search term
              if (baseFilters.tag_ids && baseFilters.tag_ids.length > 0) {
                // If we have specific tag IDs, use them
                dealsQuery = dealsQuery.in('id', 
                  supabase
                    .from('deal_tags')
                    .select('deal_id')
                    .in('tag_id', baseFilters.tag_ids)
                )
              } else {
                // Search for tags that match the search term
                const tagSearchConditions = []
                tagSearchConditions.push(`deal_tags.tags.name.ilike.%${cleanQuery}%`)
                tagSearchConditions.push(`deal_tags.tags.slug.ilike.%${cleanQuery}%`)
                
                // Add fuzzy tag matching for individual words
                searchTerms.forEach(term => {
                  tagSearchConditions.push(`deal_tags.tags.name.ilike.%${term}%`)
                  tagSearchConditions.push(`deal_tags.tags.slug.ilike.%${term}%`)
                })
                
                // Combine content search with tag search
                const allSearchConditions = [...searchConditions, ...tagSearchConditions]
                dealsQuery = dealsQuery.or(allSearchConditions.join(','))
              }
            }
          }
        }

        // Apply basic filters
        if (baseFilters.min_price !== null) {
          dealsQuery = dealsQuery.gte('price', baseFilters.min_price)
        }

        if (baseFilters.max_price !== null) {
          dealsQuery = dealsQuery.lte('price', baseFilters.max_price)
        }

        if (baseFilters.min_discount !== null) {
          dealsQuery = dealsQuery.gte('discount_percentage', baseFilters.min_discount)
        }

        if (baseFilters.has_coupon) {
          dealsQuery = dealsQuery.not('coupon_code', 'is', null)
        }

        if (baseFilters.featured) {
          dealsQuery = dealsQuery.eq('is_featured', true)
        }

        // Apply sorting
        switch (sort) {
          case 'newest':
            dealsQuery = dealsQuery.order('created_at', { ascending: false })
            break
          case 'oldest':
            dealsQuery = dealsQuery.order('created_at', { ascending: true })
            break
          case 'price_low':
            dealsQuery = dealsQuery.order('price', { ascending: true })
            break
          case 'price_high':
            dealsQuery = dealsQuery.order('price', { ascending: false })
            break
          case 'discount':
            dealsQuery = dealsQuery.order('discount_percentage', { ascending: false })
            break
          case 'popular':
            dealsQuery = dealsQuery.order('views_count', { ascending: false })
            break
          default: // relevance
            dealsQuery = dealsQuery.order('created_at', { ascending: false })
        }

        // Get results with pagination
        const { data: deals, error: dealsError, count: dealsCount } = await dealsQuery
          .range(offset, offset + limit - 1)

        if (dealsError) {
          console.error('Deals search error:', dealsError)
        } else {
          results.deals = deals || []
          results.total_deals = dealsCount || (deals ? deals.length : 0)
          
          // If no results found and we have a search query, try a broader tag-based search
          if ((!deals || deals.length === 0) && searchQuery && !genericTerms.includes(cleanQuery)) {
            console.log('No deals found with main search, trying broader tag search...')
            
            try {
              // Search for deals that have tags with similar names
              const { data: tagDeals, error: tagError } = await supabase
                .from('deals')
                .select(`
                  id, title, url, price, merchant, created_at, approved_at, status,
                  description, image_url, deal_images, featured_image, coupon_code, coupon_type, 
                  discount_percentage, discount_amount, original_price, expires_at, category_id, 
                  deal_type, is_featured, views_count, clicks_count, submitter_id,
                  categories(name, slug),
                  companies(name, slug, logo_url, is_verified),
                  profiles!submitter_id(id, handle, avatar_url, karma, role),
                  deal_tags(tags(id, name, slug, color, category))
                `)
                .eq('status', 'approved')
                .or(`deal_tags.tags.name.ilike.%${cleanQuery}%,deal_tags.tags.slug.ilike.%${cleanQuery}%`)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1)
              
              if (!tagError && tagDeals && tagDeals.length > 0) {
                console.log(`Found ${tagDeals.length} deals through tag search`)
                results.deals = tagDeals
                results.total_deals = tagDeals.length
              }
            } catch (tagSearchError) {
              console.error('Tag search error:', tagSearchError)
            }
          }
        }
      } catch (error) {
        console.error('Deals search error:', error)
      }
    }

    // Search coupons if requested
    if (type === 'all' || type === 'coupons') {
      try {
        // Use a simpler approach for coupons
        let couponsQuery = supabase
          .from('coupons')
          .select(`
            id, title, description, coupon_code, coupon_type, discount_value,
            minimum_order_amount, maximum_discount_amount, company_id, category_id,
            submitter_id, terms_conditions, starts_at, expires_at, 
            is_featured, is_exclusive, views_count, clicks_count, success_rate, 
            created_at, updated_at, status,
            companies(id, name, slug, logo_url, is_verified),
            categories(id, name, slug, color),
            profiles!submitter_id(id, handle, avatar_url, karma, role),
            coupon_tags(tags(id, name, slug, color, category))
          `)
          .eq('status', 'approved')

        // Apply search query with fuzzy matching including tags
        if (searchQuery) {
          const cleanQuery = searchQuery.replace(/#[\w-]+/g, '').trim().toLowerCase()
          if (cleanQuery) {
            // Special case: if searching for "coupon", "coupons", "discount", "discounts", "deal", "deals"
            // return all coupons since they're all relevant
            const genericTerms = ['coupon', 'coupons', 'discount', 'discounts', 'deal', 'deals', 'offer', 'offers', 'promo', 'promotion']
            
            if (genericTerms.includes(cleanQuery)) {
              // Don't add any search conditions - return all coupons
              console.log(`Generic search term "${cleanQuery}" detected - returning all coupons`)
            } else {
              // Try exact matches first, then fuzzy matches including tags
              const searchTerms = cleanQuery.split(' ').filter(term => term.length > 2)
              let searchConditions = []
              
              // Exact matches in coupon content
              searchConditions.push(`title.ilike.%${cleanQuery}%`)
              searchConditions.push(`description.ilike.%${cleanQuery}%`)
              searchConditions.push(`coupon_code.ilike.%${cleanQuery}%`)
              
              // Fuzzy matches for individual words in coupon content
              searchTerms.forEach(term => {
                searchConditions.push(`title.ilike.%${term}%`)
                searchConditions.push(`description.ilike.%${term}%`)
                searchConditions.push(`coupon_code.ilike.%${term}%`)
              })
              
              // Tag matching - search for coupons that have tags matching the search term
              if (baseFilters.tag_ids && baseFilters.tag_ids.length > 0) {
                // If we have specific tag IDs, use them
                couponsQuery = couponsQuery.in('id', 
                  supabase
                    .from('coupon_tags')
                    .select('coupon_id')
                    .in('tag_id', baseFilters.tag_ids)
                )
              } else {
                // Search for tags that match the search term
                const tagSearchConditions = []
                tagSearchConditions.push(`coupon_tags.tags.name.ilike.%${cleanQuery}%`)
                tagSearchConditions.push(`coupon_tags.tags.slug.ilike.%${cleanQuery}%`)
                
                // Add fuzzy tag matching for individual words
                searchTerms.forEach(term => {
                  tagSearchConditions.push(`coupon_tags.tags.name.ilike.%${term}%`)
                  tagSearchConditions.push(`coupon_tags.tags.slug.ilike.%${term}%`)
                })
                
                // Combine content search with tag search
                const allSearchConditions = [...searchConditions, ...tagSearchConditions]
                couponsQuery = couponsQuery.or(allSearchConditions.join(','))
              }
            }
          }
        }

        // Apply basic filters
        if (baseFilters.min_discount !== null) {
          couponsQuery = couponsQuery.gte('discount_value', baseFilters.min_discount)
        }

        if (coupon_type) {
          couponsQuery = couponsQuery.eq('coupon_type', coupon_type)
        }

        if (baseFilters.featured) {
          couponsQuery = couponsQuery.eq('is_featured', true)
        }

        // Apply sorting
        switch (sort) {
          case 'newest':
            couponsQuery = couponsQuery.order('created_at', { ascending: false })
            break
          case 'oldest':
            couponsQuery = couponsQuery.order('created_at', { ascending: true })
            break
          case 'expiring':
            couponsQuery = couponsQuery.order('expires_at', { ascending: true })
            break
          case 'discount':
            couponsQuery = couponsQuery.order('discount_value', { ascending: false })
            break
          case 'popular':
            couponsQuery = couponsQuery.order('views_count', { ascending: false })
            break
          case 'success_rate':
            couponsQuery = couponsQuery.order('success_rate', { ascending: false })
            break
          default: // relevance
            couponsQuery = couponsQuery.order('created_at', { ascending: false })
        }

        // Get results with pagination
        const { data: coupons, error: couponsError, count: couponsCount } = await couponsQuery
          .range(offset, offset + limit - 1)

        if (couponsError) {
          console.error('Coupons search error:', couponsError)
        } else {
          results.coupons = coupons || []
          results.total_coupons = couponsCount || (coupons ? coupons.length : 0)
          
          // If no results found and we have a search query, try a broader tag-based search
          if ((!coupons || coupons.length === 0) && searchQuery && !genericTerms.includes(cleanQuery)) {
            console.log('No coupons found with main search, trying broader tag search...')
            
            try {
              // Search for coupons that have tags with similar names
              const { data: tagCoupons, error: tagError } = await supabase
                .from('coupons')
                .select(`
                  id, title, description, coupon_code, coupon_type, discount_value,
                  minimum_order_amount, maximum_discount_amount, company_id, category_id,
                  submitter_id, terms_conditions, starts_at, expires_at, 
                  is_featured, is_exclusive, views_count, clicks_count, success_rate, 
                  created_at, updated_at, status,
                  companies(id, name, slug, logo_url, is_verified),
                  categories(id, name, slug, color),
                  profiles!submitter_id(id, handle, avatar_url, karma, role),
                  coupon_tags(tags(id, name, slug, color, category))
                `)
                .eq('status', 'approved')
                .or(`coupon_tags.tags.name.ilike.%${cleanQuery}%,coupon_tags.tags.slug.ilike.%${cleanQuery}%`)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1)
              
              if (!tagError && tagCoupons && tagCoupons.length > 0) {
                console.log(`Found ${tagCoupons.length} coupons through tag search`)
                results.coupons = tagCoupons
                results.total_coupons = tagCoupons.length
              }
            } catch (tagSearchError) {
              console.error('Tag search error:', tagSearchError)
            }
          }
        }
      } catch (error) {
        console.error('Coupons search error:', error)
      }
    }

    // Search users if requested
    if (type === 'all' || type === 'users') {
      try {
        let usersQuery = supabase
          .from('profiles')
          .select(`
            id, handle, avatar_url, karma, role, created_at,
            first_name, last_name, display_name, bio, location, website
          `)

        // Apply search query with fuzzy matching
        if (searchQuery) {
          const cleanQuery = searchQuery.replace(/#[\w-]+/g, '').trim()
          if (cleanQuery) {
            // Search in handle, display_name, first_name, last_name, bio, location with fuzzy matching
            usersQuery = usersQuery.or(`handle.ilike.%${cleanQuery}%,display_name.ilike.%${cleanQuery}%,first_name.ilike.%${cleanQuery}%,last_name.ilike.%${cleanQuery}%,bio.ilike.%${cleanQuery}%,location.ilike.%${cleanQuery}%`)
          }
        }

        // Sort users by karma (most active first)
        usersQuery = usersQuery.order('karma', { ascending: false })

        // Get results with pagination
        const { data: users, error: usersError } = await usersQuery
          .range(offset, offset + limit - 1)

        if (usersError) {
          console.error('Users search error:', usersError)
        } else {
          results.users = users || []
          results.total_users = users ? users.length : 0

          // For each user, get their recent deals and coupons
          for (let user of results.users) {
            // Get user's recent deals
            const { data: userDeals } = await supabase
              .from('deals')
              .select(`
                id, title, price, discount_percentage, created_at, views_count,
                categories(name, slug),
                companies(name, slug, logo_url)
              `)
              .eq('submitter_id', user.id)
              .eq('status', 'approved')
              .order('created_at', { ascending: false })
              .limit(5)

            // Get user's recent coupons
            const { data: userCoupons } = await supabase
              .from('coupons')
              .select(`
                id, title, discount_value, coupon_type, created_at, views_count,
                categories(name, slug),
                companies(name, slug, logo_url)
              `)
              .eq('submitter_id', user.id)
              .eq('status', 'approved')
              .order('created_at', { ascending: false })
              .limit(5)

            user.recent_deals = userDeals || []
            user.recent_coupons = userCoupons || []
            user.total_contributions = (userDeals?.length || 0) + (userCoupons?.length || 0)
          }
        }
      } catch (error) {
        console.error('Users search error:', error)
      }
    }

    // Search companies if requested
    if (type === 'all' || type === 'companies') {
      try {
        let companiesQuery = supabase
          .from('companies')
          .select(`
            id, name, slug, description, logo_url, website_url, 
            is_verified, created_at, category_id,
            categories(name, slug, color)
          `)

        // Apply search query with fuzzy matching
        if (searchQuery) {
          const cleanQuery = searchQuery.replace(/#[\w-]+/g, '').trim()
          if (cleanQuery) {
            // Search in company name and description with fuzzy matching
            companiesQuery = companiesQuery.or(`name.ilike.%${cleanQuery}%,description.ilike.%${cleanQuery}%`)
          }
        }

        // Sort companies by verification status and name
        companiesQuery = companiesQuery
          .order('is_verified', { ascending: false })
          .order('name', { ascending: true })

        // Get results with pagination
        const { data: companies, error: companiesError } = await companiesQuery
          .range(offset, offset + limit - 1)

        if (companiesError) {
          console.error('Companies search error:', companiesError)
        } else {
          results.companies = companies || []
          results.total_companies = companies ? companies.length : 0

          // For each company, get their recent deals and coupons
          for (let company of results.companies) {
            // Get company's recent deals
            const { data: companyDeals } = await supabase
              .from('deals')
              .select(`
                id, title, price, discount_percentage, created_at, views_count,
                profiles!submitter_id(handle, avatar_url)
              `)
              .eq('company_id', company.id)
              .eq('status', 'approved')
              .order('created_at', { ascending: false })
              .limit(5)

            // Get company's recent coupons
            const { data: companyCoupons } = await supabase
              .from('coupons')
              .select(`
                id, title, discount_value, coupon_type, created_at, views_count,
                profiles!submitter_id(handle, avatar_url)
              `)
              .eq('company_id', company.id)
              .eq('status', 'approved')
              .order('created_at', { ascending: false })
              .limit(5)

            company.recent_deals = companyDeals || []
            company.recent_coupons = companyCoupons || []
            company.total_offers = (companyDeals?.length || 0) + (companyCoupons?.length || 0)
          }
        }
      } catch (error) {
        console.error('Companies search error:', error)
      }
    }

    // Search categories if requested
    if (type === 'all' || type === 'categories') {
      try {
        let categoriesQuery = supabase
          .from('categories')
          .select(`
            id, name, slug, description, color, icon, 
            created_at, is_active
          `)
          .eq('is_active', true)

        // Apply search query with fuzzy matching
        if (searchQuery) {
          const cleanQuery = searchQuery.replace(/#[\w-]+/g, '').trim()
          if (cleanQuery) {
            // Search in category name and description with fuzzy matching
            categoriesQuery = categoriesQuery.or(`name.ilike.%${cleanQuery}%,description.ilike.%${cleanQuery}%`)
          }
        }

        // Sort categories by name
        categoriesQuery = categoriesQuery.order('name', { ascending: true })

        // Get results with pagination
        const { data: categories, error: categoriesError } = await categoriesQuery
          .range(offset, offset + limit - 1)

        if (categoriesError) {
          console.error('Categories search error:', categoriesError)
        } else {
          results.categories = categories || []
          results.total_categories = categories ? categories.length : 0

          // For each category, get recent deals and coupons
          for (let category of results.categories) {
            // Get category's recent deals
            const { data: categoryDeals } = await supabase
              .from('deals')
              .select(`
                id, title, price, discount_percentage, created_at, views_count,
                companies(name, slug, logo_url),
                profiles!submitter_id(handle, avatar_url)
              `)
              .eq('category_id', category.id)
              .eq('status', 'approved')
              .order('created_at', { ascending: false })
              .limit(5)

            // Get category's recent coupons
            const { data: categoryCoupons } = await supabase
              .from('coupons')
              .select(`
                id, title, discount_value, coupon_type, created_at, views_count,
                companies(name, slug, logo_url),
                profiles!submitter_id(handle, avatar_url)
              `)
              .eq('category_id', category.id)
              .eq('status', 'approved')
              .order('created_at', { ascending: false })
              .limit(5)

            category.recent_deals = categoryDeals || []
            category.recent_coupons = categoryCoupons || []
            category.total_items = (categoryDeals?.length || 0) + (categoryCoupons?.length || 0)
          }
        }
      } catch (error) {
        console.error('Categories search error:', error)
      }
    }

    // Calculate total results
    results.total_results = results.total_deals + results.total_coupons + results.total_users + results.total_companies + results.total_categories

    // Add applied filters to response
    results.filters_applied = {
      search_query: searchQuery,
      type,
      category,
      company,
      tags: allTagSlugs,
      min_price,
      max_price,
      min_discount,
      has_coupon,
      coupon_type,
      featured,
      sort
    }

    res.json(results)
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get search suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { q: query, type = 'all' } = req.query

    if (!query || query.length < 2) {
      return res.json({ suggestions: [] })
    }

    const suggestions = []

    // Get tag suggestions
    const { data: tagSuggestions } = await supabase
      .from('tags')
      .select('id, name, slug, category')
      .or(`name.ilike.%${query}%,slug.ilike.%${query}%`)
      .limit(5)

    if (tagSuggestions) {
      suggestions.push(...tagSuggestions.map(tag => ({
        type: 'tag',
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        category: tag.category,
        display: `#${tag.name}`
      })))
    }

    // Get company suggestions
    const { data: companySuggestions } = await supabase
      .from('companies')
      .select('id, name, slug')
      .ilike('name', `%${query}%`)
      .limit(5)

    if (companySuggestions) {
      suggestions.push(...companySuggestions.map(company => ({
        type: 'company',
        id: company.id,
        name: company.name,
        slug: company.slug,
        display: company.name
      })))
    }

    // Get category suggestions
    const { data: categorySuggestions } = await supabase
      .from('categories')
      .select('id, name, slug')
      .ilike('name', `%${query}%`)
      .limit(3)

    if (categorySuggestions) {
      suggestions.push(...categorySuggestions.map(category => ({
        type: 'category',
        id: category.id,
        name: category.name,
        slug: category.slug,
        display: category.name
      })))
    }

    res.json({ suggestions })
  } catch (error) {
    console.error('Search suggestions error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get popular search terms
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query

    // Get popular tags
    const { data: popularTags } = await supabase
      .from('tags')
      .select('id, name, slug, usage_count')
      .order('usage_count', { ascending: false })
      .limit(limit)

    // Get popular companies
    const { data: popularCompanies } = await supabase
      .from('companies')
      .select('id, name, slug')
      .eq('is_verified', true)
      .limit(5)

    res.json({
      popular_tags: popularTags || [],
      popular_companies: popularCompanies || []
    })
  } catch (error) {
    console.error('Popular search error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
