// Forum entity type constants
export const FORUM_TYPES = {
  GENERAL: 'general',
  DEALS: 'deals',
  TECH: 'tech',
  FASHION: 'fashion',
  HOME: 'home',
  TRAVEL: 'travel',
}

// Thread status constants  
export const THREAD_STATUS = {
  ACTIVE: 'active',
  LOCKED: 'locked',
  PINNED: 'pinned',
  ARCHIVED: 'archived',
}

// Sort options
export const THREAD_SORT = {
  NEW: 'new',
  TOP: 'top',
  HOT: 'hot',
}

// Default forum structure
export const DEFAULT_FORUMS = [
  {
    slug: 'general',
    name: 'General Discussion',
    description: 'General conversations about deals and savings',
    tags: ['discussion', 'community', 'help'],
    threadCount: 0,
    postCount: 0,
  },
  {
    slug: 'deals',
    name: 'Deal Discussion',
    description: 'Discuss deals, share tips, and get advice',
    tags: ['deals', 'tips', 'advice'],
    threadCount: 0,
    postCount: 0,
  },
  {
    slug: 'tech',
    name: 'Technology',
    description: 'Tech deals, gadgets, and electronics',
    tags: ['technology', 'gadgets', 'electronics'],
    threadCount: 0,
    postCount: 0,
  },
  {
    slug: 'fashion',
    name: 'Fashion & Beauty',
    description: 'Fashion deals, beauty products, and style tips',
    tags: ['fashion', 'beauty', 'style'],
    threadCount: 0,
    postCount: 0,
  },
]

// Entity keys for localStorage
export const STORAGE_KEYS = {
  FORUMS: 'forums_v1',
  THREADS: 'forum_threads_v1', 
  POSTS: 'forum_posts_v1',
}
