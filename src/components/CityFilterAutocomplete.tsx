import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import { handleNetworkError, logError } from '../utils/errorHandling';
import { API_CONFIG } from '../utils/constants';

/**
 * City Filter Autocomplete Component
 *
 * Purpose: Provides city/state search functionality specifically for the Fishing Conditions page
 * Constraints: Restricts searches to WA, OR, ID, MT only (dynamically enforced via Google Maps API)
 *
 * This component reuses the same location detection logic as the "Use My Current Location"
 * button on the home page, utilizing Google Maps Geocoding API for dynamic city resolution.
 *
 * NO CITY NAMES ARE HARD-CODED - all location data is retrieved dynamically from the API
 */

interface CityLocationSuggestion {
  id: string;
  displayName: string;
  city: string;
  state: string;
  stateCode: string;
  lat: number;
  lon: number;
  type: 'city' | 'state';
}

interface CityFilterAutocompleteProps {
  onLocationSelect: (location: CityLocationSuggestion) => void;
  placeholder?: string;
  className?: string;
  // Restrict to these states only (4 states: WA, OR, ID, MT)
  allowedStates?: string[];
}

// Default allowed states for fishing locations
const DEFAULT_ALLOWED_STATES = ['WA', 'OR', 'ID', 'MT'];

// Full state names mapping (for display purposes)
const STATE_NAMES: Record<string, string> = {
  'WA': 'Washington',
  'OR': 'Oregon',
  'ID': 'Idaho',
  'MT': 'Montana'
};

