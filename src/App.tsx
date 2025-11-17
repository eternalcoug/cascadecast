import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TopNavbar } from './components/TopNavbar';
import { FooterNavbar } from './components/FooterNavbar';
import { WeatherAlerts } from './components/WeatherAlerts';
import { FavoritesManager } from './components/FavoritesManager';
import { NotificationToast, useToast } from './components/NotificationToast';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { SearchForm } from './components/SearchForm';
import { WeatherForecast } from './components/WeatherForecast';
import { TemperatureGraph } from './components/TemperatureGraph';
import { InteractiveMap } from './components/InteractiveMap';
import { HourlyForecastPage } from './components/HourlyForecastPage';
import { RadarPage } from './components/RadarPage';
import { AstronomyPage } from './components/AstronomyPage';
import { FishingConditionsPage } from './components/FishingConditionsPage';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { Bell } from 'lucide-react';
import { saveLocation, getSavedLocation } from './utils/locationStorage';
import { 
  saveWeatherData, 
  getSavedWeatherData, 
  clearSavedWeatherData,
  hasSavedWeatherData,
  refreshWeatherDataTimestamp
} from './utils/weatherStorage';
import { CascadeCastIcon } from './components/CascadeCastIcon';
import { NotificationSettingsPanel } from './components/NotificationSettingsPanel';
import { 
  cacheWeatherData, 
  getCachedWeatherData, 
  clearExpiredCache,
  isOnline 
} from './utils/weatherCache';
import { 
  addToFavorites, 
  addToHistory, 
  FavoriteLocation 
} from './utils/favorites';
import { 
  handleNetworkError, 
  handleLocationError, 
  handleApiResponseError, 
  logError,
  withErrorHandling,
  retryWithBackoff,
  createError,
  ERROR_CODES
} from './utils/errorHandling';
import { API_CONFIG, WEATHER_CONFIG, ERROR_MESSAGES } from './utils/constants';

export interface WeatherData {
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
    }>;
  };
}

// Modern gradient backgrounds for different weather conditions
const getWeatherGradient = (weatherData?: WeatherData | null) => {
  if (!weatherData?.forecast?.periods?.[0]) {
    return 'from-slate-600 via-slate-700 to-slate-800'; // Default
  }
  
  const currentCondition = weatherData.forecast.periods[0].shortForecast.toLowerCase();
  
  if (currentCondition.includes('sunny') || currentCondition.includes('clear')) {
    return 'from-blue-500 via-sky-600 to-indigo-700';
  } else if (currentCondition.includes('rain') || currentCondition.includes('shower')) {
    return 'from-slate-600 via-slate-700 to-slate-800';
  } else if (currentCondition.includes('snow')) {
    return 'from-slate-400 via-slate-500 to-slate-600';
  } else if (currentCondition.includes('cloud')) {
    return 'from-gray-500 via-gray-600 to-gray-700';
  } else if (currentCondition.includes('storm') || currentCondition.includes('thunder')) {
    return 'from-purple-700 via-purple-800 to-indigo-900';
  }
  
  return 'from-slate-600 via-slate-700 to-slate-800'; // Default
};

// API timeout constant
const API_TIMEOUT = 15000; // 15 seconds

// Fetch with timeout utility
const fetchWithTimeout = async (url: string, timeout = API_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your internet connection.');
    }
    throw error;
  }
};

// Enhanced error response interface
interface WeatherResponse {
  success: boolean;
  data?: WeatherData;
  error?: {
    code: number;
    message: string;
    userMessage: string;
    suggestions?: string[];
  };
}

// Input validation utility
const validateLocationInput = (location: string): { isValid: boolean; error?: string } => {
  if (!location || !location.trim()) {
    return { isValid: false, error: 'Please enter a location' };
  }
  
  const trimmed = location.trim();
  
  // Check for minimum length
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Location must be at least 2 characters long' };
  }
  
  // Check for maximum length
  if (trimmed.length > 100) {
    return { isValid: false, error: 'Location is too long. Please use a shorter name.' };
  }
  
  // Check for valid characters (letters, numbers, spaces, commas, periods, hyphens)
  const validPattern = /^[a-zA-Z0-9\s,.\-+\/]+$/;
  if (!validPattern.test(trimmed)) {
    return { isValid: false, error: 'Location contains invalid characters. Use only letters, numbers, spaces, and basic punctuation.' };
  }
  
  return { isValid: true };
};

