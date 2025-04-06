/**
 * File: src/utils/logger.ts
 * Module: Utility
 * Purpose: Provides logging functionality throughout the application
 * Usage: Imported by components that need logging capability
 * Contains: Logging functions for different levels
 * Dependencies: none
 * Iteration: 1
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Current log level
let currentLevel: LogLevel = 'info';

// Log level priorities (higher number = more important)
const LOG_LEVELS: Record<LogLevel, number> = {
  'debug': 0,
  'info': 1,
  'warn': 2,
  'error': 3
};

/**
 * Set the current log level
 * @param level Log level to set
 */
export function setLevel(level: LogLevel): void {
  currentLevel = level;
}

/**
 * Get the current log level
 */
export function getLevel(): LogLevel {
  return currentLevel;
}

/**
 * Check if a log level should be displayed
 * @param level Log level to check
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

/**
 * Format a log message with timestamp
 * @param level Log level
 * @param message Main message
 * @param args Additional arguments
 */
function formatLogMessage(level: LogLevel, message: string, ...args: any[]): string {
  const timestamp = new Date().toISOString();
  let formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  if (args.length > 0) {
    formattedMessage += ' ' + args
      .map(arg => {
        if (typeof arg === 'object') {
          return JSON.stringify(arg);
        }
        return String(arg);
      })
      .join(' ');
  }
  
  return formattedMessage;
}

/**
 * Log a debug message
 * @param message Main message
 * @param args Additional arguments
 */
export function debug(message: string, ...args: any[]): void {
  if (shouldLog('debug')) {
    const formattedMessage = formatLogMessage('debug', message, ...args);
    console.debug(formattedMessage);
  }
}

/**
 * Log an info message
 * @param message Main message
 * @param args Additional arguments
 */
export function info(message: string, ...args: any[]): void {
  if (shouldLog('info')) {
    const formattedMessage = formatLogMessage('info', message, ...args);
    console.info(formattedMessage);
  }
}

/**
 * Log a warning message
 * @param message Main message
 * @param args Additional arguments
 */
export function warn(message: string, ...args: any[]): void {
  if (shouldLog('warn')) {
    const formattedMessage = formatLogMessage('warn', message, ...args);
    console.warn(formattedMessage);
  }
}

/**
 * Log an error message
 * @param message Main message
 * @param args Additional arguments
 */
export function error(message: string, ...args: any[]): void {
  if (shouldLog('error')) {
    const formattedMessage = formatLogMessage('error', message, ...args);
    console.error(formattedMessage);
  }
}

/**
 * Create a logger scoped to a specific component
 * @param component Component name
 */
export function createLogger(component: string) {
  return {
    debug: (message: string, ...args: any[]) => debug(`[${component}] ${message}`, ...args),
    info: (message: string, ...args: any[]) => info(`[${component}] ${message}`, ...args),
    warn: (message: string, ...args: any[]) => warn(`[${component}] ${message}`, ...args),
    error: (message: string, ...args: any[]) => error(`[${component}] ${message}`, ...args)
  };
}

/**
 * Default logger
 */
export default {
  setLevel,
  getLevel,
  debug,
  info,
  warn,
  error,
  createLogger
};
