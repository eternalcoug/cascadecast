/**
 * Location Storage Utility
 * Handles persistent storage of user's location data
 */

export interface SavedLocation {
  location: string;
  timestamp: number;
  coordinates?: {
    lat: number;
    lon: number;
  };
  displayName?: string;
}

const LOCATION_STORAGE_KEY = 'weather_app_location';
const LOCATION_EXPIRY_HOURS = 24; // Location expires after 24 hours

/**
 * Save location to localStorage with timestamp
 */
export const saveLocation = (locationData: Omit<SavedLocation, 'timestamp'>): void => {
  try {
    const savedLocation: SavedLocation = {
      ...locationData,
      timestamp: Date.now()
    };
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(savedLocation));
  } catch (error) {
    console.warn('Failed to save location to localStorage:', error);
  }
};

/**
 * Retrieve saved location from localStorage
 * Returns null if no location saved or if expired
 */
export const getSavedLocation = (): SavedLocation | null => {
  try {
    const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!saved) return null;

    const locationData: SavedLocation = JSON.parse(saved);
    
    // Check if location has expired
    const hoursElapsed = (Date.now() - locationData.timestamp) / (1000 * 60 * 60);
    if (hoursElapsed > LOCATION_EXPIRY_HOURS) {
      clearSavedLocation();
      return null;
    }

    return locationData;
  } catch (error) {
    console.warn('Failed to retrieve saved location:', error);
    return null;
  }
};

/**
 * Clear saved location from localStorage
 */
export const clearSavedLocation = (): void => {
  try {
    localStorage.removeItem(LOCATION_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear saved location:', error);
  }
};

/**
 * Check if a location is currently saved
 */
export const hasSavedLocation = (): boolean => {
  return getSavedLocation() !== null;
};

/**
 * Get coordinates from saved location or weather data
 */
export const getSavedCoordinates = (): { lat: number; lon: number } | null => {
  // First try to get from weather data (most recent)
  try {
    const weatherData = localStorage.getItem('cascade_cast_weather_data');
    if (weatherData) {
      const parsed = JSON.parse(weatherData);
      if (parsed.coordinates?.lat && parsed.coordinates?.lon) {
        return parsed.coordinates;
      }
    }
  } catch (error) {
    console.warn('Failed to get coordinates from weather data:', error);
  }
  
  // Fallback to location storage
  const savedLocation = getSavedLocation();
  return savedLocation?.coordinates || null;
};

/**
 * Get display name from saved location or weather data
 */
export const getSavedLocationName = (): string | null => {
  // First try to get from weather data (most recent)
  try {
    const weatherData = localStorage.getItem('cascade_cast_weather_data');
    if (weatherData) {
      const parsed = JSON.parse(weatherData);
      if (parsed.location) {
        return parsed.location;
      }
    }
  } catch (error) {
    console.warn('Failed to get location name from weather data:', error);
  }
  
  // Fallback to location storage
  const savedLocation = getSavedLocation();
  return savedLocation?.displayName || savedLocation?.location || null;
};