// Enhanced error handling utility
const handleApiError = (error: any, context: string): WeatherResponse => {
  console.error(`${context} error:`, error);
  
  if (error.name === 'AbortError') {
    return {
      success: false,
      error: {
        code: 408,
        message: 'Request timeout',
        userMessage: 'The request took too long. Please check your internet connection and try again.',
        suggestions: ['Check your internet connection', 'Try again in a few moments']
      }
    };
  }
  
  if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
    return {
      success: false,
      error: {
        code: 0,
        message: 'Network error',
        userMessage: 'Unable to connect to weather services. Please check your internet connection.',
        suggestions: ['Check your internet connection', 'Try again later', 'Contact support if the problem persists']
      }
    };
  }
  
  // Default error response
  return {
    success: false,
    error: {
      code: 500,
      message: error.message || 'Unknown error',
      userMessage: 'An unexpected error occurred. Please try again.',
      suggestions: ['Try again in a few moments', 'Try a different location', 'Contact support if the problem persists']
    }
  };
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="pb-20 sm:pb-24">
        <Routes>
          <Route path="/" element={<MainWeatherApp />} />
          <Route path="/hourly-forecast" element={<HourlyForecastPage />} />
          <Route path="/radar" element={<RadarPage />} />
          <Route path="/astronomy" element={<AstronomyPage />} />
          <Route path="/fishing-conditions" element={<FishingConditionsPage />} />
        </Routes>
        </div>
        <FooterNavbar />
      </Router>
    </ErrorBoundary>
  );
}

