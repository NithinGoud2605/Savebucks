import { DEFAULT_FORUMS, STORAGE_KEYS, THREAD_STATUS } from './forumTypes'

// Artificial delay to simulate network requests
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// Initialize default data
function initializeForums() {
  if (!localStorage.getItem(STORAGE_KEYS.FORUMS)) {
    localStorage.setItem(STORAGE_KEYS.FORUMS, JSON.stringify(DEFAULT_FORUMS))
  }
  if (!localStorage.getItem(STORAGE_KEYS.THREADS)) {
    localStorage.setItem(STORAGE_KEYS.THREADS, JSON.stringify([]))
  }
  if (!localStorage.getItem(STORAGE_KEYS.POSTS)) {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify([]))
  }
}

// Get data from localStorage
function getFromStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || []
  } catch {
    return []
  }
}

// Save data to localStorage
function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Mock service implementation
class MockForumService {
  constructor() {
    initializeForums()
  }

  // Forums
  async getForums() {
    await delay()
    const forums = getFromStorage(STORAGE_KEYS.FORUMS)
    const threads = getFromStorage(STORAGE_KEYS.THREADS)
    const posts = getFromStorage(STORAGE_KEYS.POSTS)

    // Add counts to forums
    return forums.map(forum => ({
      ...forum,
      threadCount: threads.filter(t => t.forumSlug === forum.slug).length,
      postCount: posts.filter(p => {
        const thread = threads.find(t => t.id === p.threadId)
        return thread && thread.forumSlug === forum.slug
      }).length,
    }))
  }

  async getForum(slug) {
    await delay()
    const forums = getFromStorage(STORAGE_KEYS.FORUMS)
    return forums.find(f => f.slug === slug) || null
  }

  // Threads
  async getThreads(forumSlug, { sort = 'new', tag = null, search = null } = {}) {
    await delay()
    let threads = getFromStorage(STORAGE_KEYS.THREADS)
    const posts = getFromStorage(STORAGE_KEYS.POSTS)

    // Filter by forum
    threads = threads.filter(t => t.forumSlug === forumSlug)

    // Filter by tag
    if (tag) {
      threads = threads.filter(t => t.tags.includes(tag))
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      threads = threads.filter(t => 
        t.title.toLowerCase().includes(searchLower) ||
        t.body.toLowerCase().includes(searchLower)
      )
    }

    // Add post counts and sort
    threads = threads.map(thread => ({
      ...thread,
      postCount: posts.filter(p => p.threadId === thread.id).length,
      lastActivity: posts
        .filter(p => p.threadId === thread.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]?.created_at || thread.created_at,
    }))

    // Sort threads
    switch (sort) {
      case 'top':
        threads.sort((a, b) => b.votes - a.votes)
        break
      case 'hot':
        // Simple hot algorithm: votes + recent activity
        threads.sort((a, b) => {
          const aHot = a.votes + (Date.now() - new Date(a.lastActivity)) / (1000 * 60 * 60)
          const bHot = b.votes + (Date.now() - new Date(b.lastActivity)) / (1000 * 60 * 60)
          return bHot - aHot
        })
        break
      default: // new
        threads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }

    // Pinned threads always go first
    const pinnedThreads = threads.filter(t => t.pinned)
    const regularThreads = threads.filter(t => !t.pinned)

    return [...pinnedThreads, ...regularThreads]
  }

  async getThread(threadId) {
    await delay()
    const threads = getFromStorage(STORAGE_KEYS.THREADS)
    const posts = getFromStorage(STORAGE_KEYS.POSTS)

    const thread = threads.find(t => t.id === threadId)
    if (!thread) return null

    const threadPosts = posts
      .filter(p => p.threadId === threadId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

    return {
      ...thread,
      posts: threadPosts,
    }
  }

  async createThread(forumSlug, threadData) {
    await delay()
    const threads = getFromStorage(STORAGE_KEYS.THREADS)

    const newThread = {
      id: generateId(),
      forumSlug,
      title: threadData.title,
      body: threadData.body,
      tags: threadData.tags || [],
      author: 'demo', // Mock user
      created_at: new Date().toISOString(),
      votes: 0,
      pinned: false,
      locked: false,
      status: THREAD_STATUS.ACTIVE,
    }

    threads.push(newThread)
    saveToStorage(STORAGE_KEYS.THREADS, threads)

    return newThread
  }

  async voteThread(threadId, value) {
    await delay(100)
    const threads = getFromStorage(STORAGE_KEYS.THREADS)
    const threadIndex = threads.findIndex(t => t.id === threadId)
    
    if (threadIndex === -1) return null

    threads[threadIndex].votes = Math.max(0, (threads[threadIndex].votes || 0) + value)
    saveToStorage(STORAGE_KEYS.THREADS, threads)

    return threads[threadIndex]
  }

  // Posts
  async getPosts(threadId) {
    await delay()
    const posts = getFromStorage(STORAGE_KEYS.POSTS)
    return posts
      .filter(p => p.threadId === threadId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  }

  async createPost(threadId, postData) {
    await delay()
    const posts = getFromStorage(STORAGE_KEYS.POSTS)

    const newPost = {
      id: generateId(),
      threadId,
      body: postData.body,
      author: 'demo', // Mock user
      created_at: new Date().toISOString(),
      parent_id: postData.parent_id || null,
    }

    posts.push(newPost)
    saveToStorage(STORAGE_KEYS.POSTS, posts)

    return newPost
  }

  // Moderation (mock implementations)
  async pinThread(threadId) {
    await delay(100)
    const threads = getFromStorage(STORAGE_KEYS.THREADS)
    const threadIndex = threads.findIndex(t => t.id === threadId)
    
    if (threadIndex === -1) return null

    threads[threadIndex].pinned = !threads[threadIndex].pinned
    saveToStorage(STORAGE_KEYS.THREADS, threads)

    return threads[threadIndex]
  }

  async lockThread(threadId) {
    await delay(100)
    const threads = getFromStorage(STORAGE_KEYS.THREADS)
    const threadIndex = threads.findIndex(t => t.id === threadId)
    
    if (threadIndex === -1) return null

    threads[threadIndex].locked = !threads[threadIndex].locked
    saveToStorage(STORAGE_KEYS.THREADS, threads)

    return threads[threadIndex]
  }

  async deleteThread(threadId) {
    await delay(100)
    const threads = getFromStorage(STORAGE_KEYS.THREADS)
    const posts = getFromStorage(STORAGE_KEYS.POSTS)

    // Remove thread
    const filteredThreads = threads.filter(t => t.id !== threadId)
    saveToStorage(STORAGE_KEYS.THREADS, filteredThreads)

    // Remove associated posts
    const filteredPosts = posts.filter(p => p.threadId !== threadId)
    saveToStorage(STORAGE_KEYS.POSTS, filteredPosts)

    return true
  }

  // Get latest activity for home page
  async getLatestThreads(limit = 5) {
    await delay()
    const threads = getFromStorage(STORAGE_KEYS.THREADS)
    const posts = getFromStorage(STORAGE_KEYS.POSTS)

    const threadsWithActivity = threads.map(thread => ({
      ...thread,
      lastActivity: posts
        .filter(p => p.threadId === thread.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]?.created_at || thread.created_at,
    }))

    return threadsWithActivity
      .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
      .slice(0, limit)
  }
}

export const mockForumService = new MockForumService()
