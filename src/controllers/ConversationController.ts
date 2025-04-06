/**
 * File: src/controllers/ConversationController.ts
 * Module: Controller
 * Purpose: Manages conversation flow and coordination between models
 * Usage: Imported by AppController and used by views
 * Contains: ConversationController class
 * Dependencies: models, mobx
 * Iteration: 1
 */

import { observable, action, computed, makeObservable } from 'mobx';
import { ClaudeAPIClient, APIParams } from '../models/ClaudeAPIClient';
import { ConversationModel, Conversation, Message } from '../models/ConversationModel';
import { TokenCounter } from '../models/TokenCounter';
import { SettingsModel } from '../models/SettingsModel';
import * as logger from '../utils/logger';

/**
 * Controller for managing conversation interactions
 */
export class ConversationController {
  private conversationModel: ConversationModel;
  private apiClient: ClaudeAPIClient;
  private tokenCounter: TokenCounter;
  private settingsModel: SettingsModel;
  
  @observable isLoading: boolean = false;
  @observable error: string | null = null;
  @observable debugMode: boolean = false;

  constructor(
    conversationModel: ConversationModel,
    apiClient: ClaudeAPIClient,
    tokenCounter: TokenCounter,
    settingsModel: SettingsModel,
    debug_mode: boolean = false
  ) {
    this.conversationModel = conversationModel;
    this.apiClient = apiClient;
    this.tokenCounter = tokenCounter;
    this.settingsModel = settingsModel;
    this.debugMode = debug_mode;
    
    makeObservable(this);
    
    if (debug_mode) {
      logger.debug('ConversationController initialized');
    }
  }

