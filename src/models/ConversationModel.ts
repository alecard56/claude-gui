// /**
//  * File: src/models/ConversationModel.ts
//  * Module: Model
//  * Purpose: Manages conversation data structures and storage
//  * Usage: Imported by controllers to manage conversation state
//  * Contains: ConversationModel class, Message and Conversation interfaces
//  * Dependencies: mobx, electron-store, uuid
//  * Iteration: 1
//  */

// import { observable, action, computed, makeObservable } from 'mobx';
// import ElectronStore from 'electron-store';
// import { v4 as uuidv4 } from 'uuid';
// import * as logger from '../utils/logger';

// // Data Types
// export interface Message {
//   id: string;
//   role: 'user' | 'assistant' | 'system';
//   content: string;
//   createdAt: Date;
//   metadata: {
//     tokens: number;
//     model?: string;
//     renderOptions?: RenderOptions;
//   };
// }

// export interface RenderOptions {
//   codeHighlighting: boolean;
//   formatLinks: boolean;
//   formatTables: boolean;
// }

// export interface Conversation {
//   id: string;
//   title: string;
//   createdAt: Date;
//   updatedAt: Date;
//   messages: Message[];
//   tags: string[];
//   metadata: {
//     model: string;
//     totalTokens: number;
//     favorited: boolean;
//     customData?: Record<string, any>;
//   };
// }

// export class ConversationModel {
//   private store: ElectronStore;
  
//   // Observable state
//   @observable conversations: Conversation[] = [];
//   @observable activeConversationId: string | null = null;
//   @observable conversationTags: string[] = [];
//   @observable isLoading: boolean = false;
//   @observable error: string | null = null;

//   constructor(debug_mode: boolean = false) {
//     this.store = new ElectronStore({
//       name: 'claude-api-conversations',
//       defaults: {
//         conversations: [],
//         tags: []
//       }
//     });
    
//     makeObservable(this);
//     this.loadFromStore(debug_mode);
//   }

//   /**
//    * Loads conversation data from persistent storage
//    */
//   @action
//   private loadFromStore(debug_mode: boolean = false): void {
//     try {
//       if (debug_mode) logger.debug('Loading conversations from store');
      
//       // Load conversations
//       const storedConversations = this.store.get('conversations') as any[];
      
//       if (storedConversations && Array.isArray(storedConversations)) {
//         // Convert ISO date strings to Date objects
//         this.conversations = storedConversations.map(conv => ({
//           ...conv,
//           createdAt: new Date(conv.createdAt),
//           updatedAt: new Date(conv.updatedAt),
//           messages: conv.messages.map((msg: any) => ({
//             ...msg,
//             createdAt: new Date(msg.createdAt)
//           }))
//         }));
        
//         if (debug_mode) logger.debug(`Loaded ${this.conversations.length} conversations`);
//       }
      
//       // Load tags
//       const storedTags = this.store.get('tags') as string[];
      
//       if (storedTags && Array.isArray(storedTags)) {
//         this.conversationTags = storedTags;
//         if (debug_mode) logger.debug(`Loaded ${this.conversationTags.length} tags`);
//       }
      
//       // Load active conversation ID
//       const activeId = this.store.get('activeConversationId') as string;
      
//       if (activeId && this.conversations.some(conv => conv.id === activeId)) {
//         this.activeConversationId = activeId;
//         if (debug_mode) logger.debug(`Set active conversation: ${activeId}`);
//       } else if (this.conversations.length > 0) {
//         // Set the most recent conversation as active
//         this.activeConversationId = this.conversations[0].id;
//         if (debug_mode) logger.debug(`No active conversation found, defaulting to most recent: ${this.activeConversationId}`);
//       }
//     } catch (error) {
//       const errorMsg = error instanceof Error ? error.message : 'Unknown error loading conversations';
//       if (debug_mode) logger.error('Failed to load conversations:', errorMsg);
//       this.error = `Failed to load conversations: ${errorMsg}`;
//     }
//   }

//   /**
//    * Saves the current state to persistent storage
//    */
//   private saveToStore(debug_mode: boolean = false): void {
//     try {
//       if (debug_mode) logger.debug('Saving conversations to store');
      
//       this.store.set('conversations', this.conversations);
//       this.store.set('tags', this.conversationTags);
//       this.store.set('activeConversationId', this.activeConversationId);
      
//       if (debug_mode) logger.debug('Conversations saved successfully');
//     } catch (error) {
//       const errorMsg = error instanceof Error ? error.message : 'Unknown error saving conversations';
//       if (debug_mode) logger.error('Failed to save conversations:', errorMsg);
//       this.error = `Failed to save conversations: ${errorMsg}`;
//     }
//   }

//   /**
//    * Creates a new conversation
//    * @param title Optional title for the conversation
//    */
//   @action
//   public createConversation(title: string = 'New Conversation', debug_mode: boolean = false): Conversation {
//     if (debug_mode) logger.debug(`Creating new conversation: ${title}`);
    