function MainWeatherApp() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLocation, setInitialLocation] = useState('');
  const [isRestoringData, setIsRestoringData] = useState(true);
  const [hasAttemptedAutoLocation, setHasAttemptedAutoLocation] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const toast = useToast();

  // Load saved location on component mount
  useEffect(() => {
    // Clear expired cache on startup
    clearExpiredCache();
    
    const restoreWeatherData = async () => {
      setIsRestoringData(true);
      
      try {
        // First, try to restore complete weather data
        let savedWeatherData = getSavedWeatherData();
        
        // Fallback to cache if no saved data
        if (!savedWeatherData) {
          const cachedData = getCachedWeatherData('last_location');
          if (cachedData) {
            savedWeatherData = {
              location: cachedData.location,
              coordinates: cachedData.coordinates,
              forecast: cachedData.data.forecast,
              hourlyForecast: cachedData.data.hourlyForecast,
              timestamp: cachedData.timestamp
            };
          }
        }
        
        if (savedWeatherData) {
          console.log('Restoring saved weather data for:', savedWeatherData.location);
          
          // Restore the complete weather data
          setWeatherData({
            location: savedWeatherData.location,
            coordinates: savedWeatherData.coordinates,
            forecast: savedWeatherData.forecast,
            hourlyForecast: savedWeatherData.hourlyForecast
          });
          
          setInitialLocation(savedWeatherData.location);
          
          // Refresh the timestamp to extend expiry
          refreshWeatherDataTimestamp();
          
          setIsRestoringData(false);
          return;
        }
        
        // Fallback to just saved location (legacy support)
        const savedLocation = getSavedLocation();
        if (savedLocation?.location) {
          console.log('Found saved location, will need to fetch weather data:', savedLocation.location);
          setInitialLocation(savedLocation.location);
        }
      } catch (error) {
        console.warn('Failed to restore weather data:', error);
      }
      
      setIsRestoringData(false);
    };

    restoreWeatherData();
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast.success('Connection Restored', 'You are back online. Data will be refreshed.');
      
      // Refresh data if we have a location
      if (weatherData?.location) {
        handleLocationSubmit(weatherData.location);
      }
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      toast.warning('Offline Mode', 'You are offline. Showing cached data when available.');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [weatherData, toast]);

  // Auto-detect location for first-time users (optional, privacy-conscious)
  useEffect(() => {
    const attemptAutoLocation = async () => {
      // Only attempt auto-location if:
      // 1. No saved data exists
      // 2. Haven't attempted before in this session
      // 3. Not currently loading
      if (!isRestoringData && !weatherData && !initialLocation && !hasAttemptedAutoLocation && !loading) {
        setHasAttemptedAutoLocation(true);
        
        // Optional: Attempt to get user's location automatically
        // This is commented out to respect privacy - users must explicitly request location
        /*
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const coords = {
                lat: position.coords.latitude,
                lon: position.coords.longitude
              };
              // Auto-fetch weather for detected location
              reverseGeocodeAndFetch(coords.lat, coords.lon);
            },
            (error) => {
              // Silently fail - user can manually select location
              console.log('Auto-location failed:', error.message);
            },
            { timeout: 5000, maximumAge: 300000 }
          );
        }
        */
      }
    };

    attemptAutoLocation();
  }, [isRestoringData, weatherData, initialLocation, hasAttemptedAutoLocation, loading]);

  // Auto-fetch weather data if we have a location but no weather data
  useEffect(() => {
    try {
      if (!isRestoringData && initialLocation && !weatherData && !loading) {
        console.log('Auto-fetching weather data for restored location:', initialLocation);
        handleLocationSubmit(initialLocation);
      }
    } catch (error) {
      console.warn('Failed to auto-fetch weather data:', error);
    }
  }, [isRestoringData, initialLocation, weatherData, loading]);

  // Helper function for auto-location (if implemented)
  const reverseGeocodeAndFetch = async (lat: number, lon: number) => {
    try {
      const coordinates = await getCoordinatesFromLocation(`${lat},${lon}`);
      if (coordinates?.displayName) {
        handleLocationSubmit(coordinates.displayName);
      }
    } catch (error) {
      console.warn('Auto-location reverse geocoding failed:', error);
    }
  };

  const handleLocationSubmit = async (location: string) => {
    const wrappedSubmit = withErrorHandling(async (location: string) => {
      // Input validation
      const validation = validateLocationInput(location);
      if (!validation.isValid) {
        throw createError(
          ERROR_CODES.VALIDATION_ERROR,
          validation.error || 'Invalid location input',
          validation.error || 'Invalid location input',
          'low',
          { location },
          false,
          ['Check your input format', 'Use only letters, numbers, and basic punctuation']
        );
      }

      setLoading(true);
      setError(null);
      setWeatherData(null);

      console.log('🔍 Starting weather fetch for location:', location.trim());
      
      // Check cache first
      const cacheKey = `weather_${location.trim().toLowerCase()}`;
      const cachedData = getCachedWeatherData(cacheKey);
      
      if (cachedData && isOnline()) {
        console.log('Using cached weather data');
        setWeatherData({
          location: cachedData.location,
          forecast: cachedData.data.forecast,
          hourlyForecast: cachedData.data.hourlyForecast,
          coordinates: cachedData.coordinates
        });
        
        toast.info('Cached Data', 'Showing cached weather data. Refreshing in background...');
      }
      
      // Always try to fetch fresh data if online
      if (isOnline()) {
        // Use retry with exponential backoff
        const coordinates = await retryWithBackoff(
          () => getCoordinatesFromLocation(location),
          API_CONFIG.RETRY_ATTEMPTS,
          API_CONFIG.RETRY_DELAY
        );
        
        if (!coordinates?.lat || !coordinates?.lon) {
          throw new Error('Unable to find coordinates for this location');
        }
        
        console.log('📍 Coordinates found:', coordinates);
        
        // Get weather forecast with retry
        const forecastResponse = await retryWithBackoff(
          () => getWeatherForecast(coordinates.lat, coordinates.lon),
          API_CONFIG.RETRY_ATTEMPTS,
          API_CONFIG.RETRY_DELAY
        );
        
        const forecast = forecastResponse.success ? forecastResponse.data?.forecast : null;
        const hourlyForecast = await getHourlyWeatherForecast(coordinates.lat, coordinates.lon);
        
        if (!forecast?.periods || !Array.isArray(forecast.periods)) {
          throw new Error('Invalid weather data received');
        }
        
        const newWeatherData = {
          location: coordinates?.displayName || location,
          forecast,
          hourlyForecast: hourlyForecast || undefined,
          coordinates: { lat: coordinates.lat, lon: coordinates.lon }
        };
        
        setWeatherData(newWeatherData);
        
        // Cache the data
        cacheWeatherData(cacheKey, newWeatherData, newWeatherData.location, newWeatherData.coordinates);
        
        // Save to persistent storage
        try {
          saveWeatherData({
            location: newWeatherData.location,
            coordinates: newWeatherData.coordinates,
            forecast: newWeatherData.forecast,
            hourlyForecast: newWeatherData.hourlyForecast
          });
        } catch (storageError) {
          console.warn('Failed to save weather data:', storageError);
        }
        
        // Add to search history
        addToHistory({
          location,
          displayName: coordinates.displayName || location,
          coordinates: { lat: coordinates.lat, lon: coordinates.lon },
          resultCount: forecast.periods.length
        });
        
        // Save location for favorites
        try {
          saveLocation({
            location,
            coordinates: { lat: coordinates.lat, lon: coordinates.lon },
            displayName: coordinates.displayName || location
          });
        } catch (storageError) {
          console.warn('Failed to save location:', storageError);
        }
        
        toast.success('Weather Updated', 'Latest weather data loaded successfully.');
      } else if (!cachedData) {
        throw new Error('No internet connection and no cached data available.');
      }
    }, (error) => {
      setError(error.userMessage);
      toast.error('Weather Error', error.userMessage);
    });
    
    await wrappedSubmit(location);
    setLoading(false);
  };

  const handleAddToFavorites = (location: string, coordinates?: { lat: number; lon: number }) => {
    if (!coordinates) {
      toast.error('Cannot Add Favorite', 'Location coordinates are required.');
      return;
    }
    
    const favoriteLocation: FavoriteLocation = {
      id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: location,
      displayName: location,
      coordinates,
      addedAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0
    };
    
    const success = addToFavorites(favoriteLocation);
    if (success) {
      toast.success('Added to Favorites', `${location} has been saved to your favorites.`);
    } else {
      toast.error('Failed to Add', 'Could not add location to favorites.');
    }
  };

  const handleClearData = () => {
    setWeatherData(null);
    setInitialLocation('');
    setError(null);
    setHasAttemptedAutoLocation(false);
    clearSavedWeatherData();
  };

  // Defensive rendering with proper loading and error states
  if (loading || isRestoringData) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <header className="text-center mb-16 animate-fade-in-up">
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="relative">
                <CascadeCastIcon 
                  className="drop-shadow-lg" 
                  size={window.innerWidth < 640 ? 48 : window.innerWidth < 1024 ? 64 : 80}
                />
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
              </div>
              <div>
                <h1 className="heading-primary text-4xl sm:text-5xl lg:text-6xl">Cascade Cast</h1>
                <div className="h-1 w-24 bg-gradient-to-r from-white/60 to-transparent rounded-full mt-2"></div>
              </div>
            </div>
            <p className="text-white/90 text-lg sm:text-xl lg:text-2xl font-light px-4 sm:px-6">
              Advanced Weather Intelligence
            </p>
            <p className="text-white/70 text-sm sm:text-base mt-2">
              Powered by NOAA • Real-time Data • Precision Forecasting
            </p>
          </header>
          
          <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
            {/* Offline Indicator */}
            {isOffline && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-yellow-100">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="font-medium">Offline Mode - Showing cached data</span>
                </div>
              </div>
            )}
            
            <div className="animate-slide-in-right">
              <SearchForm onSubmit={handleLocationSubmit} initialLocation={initialLocation} />
            </div>
            
            <div className="animate-fade-in-up delay-300">
              <LoadingSpinner />
            </div>
            
            {isRestoringData && (
              <div className="text-center mt-6 sm:mt-8 animate-fade-in-up delay-500">
                <div className="glass-card inline-block px-6 py-3">
                  <p className="text-white/90 text-sm sm:text-base font-medium">
                    🔄 Restoring your previous weather data...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen min-h-[100dvh] bg-gradient-to-br ${getWeatherGradient(weatherData)} relative overflow-hidden transition-all duration-1000`}>
      {/* Top Navigation */}
      <TopNavbar 
        onRefresh={() => {
          if (weatherData?.location) {
            handleLocationSubmit(weatherData.location);
          }
        }}
        onShowAlerts={() => setShowAlertsPanel(!showAlertsPanel)}
        onShowNotifications={() => setShowFavorites(!showFavorites)}
        onShowNotificationSettings={() => setShowNotificationSettings(!showNotificationSettings)}
        alertCount={alertCount}
        isRefreshing={loading}
      />
      
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-pulse delay-700"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 lg:space-y-10">
          {/* Weather Alerts */}
          {weatherData?.coordinates && showAlertsPanel && (
            <div className="animate-fade-in-up">
              <WeatherAlerts 
                coordinates={weatherData.coordinates} 
                location={weatherData.location}
                onAlertCountChange={setAlertCount}
              />
            </div>
          )}
          
          {/* Favorites Toggle */}
          
          {/* Favorites Manager */}
          {showFavorites && (
            <div className="animate-fade-in-up">
              <FavoritesManager 
                onLocationSelect={(location, coordinates) => {
                  handleLocationSubmit(location);
                  setShowFavorites(false);
                }}
                currentLocation={weatherData?.location}
              />
            </div>
          )}
          
          {/* Notification Settings Panel */}
          {showNotificationSettings && (
            <div className="animate-fade-in-up">
              <NotificationSettingsPanel 
                onClose={() => setShowNotificationSettings(false)}
                onSettingsChange={(settings) => {
                  toast.success('Settings Saved', 'Your notification preferences have been updated.');
                }}
              />
            </div>
          )}
          
          {/* Interactive Weather Map - Always visible */}
          <div className="animate-fade-in-up delay-200">
            <InteractiveMap 
              onLocationSelect={(location, coordinates) => handleLocationSubmit(location)}
              currentLocation={weatherData?.location}
              weatherCoordinates={weatherData?.coordinates}
            />
          </div>
          
          <div className="animate-slide-in-right">
            <SearchForm 
              onSubmit={handleLocationSubmit} 
              initialLocation={initialLocation}
              weatherData={weatherData}
              onClearData={handleClearData}
              onAddToFavorites={handleAddToFavorites}
            />
          </div>
          
          {error && (
            <div className="animate-fade-in-up">
              <ErrorMessage message={error} />
            </div>
          )}
          
          {weatherData?.forecast?.periods && (
            <div className="animate-fade-in-up delay-300">
              <WeatherForecast data={weatherData} />
            </div>
          )}

          {/* Bottom 4 panels in 2x2 grid layout on desktop */}
          {weatherData?.hourlyForecast?.periods && (
            <div className="animate-fade-in-up delay-400">
              <TemperatureGraph 
                hourlyData={weatherData.hourlyForecast.periods.slice(0, 48)}
                location={weatherData?.location || 'Unknown Location'}
                coordinates={weatherData?.coordinates}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Toast Notifications */}
      <NotificationToast 
        notifications={toast.notifications}
        onDismiss={toast.removeNotification}
        position="top-right"
      />
      
      {/* Performance Monitor (Development Only) */}
      <PerformanceMonitor enabled={process.env.NODE_ENV === 'development'} />
    </div>
  );
}

async function getCoordinatesFromLocation(location: string): Promise<{ lat: number; lon: number; displayName: string }> {
  if (!location?.trim()) {
    throw new Error('Location is required');
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  console.log('🔑 Google Maps API Key available:', !!apiKey);
  
  if (!apiKey) {
    throw new Error('Weather service configuration error. Please contact support.');
  }

  const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&components=country:US&key=${apiKey}`;
  console.log('🌐 Geocoding URL:', geocodeUrl.replace(apiKey, 'API_KEY_HIDDEN'));
  
  try {
    const response = await fetchWithTimeout(geocodeUrl);
    
    if (!response.ok) {
      console.error('❌ Geocoding HTTP error:', response.status, response.statusText);
      
      if (response.status === 400) {
        throw new Error('Invalid location format. Please try "City, State" or a 5-digit ZIP code.');
      } else if (response.status === 403) {
        throw new Error('Weather service temporarily unavailable. Please try again later.');
      } else if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      } else {
        throw new Error(`Location service error (${response.status}). Please try again.`);
      }
    }
    
    const data = await response.json();
    console.log('📊 Geocoding response status:', data.status);
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.error('❌ Geocoding failed:', data.status, data.error_message);
      
      if (data.status === 'ZERO_RESULTS') {
        throw new Error('Location not found. Please check spelling and try a valid US location (e.g., "Seattle, WA" or "90210").');
      } else if (data.status === 'REQUEST_DENIED') {
        throw new Error('Weather service temporarily unavailable. Please try again later.');
      } else if (data.status === 'INVALID_REQUEST') {
        throw new Error('Invalid location format. Please try "City, State" or a 5-digit ZIP code.');
      } else {
        throw new Error(`Location lookup failed: ${data.error_message || 'Please try a different location.'}`);
      }
    }
    
    const result = data.results[0];
    const location_data = result.geometry.location;
    
    if (!location_data?.lat || !location_data?.lng) {
      throw new Error('Invalid location data received. Please try a different location.');
    }
    
    console.log('✅ Geocoding successful:', result.formatted_address);
    
    return {
      lat: location_data.lat,
      lon: location_data.lng,
      displayName: result.formatted_address || location
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Location')) {
      throw error; // Re-throw location-specific errors
    }
    throw new Error('Unable to find location. Please check your internet connection and try again.');
  }
}

