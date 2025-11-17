/**
 * Centralized Error Handling Utility
 * Provides consistent error handling across the application
 */

import { ERROR_MESSAGES } from './constants';

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  timestamp: number;
  stack?: string;
  retryable: boolean;
  suggestions?: string[];
}

export interface ErrorReport {
  error: AppError;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId: string;
  additionalContext?: Record<string, any>;
}

// Error codes
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  API_ERROR: 'API_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  
  // Location errors
  LOCATION_NOT_FOUND: 'LOCATION_NOT_FOUND',
  INVALID_LOCATION: 'INVALID_LOCATION',
  GEOCODING_ERROR: 'GEOCODING_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  POSITION_UNAVAILABLE: 'POSITION_UNAVAILABLE',
  
  // Data errors
  INVALID_DATA: 'INVALID_DATA',
  PARSING_ERROR: 'PARSING_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // Storage errors
  STORAGE_ERROR: 'STORAGE_ERROR',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  
  // Component errors
  COMPONENT_ERROR: 'COMPONENT_ERROR',
  RENDER_ERROR: 'RENDER_ERROR',
  
  // Generic errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
} as const;

/**
 * Create a standardized error object
 */
export const createError = (
  code: string,
  message: string,
  userMessage: string,
  severity: AppError['severity'] = 'medium',
  context?: Record<string, any>,
  retryable: boolean = true,
  suggestions?: string[]
): AppError => {
  return {
    code,
    message,
    userMessage,
    severity,
    context,
    timestamp: Date.now(),
    stack: new Error().stack,
    retryable,
    suggestions
  };
};

/**
 * Handle network errors
 */
export const handleNetworkError = (error: any, context?: Record<string, any>): AppError => {
  console.error('Network error:', error, context);
  
  if (error.name === 'AbortError') {
    return createError(
      ERROR_CODES.TIMEOUT_ERROR,
      'Request timeout',
      ERROR_MESSAGES.TIMEOUT_ERROR,
      'medium',
      context,
      true,
      ['Check your internet connection', 'Try again in a few moments']
    );
  }
  
  if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
    return createError(
      ERROR_CODES.NETWORK_ERROR,
      'Network connection failed',
      ERROR_MESSAGES.NETWORK_ERROR,
      'high',
      context,
      true,
      ['Check your internet connection', 'Try again later', 'Contact support if the problem persists']
    );
  }
  
  return createError(
    ERROR_CODES.API_ERROR,
    error.message || 'API request failed',
    'Unable to fetch data. Please try again.',
    'medium',
    context,
    true
  );
};

/**
 * Handle location errors
 */
export const handleLocationError = (error: any, context?: Record<string, any>): AppError => {
  console.error('Location error:', error, context);
  
  if (error.code === 1) { // PERMISSION_DENIED
    return createError(
      ERROR_CODES.PERMISSION_DENIED,
      'Geolocation permission denied',
      ERROR_MESSAGES.PERMISSION_DENIED,
      'medium',
      context,
      false,
      ['Enable location permissions in your browser', 'Use the search form instead']
    );
  }
  
  if (error.code === 2) { // POSITION_UNAVAILABLE
    return createError(
      ERROR_CODES.POSITION_UNAVAILABLE,
      'Position unavailable',
      ERROR_MESSAGES.POSITION_UNAVAILABLE,
      'medium',
      context,
      true,
      ['Try again in a few moments', 'Use the search form instead']
    );
  }
  
  if (error.code === 3) { // TIMEOUT
    return createError(
      ERROR_CODES.TIMEOUT_ERROR,
      'Geolocation timeout',
      'Location request timed out. Please try again.',
      'medium',
      context,
      true,
      ['Try again', 'Use the search form instead']
    );
  }
  
  return createError(
    ERROR_CODES.UNKNOWN_ERROR,
    error.message || 'Unknown location error',
    'Unable to get your location. Please try again.',
    'medium',
    context,
    true
  );
};

/**
 * Handle API response errors
 */
export const handleApiResponseError = (response: Response, context?: Record<string, any>): AppError => {
  console.error('API response error:', response.status, response.statusText, context);
  
  const statusCode = response.status;
  
  switch (statusCode) {
    case 400:
      return createError(
        ERROR_CODES.INVALID_DATA,
        `Bad request: ${response.statusText}`,
        ERROR_MESSAGES.INVALID_LOCATION,
        'medium',
        { ...context, statusCode },
        false,
        ['Check your input format', 'Try a different location']
      );
      
    case 401:
      return createError(
        ERROR_CODES.API_ERROR,
        'Unauthorized request',
        'Authentication error. Please try again.',
        'high',
        { ...context, statusCode },
        false,
        ['Contact support if the problem persists']
      );
      
    case 403:
      return createError(
        ERROR_CODES.API_ERROR,
        'Forbidden request',
        ERROR_MESSAGES.SERVICE_UNAVAILABLE,
        'high',
        { ...context, statusCode },
        true,
        ['Try again later', 'Contact support if the problem persists']
      );
      
    case 404:
      return createError(
        ERROR_CODES.LOCATION_NOT_FOUND,
        'Resource not found',
        ERROR_MESSAGES.LOCATION_NOT_FOUND,
        'medium',
        { ...context, statusCode },
        false,
        ['Check the spelling', 'Try a different location', 'Use a major city or ZIP code']
      );
      
    case 429:
      return createError(
        ERROR_CODES.RATE_LIMIT_ERROR,
        'Rate limit exceeded',
        'Too many requests. Please wait a moment and try again.',
        'medium',
        { ...context, statusCode },
        true,
        ['Wait a few minutes before trying again']
      );
      
    case 500:
    case 502:
    case 503:
    case 504:
      return createError(
        ERROR_CODES.API_ERROR,
        `Server error: ${statusCode}`,
        ERROR_MESSAGES.SERVICE_UNAVAILABLE,
        'high',
        { ...context, statusCode },
        true,
        ['Try again in a few minutes', 'Check service status']
      );
      
    default:
      return createError(
        ERROR_CODES.API_ERROR,
        `HTTP error: ${statusCode}`,
        `Service error (${statusCode}). Please try again.`,
        'medium',
        { ...context, statusCode },
        true,
        ['Try again', 'Contact support if the problem persists']
      );
  }
};

