import { makeUserClientFromToken } from './supaUser.js';

// Helper function to safely create Supabase user client with proper error handling
export async function createSafeUserClient(token, res) {
  try {
    return await makeUserClientFromToken(token);
  } catch (clientError) {
    // Return appropriate error codes based on the error type
    if (clientError.message.includes('Invalid JWT token format')) {
      res.status(400).json({ error: 'Invalid token format' });
      return null;
    } else if (clientError.message.includes('JWT cryptographic operation failed') || 
               clientError.message.includes('Invalid JWT') ||
               clientError.message.includes('JWT expired') ||
               clientError.message.includes('JWT malformed') ||
               clientError.message.includes('Invalid or expired JWT token')) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return null;
    } else {
      res.status(401).json({ error: 'Authentication failed: ' + clientError.message });
      return null;
    }
  }
}
