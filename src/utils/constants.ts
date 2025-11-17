/**
 * Application Constants and Configuration
 * Centralized configuration values to avoid magic numbers and strings
 */

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 15000, // 15 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  CACHE_DURATION: 30 * 60 * 1000, // 30 minutes
  OFFLINE_CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Weather Data Configuration
export const WEATHER_CONFIG = {
  FORECAST_DAYS: 7,
  HOURLY_FORECAST_HOURS: 48,
  UPDATE_INTERVAL: 15 * 60 * 1000, // 15 minutes
  STALE_DATA_THRESHOLD: 60 * 60 * 1000, // 1 hour
  COORDINATES_PRECISION: 4, // decimal places
} as const;

// UI Configuration
export const UI_CONFIG = {
  ANIMATION_DURATION: 300, // milliseconds
  DEBOUNCE_DELAY: 300, // milliseconds
  TOUCH_TARGET_SIZE: 44, // pixels (minimum for accessibility)
  MOBILE_BREAKPOINT: 640, // pixels
  TABLET_BREAKPOINT: 1024, // pixels
  DESKTOP_BREAKPOINT: 1280, // pixels
} as const;

// Storage Configuration
export const STORAGE_CONFIG = {
  MAX_FAVORITES: 20,
  MAX_HISTORY_ITEMS: 50,
  MAX_CACHE_SIZE: 10 * 1024 * 1024, // 10MB
  CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_CENTER: [39.8283, -98.5795] as [number, number], // Center of US
  DEFAULT_ZOOM: 4,
  MAX_ZOOM: 18,
  MIN_ZOOM: 3,
  TILE_SIZE: 256,
  ATTRIBUTION: '© OpenStreetMap contributors',
} as const;

// Weather Alert Configuration
export const ALERT_CONFIG = {
  REFRESH_INTERVAL: 15 * 60 * 1000, // 15 minutes
  CACHE_DURATION: 15 * 60 * 1000, // 15 minutes
  NOTIFICATION_TIMEOUT: 10000, // 10 seconds
  MAX_ALERT_HISTORY: 100,
  COORDINATE_TOLERANCE: 0.5, // degrees (~50km)
} as const;

// Astronomy Configuration
export const ASTRONOMY_CONFIG = {
  SEEING_EXCELLENT_THRESHOLD: 1.5, // arcseconds
  SEEING_GOOD_THRESHOLD: 2.5,
  SEEING_FAIR_THRESHOLD: 3.5,
  TRANSPARENCY_EXCELLENT_THRESHOLD: 6.0, // magnitude
  TRANSPARENCY_GOOD_THRESHOLD: 5.5,
  TRANSPARENCY_FAIR_THRESHOLD: 5.0,
  MOON_PHASE_CYCLE: 29.53, // days
  PICKERING_SCALE_MAX: 10,
} as const;

// Fishing Conditions Configuration
export const FISHING_CONFIG = {
  SEARCH_RADIUS_OPTIONS: [10, 25, 50, 100], // miles
  DEFAULT_SEARCH_RADIUS: 25,
  MAX_RESULTS: 20,
  SCORE_EXCELLENT_THRESHOLD: 8,
  SCORE_GOOD_THRESHOLD: 6,
  SCORE_FAIR_THRESHOLD: 4,
  WATER_TEMP_IDEAL_MIN: 50, // Fahrenheit
  WATER_TEMP_IDEAL_MAX: 70,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to weather services. Please check your internet connection.',
  LOCATION_NOT_FOUND: 'Location not found. Please check the spelling and try again with a valid US location.',
  TIMEOUT_ERROR: 'Request timed out. Please check your internet connection and try again.',
  INVALID_LOCATION: 'Invalid location format. Please try "City, State" or a 5-digit ZIP code.',
  SERVICE_UNAVAILABLE: 'Weather service is temporarily unavailable. Please try again in a few minutes.',
  PERMISSION_DENIED: 'Location access denied. Please enable location permissions or use the search form.',
  POSITION_UNAVAILABLE: 'Location information unavailable. Please try again or use the search form.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOCATION_SAVED: 'Location saved to favorites',
  LOCATION_REMOVED: 'Location removed from favorites',
  SETTINGS_SAVED: 'Settings saved successfully',
  DATA_REFRESHED: 'Weather data refreshed',
  CACHE_CLEARED: 'Cache cleared successfully',
} as const;