export const CityFilterAutocomplete: React.FC<CityFilterAutocompleteProps> = ({
  onLocationSelect,
  placeholder = "Search city or state (WA, OR, ID, MT)",
  className = "",
  allowedStates = DEFAULT_ALLOWED_STATES
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<CityLocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Debounced search function
   * Prevents excessive API calls by waiting for user to stop typing
   */
  const debouncedSearch = useCallback((query: string) => {
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

    // Require at least 2 characters
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    // Check if query is a state code or state name
    const upperQuery = query.toUpperCase().trim();
    const isStateQuery = allowedStates.includes(upperQuery) ||
                        Object.values(STATE_NAMES).some(name =>
                          name.toUpperCase() === upperQuery
                        );

    if (isStateQuery) {
      // Handle state-only search immediately
      handleStateSearch(query);
      return;
    }

    // Search for cities online
    searchOnline(query);
  }, [allowedStates]);

  /**
   * Handle state-only search
   * If user searches for just a state, provide that as an option
   */
  const handleStateSearch = (query: string) => {
    const upperQuery = query.toUpperCase().trim();
    const matchedStates: CityLocationSuggestion[] = [];

    // Check for state code match
    if (allowedStates.includes(upperQuery)) {
      matchedStates.push(createStateSuggestion(upperQuery));
    }

    // Check for state name match
    Object.entries(STATE_NAMES).forEach(([code, name]) => {
      if (allowedStates.includes(code) && name.toUpperCase().includes(upperQuery)) {
        // Avoid duplicates
        if (!matchedStates.some(s => s.stateCode === code)) {
          matchedStates.push(createStateSuggestion(code));
        }
      }
    });

    setSuggestions(matchedStates);
    setIsOpen(matchedStates.length > 0);
    setIsLoading(false);
  };

  /**
   * Create a state-level suggestion
   * Uses approximate center coordinates for each state
   */
  const createStateSuggestion = (stateCode: string): CityLocationSuggestion => {
    // Approximate center coordinates for each state
    const stateCenters: Record<string, { lat: number; lon: number }> = {
      'WA': { lat: 47.5, lon: -120.5 },
      'OR': { lat: 44.0, lon: -120.5 },
      'ID': { lat: 44.5, lon: -114.0 },
      'MT': { lat: 47.0, lon: -110.0 }
    };

    return {
      id: `state-${stateCode}`,
      displayName: STATE_NAMES[stateCode] || stateCode,
      city: '',
      state: STATE_NAMES[stateCode] || stateCode,
      stateCode: stateCode,
      lat: stateCenters[stateCode]?.lat || 0,
      lon: stateCenters[stateCode]?.lon || 0,
      type: 'state'
    };
  };

  /**
   * Search for cities online using Google Maps Geocoding API
   * Dynamically retrieves city data - NO HARD-CODED CITIES
   */
  const searchOnline = (query: string) => {
    setIsLoading(true);
    setError(null);

    debounceRef.current = setTimeout(async () => {
      try {
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        // Add timeout to the search
        const timeoutId = setTimeout(() => {
          abortControllerRef.current?.abort();
        }, API_CONFIG.TIMEOUT);

        try {
          await searchCitiesInStates(query, signal);
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('City search error:', err);
          const appError = handleNetworkError(err, { query });
          logError(appError);
          setError(appError.userMessage);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce
  };

  /**
   * Search cities using Google Maps Geocoding API
   * Dynamically filters results to only include allowed states
   *
   * Implementation approach:
   * 1. Make API call to Google Maps with search query
   * 2. Filter results to only include cities in allowed states (WA, OR, ID, MT)
   * 3. Process and format results for display
   * 4. NO CITY NAMES are stored in code - all data comes from API
   */
  const searchCitiesInStates = async (query: string, signal: AbortSignal) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key is not configured');
    }

    // Build search query that biases toward our allowed states
    // We'll filter results on the client side to ensure only allowed states
    const searchQuery = query.trim();

    // Use Google Maps Geocoding API with components filter for US
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&components=country:US&key=${apiKey}`;

    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Process results and filter by allowed states
    const processedSuggestions: CityLocationSuggestion[] = data.results
      .map((item: any, index: number) => {
        const addressComponents = item.address_components || [];

        // Extract city, state code, and full state name
        let city = '';
        let stateCode = '';
        let stateName = '';

        addressComponents.forEach((component: any) => {
          const types = component.types || [];
          if (types.includes('locality')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            stateCode = component.short_name; // e.g., "WA"
            stateName = component.long_name;   // e.g., "Washington"
          }
        });

        // Fallback parsing if components missing
        if (!city || !stateCode) {
          const addressParts = item.formatted_address.split(', ');
          if (addressParts.length >= 2) {
            city = city || addressParts[0];
            const stateZip = addressParts[addressParts.length - 2];
            stateCode = stateCode || stateZip.split(' ')[0];
          }
        }

        return {
          id: item.place_id || `google-city-${index}`,
          displayName: `${city}, ${stateName || stateCode}`,
          city: city || 'Unknown',
          state: stateName || STATE_NAMES[stateCode] || stateCode,
          stateCode: stateCode || '',
          lat: item.geometry.location.lat,
          lon: item.geometry.location.lng,
          type: 'city' as const
        };
      })
      // CRITICAL: Filter to only include cities in allowed states
      .filter((suggestion: CityLocationSuggestion) => {
        const isAllowed = allowedStates.includes(suggestion.stateCode.toUpperCase());
        if (!isAllowed) {
          console.log(`Filtered out: ${suggestion.displayName} (${suggestion.stateCode} not in allowed list)`);
        }
        return isAllowed;
      })
      .slice(0, 8); // Limit to 8 suggestions

    console.log(`Found ${processedSuggestions.length} cities in allowed states (${allowedStates.join(', ')})`);
    setSuggestions(processedSuggestions);
    setIsOpen(processedSuggestions.length > 0);
    setSelectedIndex(-1);
  };

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSearch(value);
  };

  /**
   * Handle suggestion selection
   */
  const handleSuggestionSelect = (suggestion: CityLocationSuggestion) => {
    setInputValue(suggestion.displayName);
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    onLocationSelect(suggestion);
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
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

  /**
   * Handle input focus
   */
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  /**
   * Handle input blur
   */
  const handleBlur = () => {
    // Delay closing to allow for suggestion clicks
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }, 150);
  };

  /**
   * Clear input
   */
  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    setError(null);
    inputRef.current?.focus();
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
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
          className="w-full px-4 py-2 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          autoComplete="off"
          spellCheck="false"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          role="combobox"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {isLoading && (
            <div className="p-1">
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-white/30
                     rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto"
          role="listbox"
        >
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion)}
                className={`w-full px-4 py-3 text-left hover:bg-blue-500/10 focus:bg-blue-500/10
                           focus:outline-none transition-all duration-200 border-b border-white/20 last:border-b-0
                           first:rounded-t-lg last:rounded-b-lg ${
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
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.displayName}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {suggestion.type === 'state' ? 'State' : 'City'}
                    </div>
                  </div>
                </div>
              </button>
            ))
          ) : !isLoading && inputValue.length >= 2 ? (
            <div className="px-4 py-3 text-gray-500 text-sm text-center">
              No cities found in {allowedStates.join(', ')} for "{inputValue}"
            </div>
          ) : null}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-xs">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 text-xs mt-1 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Helper text */}
      <div className="mt-1 text-xs text-white/70">
        Search limited to: {allowedStates.map(code => STATE_NAMES[code] || code).join(', ')}
      </div>
    </div>
  );
};