  /**
   * Submit a prompt to Claude
   * @param promptText Text to send to Claude
   */
  @action
  public async submitPrompt(promptText: string): Promise<void> {
    if (!promptText || promptText.trim() === '') {
      return;
    }
    
    try {
      if (this.debugMode) {
        logger.debug('Submitting prompt to Claude');
      }
      
      this.isLoading = true;
      this.error = null;
      
      // Get API parameters from settings
      const apiConfig = this.settingsModel.apiConfig;
      
      // Estimate token count for the prompt
      const promptTokenCount = this.estimateTokenCount(promptText);
      
      // Add user message to conversation
      const userMessage = this.conversationModel.addMessage(
        'user',
        promptText,
        {
          tokens: promptTokenCount,
          model: apiConfig.defaultModel
        },
        this.debugMode
      );
      
      if (!userMessage) {
        throw new Error('Failed to add user message to conversation');
      }
      
      // Prepare API parameters
      const apiParams: Partial<APIParams> = {
        model: apiConfig.defaultModel,
        temperature: apiConfig.temperature,
        max_tokens: apiConfig.maxTokens,
        top_p: apiConfig.topP,
        system_prompt: apiConfig.systemPrompt || undefined,
        stop_sequences: apiConfig.customStopSequences.length > 0 ? apiConfig.customStopSequences : undefined
      };
      
      if (this.debugMode) {
        logger.debug('API parameters:', JSON.stringify(apiParams, null, 2));
      }
      
      // Send prompt to Claude
      const response = await this.apiClient.sendPrompt(promptText, apiParams, this.debugMode);
      
      if (!response) {
        throw new Error('No response from Claude API');
      }
      
      // Add assistant message to conversation
      const assistantMessage = this.conversationModel.addMessage(
        'assistant',
        response.content,
        {
          tokens: response.usage.outputTokens,
          model: response.model,
          renderOptions: {
            codeHighlighting: true,
            formatLinks: true,
            formatTables: true
          }
        },
        this.debugMode
      );
      
      if (!assistantMessage) {
        throw new Error('Failed to add assistant message to conversation');
      }
      
      // Record token usage
      this.tokenCounter.recordUsage(
        response.usage.inputTokens,
        response.usage.outputTokens,
        response.model,
        this.debugMode
      );
      
      if (this.debugMode) {
        logger.debug('Prompt submission complete');
        logger.debug(`Input tokens: ${response.usage.inputTokens}, Output tokens: ${response.usage.outputTokens}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error submitting prompt';
      
      if (this.debugMode) {
        logger.error('Error submitting prompt:', errorMsg);
      }
      
      this.error = `Error: ${errorMsg}`;
      
      // Add error message to conversation if appropriate
      if (this.getActiveConversation()) {
        this.conversationModel.addMessage(
          'system',
          `Error: ${errorMsg}`,
          {
            tokens: 0
          },
          this.debugMode
        );
      }
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Cancel an ongoing request
   */
  @action
  public cancelRequest(): void {
    if (this.debugMode) {
      logger.debug('Cancelling API request');
    }
    
    this.apiClient.abortRequest(this.debugMode);
    this.isLoading = false;
  }

  /**
   * Start a new conversation
   * @param title Optional title for the conversation
   */
  @action
  public startNewConversation(title?: string): void {
    if (this.debugMode) {
      logger.debug('Starting new conversation');
    }
    
    this.conversationModel.createConversation(title || 'New Conversation', this.debugMode);
  }

  /**
   * Load a conversation by ID
   * @param id Conversation ID to load
   */
  @action
  public loadConversation(id: string): boolean {
    if (this.debugMode) {
      logger.debug(`Loading conversation: ${id}`);
    }
    
    return this.conversationModel.setActiveConversation(id, this.debugMode);
  }

  /**
   * Delete a conversation
   * @param id Conversation ID to delete
   */
  @action
  public deleteConversation(id: string): boolean {
    if (this.debugMode) {
      logger.debug(`Deleting conversation: ${id}`);
    }
    
    return this.conversationModel.deleteConversation(id, this.debugMode);
  }

  /**
   * Rename a conversation
   * @param id Conversation ID to rename
   * @param newTitle New title for the conversation
   */
  @action
  public renameConversation(id: string, newTitle: string): boolean {
    if (this.debugMode) {
      logger.debug(`Renaming conversation ${id} to: ${newTitle}`);
    }
    
    return this.conversationModel.updateConversationTitle(id, newTitle, this.debugMode);
  }

  /**
   * Add or update tags for a conversation
   * @param id Conversation ID to tag
   * @param tags Array of tags
   */
  @action
  public tagConversation(id: string, tags: string[]): boolean {
    if (this.debugMode) {
      logger.debug(`Tagging conversation ${id} with: ${tags.join(', ')}`);
    }
    
    return this.conversationModel.tagConversation(id, tags, this.debugMode);
  }

  /**
   * Toggle favorite status of a conversation
   * @param id Conversation ID to toggle
   */
  @action
  public toggleFavorite(id: string): boolean {
    if (this.debugMode) {
      logger.debug(`Toggling favorite status for conversation: ${id}`);
    }
    
    return this.conversationModel.toggleFavorite(id, this.debugMode);
  }

  /**
   * Search conversations
   * @param query Search query
   */
  public searchConversations(query: string): Conversation[] {
    if (this.debugMode) {
      logger.debug(`Searching conversations with query: ${query}`);
    }
    
    return this.conversationModel.searchConversations(query, this.debugMode);
  }

  /**
   * Estimate token count for a text
   * @param text Text to estimate tokens for
   */
  public estimateTokenCount(text: string): number {
    return this.tokenCounter.estimateTokenCount(text, this.debugMode);
  }

  /**
   * Get the active conversation
   */
  public getActiveConversation(): Conversation | null {
    return this.conversationModel.activeConversation;
  }

  /**
   * Get all conversations
   */
  public getAllConversations(): Conversation[] {
    return this.conversationModel.conversations;
  }

  /**
   * Get the active conversation ID
   */
  public getActiveConversationId(): string | null {
    return this.conversationModel.activeConversationId;
  }

  /**
   * Get all tags from all conversations
   */
  public getAllTags(): string[] {
    return this.conversationModel.conversationTags;
  }

  /**
   * Get the current model from settings
   */
  public getCurrentModel(): string {
    return this.settingsModel.apiConfig.defaultModel;
  }

  /**
   * Get the temperature from settings
   */
  public getTemperature(): number {
    return this.settingsModel.apiConfig.temperature;
  }

  /**
   * Get the max tokens from settings
   */
  public getMaxTokens(): number {
    return this.settingsModel.apiConfig.maxTokens;
  }

  /**
   * Get the top_p from settings
   */
  public getTopP(): number {
    return this.settingsModel.apiConfig.topP;
  }

  /**
   * Set debug mode
   * @param debug_mode Debug mode status
   */
  @action
  public setDebugMode(debug_mode: boolean): void {
    this.debugMode = debug_mode;
  }
}
