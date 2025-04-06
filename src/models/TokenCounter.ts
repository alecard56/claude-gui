/**
 * File: src/models/TokenCounter.ts
 * Module: Model
 * Purpose: Tracks token usage and cost estimation
 * Usage: Imported by controllers to track API usage
 * Contains: TokenCounter class, usage tracking interfaces
 * Dependencies: mobx, electron-store
 * Iteration: 1
 */

import { observable, action, computed, makeObservable } from 'mobx';
import ElectronStore from 'electron-store';
import * as logger from '../utils/logger';

// Token Usage Types
export interface UsageRecord {
  timestamp: Date;
  model: string;
  promptTokens: number;
  completionTokens: number;
  cost: number;
}

export interface UsageSummary {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalCost: number;
  usageByModel: Record<string, {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  }>;
  dailyUsage: Record<string, {
    date: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  }>;
}

export interface CostEstimate {
  current: number;
  projected: number;
  timeframe: 'day' | 'week' | 'month';
}

// Token pricing per 1M tokens (in USD)
interface ModelPricing {
  promptPrice: number;   // Per 1M tokens
  completionPrice: number; // Per 1M tokens
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  'claude-3-opus-20240229': {
    promptPrice: 15,
    completionPrice: 75
  },
  'claude-3-sonnet-20240229': {
    promptPrice: 3,
    completionPrice: 15
  },
  'claude-3-haiku-20240307': {
    promptPrice: 0.25,
    completionPrice: 1.25
  },
  'claude-2.1': {
    promptPrice: 8,
    completionPrice: 24
  },
  'claude-2.0': {
    promptPrice: 8,
    completionPrice: 24
  },
  'claude-instant-1.2': {
    promptPrice: 1.63,
    completionPrice: 5.51
  }
};

// Default pricing for unknown models
const DEFAULT_PRICING: ModelPricing = {
  promptPrice: 10,
  completionPrice: 30
};

export class TokenCounter {
  private store: ElectronStore;
  
  // Observable state
  @observable usageHistory: UsageRecord[] = [];
  @observable error: string | null = null;
  @observable isLoading: boolean = false;

  constructor(debug_mode: boolean = false) {
    this.store = new ElectronStore({
      name: 'claude-api-usage',
      defaults: {
        usageHistory: []
      }
    });
    
    makeObservable(this);
    this.loadFromStore(debug_mode);
  }

