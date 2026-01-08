/**
 * AI Chat Logger
 * Logs all AI chat requests and responses to a file for debugging
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const LOGS_DIR = path.join(__dirname, '../../../logs');
export const LOG_FILE = path.join(LOGS_DIR, 'ai-chat.log');

// Initialize logs directory
async function ensureLogsDir() {
    try {
        await fs.mkdir(LOGS_DIR, { recursive: true });
    } catch (error) {
        // Directory might already exist, ignore
        if (error.code !== 'EEXIST') {
            console.error('[ChatLogger] Failed to create logs directory:', error.message);
        }
    }
}

// Initialize on module load
ensureLogsDir().catch(console.error);

/**
 * Log an AI chat request and response
 * @param {Object} logData - Log data
 * @param {string} logData.requestId - Request ID
 * @param {string} logData.userId - User ID (or null for guests)
 * @param {string} logData.input - User input message
 * @param {string} logData.output - AI response content
 * @param {Object} logData.metadata - Additional metadata (model, tokens, cost, etc.)
 */
export async function logChatInteraction({ requestId, userId, input, output, metadata = {} }) {
    try {
        await ensureLogsDir();

        const logEntry = {
            timestamp: new Date().toISOString(),
            requestId,
            userId: userId || 'guest',
            input: input || '',
            output: output || '',
            outputLength: output?.length || 0,
            inputLength: input?.length || 0,
            ...metadata
        };

        // Format log line (JSON for easy parsing, but readable)
        const logLine = JSON.stringify(logEntry) + '\n';

        // Append to log file (async, fire and forget)
        await fs.appendFile(LOG_FILE, logLine);
    } catch (error) {
        // Don't fail the request if logging fails
        console.error('[ChatLogger] Failed to log chat interaction:', error.message);
    }
}

/**
 * Log streaming chat start (when streaming begins)
 */
export async function logStreamingStart({ requestId, userId, input, metadata = {} }) {
    try {
        await ensureLogsDir();

        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'stream_start',
            requestId,
            userId: userId || 'guest',
            input: input || '',
            inputLength: input?.length || 0,
            ...metadata
        };

        const logLine = JSON.stringify(logEntry) + '\n';
        await fs.appendFile(LOG_FILE, logLine);
    } catch (error) {
        console.error('[ChatLogger] Failed to log stream start:', error.message);
    }
}

/**
 * Log streaming chat end (when streaming completes)
 */
export async function logStreamingEnd({ requestId, userId, input, output, metadata = {} }) {
    try {
        await ensureLogsDir();

        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'stream_end',
            requestId,
            userId: userId || 'guest',
            input: input || '',
            output: output || '',
            outputLength: output?.length || 0,
            inputLength: input?.length || 0,
            ...metadata
        };

        const logLine = JSON.stringify(logEntry) + '\n';
        await fs.appendFile(LOG_FILE, logLine);
    } catch (error) {
        console.error('[ChatLogger] Failed to log stream end:', error.message);
    }
}

/**
 * Get recent chat logs (for debugging/viewing)
 * @param {number} limit - Number of recent entries to retrieve
 * @param {string} cursor - Cursor for pagination (timestamp or line index)
 * @returns {Promise<{logs: Array, nextCursor: string|null, hasMore: boolean}>} Paginated log entries
 */
export async function getRecentLogs(limit = 50, cursor = null) {
    try {
        const content = await fs.readFile(LOG_FILE, 'utf-8');
        const lines = content.trim().split('\n').filter(line => line.trim());
        
        // Parse all lines to objects
        const allLogs = lines.map(line => {
            try {
                return JSON.parse(line);
            } catch (error) {
                return null;
            }
        }).filter(Boolean);
        
        // Sort by timestamp descending (newest first)
        allLogs.sort((a, b) => {
            const timeA = new Date(a.timestamp || 0).getTime();
            const timeB = new Date(b.timestamp || 0).getTime();
            return timeB - timeA;
        });
        
        // If cursor provided, find starting point
        let startIndex = 0;
        if (cursor) {
            const cursorIndex = allLogs.findIndex(log => 
                log.timestamp === cursor || log.requestId === cursor
            );
            if (cursorIndex !== -1) {
                startIndex = cursorIndex + 1;
            }
        }
        
        // Get next batch
        const paginatedLogs = allLogs.slice(startIndex, startIndex + limit);
        const hasMore = startIndex + limit < allLogs.length;
        const nextCursor = hasMore && paginatedLogs.length > 0 
            ? paginatedLogs[paginatedLogs.length - 1].timestamp 
            : null;
        
        return {
            logs: paginatedLogs,
            nextCursor,
            hasMore,
            total: allLogs.length
        };
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Log file doesn't exist yet
            return { logs: [], nextCursor: null, hasMore: false, total: 0 };
        }
        console.error('[ChatLogger] Failed to read logs:', error.message);
        return { logs: [], nextCursor: null, hasMore: false, total: 0 };
    }
}

/**
 * Clear old logs (optional cleanup utility)
 * @param {number} daysToKeep - Number of days of logs to keep
 */
export async function clearOldLogs(daysToKeep = 30) {
    try {
        const content = await fs.readFile(LOG_FILE, 'utf-8');
        const lines = content.trim().split('\n').filter(line => line.trim());
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        
        const recentLines = lines.filter(line => {
            try {
                const entry = JSON.parse(line);
                const entryDate = new Date(entry.timestamp);
                return entryDate >= cutoffDate;
            } catch (error) {
                return false;
            }
        });
        
        await fs.writeFile(LOG_FILE, recentLines.join('\n') + '\n');
        console.log(`[ChatLogger] Cleared old logs, kept ${recentLines.length} entries`);
    } catch (error) {
        console.error('[ChatLogger] Failed to clear old logs:', error.message);
    }
}

