/**
 * File: src/models/ClaudeAPIClient.ts
 * Module: Model
 * Purpose: Handles all communication with the Claude API
 * Usage: Imported by controllers to make API requests
 * Contains: ClaudeAPIClient class for API integration
 * Dependencies: axios, electron-store
 * Iteration: 1
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { observable, action, makeObservable } from 'mobx';
import ElectronStore from 'electron-store';
import { v4 as uuidv4 } from 'uuid';
import * as logger from '../utils/logger';

// API Response Types
export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  maxTokens: number;
}

export interface APIResponse {
  id: string;
  type: string;
  role: string;
  content: string;
  model: string;
  stopReason: string | null;
  stopSequence: string | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
  }
}

export interface APIParams {
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  top_k?: number;
  stop_sequences?: string[];
  system_prompt?: string;
  stream?: boolean;
}

// Default API Parameters
const DEFAULT_API_PARAMS: APIParams = {
  model: 'claude-3-opus-20240229',
  temperature: 0.7,
  max_tokens: 4096,
  top_p: 0.9,
  stream: false
};

export class ClaudeAPIClient {
  private axiosInstance: AxiosInstance;
  private store: ElectronStore;
  private baseURL = 'https://api.anthropic.com/v1';
  private apiVersion = '2023-06-01';
  
  // Observable states
  @observable isLoading: boolean = false;
  @observable lastResponse: APIResponse | null = null;
  @observable availableModels: ModelInfo[] = [];
  @observable error: string | null = null;

  constructor(debug_mode: boolean = false) {
    // Initialize Store for API Keys
    this.store = new ElectronStore({
      name: 'claude-api-credentials',
      encryptionKey: 'claude-api-gui-app'
    });

    // Initialize Axios Instance
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': this.apiVersion
      }
    });

    // Setup request interceptor to add API key
    this.axiosInstance.interceptors.request.use((config) => {
      const apiKey = this.getAPIKey();
      if (apiKey) {
        config.headers['x-api-key'] = apiKey;
      }
      if (debug_mode) {
        logger.debug('API Request:', JSON.stringify({
          url: config.url,
          method: config.method,
          params: config.params,
          headers: config.headers
        }, null, 2));
      }
      return config;
    });
    
    makeObservable(this);
  }

  /**
   * Validates and stores API key
   * @param apiKey API key to validate and store
   * @param profileName Optional name for the profile
   */
  @action
  public async validateAPIKey(apiKey: string, profileName: string = 'Default', debug_mode: boolean = false): Promise<boolean> {
    try {
      if (debug_mode) logger.debug(`Validating API key for profile: ${profileName}`);
      
      // Temporary set API key for validation request
      this.axiosInstance.defaults.headers['x-api-key'] = apiKey;
      
      // Check if key is valid by attempting to list models
      await this.getModels(debug_mode);
      
      // Store valid API key
      this.storeAPIKey(apiKey, profileName);
      
      if (debug_mode) logger.debug('API key validation successful');
      this.error = null;
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error during API key validation';
      if (debug_mode) logger.error('API key validation failed:', errorMsg);
      this.error = `API key validation failed: ${errorMsg}`;
      return false;
    }
  }

  /**
   * Stores API key securely
   * @param apiKey API key to store
   * @param profileName Name for the profile
   */
  private storeAPIKey(apiKey: string, profileName: string): void {
    const profiles = this.store.get('profiles', []) as any[];
    
    const keyLastDigits = apiKey.slice(-4);
    const profileId = uuidv4();
    
    const newProfile = {
      id: profileId,
      name: profileName,
      keyLastDigits,
      created: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };
    
    // Store the full key separately with the profile ID as reference
    this.store.set(`apiKeys.${profileId}`, apiKey);
    
    // Add profile to the list
    this.store.set('profiles', [...profiles, newProfile]);
    
    // Set as active profile
    this.store.set('activeProfileId', profileId);
  }

  /**
   * Retrieves the current API key
   */
  private getAPIKey(): string | null {
    const activeProfileId = this.store.get('activeProfileId') as string;
    if (!activeProfileId) return null;
    
    return this.store.get(`apiKeys.${activeProfileId}`) as string;
  }

  /**
   * Gets a list of available Claude models
   */
  @action
  public async getModels(debug_mode: boolean = false): Promise<ModelInfo[]> {
    try {
      this.isLoading = true;
      if (debug_mode) logger.debug('Fetching available models');
      
      const response = await this.axiosInstance.get('/models');
      
      this.availableModels = response.data.models.map((model: any) => ({
        id: model.id,
        name: model.name || model.id,
        description: model.description || '',
        contextWindow: model.context_window || 100000,
        maxTokens: model.max_tokens_to_sample || 4096
      }));
      
      if (debug_mode) logger.debug(`Retrieved ${this.availableModels.length} models`);
      return this.availableModels;
    } catch (error) {
      this.handleAPIError(error, 'Failed to fetch models', debug_mode);
      return [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Sends a prompt to the Claude API
   * @param prompt User message to send
   * @param params API parameters
   */
  @action
  public async sendPrompt(prompt: string, params: Partial<APIParams> = {}, debug_mode: boolean = false): Promise<APIResponse | null> {
    try {
      this.isLoading = true;
      if (debug_mode) logger.debug('Sending prompt to Claude API');
      
      // Merge with default parameters
      const apiParams: APIParams = { ...DEFAULT_API_PARAMS, ...params };
      
      // Create the request body
      const requestBody = {
        model: apiParams.model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: apiParams.temperature,
        max_tokens: apiParams.max_tokens,
        top_p: apiParams.top_p,
        top_k: apiParams.top_k,
        stop_sequences: apiParams.stop_sequences,
        system: apiParams.system_prompt
      };
      
      if (debug_mode) logger.debug('Request parameters:', JSON.stringify(requestBody, null, 2));
      
      // Send the request
      const response = await this.axiosInstance.post('/messages', requestBody);
      
      // Process the response
      this.lastResponse = {
        id: response.data.id,
        type: response.data.type,
        role: response.data.role,
        content: response.data.content[0].text,
        model: response.data.model,
        stopReason: response.data.stop_reason,
        stopSequence: response.data.stop_sequence,
        usage: {
          inputTokens: response.data.usage.input_tokens,
          outputTokens: response.data.usage.output_tokens
        }
      };
      
      if (debug_mode) {
        logger.debug('Response received');
        logger.debug(`Input tokens: ${this.lastResponse.usage.inputTokens}`);
        logger.debug(`Output tokens: ${this.lastResponse.usage.outputTokens}`);
      }
      
      this.error = null;
      return this.lastResponse;
    } catch (error) {
      this.handleAPIError(error, 'Failed to send prompt', debug_mode);
      return null;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Aborts an ongoing API request
   */
  @action
  public abortRequest(debug_mode: boolean = false): void {
    if (debug_mode) logger.debug('Aborting API request');
    // Implementation would use a cancellation token with axios
    this.isLoading = false;
  }

  /**
   * Handles API errors in a consistent way
   * @param error The error that occurred
   * @param context Additional context about the operation
   */
  private handleAPIError(error: any, context: string, debug_mode: boolean = false): void {
    let errorMessage = context;
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        errorMessage += `: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`;
      } else if (axiosError.request) {
        errorMessage += ': No response received from API';
      } else {
        errorMessage += `: ${axiosError.message}`;
      }
      
      // Rate limit detection
      if (axiosError.response?.status === 429) {
        errorMessage = 'Rate limit reached. Please try again later.';
      }
      // Authentication error
      else if (axiosError.response?.status === 401) {
        errorMessage = 'Authentication failed. Please check your API key.';
      }
    } else {
      errorMessage += `: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
    
    if (debug_mode) logger.error(errorMessage);
    this.error = errorMessage;
  }

  /**
   * Estimates the number of tokens in the prompt
   * @param text Text to estimate token count for
   */
  public estimateTokens(text: string, debug_mode: boolean = false): number {
    // A very rough estimation: 1 token ≈ 4 characters in English
    const tokenEstimate = Math.ceil(text.length / 4);
    
    if (debug_mode) logger.debug(`Estimated ${tokenEstimate} tokens for text of length ${text.length}`);
    
    return tokenEstimate;
  }
}
