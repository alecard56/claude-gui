// File: src/models/ConversationModel.ts
// Module: Model
// Purpose: Manages conversation data and persistence
// Usage: Accessed through RootStore.conversationStore
// Contains: Methods for creating, saving, and retrieving conversations
// Dependencies: MobX, RootStore
// Iteration: 2

import { makeAutoObservable, runInAction } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import { RootStore } from './RootStore';

// Type definitions
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  metadata: {
    tokens: number;
    model?: string;
    renderOptions?: Record<string, any>;
  };
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
  tags: string[];
  metadata: {
    model: string;
    totalTokens: number;
    favorited: boolean;
    customData?: Record<string, any>;
  };
}

/**
 * Model for managing conversation data and persistence
 */
export class ConversationModel {
  // Observable properties
  conversations: Conversation[] = [];
  activeConversationId = '';
  conversationTags: string[] = [];
  isLoading = false;
  error: string | null = null;
  
  // Reference to root store for cross-store interactions
  private rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  /**
   * Initialize the conversation model
   * Loads saved conversations from storage
   */
  async initialize(debug_mode = false) {
    if (debug_mode) {
      console.log('Initializing ConversationModel...');
    }
    
    this.isLoading = true;
    
    try {
      // Get conversations from storage
      const savedConversations = await window.electronAPI.getConversations();
      
      if (savedConversations && Array.isArray(savedConversations)) {
        runInAction(() => {
          // Convert date strings to Date objects
          this.conversations = savedConversations.map(conv => ({
            ...conv,
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt),
            messages: conv.messages.map(msg => ({
              ...msg,
              createdAt: new Date(msg.createdAt),
            })),
          }));
          
          // Extract unique tags
          this.conversationTags = Array.from(
            new Set(
              this.conversations.flatMap(conv => conv.tags)
            )
          );
        });
        
        if (debug_mode) {
          console.log(`Loaded ${savedConversations.length} conversations`);
        }
      } else if (debug_mode) {
        console.log('No saved conversations found');
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      
      if (debug_mode) {
        console.error('Conversation loading error details:', error);
      }
      
      runInAction(() => {
        this.error = 'Failed to load conversations';
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  /**
   * Reset the conversation model state
   */
  reset() {
    this.conversations = [];
    this.activeConversationId = '';
    this.conversationTags = [];
    this.isLoading = false;
    this.error = null;
  }

  /**
   * Create a new conversation
   */
  createConversation(title?: string, debug_mode = false): Conversation {
    if (debug_mode) {
      console.log('Creating new conversation:', title);
    }
    
    const newConversation: Conversation = {
      id: uuidv4(),
      title: title || `New Conversation ${this.conversations.length + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
      tags: [],
      metadata: {
        model: this.rootStore.apiStore.currentParams.model,
        totalTokens: 0,
        favorited: false,
      },
    };
    
    runInAction(() => {
      this.conversations.push(newConversation);
      this.activeConversationId = newConversation.id;
    });
    
    // Save the new conversation
    this.saveConversation(newConversation);
    
    if (debug_mode) {
      console.log('Created conversation:', newConversation.id);
    }
    
    return newConversation;
  }

  /**
   * Save a conversation to storage
   */
  async saveConversation(conversation: Conversation, debug_mode = false): Promise<boolean> {
    if (debug_mode) {
      console.log('Saving conversation:', conversation.id);
    }
    
    try {
      // Update the conversation's updatedAt timestamp
      conversation.updatedAt = new Date();
      
      // Find the index of the conversation in the array
      const index = this.conversations.findIndex(c => c.id === conversation.id);
      
      if (index !== -1) {
        // Update existing conversation
        runInAction(() => {
          this.conversations[index] = conversation;
        });
      } else {
        // Add new conversation
        runInAction(() => {
          this.conversations.push(conversation);
        });
      }
      
      // Save to storage
      const result = await window.electronAPI.saveConversation(conversation);
      
      if (result.success) {
        if (debug_mode) {
          console.log('Conversation saved successfully');
        }
        return true;
      }
      
      if (debug_mode) {
        console.error('Failed to save conversation:', result.error);
      }
      
      runInAction(() => {
        this.error = result.error || 'Failed to save conversation';
      });
      
      return false;
    } catch (error) {
      console.error('Error saving conversation:', error);
      
      if (debug_mode) {
        console.error('Conversation save error details:', error);
      }
      
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error saving conversation';
      });
      
      return false;
    }
  }

  /**
   * Get a conversation by ID
   */
  getConversationById(id: string): Conversation | undefined {
    return this.conversations.find(c => c.id === id);
  }

  /**
   * Set the active conversation
   */
  setActiveConversation(id: string, debug_mode = false): boolean {
    if (debug_mode) {
      console.log('Setting active conversation:', id);
    }
    
    const conversation = this.getConversationById(id);
    
    if (!conversation) {
      if (debug_mode) {
        console.error('Conversation not found:', id);
      }
      
      runInAction(() => {
        this.error = 'Conversation not found';
      });
      
      return false;
    }
    
    runInAction(() => {
      this.activeConversationId = id;
    });
    
    return true;
  }

  /**
   * Get the active conversation
   */
  getActiveConversation(): Conversation | undefined {
    return this.getConversationById(this.activeConversationId);
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(id: string, debug_mode = false): Promise<boolean> {
    if (debug_mode) {
      console.log('Deleting conversation:', id);
    }
    
    try {
      // Delete from storage
      const result = await window.electronAPI.deleteConversation(id);
      
      if (result.success) {
        runInAction(() => {
          // Remove from array
          this.conversations = this.conversations.filter(c => c.id !== id);
          
          // If we deleted the active conversation, set a new one or clear
          if (this.activeConversationId === id) {
            this.activeConversationId = this.conversations.length > 0 
              ? this.conversations[0].id 
              : '';
          }
          
          // Update tags list
          this.conversationTags = Array.from(
            new Set(
              this.conversations.flatMap(conv => conv.tags)
            )
          );
        });
        
        if (debug_mode) {
          console.log('Conversation deleted successfully');
        }
        
        return true;
      }
      
      if (debug_mode) {
        console.error('Failed to delete conversation:', result.error);
      }
      
      runInAction(() => {
        this.error = result.error || 'Failed to delete conversation';
      });
      
      return false;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      
      if (debug_mode) {
        console.error('Conversation delete error details:', error);
      }
      
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error deleting conversation';
      });
      
      return false;
    }
  }

  /**
   * Add a message to the active conversation
   */
  async addMessage(
    content: string,
    role: 'user' | 'assistant' | 'system',
    metadata?: Partial<Message['metadata']>,
    debug_mode = false
  ): Promise<Message | null> {
    if (debug_mode) {
      console.log('Adding message to conversation:', { role, contentLength: content.length });
    }
    
    const activeConversation = this.getActiveConversation();
    
    if (!activeConversation) {
      if (debug_mode) {
        console.error('No active conversation found');
      }
      
      runInAction(() => {
        this.error = 'No active conversation';
      });
      
      return null;
    }
    
    // Create the message
    const message: Message = {
      id: uuidv4(),
      role,
      content,
      createdAt: new Date(),
      metadata: {
        tokens: metadata?.tokens || 0,
        model: metadata?.model || this.rootStore.apiStore.currentParams.model,
        renderOptions: metadata?.renderOptions || {},
      },
    };
    
    // Update the conversation
    activeConversation.messages.push(message);
    activeConversation.updatedAt = new Date();
    activeConversation.metadata.totalTokens += message.metadata.tokens;
    
    // If it's the first user message and no title, generate a title
    if (
      role === 'user' && 
      activeConversation.messages.filter(m => m.role === 'user').length === 1 && 
      activeConversation.title.startsWith('New Conversation')
    ) {
      // Use the first ~30 chars as the title
      const titlePreview = content.slice(0, 30).trim();
      activeConversation.title = titlePreview + (content.length > 30 ? '...' : '');
    }
    
    // Save the updated conversation
    await this.saveConversation(activeConversation, debug_mode);
    
    return message;
  }

  /**
   * Update an existing message
   */
  async updateMessage(
    messageId: string,
    updates: Partial<Omit<Message, 'id'>>,
    debug_mode = false
  ): Promise<boolean> {
    if (debug_mode) {
      console.log('Updating message:', messageId);
    }
    
    const activeConversation = this.getActiveConversation();
    
    if (!activeConversation) {
      if (debug_mode) {
        console.error('No active conversation found');
      }
      
      runInAction(() => {
        this.error = 'No active conversation';
      });
      
      return false;
    }
    
    // Find the message
    const messageIndex = activeConversation.messages.findIndex(m => m.id === messageId);
    
    if (messageIndex === -1) {
      if (debug_mode) {
        console.error('Message not found:', messageId);
      }
      
      runInAction(() => {
        this.error = 'Message not found';
      });
      
      return false;
    }
    
    // Get the original message
    const originalMessage = activeConversation.messages[messageIndex];
    
    // Calculate token difference if updating content
    let tokenDifference = 0;
    if (updates.metadata?.tokens !== undefined) {
      tokenDifference = updates.metadata.tokens - originalMessage.metadata.tokens;
    }
    
    // Update the message
    activeConversation.messages[messageIndex] = {
      ...originalMessage,
      ...updates,
      id: originalMessage.id, // Ensure ID doesn't change
      metadata: {
        ...originalMessage.metadata,
        ...(updates.metadata || {}),
      },
    };
    
    // Update conversation metadata
    activeConversation.updatedAt = new Date();
    activeConversation.metadata.totalTokens += tokenDifference;
    
    // Save the updated conversation
    return await this.saveConversation(activeConversation, debug_mode);
  }

  /**
   * Delete a message from a conversation
   */
  async deleteMessage(messageId: string, debug_mode = false): Promise<boolean> {
    if (debug_mode) {
      console.log('Deleting message:', messageId);
    }
    
    const activeConversation = this.getActiveConversation();
    
    if (!activeConversation) {
      if (debug_mode) {
        console.error('No active conversation found');
      }
      
      runInAction(() => {
        this.error = 'No active conversation';
      });
      
      return false;
    }
    
    // Find the message
    const message = activeConversation.messages.find(m => m.id === messageId);
    
    if (!message) {
      if (debug_mode) {
        console.error('Message not found:', messageId);
      }
      
      runInAction(() => {
        this.error = 'Message not found';
      });
      
      return false;
    }
    
    // Update the conversation
    activeConversation.messages = activeConversation.messages.filter(m => m.id !== messageId);
    activeConversation.updatedAt = new Date();
    activeConversation.metadata.totalTokens -= message.metadata.tokens;
    
    // Save the updated conversation
    return await this.saveConversation(activeConversation, debug_mode);
  }

  /**
   * Update conversation tags
   */
  async updateTags(conversationId: string, tags: string[], debug_mode = false): Promise<boolean> {
    if (debug_mode) {
      console.log('Updating tags for conversation:', conversationId);
    }
    
    const conversation = this.getConversationById(conversationId);
    
    if (!conversation) {
      if (debug_mode) {
        console.error('Conversation not found:', conversationId);
      }
      
      runInAction(() => {
        this.error = 'Conversation not found';
      });
      
      return false;
    }
    
    // Update tags
    conversation.tags = tags;
    conversation.updatedAt = new Date();
    
    // Save the updated conversation
    const success = await this.saveConversation(conversation, debug_mode);
    
    if (success) {
      // Update global tags list
      runInAction(() => {
        this.conversationTags = Array.from(
          new Set(
            this.conversations.flatMap(conv => conv.tags)
          )
        );
      });
    }
    
    return success;
  }

  /**
   * Search conversations by query
   */
  searchConversations(query: string, tags?: string[], debug_mode = false): Conversation[] {
    if (debug_mode) {
      console.log('Searching conversations:', { query, tags });
    }
    
    if (!query && (!tags || tags.length === 0)) {
      return [...this.conversations];
    }
    
    // Convert query to lowercase for case-insensitive search
    const lowerQuery = query.toLowerCase();
    
    return this.conversations.filter(conversation => {
      // Filter by tags if provided
      if (tags && tags.length > 0) {
        const hasMatchingTag = tags.some(tag => conversation.tags.includes(tag));
        if (!hasMatchingTag) {
          return false;
        }
      }
      
      // If no query, just filter by tags
      if (!query) {
        return true;
      }
      
      // Check title
      if (conversation.title.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      
      // Check message content
      return conversation.messages.some(message => 
        message.content.toLowerCase().includes(lowerQuery)
      );
    });
  }

  /**
   * Toggle favorite status for a conversation
   */
  async toggleFavorite(conversationId: string, debug_mode = false): Promise<boolean> {
    if (debug_mode) {
      console.log('Toggling favorite status for conversation:', conversationId);
    }
    
    const conversation = this.getConversationById(conversationId);
    
    if (!conversation) {
      if (debug_mode) {
        console.error('Conversation not found:', conversationId);
      }
      
      runInAction(() => {
        this.error = 'Conversation not found';
      });
      
      return false;
    }
    
    // Toggle favorite status
    conversation.metadata.favorited = !conversation.metadata.favorited;
    conversation.updatedAt = new Date();
    
    // Save the updated conversation
    return await this.saveConversation(conversation, debug_mode);
  }

  /**
   * Update a conversation title
   */
  async updateTitle(conversationId: string, title: string, debug_mode = false): Promise<boolean> {
    if (debug_mode) {
      console.log('Updating title for conversation:', { conversationId, title });
    }
    
    const conversation = this.getConversationById(conversationId);
    
    if (!conversation) {
      if (debug_mode) {
        console.error('Conversation not found:', conversationId);
      }
      
      runInAction(() => {
        this.error = 'Conversation not found';
      });
      
      return false;
    }
    
    // Update title
    conversation.title = title;
    conversation.updatedAt = new Date();
    
    // Save the updated conversation
    return await this.saveConversation(conversation, debug_mode);
  }
}