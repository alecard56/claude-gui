// File: src/models/APIModel.ts
// Module: Model
// Purpose: Handles Claude API communication
// Usage: Accessed through RootStore.apiStore
// Contains: Methods for sending prompts and handling responses
// Dependencies: MobX, axios, RootStore
// Iteration: 1

import { makeAutoObservable, runInAction } from 'mobx';
import axios from 'axios';
import { RootStore } from './RootStore';

// Type definitions
export interface APIParams {
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  top_k?: number;
  stop_sequences?: string[];
  system?: string;
  stream?: boolean;
}

export interface ModelInfo {
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
  };
}

/**
 * Model for handling Claude API communication
 */
export class APIModel {
  // Observable properties
  isLoading: boolean = false;
  lastResponse: APIResponse | null = null;
  availableModels: ModelInfo[] = [];
  currentParams: APIParams = {
    model: 'claude-3-opus-20240229',
    temperature: 0.7,
    max_tokens: 4096,
    top_p: 0.9,
  };
  abortController: AbortController | null = null;
  error: string | null = null;
  
  // Reference to root store for cross-store interactions
  private rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  /**
   * Initialize the API model
   */
  async initialize(debug_mode = false) {
    if (debug_mode) {
      console.log('Initializing APIModel...');
    }
    
    // Set default models
    runInAction(() => {
      this.availableModels = [
        {
          name: 'claude-3-opus-20240229',
          description: 'Most powerful model for complex tasks',
          contextWindow: 200000,
          maxTokens: 4096,
        },
        {
          name: 'claude-3-sonnet-20240229',
          description: 'Balance of intelligence and speed',
          contextWindow: 200000,
          maxTokens: 4096,
        },
        {
          name: 'claude-3-haiku-20240307',
          description: 'Fastest, most compact model',
          contextWindow: 200000,
          maxTokens: 4096,
        },
      ];
    });
    
    if (debug_mode) {
      console.log('APIModel initialized with default models');
    }
  }

  /**
   * Reset the API model state
   */
  reset() {
    this.isLoading = false;
    this.lastResponse = null;
    this.abortController = null;
    this.error = null;
  }

  /**
   * Send a prompt to the Claude API
   */
  async sendPrompt(prompt: string, params?: Partial<APIParams>, debug_mode = false): Promise<APIResponse | null> {
    if (debug_mode) {
      console.log('Sending prompt to Claude API:', { prompt, params });
    }
    
    // Update loading state
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });
    
    // Create a new abort controller for this request
    this.abortController = new AbortController();
    
    try {
      // Merge provided params with defaults
      const requestParams = {
        ...this.currentParams,
        ...params,
      };
      
      // Get the API key from the auth store
      const apiKey = await window.electronAPI.getApiKey(this.rootStore.authStore.activeProfileId);
      
      if (!apiKey) {
        throw new Error('No API key available');
      }
      
      // Build the request payload
      const payload = {
        model: requestParams.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: requestParams.temperature,
        max_tokens: requestParams.max_tokens,
        top_p: requestParams.top_p,
        top_k: requestParams.top_k,
        stop_sequences: requestParams.stop_sequences,
        system: requestParams.system,
        stream: requestParams.stream,
      };
      
      if (debug_mode) {
        console.log('API request payload:', payload);
      }
      
      // Make the API request
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        payload,
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          signal: this.abortController.signal,
        }
      );
      
      if (debug_mode) {
        console.log('API response:', response.data);
      }
      
      // Record token usage
      if (response.data.usage) {
        this.rootStore.usageStore.recordUsage(
          response.data.usage.input_tokens,
          response.data.usage.output_tokens,
          requestParams.model
        );
      }
      
      // Format the response
      const formattedResponse: APIResponse = {
        id: response.data.id,
        type: response.data.type,
        role: response.data.content[0].type,
        content: response.data.content[0].text,
        model: response.data.model,
        stopReason: response.data.stop_reason,
        stopSequence: response.data.stop_sequence,
        usage: {
          inputTokens: response.data.usage.input_tokens,
          outputTokens: response.data.usage.output_tokens,
        },
      };
      
      runInAction(() => {
        this.lastResponse = formattedResponse;
        this.isLoading = false;
      });
      
      return formattedResponse;
    } catch (error) {
      if (axios.isCancel(error)) {
        if (debug_mode) {
          console.log('Request was cancelled');
        }
      } else {
        console.error('API request error:', error);
        
        if (debug_mode) {
          console.error('API error details:', error);
        }
        
        runInAction(() => {
          this.error = error instanceof Error ? error.message : 'Unknown error';
        });
      }
      
      runInAction(() => {
        this.isLoading = false;
      });
      
      return null;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Abort the current API request
   */
  abortRequest() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  /**
   * Update the API parameters
   */
  updateParams(params: Partial<APIParams>) {
    runInAction(() => {
      this.currentParams = {
        ...this.currentParams,
        ...params,
      };
    });
  }
}