// File: src/models/TokenUsageModel.ts
// Module: Model
// Purpose: Tracks API token usage and costs
// Usage: Accessed through RootStore.usageStore
// Contains: Methods for recording usage, calculating costs
// Dependencies: MobX, RootStore
// Iteration: 1

import { makeAutoObservable, runInAction } from 'mobx';
import { RootStore } from './RootStore';

// Type definitions
export interface UsageRecord {
  date: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  cost: number;
}

export interface UsageSummary {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCost: number;
  usageByModel: Record<string, {
    promptTokens: number;
    completionTokens: number;
    cost: number;
  }>;
  dailyUsage: Record<string, {
    date: string;
    tokens: number;
    cost: number;
  }>;
}

export interface CostEstimate {
  monthlyProjection: number;
  currentMonth: number;
  previousMonth: number;
}

/**
 * Model for tracking token usage and costs
 */
export class TokenUsageModel {
  // Observable properties
  usageHistory: UsageRecord[] = [];
  currentMonthUsage: UsageSummary = {
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalCost: 0,
    usageByModel: {},
    dailyUsage: {},
  };
  costEstimate: CostEstimate = {
    monthlyProjection: 0,
    currentMonth: 0,
    previousMonth: 0,
  };
  isLoading: boolean = false;
  error: string | null = null;
  
  // Model pricing rates (per 1M tokens)
  private modelRates: Record<string, { prompt: number; completion: number }> = {
    'claude-3-opus-20240229': { prompt: 15, completion: 75 },
    'claude-3-sonnet-20240229': { prompt: 3, completion: 15 },
    'claude-3-haiku-20240307': { prompt: 0.25, completion: 1.25 },
    'claude-2.1': { prompt: 8, completion: 24 },
    'claude-2.0': { prompt: 8, completion: 24 },
    'claude-instant-1.2': { prompt: 1.63, completion: 5.51 },
  };
  