//     const now = new Date();
//     const newConversation: Conversation = {
//       id: uuidv4(),
//       title,
//       createdAt: now,
//       updatedAt: now,
//       messages: [],
//       tags: [],
//       metadata: {
//         model: 'claude-3-opus-20240229',
//         totalTokens: 0,
//         favorited: false
//       }
//     };
    
//     this.conversations.unshift(newConversation);
//     this.activeConversationId = newConversation.id;
//     this.saveToStore(debug_mode);
    
//     if (debug_mode) logger.debug(`New conversation created with ID: ${newConversation.id}`);
    
//     return newConversation;
//   }

//   /**
//    * Gets the active conversation
//    */
//   @computed
//   public get activeConversation(): Conversation | null {
//     if (!this.activeConversationId) return null;
//     return this.conversations.find(conv => conv.id === this.activeConversationId) || null;
//   }

//   /**
//    * Gets a conversation by ID
//    * @param id Conversation ID
//    */
//   public getConversationById(id: string, debug_mode: boolean = false): Conversation | null {
//     if (debug_mode) logger.debug(`Getting conversation by ID: ${id}`);
    
//     const conversation = this.conversations.find(conv => conv.id === id) || null;
    
//     if (debug_mode) {
//       if (conversation) {
//         logger.debug(`Found conversation: ${conversation.title}`);
//       } else {
//         logger.debug(`Conversation not found with ID: ${id}`);
//       }
//     }
    
//     return conversation;
//   }

//   /**
//    * Updates a conversation
//    * @param conversation Updated conversation object
//    */
//   @action
//   public updateConversation(conversation: Conversation, debug_mode: boolean = false): void {
//     if (debug_mode) logger.debug(`Updating conversation: ${conversation.id}`);
    
//     const index = this.conversations.findIndex(conv => conv.id === conversation.id);
    
//     if (index !== -1) {
//       // Update timestamp
//       conversation.updatedAt = new Date();
      
//       // Replace the conversation in the array
//       this.conversations[index] = conversation;
//       this.saveToStore(debug_mode);
      
//       if (debug_mode) logger.debug(`Conversation updated: ${conversation.title}`);
//     } else {
//       if (debug_mode) logger.error(`Conversation not found for update: ${conversation.id}`);
//       this.error = `Conversation not found: ${conversation.id}`;
//     }
//   }

//   /**
//    * Adds a message to the active conversation
//    * @param role Role of the message sender
//    * @param content Content of the message
//    * @param metadata Additional metadata
//    */
//   @action
//   public addMessage(
//     role: 'user' | 'assistant' | 'system',
//     content: string,
//     metadata: { tokens: number; model?: string; renderOptions?: RenderOptions },
//     debug_mode: boolean = false
//   ): Message | null {
//     try {
//       const activeConv = this.activeConversation;
      
//       if (!activeConv) {
//         if (debug_mode) logger.error('No active conversation to add message to');
//         this.error = 'No active conversation';
//         return null;
//       }
      
//       if (debug_mode) logger.debug(`Adding ${role} message to conversation: ${activeConv.id}`);
      
//       // Create new message
//       const newMessage: Message = {
//         id: uuidv4(),
//         role,
//         content,
//         createdAt: new Date(),
//         metadata
//       };
      
//       // Add message to conversation
//       activeConv.messages.push(newMessage);
      
//       // Update conversation metadata
//       activeConv.updatedAt = new Date();
//       activeConv.metadata.totalTokens += metadata.tokens;
      
//       if (metadata.model) {
//         activeConv.metadata.model = metadata.model;
//       }
      
//       // Update conversation in state
//       this.updateConversation(activeConv, debug_mode);
      
//       if (debug_mode) logger.debug(`Message added with ID: ${newMessage.id}`);
      
//       return newMessage;
//     } catch (error) {
//       const errorMsg = error instanceof Error ? error.message : 'Unknown error adding message';
//       if (debug_mode) logger.error('Failed to add message:', errorMsg);
//       this.error = `Failed to add message: ${errorMsg}`;
//       return null;
//     }
//   }

//   /**
//    * Deletes a conversation
//    * @param id ID of the conversation to delete
//    */
//   @action
//   public deleteConversation(id: string, debug_mode: boolean = false): boolean {
//     if (debug_mode) logger.debug(`Deleting conversation: ${id}`);
    
//     const initialLength = this.conversations.length;
//     this.conversations = this.conversations.filter(conv => conv.id !== id);
    
//     // If we deleted the active conversation, set a new active conversation
//     if (this.activeConversationId === id) {
//       this.activeConversationId = this.conversations.length > 0 ? this.conversations[0].id : null;
//       if (debug_mode) logger.debug(`Active conversation was deleted, new active: ${this.activeConversationId}`);
//     }
    
