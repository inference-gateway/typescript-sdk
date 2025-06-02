/**
 * In-Memory Storage Manager with Background Persistence
 *
 * This module provides fast in-memory operations with automatic background
 * disk persistence to avoid blocking the main thread on file I/O.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createMcpLogger } from './logger.js';

const logger = createMcpLogger('memory-manager', '1.0.0');

class MemoryManager {
  constructor(memoryDir = '/tmp/memory', persistIntervalMs = 5000) {
    this.memoryDir = memoryDir;
    this.persistIntervalMs = persistIntervalMs;

    this.memoryStore = new Map();

    this.dirtySet = new Set();

    this.persistenceInterval = null;
    this.isShuttingDown = false;

    logger.info('MemoryManager initialized', {
      memoryDir: this.memoryDir,
      persistIntervalMs: this.persistIntervalMs,
    });
  }

  /**
   * Initialize the memory manager
   */
  async initialize() {
    try {
      await fs.mkdir(this.memoryDir, { recursive: true });

      await this.loadExistingSessions();

      this.startBackgroundPersistence();

      logger.info('MemoryManager started successfully', {
        loadedSessions: this.memoryStore.size,
      });
    } catch (error) {
      logger.error('Failed to initialize MemoryManager', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Load existing sessions from disk into memory on startup
   */
  async loadExistingSessions() {
    try {
      const files = await fs.readdir(this.memoryDir);
      const jsonFiles = files.filter((file) => file.endsWith('.json'));

      logger.debug('Loading existing sessions', {
        totalFiles: files.length,
        jsonFiles: jsonFiles.length,
      });

      let loadedCount = 0;
      let errorCount = 0;

      for (const file of jsonFiles) {
        try {
          const sessionId = path.basename(file, '.json');
          const filePath = path.join(this.memoryDir, file);
          const fileContent = await fs.readFile(filePath, 'utf8');
          const memoryData = JSON.parse(fileContent);

          this.memoryStore.set(sessionId, memoryData);
          loadedCount++;

          logger.debug('Session loaded successfully', { sessionId });
        } catch (readError) {
          errorCount++;
          logger.warn('Failed to load session file', {
            file,
            error: readError.message,
          });
        }
      }

      logger.info('Session loading completed', {
        loadedCount,
        errorCount,
        totalSessions: this.memoryStore.size,
      });
    } catch (error) {
      logger.error('Failed to load existing sessions', {
        error: error.message,
      });
      // Don't throw - we can continue with empty memory
    }
  }

  /**
   * Start background persistence process
   */
  startBackgroundPersistence() {
    if (this.persistenceInterval) {
      globalThis.clearInterval(this.persistenceInterval);
    }

    this.persistenceInterval = globalThis.setInterval(async () => {
      if (this.isShuttingDown) return;

      logger.debug('Background persistence tick', {
        dirtySessions: this.dirtySet.size,
        totalSessions: this.memoryStore.size,
      });

      try {
        await this.persistDirtySessions();
      } catch (error) {
        logger.error('Background persistence failed', {
          error: error.message,
        });
      }
    }, this.persistIntervalMs);

    logger.info('Background persistence started', {
      intervalMs: this.persistIntervalMs,
      intervalId: this.persistenceInterval,
    });
  }

  /**
   * Persist dirty sessions to disk
   */
  async persistDirtySessions() {
    if (this.dirtySet.size === 0) return;

    const sessionsToPersist = Array.from(this.dirtySet);
    this.dirtySet.clear();

    logger.debug('Persisting dirty sessions', {
      sessionCount: sessionsToPersist.length,
    });

    const persistPromises = sessionsToPersist.map(async (sessionId) => {
      try {
        const memoryData = this.memoryStore.get(sessionId);
        if (!memoryData) {
          logger.warn('Session not found in memory during persistence', {
            sessionId,
          });
          return;
        }

        const filePath = path.join(this.memoryDir, `${sessionId}.json`);
        await fs.writeFile(filePath, JSON.stringify(memoryData, null, 2));

        logger.debug('Session persisted successfully', { sessionId });
      } catch (error) {
        logger.error('Failed to persist session', {
          sessionId,
          error: error.message,
        });
        this.dirtySet.add(sessionId);
      }
    });

    await Promise.allSettled(persistPromises);
  }

  /**
   * Save state to memory (fast, synchronous operation)
   */
  saveState(sessionId, state, context = null) {
    const memoryData = {
      sessionId,
      state,
      context,
      timestamp: new Date().toISOString(),
      lastError: this.memoryStore.get(sessionId)?.lastError || null,
    };

    this.memoryStore.set(sessionId, memoryData);
    this.dirtySet.add(sessionId);

    logger.debug('State saved to memory', {
      sessionId,
      stateSize: JSON.stringify(state).length,
      totalDirtySessions: this.dirtySet.size,
    });

    return memoryData;
  }

  /**
   * Save error state for a session (fast in-memory operation)
   */
  async saveErrorState(sessionId, state, error, context) {
    const memoryData = {
      sessionId,
      state,
      context,
      timestamp: new Date().toISOString(),
      lastError: {
        ...error,
        timestamp: new Date().toISOString(),
      },
    };

    this.memoryStore.set(sessionId, memoryData);

    this.dirtySet.add(sessionId);

    logger.debug('Error state saved to memory', {
      sessionId,
      errorMessage: error.message,
      memorySize: this.memoryStore.size,
    });
  }

  /**
   * Restore state from memory (fast, synchronous operation)
   */
  restoreState(sessionId) {
    const memoryData = this.memoryStore.get(sessionId);

    if (!memoryData) {
      logger.debug('No state found in memory', { sessionId });
      return null;
    }

    logger.debug('State restored from memory', {
      sessionId,
      hasError: !!memoryData.lastError,
    });

    return memoryData;
  }

  /**
   * List all sessions in memory (fast, synchronous operation)
   */
  listSessions() {
    const sessions = Array.from(this.memoryStore.entries()).map(
      ([sessionId, data]) => ({
        sessionId,
        context: data.context,
        timestamp: data.timestamp,
        hasError: !!data.lastError,
        lastError: data.lastError?.message,
      })
    );

    logger.debug('Sessions listed from memory', {
      sessionCount: sessions.length,
    });

    return sessions;
  }

  /**
   * Clear session from memory and mark for deletion
   */
  clearSession(sessionId) {
    const existed = this.memoryStore.has(sessionId);
    this.memoryStore.delete(sessionId);
    this.dirtySet.delete(sessionId);

    if (existed) {
      this.scheduleFileDeletion(sessionId);
      logger.debug('Session cleared from memory', { sessionId });
    }

    return existed;
  }

  /**
   * Schedule file deletion for the next persistence cycle
   */
  scheduleFileDeletion(sessionId) {
    this.dirtySet.add(`__DELETE__${sessionId}`);
  }

  /**
   * Enhanced persistence that handles deletions
   */
  async persistDirtySessionsWithDeletions() {
    if (this.dirtySet.size === 0) return;

    const operations = Array.from(this.dirtySet);
    this.dirtySet.clear();

    const saveOperations = operations.filter(
      (op) => !op.startsWith('__DELETE__')
    );
    const deleteOperations = operations
      .filter((op) => op.startsWith('__DELETE__'))
      .map((op) => op.replace('__DELETE__', ''));

    logger.debug('Persisting sessions with operations', {
      saveCount: saveOperations.length,
      deleteCount: deleteOperations.length,
    });

    const savePromises = saveOperations.map(async (sessionId) => {
      try {
        const memoryData = this.memoryStore.get(sessionId);
        if (!memoryData) return;

        const filePath = path.join(this.memoryDir, `${sessionId}.json`);
        await fs.writeFile(filePath, JSON.stringify(memoryData, null, 2));
      } catch (error) {
        logger.error('Failed to persist session', {
          sessionId,
          error: error.message,
        });
        this.dirtySet.add(sessionId);
      }
    });

    const deletePromises = deleteOperations.map(async (sessionId) => {
      try {
        const filePath = path.join(this.memoryDir, `${sessionId}.json`);
        await fs.unlink(filePath);
        logger.debug('Session file deleted', { sessionId });
      } catch (error) {
        if (error.code !== 'ENOENT') {
          logger.error('Failed to delete session file', {
            sessionId,
            error: error.message,
          });
        }
      }
    });

    await Promise.allSettled([...savePromises, ...deletePromises]);
  }

  /**
   * Graceful shutdown with immediate persistence
   */
  async shutdown() {
    logger.info('MemoryManager shutting down...');

    this.isShuttingDown = true;

    if (this.persistenceInterval) {
      globalThis.clearInterval(this.persistenceInterval);
      this.persistenceInterval = null;
    }

    try {
      await this.persistDirtySessionsWithDeletions();
      logger.info('Final persistence completed successfully');
    } catch (error) {
      logger.error('Failed to complete final persistence', {
        error: error.message,
      });
    }

    logger.info('MemoryManager shutdown completed');
  }

  /**
   * Get memory statistics
   */
  getStats() {
    return {
      sessionsInMemory: this.memoryStore.size,
      dirtySessionsCount: this.dirtySet.size,
      isShuttingDown: this.isShuttingDown,
      persistIntervalMs: this.persistIntervalMs,
    };
  }

  /**
   * Save conversation to memory (fast in-memory operation)
   */
  saveConversation(sessionId, messages, context = null) {
    const existingData = this.memoryStore.get(sessionId) || {};

    const timestampedMessages = messages.map((msg) => ({
      ...msg,
      timestamp: msg.timestamp || new Date().toISOString(),
    }));

    const memoryData = {
      ...existingData,
      sessionId,
      conversation: {
        messages: timestampedMessages,
        context,
        lastUpdated: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    this.memoryStore.set(sessionId, memoryData);
    this.dirtySet.add(sessionId);

    logger.debug('Conversation saved to memory', {
      sessionId,
      messageCount: timestampedMessages.length,
      memorySize: this.memoryStore.size,
    });

    return memoryData;
  }

  /**
   * Add message to conversation (fast in-memory operation)
   */
  addMessage(sessionId, role, content, timestamp = null) {
    const messageTimestamp = timestamp || new Date().toISOString();
    const newMessage = {
      role,
      content,
      timestamp: messageTimestamp,
    };

    let memoryData = this.memoryStore.get(sessionId) || {
      sessionId,
      timestamp: new Date().toISOString(),
    };

    if (!memoryData.conversation) {
      memoryData.conversation = {
        messages: [],
        context: null,
        lastUpdated: new Date().toISOString(),
      };
    }

    memoryData.conversation.messages.push(newMessage);
    memoryData.conversation.lastUpdated = new Date().toISOString();
    memoryData.timestamp = new Date().toISOString();

    this.memoryStore.set(sessionId, memoryData);
    this.dirtySet.add(sessionId);

    logger.debug('Message added to memory', {
      sessionId,
      role,
      totalMessages: memoryData.conversation.messages.length,
    });

    return memoryData;
  }

  /**
   * Get conversation from memory (fast, synchronous operation)
   */
  getConversation(sessionId, filterRole = null, limit = null) {
    const memoryData = this.memoryStore.get(sessionId);

    if (
      !memoryData ||
      !memoryData.conversation ||
      !memoryData.conversation.messages
    ) {
      logger.debug('No conversation found in memory', { sessionId });
      return null;
    }

    let messages = [...memoryData.conversation.messages];

    if (filterRole) {
      messages = messages.filter((msg) => msg.role === filterRole);
    }

    if (limit && limit > 0) {
      messages = messages.slice(-limit);
    }

    logger.debug('Conversation retrieved from memory', {
      sessionId,
      totalMessages: memoryData.conversation.messages.length,
      filteredMessages: messages.length,
      filterRole,
      limit,
    });

    return {
      sessionId: memoryData.sessionId,
      conversation: {
        messages,
        context: memoryData.conversation.context,
        lastUpdated: memoryData.conversation.lastUpdated,
        totalMessages: memoryData.conversation.messages.length,
        filteredMessages: messages.length,
      },
      timestamp: memoryData.timestamp,
    };
  }

  /**
   * Clear conversation from memory while keeping other data
   */
  clearConversation(sessionId, keepOtherData = true) {
    if (keepOtherData) {
      const memoryData = this.memoryStore.get(sessionId);
      if (!memoryData) {
        logger.debug('No session found to clear conversation', { sessionId });
        return false;
      }

      delete memoryData.conversation;
      memoryData.timestamp = new Date().toISOString();

      this.memoryStore.set(sessionId, memoryData);
      this.dirtySet.add(sessionId);

      logger.debug('Conversation cleared from memory (keeping other data)', {
        sessionId,
      });
      return true;
    } else {
      return this.clearSession(sessionId);
    }
  }
}

MemoryManager.prototype.persistDirtySessions =
  MemoryManager.prototype.persistDirtySessionsWithDeletions;

export default MemoryManager;