  // Reference to root store for cross-store interactions
  private rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  /**
   * Initialize the token usage model
   * Loads usage history from storage
   */
  async initialize(debug_mode = false) {
    if (debug_mode) {
      console.log('Initializing TokenUsageModel...');
    }
    
    this.isLoading = true;
    
    try {
      // Get usage stats from storage
      const savedStats = await window.electronAPI.getUsageStats();
      
      if (savedStats) {
        runInAction(() => {
          if (savedStats.usageHistory) {
            this.usageHistory = savedStats.usageHistory;
          }
          
          if (savedStats.currentMonthUsage) {
            this.currentMonthUsage = savedStats.currentMonthUsage;
          }
          
          if (savedStats.costEstimate) {
            this.costEstimate = savedStats.costEstimate;
          }
        });
        
        // Calculate cost projections
        this.updateCostEstimates();
        
        if (debug_mode) {
          console.log('Usage stats loaded:', {
            historyLength: this.usageHistory.length,
            totalCost: this.currentMonthUsage.totalCost,
          });
        }
      } else if (debug_mode) {
        console.log('No saved usage stats found');
      }
    } catch (error) {
      console.error('Failed to load usage stats:', error);
      
      if (debug_mode) {
        console.error('Usage stats loading error details:', error);
      }
      
      runInAction(() => {
        this.error = 'Failed to load usage statistics';
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  /**
   * Reset the token usage model state
   */
  reset() {
    this.usageHistory = [];
    this.currentMonthUsage = {
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalCost: 0,
      usageByModel: {},
      dailyUsage: {},
    };
    this.costEstimate = {
      monthlyProjection: 0,
      currentMonth: 0,
      previousMonth: 0,
    };
    this.error = null;
  }

  /**
   * Record token usage for an API request
   */
  recordUsage(promptTokens: number, completionTokens: number, model: string, debug_mode = false) {
    if (debug_mode) {
      console.log('Recording token usage:', { promptTokens, completionTokens, model });
    }
    
    // Calculate cost based on model rates
    const rates = this.modelRates[model] || this.modelRates['claude-3-opus-20240229'];
    const promptCost = (promptTokens / 1000000) * rates.prompt;
    const completionCost = (completionTokens / 1000000) * rates.completion;
    const totalCost = promptCost + completionCost;
    
    // Get today's date as YYYY-MM-DD string
    const today = new Date().toISOString().split('T')[0];
    
    // Create a new usage record
    const usageRecord: UsageRecord = {
      date: today,
      model,
      promptTokens,
      completionTokens,
      cost: totalCost,
    };
    
    runInAction(() => {
      // Add to usage history
      this.usageHistory.push(usageRecord);
      
      // Update current month usage
      this.currentMonthUsage.totalPromptTokens += promptTokens;
      this.currentMonthUsage.totalCompletionTokens += completionTokens;
      this.currentMonthUsage.totalCost += totalCost;
      
      // Update usage by model
      if (!this.currentMonthUsage.usageByModel[model]) {
        this.currentMonthUsage.usageByModel[model] = {
          promptTokens: 0,
          completionTokens: 0,
          cost: 0,
        };
      }
      
      this.currentMonthUsage.usageByModel[model].promptTokens += promptTokens;
      this.currentMonthUsage.usageByModel[model].completionTokens += completionTokens;
      this.currentMonthUsage.usageByModel[model].cost += totalCost;
      
      // Update daily usage
      if (!this.currentMonthUsage.dailyUsage[today]) {
        this.currentMonthUsage.dailyUsage[today] = {
          date: today,
          tokens: 0,
          cost: 0,
        };
      }
      
      this.currentMonthUsage.dailyUsage[today].tokens += (promptTokens + completionTokens);
      this.currentMonthUsage.dailyUsage[today].cost += totalCost;
    });
    
    // Update cost estimates
    this.updateCostEstimates();
    
    // Save usage stats to storage
    this.saveUsageStats();
    
    if (debug_mode) {
      console.log('Updated usage totals:', {
        totalPromptTokens: this.currentMonthUsage.totalPromptTokens,
        totalCompletionTokens: this.currentMonthUsage.totalCompletionTokens,
        totalCost: this.currentMonthUsage.totalCost,
      });
    }
  }

  /**
   * Update cost estimates based on current usage
   */
  private updateCostEstimates() {
    // Get the current date
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Get the first and last day of the current month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // Calculate days in the month and days passed
    const daysInMonth = lastDay.getDate();
    const daysPassed = Math.min(now.getDate(), daysInMonth);
    
    // Calculate current month cost
    const currentMonthCost = this.currentMonthUsage.totalCost;
    
    // Calculate monthly projection based on current usage rate
    const monthlyProjection = daysPassed > 0
      ? (currentMonthCost / daysPassed) * daysInMonth
      : 0;
    
    // Calculate previous month cost
    const previousMonthCost = this.calculatePreviousMonthCost();
    
    runInAction(() => {
      this.costEstimate = {
        monthlyProjection,
        currentMonth: currentMonthCost,
        previousMonth: previousMonthCost,
      };
    });
  }

  /**
   * Calculate the total cost for the previous month
   */
  private calculatePreviousMonthCost(): number {
    // Get the previous month's date range
    const now = new Date();
    const previousMonth = now.getMonth() - 1;
    const year = previousMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
    const month = previousMonth < 0 ? 11 : previousMonth;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Format dates as YYYY-MM-DD strings
    const startDateStr = firstDay.toISOString().split('T')[0];
    const endDateStr = lastDay.toISOString().split('T')[0];
    
    // Sum costs for the previous month
    return this.usageHistory
      .filter(record => record.date >= startDateStr && record.date <= endDateStr)
      .reduce((total, record) => total + record.cost, 0);
  }

  /**
   * Save usage stats to storage
   */
  private async saveUsageStats() {
    try {
      await window.electronAPI.recordUsage({
        usageHistory: this.usageHistory,
        currentMonthUsage: this.currentMonthUsage,
        costEstimate: this.costEstimate,
      });
    } catch (error) {
      console.error('Failed to save usage stats:', error);
      runInAction(() => {
        this.error = 'Failed to save usage statistics';
      });
    }
  }

  /**
   * Get a usage summary for the specified time period
   */
  getUsageSummary(
    startDate?: Date,
    endDate?: Date,
    model?: string,
    debug_mode = false
  ): UsageSummary {
    if (debug_mode) {
      console.log('Getting usage summary:', { startDate, endDate, model });
    }
    
    // Default to all-time if no dates provided
    const start = startDate ? startDate.toISOString().split('T')[0] : '1970-01-01';
    const end = endDate ? endDate.toISOString().split('T')[0] : '9999-12-31';
    
    // Filter records by date range and model
    const filteredRecords = this.usageHistory.filter(record => {
      const dateMatch = record.date >= start && record.date <= end;
      const modelMatch = !model || record.model === model;
      return dateMatch && modelMatch;
    });
    
    // Calculate totals
    const summary: UsageSummary = {
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalCost: 0,
      usageByModel: {},
      dailyUsage: {},
    };
    
    filteredRecords.forEach(record => {
      // Update totals
      summary.totalPromptTokens += record.promptTokens;
      summary.totalCompletionTokens += record.completionTokens;
      summary.totalCost += record.cost;
      
      // Update usage by model
      if (!summary.usageByModel[record.model]) {
        summary.usageByModel[record.model] = {
          promptTokens: 0,
          completionTokens: 0,
          cost: 0,
        };
      }
      
      summary.usageByModel[record.model].promptTokens += record.promptTokens;
      summary.usageByModel[record.model].completionTokens += record.completionTokens;
      summary.usageByModel[record.model].cost += record.cost;
      
      // Update daily usage
      if (!summary.dailyUsage[record.date]) {
        summary.dailyUsage[record.date] = {
          date: record.date,
          tokens: 0,
          cost: 0,
        };
      }
      
      summary.dailyUsage[record.date].tokens += (record.promptTokens + record.completionTokens);
      summary.dailyUsage[record.date].cost += record.cost;
    });
    
    return summary;
  }
}