//     const deleted = initialLength > this.conversations.length;
    
//     if (deleted) {
//       this.saveToStore(debug_mode);
//       if (debug_mode) logger.debug('Conversation deleted successfully');
//     } else {
//       if (debug_mode) logger.debug(`Conversation not found for deletion: ${id}`);
//     }
    
//     return deleted;
//   }

//   /**
//    * Search for conversations by query
//    * @param query Search string
//    */
//   @action
//   public searchConversations(query: string, debug_mode: boolean = false): Conversation[] {
//     if (!query || query.trim() === '') {
//       if (debug_mode) logger.debug('Empty search query, returning all conversations');
//       return [...this.conversations];
//     }
    
//     if (debug_mode) logger.debug(`Searching conversations with query: ${query}`);
    
//     const normalizedQuery = query.toLowerCase().trim();
    
//     const results = this.conversations.filter(conv => {
//       // Search in title
//       if (conv.title.toLowerCase().includes(normalizedQuery)) return true;
      
//       // Search in tags
//       if (conv.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))) return true;
      
//       // Search in messages
//       if (conv.messages.some(msg => msg.content.toLowerCase().includes(normalizedQuery))) return true;
      
//       return false;
//     });
    
//     if (debug_mode) logger.debug(`Found ${results.length} conversations matching query`);
    
//     return results;
//   }

//   /**
//    * Adds or updates tags for a conversation
//    * @param id Conversation ID
//    * @param tags Array of tags
//    */
//   @action
//   public tagConversation(id: string, tags: string[], debug_mode: boolean = false): boolean {
//     if (debug_mode) logger.debug(`Tagging conversation ${id} with tags: ${tags.join(', ')}`);
    
//     const conversation = this.getConversationById(id);
    
//     if (!conversation) {
//       if (debug_mode) logger.error(`Conversation not found for tagging: ${id}`);
//       this.error = `Conversation not found: ${id}`;
//       return false;
//     }
    
//     // Update conversation tags
//     conversation.tags = [...tags];
    
//     // Update conversation
//     this.updateConversation(conversation, debug_mode);
    
//     // Update global tag list with any new tags
//     const uniqueTags = new Set([...this.conversationTags, ...tags]);
//     this.conversationTags = Array.from(uniqueTags);
    
//     this.saveToStore(debug_mode);
    
//     if (debug_mode) logger.debug('Conversation tagged successfully');
    
//     return true;
//   }

//   /**
//    * Sets the active conversation
//    * @param id Conversation ID
//    */
//   @action
//   public setActiveConversation(id: string, debug_mode: boolean = false): boolean {
//     if (debug_mode) logger.debug(`Setting active conversation: ${id}`);
    
//     const conversation = this.getConversationById(id);
    
//     if (!conversation) {
//       if (debug_mode) logger.error(`Conversation not found: ${id}`);
//       this.error = `Conversation not found: ${id}`;
//       return false;
//     }
    
//     this.activeConversationId = id;
//     this.saveToStore(debug_mode);
    
//     if (debug_mode) logger.debug(`Active conversation set to: ${conversation.title}`);
    
//     return true;
//   }

//   /**
//    * Updates the title of a conversation
//    * @param id Conversation ID
//    * @param title New title
//    */
//   @action
//   public updateConversationTitle(id: string, title: string, debug_mode: boolean = false): boolean {
//     if (debug_mode) logger.debug(`Updating title for conversation ${id}: ${title}`);
    
//     const conversation = this.getConversationById(id);
    
//     if (!conversation) {
//       if (debug_mode) logger.error(`Conversation not found for title update: ${id}`);
//       this.error = `Conversation not found: ${id}`;
//       return false;
//     }
    
//     conversation.title = title;
//     this.updateConversation(conversation, debug_mode);
    
//     if (debug_mode) logger.debug('Conversation title updated successfully');
    
//     return true;
//   }

//   /**
//    * Toggles the favorited status of a conversation
//    * @param id Conversation ID
//    */
//   @action
//   public toggleFavorite(id: string, debug_mode: boolean = false): boolean {
//     if (debug_mode) logger.debug(`Toggling favorite status for conversation: ${id}`);
    
//     const conversation = this.getConversationById(id);
    
//     if (!conversation) {
//       if (debug_mode) logger.error(`Conversation not found for favorite toggle: ${id}`);
//       this.error = `Conversation not found: ${id}`;
//       return false;
//     }
    
//     conversation.metadata.favorited = !conversation.metadata.favorited;
//     this.updateConversation(conversation, debug_mode);
    
//     if (debug_mode) {
//       logger.debug(`Conversation favorite status set to: ${conversation.metadata.favorited}`);
//     }
    
//     return true;
//   }
// }


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
  activeConversationId: string = '';
  conversationTags: string[] = [];
  isLoading: boolean = false;
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