// Color Schemes
export const COLOR_SCHEMES = {
  WEATHER_CONDITIONS: {
    CLEAR: 'from-blue-500 via-sky-600 to-indigo-700',
    CLOUDY: 'from-gray-500 via-gray-600 to-gray-700',
    RAINY: 'from-slate-600 via-slate-700 to-slate-800',
    SNOWY: 'from-slate-400 via-slate-500 to-slate-600',
    STORMY: 'from-purple-700 via-purple-800 to-indigo-900',
    DEFAULT: 'from-slate-600 via-slate-700 to-slate-800',
  },
  ALERT_SEVERITY: {
    EXTREME: 'bg-red-600 text-white border-red-700',
    SEVERE: 'bg-orange-600 text-white border-orange-700',
    MODERATE: 'bg-yellow-600 text-white border-yellow-700',
    MINOR: 'bg-blue-600 text-white border-blue-700',
  },
  FISHING_SCORE: {
    EXCELLENT: 'text-green-700 bg-green-100 border-green-300',
    GOOD: 'text-blue-700 bg-blue-100 border-blue-300',
    FAIR: 'text-yellow-700 bg-yellow-100 border-yellow-300',
    POOR: 'text-red-700 bg-red-100 border-red-300',
  },
  ASTRONOMY_CONDITIONS: {
    EXCELLENT: 'text-green-700 bg-green-100',
    GOOD: 'text-blue-700 bg-blue-100',
    FAIR: 'text-yellow-700 bg-yellow-100',
    POOR: 'text-red-700 bg-red-100',
  },
} as const;

// Chart Configuration
export const CHART_CONFIG = {
  COLORS: {
    TEMPERATURE: '#ea580c',
    PRECIPITATION: '#3b82f6',
    HUMIDITY: '#0f766e',
    WIND: '#10b981',
    PRESSURE: '#7c3aed',
  },
  GRID_COLOR: 'rgba(156, 163, 175, 0.2)',
  TEXT_COLOR: '#6b7280',
  FONT_SIZE: {
    MOBILE: 10,
    DESKTOP: 11,
  },
  ANIMATION_DURATION: 750,
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  LOCATION_MIN_LENGTH: 2,
  LOCATION_MAX_LENGTH: 100,
  COORDINATES_MIN_LAT: -90,
  COORDINATES_MAX_LAT: 90,
  COORDINATES_MIN_LON: -180,
  COORDINATES_MAX_LON: 180,
  ZIP_CODE_PATTERN: /^\d{5}(-\d{4})?$/,
  CITY_STATE_PATTERN: /^[a-zA-Z\s,.\-]+$/,
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_OFFLINE_MODE: true,
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_LOCATION_HISTORY: true,
  ENABLE_FAVORITES: true,
  ENABLE_WEATHER_ALERTS: true,
  ENABLE_ASTRONOMY_FORECAST: true,
  ENABLE_FISHING_CONDITIONS: true,
  ENABLE_RADAR_ANIMATION: true,
  ENABLE_EXPORT_FEATURES: true,
  ENABLE_ADVANCED_CHARTS: true,
} as const;

// Performance Configuration
export const PERFORMANCE_CONFIG = {
  IMAGE_LAZY_LOADING: true,
  COMPONENT_LAZY_LOADING: true,
  BUNDLE_SPLITTING: true,
  PREFETCH_CRITICAL_DATA: true,
  DEBOUNCE_SEARCH: true,
  THROTTLE_SCROLL: true,
  VIRTUAL_SCROLLING_THRESHOLD: 100,
} as const;

// Accessibility Configuration
export const A11Y_CONFIG = {
  FOCUS_VISIBLE_OUTLINE: '2px solid #3b82f6',
  FOCUS_VISIBLE_OFFSET: '2px',
  HIGH_CONTRAST_RATIO: 4.5,
  LARGE_TEXT_RATIO: 3,
  ANIMATION_RESPECT_PREFERS_REDUCED_MOTION: true,
  KEYBOARD_NAVIGATION: true,
  SCREEN_READER_SUPPORT: true,
} as const;

// Development Configuration
export const DEV_CONFIG = {
  ENABLE_LOGGING: process.env.NODE_ENV === 'development',
  ENABLE_DEBUG_TOOLS: process.env.NODE_ENV === 'development',
  MOCK_API_RESPONSES: false,
  ENABLE_PERFORMANCE_MONITORING: true,
  LOG_LEVEL: 'info' as 'error' | 'warn' | 'info' | 'debug',
} as const;

// Export all constants as a single object for convenience
export const CONSTANTS = {
  API_CONFIG,
  WEATHER_CONFIG,
  UI_CONFIG,
  STORAGE_CONFIG,
  MAP_CONFIG,
  ALERT_CONFIG,
  ASTRONOMY_CONFIG,
  FISHING_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  COLOR_SCHEMES,
  CHART_CONFIG,
  VALIDATION_RULES,
  FEATURE_FLAGS,
  PERFORMANCE_CONFIG,
  A11Y_CONFIG,
  DEV_CONFIG,
} as const;