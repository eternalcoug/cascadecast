import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { searchFavoritesAndHistory } from '../utils/favorites';
import { handleNetworkError, logError } from '../utils/errorHandling';
import { API_CONFIG } from '../utils/constants';

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

interface LocationAutocompleteProps {
  onLocationSelect: (location: LocationSuggestion) => void;
  placeholder?: string;
  initialValue?: string;
  className?: string;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  onLocationSelect,
  placeholder = "e.g., 99203 or Spokane, WA",
  initialValue = "",
  className = ""
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [showFavoritesFirst, setShowFavoritesFirst] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback((query: string) => {
    console.log('debouncedSearch called with query:', query);
    
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    // First, search favorites and history
    if (showFavoritesFirst) {
      const localResults = searchFavoritesAndHistory(query);
      if (localResults.length > 0) {
        const formattedResults = localResults.map(result => ({
          id: result.id,
          displayName: result.displayName || result.name || (result as any).location,
          city: result.city || (result as any).location?.split(',')[0] || 'Unknown',
          state: result.state || (result as any).location?.split(',')[1]?.trim() || '',
          zipCode: undefined,
          lat: result.coordinates?.lat || 0,
          lon: result.coordinates?.lon || 0,
          type: (result as any).type === 'favorite' ? 'city' as const : 'city' as const
        }));
        
        setSuggestions(formattedResults);
        setIsOpen(true);
        setSelectedIndex(-1);
        
        // Still search online for additional results
        if (formattedResults.length < 3) {
          searchOnline(query);
        }
        return;
      }
    }
    
    // Search online if no local results or not prioritizing favorites
    searchOnline(query);
  }, [showFavoritesFirst]);
  