  /**
   * Loads usage data from persistent storage
   */
  @action
  private loadFromStore(debug_mode: boolean = false): void {
    try {
      if (debug_mode) logger.debug('Loading token usage history from store');
      
      const storedHistory = this.store.get('usageHistory') as any[];
      
      if (storedHistory && Array.isArray(storedHistory)) {
        // Convert ISO date strings to Date objects
        this.usageHistory = storedHistory.map(record => ({
          ...record,
          timestamp: new Date(record.timestamp)
        }));
        
        if (debug_mode) logger.debug(`Loaded ${this.usageHistory.length} usage records`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error loading usage history';
      if (debug_mode) logger.error('Failed to load usage history:', errorMsg);
      this.error = `Failed to load usage history: ${errorMsg}`;
    }
  }

  /**
   * Saves current state to persistent storage
   */
  private saveToStore(debug_mode: boolean = false): void {
    try {
      if (debug_mode) logger.debug('Saving token usage history to store');
      
      this.store.set('usageHistory', this.usageHistory);
      
      if (debug_mode) logger.debug('Usage history saved successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error saving usage history';
      if (debug_mode) logger.error('Failed to save usage history:', errorMsg);
      this.error = `Failed to save usage history: ${errorMsg}`;
    }
  }

  /**
   * Records token usage from an API call
   * @param promptTokens Number of prompt tokens
   * @param completionTokens Number of completion tokens
   * @param model Model identifier
   */
  @action
  public recordUsage(promptTokens: number, completionTokens: number, model: string, debug_mode: boolean = false): void {
    try {
      if (debug_mode) {
        logger.debug(`Recording usage: ${promptTokens} prompt tokens, ${completionTokens} completion tokens for model ${model}`);
      }
      
      // Calculate cost
      const cost = this.calculateCost(promptTokens, completionTokens, model);
      
      // Create usage record
      const usageRecord: UsageRecord = {
        timestamp: new Date(),
        model,
        promptTokens,
        completionTokens,
        cost
      };
      
      // Add to history
      this.usageHistory.push(usageRecord);
      this.saveToStore(debug_mode);
      
      if (debug_mode) {
        logger.debug(`Recorded usage with cost: $${cost.toFixed(4)}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error recording usage';
      if (debug_mode) logger.error('Failed to record usage:', errorMsg);
      this.error = `Failed to record usage: ${errorMsg}`;
    }
  }

  /**
   * Calculates cost based on token counts and model
   * @param promptTokens Number of prompt tokens
   * @param completionTokens Number of completion tokens
   * @param model Model identifier
   */
  private calculateCost(promptTokens: number, completionTokens: number, model: string): number {
    // Get pricing for the model, or use default if not found
    const pricing = MODEL_PRICING[model] || DEFAULT_PRICING;
    
    // Calculate cost in USD (prices are per 1M tokens)
    const promptCost = (promptTokens / 1000000) * pricing.promptPrice;
    const completionCost = (completionTokens / 1000000) * pricing.completionPrice;
    
    return promptCost + completionCost;
  }

  /**
   * Gets usage summary statistics
   */
  @computed
  public get usageSummary(): UsageSummary {
    // Initialize summary structure
    const summary: UsageSummary = {
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      usageByModel: {},
      dailyUsage: {}
    };
    
    // Process each usage record
    this.usageHistory.forEach(record => {
      // Update totals
      summary.totalPromptTokens += record.promptTokens;
      summary.totalCompletionTokens += record.completionTokens;
      summary.totalTokens += record.promptTokens + record.completionTokens;
      summary.totalCost += record.cost;
      
      // Update model-specific usage
      if (!summary.usageByModel[record.model]) {
        summary.usageByModel[record.model] = {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          cost: 0
        };
      }
      
      summary.usageByModel[record.model].promptTokens += record.promptTokens;
      summary.usageByModel[record.model].completionTokens += record.completionTokens;
      summary.usageByModel[record.model].totalTokens += record.promptTokens + record.completionTokens;
      summary.usageByModel[record.model].cost += record.cost;
      
      // Update daily usage
      const dateKey = record.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!summary.dailyUsage[dateKey]) {
        summary.dailyUsage[dateKey] = {
          date: dateKey,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          cost: 0
        };
      }
      
      summary.dailyUsage[dateKey].promptTokens += record.promptTokens;
      summary.dailyUsage[dateKey].completionTokens += record.completionTokens;
      summary.dailyUsage[dateKey].totalTokens += record.promptTokens + record.completionTokens;
      summary.dailyUsage[dateKey].cost += record.cost;
    });
    
    return summary;
  }

  /**
   * Gets cost estimate for current usage patterns
   */
  @computed
  public get costEstimate(): CostEstimate {
    // Default to monthly projection
    const timeframe: 'day' | 'week' | 'month' = 'month';
    
    // Get current date
    const now = new Date();
    const currentDateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Get usage for today
    const currentDayUsage = this.usageSummary.dailyUsage[currentDateKey]?.cost || 0;
    
    // Calculate average daily cost over the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });
    
    let total7DayCost = 0;
    let dayCount = 0;
    
    last7Days.forEach(dateKey => {
      if (this.usageSummary.dailyUsage[dateKey]) {
        total7DayCost += this.usageSummary.dailyUsage[dateKey].cost;
        dayCount++;
      }
    });
    
    // Calculate average daily cost
    const avgDailyCost = dayCount > 0 ? total7DayCost / dayCount : 0;
    
    // Project monthly cost
    const projectedMonthlyCost = avgDailyCost * 30; // Approximation for month
    
    return {
      current: currentDayUsage,
      projected: projectedMonthlyCost,
      timeframe
    };
  }

  /**
   * Resets usage statistics
   */
  @action
  public resetStats(debug_mode: boolean = false): void {
    try {
      if (debug_mode) logger.debug('Resetting token usage statistics');
      
      this.usageHistory = [];
      this.saveToStore(debug_mode);
      
      if (debug_mode) logger.debug('Usage statistics reset successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error resetting stats';
      if (debug_mode) logger.error('Failed to reset stats:', errorMsg);
      this.error = `Failed to reset stats: ${errorMsg}`;
    }
  }

  /**
   * Gets usage records within a specific date range
   * @param startDate Start date
   * @param endDate End date
   */
  public getUsageForDateRange(startDate: Date, endDate: Date, debug_mode: boolean = false): UsageRecord[] {
    if (debug_mode) {
      logger.debug(`Getting usage for date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    }
    
    const filteredRecords = this.usageHistory.filter(record => {
      return record.timestamp >= startDate && record.timestamp <= endDate;
    });
    
    if (debug_mode) {
      logger.debug(`Found ${filteredRecords.length} records in date range`);
    }
    
    return filteredRecords;
  }

  /**
   * Calculates estimated token count for a given text
   * @param text Text to estimate token count for
   */
  public estimateTokenCount(text: string, debug_mode: boolean = false): number {
    // A very rough estimation: 1 token ≈ 4 characters in English
    const tokenEstimate = Math.ceil(text.length / 4);
    
    if (debug_mode) {
      logger.debug(`Estimated ${tokenEstimate} tokens for text of length ${text.length}`);
    }
    
    return tokenEstimate;
  }

  /**
   * Gets pricing information for a specific model
   * @param model Model identifier
   */
  public getModelPricing(model: string): ModelPricing {
    return MODEL_PRICING[model] || DEFAULT_PRICING;
  }
}