/**
 * Handle storage errors
 */
export const handleStorageError = (error: any, context?: Record<string, any>): AppError => {
  console.error('Storage error:', error, context);
  
  if (error.name === 'QuotaExceededError') {
    return createError(
      ERROR_CODES.QUOTA_EXCEEDED,
      'Storage quota exceeded',
      'Storage is full. Please clear some data and try again.',
      'medium',
      context,
      false,
      ['Clear browser data', 'Remove old favorites', 'Clear cache']
    );
  }
  
  return createError(
    ERROR_CODES.STORAGE_ERROR,
    error.message || 'Storage operation failed',
    'Unable to save data. Please try again.',
    'low',
    context,
    true
  );
};

/**
 * Handle validation errors
 */
export const handleValidationError = (field: string, value: any, rule: string, context?: Record<string, any>): AppError => {
  console.error('Validation error:', field, value, rule, context);
  
  return createError(
    ERROR_CODES.VALIDATION_ERROR,
    `Validation failed for ${field}: ${rule}`,
    `Invalid ${field}. Please check your input and try again.`,
    'low',
    { ...context, field, value, rule },
    false,
    ['Check your input format', 'Follow the suggested format']
  );
};

/**
 * Handle component errors
 */
export const handleComponentError = (componentName: string, error: any, context?: Record<string, any>): AppError => {
  console.error('Component error:', componentName, error, context);
  
  return createError(
    ERROR_CODES.COMPONENT_ERROR,
    `Component error in ${componentName}: ${error.message}`,
    'A component failed to load. Please refresh the page.',
    'high',
    { ...context, componentName, originalError: error.message },
    true,
    ['Refresh the page', 'Try again later', 'Contact support if the problem persists']
  );
};

/**
 * Log error for monitoring/debugging
 */
export const logError = (error: AppError, additionalContext?: Record<string, any>): void => {
  const errorReport: ErrorReport = {
    error,
    userAgent: navigator.userAgent,
    url: window.location.href,
    sessionId: getSessionId(),
    additionalContext
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 Error: ${error.code}`);
    console.error('Message:', error.message);
    console.error('User Message:', error.userMessage);
    console.error('Severity:', error.severity);
    console.error('Context:', error.context);
    console.error('Stack:', error.stack);
    console.error('Full Report:', errorReport);
    console.groupEnd();
  }
  
  // In production, you would send this to your error monitoring service
  // Example: Sentry, LogRocket, Bugsnag, etc.
  if (process.env.NODE_ENV === 'production') {
    // sendToErrorMonitoring(errorReport);
  }
  
  // Store in local storage for debugging (limit to last 50 errors)
  try {
    const storedErrors = JSON.parse(localStorage.getItem('error_log') || '[]');
    storedErrors.unshift(errorReport);
    if (storedErrors.length > 50) {
      storedErrors.splice(50);
    }
    localStorage.setItem('error_log', JSON.stringify(storedErrors));
  } catch (storageError) {
    console.warn('Failed to store error log:', storageError);
  }
};

/**
 * Get or create session ID
 */
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

/**
 * Get stored error logs
 */
export const getErrorLogs = (): ErrorReport[] => {
  try {
    return JSON.parse(localStorage.getItem('error_log') || '[]');
  } catch (error) {
    console.warn('Failed to get error logs:', error);
    return [];
  }
};

/**
 * Clear error logs
 */
export const clearErrorLogs = (): void => {
  try {
    localStorage.removeItem('error_log');
    console.log('Error logs cleared');
  } catch (error) {
    console.warn('Failed to clear error logs:', error);
  }
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  backoffMultiplier: number = 2
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
      console.log(`Retry attempt ${attempt} failed, retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Create error boundary handler
 */
export const createErrorBoundaryHandler = (componentName: string) => {
  return (error: Error, errorInfo: any) => {
    const appError = handleComponentError(componentName, error, errorInfo);
    logError(appError);
  };
};

/**
 * Wrap async function with error handling
 */
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorHandler?: (error: AppError) => void
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      let appError: AppError;
      
      // Check if error is already an AppError
      if (error && typeof error === 'object' && 'code' in error && 'userMessage' in error && 'message' in error) {
        appError = error as AppError;
      } else 
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          appError = handleNetworkError(error);
        } else if (error.message.includes('fetch')) {
          appError = handleNetworkError(error);
        } else {
          appError = createError(
            ERROR_CODES.UNKNOWN_ERROR,
            error.message,
            ERROR_MESSAGES.GENERIC_ERROR,
            'medium',
            { originalError: error.message }
          );
        }
      } else {
        appError = createError(
          ERROR_CODES.UNKNOWN_ERROR,
          'Unknown error occurred',
          ERROR_MESSAGES.GENERIC_ERROR,
          'medium',
          { originalError: error }
        );
      }
      
      logError(appError);
      
      if (errorHandler) {
        errorHandler(appError);
      }
      
      return null;
    }
  };
};