async function getWeatherForecast(lat: number, lon: number): Promise<WeatherResponse> {
  if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
    return {
      success: false,
      error: {
        code: 400,
        message: 'Invalid coordinates',
        userMessage: 'Invalid location coordinates. Please try a different location.'
      }
    };
  }

  console.log('🌤️ Fetching weather forecast for coordinates:', lat, lon);

  try {
    // Step 1: Get the forecast office and grid coordinates
    const pointsUrl = `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`;
    console.log('📍 NOAA Points API URL:', pointsUrl);
    
    const pointsResponse = await fetchWithTimeout(pointsUrl);
    
    if (!pointsResponse.ok) {
      console.error('❌ NOAA Points API error:', pointsResponse.status, pointsResponse.statusText);
      
      if (pointsResponse.status === 404) {
        return {
          success: false,
          error: {
            code: 404,
            message: 'Location not supported',
            userMessage: 'Weather data is not available for this location. Please try a location within the United States.',
            suggestions: [
              'Try a location within the United States',
              'Check that the location is spelled correctly',
              'Use a major city or ZIP code instead'
            ]
          }
        };
      } else if (pointsResponse.status === 500 || pointsResponse.status === 503) {
        return {
          success: false,
          error: {
            code: pointsResponse.status,
            message: 'Weather service unavailable',
            userMessage: 'Weather service is temporarily unavailable. Please try again in a few minutes.',
            suggestions: ['Try again in a few minutes', 'Check if the weather service is experiencing issues']
          }
        };
      } else {
        return {
          success: false,
          error: {
            code: pointsResponse.status,
            message: `NOAA API error: ${pointsResponse.status}`,
            userMessage: `Weather service error (${pointsResponse.status}). Please try again.`,
            suggestions: ['Try again in a few moments', 'Try a different location']
          }
        };
      }
    }
    
    const pointsData = await pointsResponse.json();
    console.log('📊 NOAA Points response:', pointsData.properties ? 'Success' : 'No properties');
    
    if (!pointsData?.properties?.forecast) {
      console.error('❌ Invalid points data structure:', pointsData);
      return {
        success: false,
        error: {
          code: 502,
          message: 'Invalid weather service response',
          userMessage: 'Weather service returned invalid data. Please try again.',
          suggestions: ['Try again in a few moments', 'Try a different location']
        }
      };
    }
    
    // Step 2: Get the actual forecast
    const forecastUrl = pointsData.properties.forecast;
    console.log('🌦️ NOAA Forecast API URL:', forecastUrl);
    
    const forecastResponse = await fetchWithTimeout(forecastUrl);
    
    if (!forecastResponse.ok) {
      console.error('❌ NOAA Forecast API error:', forecastResponse.status, forecastResponse.statusText);
      
      if (forecastResponse.status === 404) {
        return {
          success: false,
          error: {
            code: 404,
            message: 'Forecast not available',
            userMessage: 'Weather forecast is not available for this location. Please try a different location.',
            suggestions: [
              'Try a nearby major city',
              'Use a ZIP code instead',
              'Check that the location is within the United States'
            ]
          }
        };
      } else {
        return {
          success: false,
          error: {
            code: forecastResponse.status,
            message: `Forecast API error: ${forecastResponse.status}`,
            userMessage: `Unable to get weather forecast (${forecastResponse.status}). Please try again.`,
            suggestions: ['Try again in a few moments', 'Try a different location']
          }
        };
      }
    }
    
    const forecastData = await forecastResponse.json();
    console.log('📈 NOAA Forecast response:', forecastData.properties ? 'Success' : 'No properties');
    
    if (!forecastData?.properties?.periods || !Array.isArray(forecastData.properties.periods)) {
      console.error('❌ Invalid forecast data structure:', forecastData);
      return {
        success: false,
        error: {
          code: 502,
          message: 'Invalid forecast data',
          userMessage: 'Weather service returned invalid forecast data. Please try again.',
          suggestions: ['Try again in a few moments', 'Try a different location']
        }
      };
    }
    
    console.log('✅ Weather forecast retrieved successfully');
    
    return {
      success: true,
      data: {
        location: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        forecast: forecastData.properties
      }
    };
    
  } catch (error) {
    console.error('❌ Weather forecast error:', error);
    return handleApiError(error, 'Weather forecast');
  }
}

