import { mockForumService } from './mockService'

// Service adapter - switches between mock and real API based on environment
const useMockForums = import.meta.env.VITE_MOCK_FORUMS !== 'false'

// Real API service (placeholder for future implementation)
const realForumService = {
  // TODO: Implement real API calls when backend is ready
  async getForums() {
    throw new Error('Real forum API not implemented yet')
  },
  
  async getForum(slug) {
    throw new Error('Real forum API not implemented yet')
  },
  
  async getThreads(forumSlug, options) {
    throw new Error('Real forum API not implemented yet')
  },
  
  async getThread(threadId) {
    throw new Error('Real forum API not implemented yet')
  },
  
  async createThread(forumSlug, threadData) {
    throw new Error('Real forum API not implemented yet')
  },
  
  async voteThread(threadId, value) {
    throw new Error('Real forum API not implemented yet')
  },
  
  async getPosts(threadId) {
    throw new Error('Real forum API not implemented yet')
  },
  
  async createPost(threadId, postData) {
    throw new Error('Real forum API not implemented yet')
  },
  
  async pinThread(threadId) {
    throw new Error('Real forum API not implemented yet')
  },
  
  async lockThread(threadId) {
    throw new Error('Real forum API not implemented yet')
  },
  
  async deleteThread(threadId) {
    throw new Error('Real forum API not implemented yet')
  },
  
  async getLatestThreads(limit) {
    throw new Error('Real forum API not implemented yet')
  },
}

// Export the active service based on environment
export const forumService = useMockForums ? mockForumService : realForumService
