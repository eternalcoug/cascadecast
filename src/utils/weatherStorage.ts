/**
 * Weather Data Storage Utility
 * Handles persistent storage of weather data and user location
 */

export interface StoredWeatherData {
  location: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  forecast: {
    periods: Array<{
      number: number;
      name: string;
      startTime: string;
      endTime: string;
      isDaytime: boolean;
      temperature: number;
      temperatureUnit: string;
      windSpeed: string;
      windDirection: string;
      icon: string;
      shortForecast: string;
      detailedForecast: string;
    }>;
  };
  hourlyForecast?: {
    periods: Array<{
      number: number;
      startTime: string;
      endTime: string;
      isDaytime: boolean;
      temperature: number;
      temperatureUnit: string;
      windSpeed: string;
      windDirection: string;
      icon: string;
      shortForecast: string;
      detailedForecast: string;
      probabilityOfPrecipitation?: {
        value: number | null;
      };
      relativeHumidity?: {
        value: number | null;
      };
      dewpoint?: {
        value: number | null;
      };
    }>;
  };
  timestamp: number;
}

const WEATHER_STORAGE_KEY = 'cascade_cast_weather_data';
const WEATHER_EXPIRY_HOURS = 1; // Weather data expires after 1 hour

/**
 * Save complete weather data to localStorage
 */
export const saveWeatherData = (weatherData: Omit<StoredWeatherData, 'timestamp'>): void => {
  try {
    const storedData: StoredWeatherData = {
      ...weatherData,
      timestamp: Date.now()
    };
    localStorage.setItem(WEATHER_STORAGE_KEY, JSON.stringify(storedData));
    console.log('Weather data saved to localStorage:', storedData.location);
  } catch (error) {
    console.warn('Failed to save weather data to localStorage:', error);
  }
};

/**
 * Retrieve saved weather data from localStorage
 * Returns null if no data saved or if expired
 */
export const getSavedWeatherData = (): StoredWeatherData | null => {
  try {
    const saved = localStorage.getItem(WEATHER_STORAGE_KEY);
    if (!saved) return null;

    const weatherData: StoredWeatherData = JSON.parse(saved);
    
    // Check if weather data has expired
    const hoursElapsed = (Date.now() - weatherData.timestamp) / (1000 * 60 * 60);
    if (hoursElapsed > WEATHER_EXPIRY_HOURS) {
      clearSavedWeatherData();
      console.log('Weather data expired, cleared from storage');
      return null;
    }

    console.log('Retrieved saved weather data:', weatherData.location);
    return weatherData;
  } catch (error) {
    console.warn('Failed to retrieve saved weather data:', error);
    return null;
  }
};

/**
 * Clear saved weather data from localStorage
 */
export const clearSavedWeatherData = (): void => {
  try {
    localStorage.removeItem(WEATHER_STORAGE_KEY);
    console.log('Weather data cleared from localStorage');
  } catch (error) {
    console.warn('Failed to clear saved weather data:', error);
  }
};

/**
 * Check if weather data is currently saved and valid
 */
export const hasSavedWeatherData = (): boolean => {
  return getSavedWeatherData() !== null;
};

/**
 * Get just the location string from saved data
 */
export const getSavedLocation = (): string | null => {
  const weatherData = getSavedWeatherData();
  return weatherData?.location || null;
};

/**
 * Update the timestamp of existing weather data (refresh expiry)
 */
export const refreshWeatherDataTimestamp = (): void => {
  const existingData = getSavedWeatherData();
  if (existingData) {
    saveWeatherData({
      location: existingData.location,
      coordinates: existingData.coordinates,
      forecast: existingData.forecast,
      hourlyForecast: existingData.hourlyForecast
    });
  }
};