async function getHourlyWeatherForecast(lat: number, lon: number) {
  try {
    console.log('⏰ Fetching hourly weather forecast for coordinates:', lat, lon);
    
    if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
      console.warn('Invalid coordinates for hourly forecast');
      return null;
    }

    // Get the forecast office and grid coordinates
    const pointsUrl = `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`;
    const pointsResponse = await fetchWithTimeout(pointsUrl);
    
    if (!pointsResponse.ok) {
      console.warn('❌ Failed to get hourly forecast points data:', pointsResponse.status);
      return null;
    }
    
    const pointsData = await pointsResponse.json();
    
    if (!pointsData?.properties?.forecastHourly) {
      console.warn('❌ Hourly forecast URL not available in points data');
      return null;
    }
    
    // Get the hourly forecast
    const hourlyForecastResponse = await fetchWithTimeout(pointsData.properties.forecastHourly);
    
    if (!hourlyForecastResponse.ok) {
      console.warn('❌ Hourly forecast not available for this location:', hourlyForecastResponse.status);
      return null;
    }
    
    const hourlyForecastData = await hourlyForecastResponse.json();
    
    if (!hourlyForecastData?.properties) {
      console.warn('❌ Invalid hourly forecast data structure');
      return null;
    }
    
    console.log('✅ Hourly forecast retrieved successfully');
    
    return hourlyForecastData.properties;
  } catch (error) {
    console.warn('❌ Failed to fetch hourly forecast:', error);
    return null;
  }
}

export default App;