/**
 * Weather Data Caching and Offline Support Utility
 * Provides robust caching with fallback mechanisms
 */

export interface CachedWeatherData {
  data: any;
  timestamp: number;
  location: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  expiresAt: number;
}

export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  areas: string[];
  effective: string;
  expires: string;
  urgency: 'immediate' | 'expected' | 'future';
}

const CACHE_PREFIX = 'weather_cache_';
const ALERTS_CACHE_KEY = 'weather_alerts';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const OFFLINE_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for offline

/**
 * Enhanced caching with compression and validation
 */
export const cacheWeatherData = (key: string, data: any, location: string, coordinates?: { lat: number; lon: number }): void => {
  try {
    const cachedData: CachedWeatherData = {
      data,
      timestamp: Date.now(),
      location,
      coordinates,
      expiresAt: Date.now() + CACHE_DURATION
    };
    
    const compressed = JSON.stringify(cachedData);
    localStorage.setItem(CACHE_PREFIX + key, compressed);
    
    // Also store in offline cache with longer duration
    const offlineData = {
      ...cachedData,
      expiresAt: Date.now() + OFFLINE_CACHE_DURATION
    };
    localStorage.setItem(CACHE_PREFIX + 'offline_' + key, JSON.stringify(offlineData));
    
    console.log('Weather data cached successfully:', key);
  } catch (error) {
    console.warn('Failed to cache weather data:', error);
  }
};

/**
 * Retrieve cached data with fallback to offline cache
 */
export const getCachedWeatherData = (key: string): CachedWeatherData | null => {
  try {
    // Try regular cache first
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (cached) {
      const data: CachedWeatherData = JSON.parse(cached);
      if (Date.now() < data.expiresAt) {
        console.log('Retrieved fresh cached data:', key);
        return data;
      }
    }
    
    // Fallback to offline cache
    const offlineCached = localStorage.getItem(CACHE_PREFIX + 'offline_' + key);
    if (offlineCached) {
      const data: CachedWeatherData = JSON.parse(offlineCached);
      if (Date.now() < data.expiresAt) {
        console.log('Retrieved offline cached data:', key);
        return data;
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to retrieve cached data:', error);
    return null;
  }
};

/**
 * Clear expired cache entries
 */
export const clearExpiredCache = (): void => {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.expiresAt && now > data.expiresAt) {
            localStorage.removeItem(key);
            console.log('Cleared expired cache:', key);
          }
        } catch (error) {
          // Invalid cache entry, remove it
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.warn('Failed to clear expired cache:', error);
  }
};

/**
 * Get all cached locations for favorites/history
 */
export const getCachedLocations = (): Array<{ location: string; coordinates?: { lat: number; lon: number }; lastAccessed: number }> => {
  try {
    const keys = Object.keys(localStorage);
    const locations: Array<{ location: string; coordinates?: { lat: number; lon: number }; lastAccessed: number }> = [];
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX) && !key.includes('offline_')) {
        try {
          const data: CachedWeatherData = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.location) {
            locations.push({
              location: data.location,
              coordinates: data.coordinates,
              lastAccessed: data.timestamp
            });
          }
        } catch (error) {
          // Skip invalid entries
        }
      }
    });
    
    // Sort by most recently accessed
    return locations.sort((a, b) => b.lastAccessed - a.lastAccessed);
  } catch (error) {
    console.warn('Failed to get cached locations:', error);
    return [];
  }
};

/**
 * Cache weather alerts
 */
export const cacheWeatherAlerts = (alerts: WeatherAlert[]): void => {
  try {
    const alertData = {
      alerts,
      timestamp: Date.now(),
      expiresAt: Date.now() + (15 * 60 * 1000) // 15 minutes
    };
    localStorage.setItem(ALERTS_CACHE_KEY, JSON.stringify(alertData));
  } catch (error) {
    console.warn('Failed to cache weather alerts:', error);
  }
};

/**
 * Get cached weather alerts
 */
export const getCachedWeatherAlerts = (): WeatherAlert[] => {
  try {
    const cached = localStorage.getItem(ALERTS_CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      if (Date.now() < data.expiresAt) {
        return data.alerts || [];
      }
    }
    return [];
  } catch (error) {
    console.warn('Failed to retrieve cached alerts:', error);
    return [];
  }
};

/**
 * Check if device is online
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Get cache statistics
 */
export const getCacheStats = (): { totalEntries: number; totalSize: number; oldestEntry: number; newestEntry: number } => {
  try {
    const keys = Object.keys(localStorage);
    const weatherKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    
    let totalSize = 0;
    let oldestEntry = Date.now();
    let newestEntry = 0;
    
    weatherKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += value.length;
        try {
          const data = JSON.parse(value);
          if (data.timestamp) {
            oldestEntry = Math.min(oldestEntry, data.timestamp);
            newestEntry = Math.max(newestEntry, data.timestamp);
          }
        } catch (error) {
          // Skip invalid entries
        }
      }
    });
    
    return {
      totalEntries: weatherKeys.length,
      totalSize,
      oldestEntry: oldestEntry === Date.now() ? 0 : oldestEntry,
      newestEntry
    };
  } catch (error) {
    console.warn('Failed to get cache stats:', error);
    return { totalEntries: 0, totalSize: 0, oldestEntry: 0, newestEntry: 0 };
  }
};