  const searchOnline = (query: string) => {
    setIsLoading(true);
    setError(null);

    debounceRef.current = setTimeout(async () => {
      console.log('Executing search for:', query);
      try {
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        
        // Add timeout to the search
        const timeoutId = setTimeout(() => {
          abortControllerRef.current?.abort();
        }, API_CONFIG.TIMEOUT);
        
        try {
          await searchLocations(query, signal);
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Search error:', err);
          const appError = handleNetworkError(err, { query });
          logError(appError);
          setError(appError.userMessage);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  // Search locations using Nominatim API
  const searchLocations = async (query: string, signal: AbortSignal) => {
    console.log('searchLocations called with query:', query);
    
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key is not configured');
    }
    
    const isZipCode = /^\d{2,5}$/.test(query.trim());
    console.log('isZipCode:', isZipCode, 'for query:', query);
    
    let searchQuery = query.trim();
    // Google Maps API handles US filtering via components parameter

    console.log('Final search query sent to API:', searchQuery);

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&components=country:US&key=${apiKey}`;

    console.log('API URL:', url);

    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API response data:', data);
    
    if (data.status !== 'OK' || !data.results) {
      console.log('No results from Google Maps API:', data.status);
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    
    const processedSuggestions: LocationSuggestion[] = data.results
      .slice(0, 6) // Limit to 6 suggestions
      .map((item: any, index: number) => {
        const addressComponents = item.address_components || [];
        
        // Extract city, state, and zip code from address components
        let city = '';
        let state = '';
        let zipCode = '';
        
        addressComponents.forEach((component: any) => {
          const types = component.types || [];
          if (types.includes('locality')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            state = component.short_name;
          } else if (types.includes('postal_code')) {
            zipCode = component.long_name;
          }
        });
        
        // Fallback to formatted address parsing if components are missing
        if (!city || !state) {
          const addressParts = item.formatted_address.split(', ');
          if (addressParts.length >= 2) {
            city = city || addressParts[0];
            const stateZip = addressParts[addressParts.length - 2];
            state = state || stateZip.split(' ')[0];
          }
        }
        
        // Determine if this is primarily a zip code result
        const isZipResult = zipCode && (
          item.formatted_address.startsWith(zipCode) ||
          query.trim() === zipCode ||
          zipCode.startsWith(query.trim())
        );

        let displayName: string;
        if (isZipResult && zipCode) {
          displayName = `${zipCode} - ${city}, ${state}`;
        } else if (zipCode) {
          displayName = `${city}, ${state} ${zipCode}`;
        } else {
          displayName = `${city}, ${state}`;
        }

        return {
          id: item.place_id || `google-${index}`,
          displayName,
          city: city || 'Unknown',
          state: state || '',
          zipCode,
          lat: item.geometry.location.lat,
          lon: item.geometry.location.lng,
          type: isZipResult ? 'zipcode' as const : 'city' as const
        };
      });

    console.log('Processed suggestions:', processedSuggestions);
    setSuggestions(processedSuggestions);
    setIsOpen(processedSuggestions.length > 0);
    setSelectedIndex(-1);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Input changed to:', value);
    setInputValue(value);
    debouncedSearch(value);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    setInputValue(suggestion.displayName);
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    onLocationSelect(suggestion);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        // If no suggestions, try to search with current input
        if (inputValue.trim()) {
          const isZipCode = /^\d{5}$/.test(inputValue.trim());
          const isCityState = /^[a-zA-Z\s]+,\s*[a-zA-Z\s]+$/.test(inputValue.trim());
          
          if (isZipCode || isCityState) {
            // Create a basic suggestion from the input
            const basicSuggestion: LocationSuggestion = {
              id: 'manual-' + Date.now(),
              displayName: inputValue.trim(),
              city: isZipCode ? inputValue.trim() : inputValue.split(',')[0].trim(),
              state: isZipCode ? '' : inputValue.split(',')[1]?.trim() || '',
              zipCode: isZipCode ? inputValue.trim() : undefined,
              lat: 0, // Will be geocoded later
              lon: 0, // Will be geocoded later
              type: isZipCode ? 'zipcode' : 'city'
            };
            onLocationSelect(basicSuggestion);
          }
        }
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle input focus
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  // Handle input blur
  const handleBlur = (e: React.FocusEvent) => {
    // Delay closing to allow for suggestion clicks
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }, 150);
  };

  // Clear input
  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    setError(null);
    inputRef.current?.focus();
  };

  // Highlight matching text in suggestions
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-gray-900 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="input-modern text-base sm:text-lg lg:text-xl pl-4 sm:pl-5 pr-12 sm:pr-14 py-3 sm:py-4 
                     bg-white/95 backdrop-blur-sm border-white/30 hover:bg-white focus:bg-white
                     placeholder-gray-400 text-gray-800 font-medium"
          autoComplete="off"
          spellCheck="false"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          role="combobox"
        />
        
        <div className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200 touch-manipulation"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {isLoading ? (
            <div className="p-1 sm:p-2">
              <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
            </div>
          ) : (
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
                           text-white p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-200 
                           touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center
                           shadow-lg hover:shadow-xl transform hover:scale-105">
              <Search className="h-5 w-5" />
            </div>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-white/30 
                     rounded-xl sm:rounded-2xl shadow-2xl z-50 max-h-60 sm:max-h-80 overflow-y-auto"
          role="listbox"
        >
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion)}
                className={`w-full px-4 sm:px-5 py-3 sm:py-4 text-left hover:bg-blue-500/10 focus:bg-blue-500/10 
                           focus:outline-none transition-all duration-200 border-b border-white/20 last:border-b-0 
                           first:rounded-t-xl first:sm:rounded-t-2xl last:rounded-b-xl last:sm:rounded-b-2xl 
                           touch-manipulation backdrop-blur-sm ${
                  index === selectedIndex ? 'bg-blue-500/10 border-blue-500/30' : ''
                }`}
                role="option"
                aria-selected={index === selectedIndex}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <MapPin className="h-4 w-4 text-teal-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm lg:text-base font-medium text-gray-900 truncate">
                      {highlightMatch(suggestion.displayName, inputValue)}
                    </div>
                    {suggestion.type && (
                      <div className="text-xs text-gray-500 mt-0.5 hidden sm:block">
                        {suggestion.type === 'zipcode' ? 'ZIP Code' : 'Location'}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          ) : !isLoading && inputValue.length >= 2 ? (
            <div className="px-3 sm:px-4 py-2 sm:py-3 text-gray-500 text-xs sm:text-sm text-center">
              No locations found for "{inputValue}"
            </div>
          ) : null}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0 mt-0.5"></div>
            <div className="flex-1">
          <p className="text-red-600 text-xs sm:text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 text-xs mt-1 font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Search Options */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showFavoritesFirst}
            onChange={(e) => setShowFavoritesFirst(e.target.checked)}
            className="rounded"
          />
          <span>Show favorites first</span>
        </label>
        
        {suggestions.length > 0 && (
          <span>{suggestions.length} result{suggestions.length !== 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  );
};