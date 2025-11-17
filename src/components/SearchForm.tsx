import React, { useState } from 'react';
import { MapPin, Clock, X } from 'lucide-react';
import { getSavedLocation, clearSavedLocation } from '../utils/locationStorage';
import { getSavedWeatherData, clearSavedWeatherData } from '../utils/weatherStorage';
import { getRecentSearches, getFavorites } from '../utils/favorites';
import { LocationAutocomplete } from './LocationAutocomplete';

interface SearchFormProps {
  onSubmit: (location: string) => void;
  initialLocation?: string;
  weatherData?: any;
  onClearData?: () => void;
  onAddToFavorites?: (location: string, coordinates?: { lat: number; lon: number }) => void;
}

interface LocationSuggestion {
  id: string;
  displayName: string;
  city: string;
  state: string;
  zipCode?: string;
  lat: number;
  lon: number;
  type: 'city' | 'zipcode';
}

export const SearchForm: React.FC<SearchFormProps> = ({ 
  onSubmit, 
  initialLocation = '',
  weatherData,
  onClearData,
  onAddToFavorites
}) => {
  const [error, setError] = useState('');
  const [showSavedLocation, setShowSavedLocation] = useState(false);
  const savedWeatherData = getSavedWeatherData();
  const savedLocation = savedWeatherData || getSavedLocation();
  const recentSearches = getRecentSearches();
  const favorites = getFavorites().slice(0, 5); // Top 5 favorites

  React.useEffect(() => {
    // Show saved location banner if available and no current weather data displayed
    if (savedLocation && !initialLocation && !savedWeatherData) {
      setShowSavedLocation(true);
    }
  }, [savedLocation, initialLocation, savedWeatherData]);

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    setError('');
    setShowSavedLocation(false);

    // Use the display name for the location string
    let locationString = suggestion.displayName;
    
    // If it's a zip code type, prefer just the zip code
    if (suggestion.type === 'zipcode' && suggestion.zipCode) {
      locationString = suggestion.zipCode;
    } else if (suggestion.zipCode) {
      // For city results with zip codes, use "City, State" format
      locationString = `${suggestion.city}, ${suggestion.state}`;
    }
    
    onSubmit(locationString);
  };

  const handleUseSavedLocation = () => {
    if (savedLocation) {
      const locationString = savedLocation.location;
      setShowSavedLocation(false);
      onSubmit(locationString);
    }
  };

  const handleClearSavedLocation = () => {
    clearSavedWeatherData(); // Clear weather data too
    clearSavedLocation();
    setShowSavedLocation(false);
  };

  return (
    <div className="weather-card-glass mb-8 sm:mb-10 lg:mb-12 relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none"></div>
      
      <div className="relative z-10">
      {/* Saved Location Banner */}
      {showSavedLocation && savedLocation && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 
                        border border-white/30 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
              <div className="p-1 bg-white/20 rounded-lg">
                <Clock className="h-4 w-4 text-white flex-shrink-0" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-semibold text-white truncate">
                  Previous search: {savedLocation.displayName || savedLocation.location}
                </p>
                <p className="text-xs sm:text-sm text-white/80">
                  {savedWeatherData ? 'Weather data available' : `Saved ${new Date(savedLocation.timestamp).toLocaleString()}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-1 sm:ml-2">
              <button
                type="button"
                onClick={handleUseSavedLocation}
                className="btn-primary text-xs px-3 py-1.5 min-h-0"
              >
                Use
              </button>
              <button
                type="button"
                onClick={handleClearSavedLocation}
                className="text-white/80 hover:text-white transition-colors duration-200 touch-manipulation p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-sm sm:text-base lg:text-lg font-semibold text-white mb-2 sm:mb-3 
                           flex items-center gap-2">
            <div className="p-1 bg-white/20 rounded-lg">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            Search Location
          </label>
          
          <LocationAutocomplete
            onLocationSelect={handleLocationSelect}
            placeholder="e.g., 99203 or Spokane, WA"
            initialValue={initialLocation}
          />
        </div>
        
        {error && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
            <p className="text-red-100 text-sm sm:text-base font-medium">
            {error}
          </p>
          </div>
        )}
        
        <p className="text-white/70 text-sm sm:text-base">
          Start typing to search for cities or ZIP codes across the United States
        </p>
        
        {/* Action buttons when weather data is available */}
        {weatherData && onClearData && onAddToFavorites && (
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/20">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={onClearData}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 
                         rounded-xl border border-white/30 hover:border-white/50 transition-all 
                         duration-300 touch-manipulation text-sm sm:text-base font-medium
                         shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🔄 Search Different Location
              </button>
              
              <button
                onClick={() => onAddToFavorites(weatherData.location, weatherData.coordinates)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 
                         rounded-xl border border-white/30 hover:border-white/50 transition-all 
                         duration-300 touch-manipulation text-sm sm:text-base font-medium
                         shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                ⭐ Add to Favorites
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};