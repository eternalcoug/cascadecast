import React, { useEffect, useRef, useState } from 'react';
import { Map as MapIcon, MapPin, Loader2, AlertCircle, Navigation } from 'lucide-react';
import { handleLocationError, logError } from '../utils/errorHandling';

// Leaflet types and imports
declare global {
  interface Window {
    L: any;
  }
}

interface InteractiveMapProps {
  onLocationSelect: (location: string, coordinates: { lat: number; lon: number }) => void;
  currentLocation?: string;
  weatherCoordinates?: { lat: number; lon: number };
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
  onLocationSelect, 
  currentLocation,
  weatherCoordinates
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const currentMarkerRef = useRef<any>(null);
  const isInitializingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(!currentLocation);
  const [mapReady, setMapReady] = useState(false);

  // Effect to center map on weather location when coordinates are available
  useEffect(() => {
    if (weatherCoordinates && mapInstanceRef.current && mapReady && !hasUserInteracted) {
      console.log('🎯 Centering map on weather location:', weatherCoordinates);
      
      try {
        // Center map on weather location with smooth animation
        mapInstanceRef.current.setView([weatherCoordinates.lat, weatherCoordinates.lon], 10, {
          animate: true,
          duration: 1.0
        });
        
        // Remove previous marker
        if (currentMarkerRef.current) {
          mapInstanceRef.current.removeLayer(currentMarkerRef.current);
        }

        // Add marker for weather location
        const marker = window.L.marker([weatherCoordinates.lat, weatherCoordinates.lon], {
          icon: window.L.divIcon({
            className: 'weather-location-marker',
            html: '<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })
        }).addTo(mapInstanceRef.current);

        currentMarkerRef.current = marker;
        setSelectedCoords({ lat: weatherCoordinates.lat, lon: weatherCoordinates.lon });
        
      } catch (error) {
        console.error('Failed to center map on weather location:', error);
      }
    }
  }, [weatherCoordinates, mapReady, hasUserInteracted]);
  
  // Load Leaflet CSS and JS - only once
  useEffect(() => {
    let isMounted = true;
    
    const loadLeaflet = async () => {
      try {
        console.log('🗺️ Starting Leaflet loading process...');
        
        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
          cssLink.crossOrigin = '';
          document.head.appendChild(cssLink);
          console.log('📄 Leaflet CSS loaded');
        }

        // Load Leaflet JS
        if (!window.L) {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
          script.crossOrigin = '';
          
          script.onload = () => {
            console.log('📦 Leaflet JS loaded');
            if (isMounted) {
              // Small delay to ensure DOM is ready
              setTimeout(() => {
                initializeMap();
              }, 100);
            }
          };
          
          script.onerror = () => {
            console.error('❌ Failed to load Leaflet JS');
            if (isMounted) {
              setError('Unable to load map. Please refresh the page and try again.');
              setIsLoading(false);
            }
          };
          
          document.head.appendChild(script);
        } else {
          console.log('📦 Leaflet already available');
          if (isMounted) {
            // Small delay to ensure everything is ready
            setTimeout(() => {
              initializeMap();
            }, 100);
          }
        }
      } catch (err) {
        console.error('❌ Map loading error:', err);
        if (isMounted) {
          setError('Map loading failed. Please refresh the page and try again.');
          setIsLoading(false);
        }
      }
    };

    loadLeaflet();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once

  // Hide welcome message when user has a current location
  useEffect(() => {
    if (currentLocation) {
      setShowWelcomeMessage(false);
    }
  }, [currentLocation]);

  const initializeMap = () => {
    if (!mapRef.current || !window.L) {
      console.warn('⚠️ Map container or Leaflet not available');
      setError('Map container not ready. Please refresh the page.');
      setIsLoading(false);
      return;
    }

    // Prevent multiple initializations
    if (mapInstanceRef.current) {
      console.log('🗺️ Map already initialized, skipping');
      setIsLoading(false);
      setMapReady(true);
      return;
    }

    try {
      console.log('🗺️ Initializing map...');
      
      // Ensure container is visible and has dimensions
      const container = mapRef.current;
      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        console.error('❌ Map container has no dimensions');
        setError('Map container sizing issue. Please refresh the page.');
        setIsLoading(false);
        return;
      }
      
      // Initialize map centered on continental US
      const map = window.L.map(mapRef.current, {
        center: [39.8283, -98.5795], // Center of continental US
        zoom: 4,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
        touchZoom: true,
        boxZoom: true,
        keyboard: true,
        preferCanvas: false,
        attributionControl: true,
        fadeAnimation: false, // Disable fade to prevent loading issues
      });

      // Add OpenStreetMap tiles
      const tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
        minZoom: 3,
      });
      
      // Wait for tiles to load before proceeding
      tileLayer.on('load', () => {
        console.log('🗺️ Map tiles loaded successfully');
      });
      
      tileLayer.on('tileerror', (e) => {
        console.warn('⚠️ Tile loading error:', e);
      });
      
      tileLayer.addTo(map);

      // Add click event listener
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        console.log('🖱️ Map clicked at:', lat, lng);
        
        setHasUserInteracted(true);
        setShowWelcomeMessage(false);
        
        // Remove previous marker
        if (currentMarkerRef.current) {
          try {
            map.removeLayer(currentMarkerRef.current);
          } catch (error) {
            console.warn('Failed to remove previous marker:', error);
          }
        }

        // Add new marker
        try {
          const marker = window.L.marker([lat, lng], {
            icon: window.L.divIcon({
              className: 'custom-marker',
              html: '<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })
          }).addTo(map);

          currentMarkerRef.current = marker;
          setSelectedCoords({ lat, lon: lng });

          // Auto-zoom in by 2 levels for clicked locations to show more detail
          setTimeout(() => {
            if (mapInstanceRef.current) {
              const currentZoom = mapInstanceRef.current.getZoom();
              const targetZoom = Math.min(currentZoom + 1, 18); // Respect max zoom limit
              
              mapInstanceRef.current.setZoom(targetZoom, {
                animate: true,
                duration: 0.8
              });
              
              console.log(`🔍 Clicked location auto-zoomed from level ${currentZoom} to ${targetZoom} (+1 level)`);
            }
          }, 1200); // Wait for marker placement
          
          // Reverse geocode the location
          await reverseGeocode(lat, lng);
        } catch (error) {
          console.error('Failed to add marker:', error);
        }
      });

      // Map ready event
      map.whenReady(() => {
        console.log('✅ Map is ready');
        // Double-check map is actually ready
        setTimeout(() => {
          if (mapInstanceRef.current && mapRef.current) {
            setMapReady(true);
            setIsLoading(false);
            setError(null);
            console.log('✅ Map fully initialized and ready');
          }
        }, 200);
      });

      // Handle map load errors
      map.on('error', (e) => {
        console.error('❌ Map error:', e);
        setError('Map failed to load properly. Please refresh the page.');
        setIsLoading(false);
      });

      // Store map instance
      mapInstanceRef.current = map;
      
      console.log('✅ Map initialized successfully');
      
    } catch (err) {
      console.error('❌ Map setup error:', err);
      setError('Map setup failed. Please refresh the page or try using the search form above.');
      setIsLoading(false);
    }
  };

  // Reverse geocode coordinates to get location name
  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      console.log('🔍 Reverse geocoding:', lat, lon);

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

      if (apiKey) {
        // Use AbortController for timeout (fetch doesn't support timeout option)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
              const address = data.results[0].formatted_address;
              console.log('📍 Geocoded address:', address);
              onLocationSelect(address, { lat, lon });
              return;
            }
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            console.warn('⏱️ Reverse geocoding timed out, using coordinates');
          } else {
            throw fetchError;
          }
        }
      }

      // Fallback to coordinates if geocoding fails
      const coordString = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      console.log('📍 Using coordinates as fallback:', coordString);
      onLocationSelect(coordString, { lat, lon });
    } catch (error) {
      console.error('❌ Reverse geocoding error:', error);
      const coordString = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      onLocationSelect(coordString, { lat, lon });
      // Don't re-throw - we've already handled it with fallback coordinates
    }
  };

  // Get user's current location
  const getCurrentLocation = () => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      const error = new Error('Geolocation is not supported by this browser');
      logError(error, 'getCurrentLocation', { feature: 'geolocation' });
      setError('Geolocation is not supported by this browser');
      setIsGettingLocation(false);
      return;
    }

    setIsGettingLocation(true);
    setError(null);
    setHasUserInteracted(true);
    setShowWelcomeMessage(false);

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          
          console.log('📍 Got user location:', coords);
          
          // Center map on user location
          if (mapInstanceRef.current && mapReady) {
            try {
              // First center the map at a moderate zoom level
              mapInstanceRef.current.setView([coords.lat, coords.lon], 8, {
                animate: true,
                duration: 1.0
              });
              
              // Then zoom in by 2 additional levels after a brief delay
              setTimeout(() => {
                if (mapInstanceRef.current) {
                  const currentZoom = mapInstanceRef.current.getZoom();
                  const targetZoom = Math.min(currentZoom + 1, 18);
                  
                  mapInstanceRef.current.setZoom(targetZoom, {
                    animate: true,
                    duration: 0.8
                  });
                  
                  console.log(`🔍 Weather location auto-zoomed from level ${currentZoom} to ${targetZoom} (+1 level)`);
                }
              }, 1200); // Wait for initial centering animation to complete
              
              // Remove previous marker
              if (currentMarkerRef.current) {
                mapInstanceRef.current.removeLayer(currentMarkerRef.current);
              }

              // Add marker for current location
              const marker = window.L.marker([coords.lat, coords.lon], {
                icon: window.L.divIcon({
                  className: 'current-location-marker',
                  html: '<div style="background-color: #10b981; width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); position: relative;"><div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div></div>',
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                })
              }).addTo(mapInstanceRef.current);

              currentMarkerRef.current = marker;
            } catch (error) {
              console.error('Failed to update map with user location:', error);
              logError(error as Error, 'getCurrentLocation', { step: 'map_update' });
            }
          }
          
          setSelectedCoords(coords);
          
          // Reverse geocode and then stop loading
          reverseGeocode(coords.lat, coords.lon)
            .then(() => {
              setIsGettingLocation(false);
            })
            .catch((error) => {
  console.error('Reverse geocoding failed:', error);
  logError(error as Error, 'getCurrentLocation', { step: 'reverse_geocode' });
  setError('Unable to determine your location address. Using coordinates instead.');
  setIsGettingLocation(false);
});
        },
        (error) => {
          console.error('Geolocation error:', error);
          
          // Use centralized error handling
          const handledError = handleLocationError(error);
          logError(new Error(handledError.message), 'getCurrentLocation', { 
            geolocationCode: error.code,
            geolocationMessage: error.message 
          });
          
          let errorMessage = 'Unable to get your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions or use the search form above.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable. Please try again or use the search form above.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again or use the search form above.';
              break;
            default:
              errorMessage = `Location error: ${error.message || 'Unknown error'}. Please try again or use the search form above.`;
              break;
          }
          setError(errorMessage);
          setIsGettingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 30000, // 30 seconds timeout
          maximumAge: 300000 // 5 minutes cache
        }
      );
    } catch (error) {
      console.error('Geolocation setup error:', error);
      logError(error as Error, 'getCurrentLocation', { step: 'setup' });
      setError('Failed to access location services. Please try again or use the search form above.');
      setIsGettingLocation(false);
    }
  };

  // Quick location suggestions for first-time users
  const quickLocations = [
    { name: 'New York, NY', lat: 40.7128, lon: -74.0060 },
    { name: 'Los Angeles, CA', lat: 34.0522, lon: -118.2437 },
    { name: 'Chicago, IL', lat: 41.8781, lon: -87.6298 },
    { name: 'Houston, TX', lat: 29.7604, lon: -95.3698 },
    { name: 'Phoenix, AZ', lat: 33.4484, lon: -112.0740 },
    { name: 'Seattle, WA', lat: 47.6062, lon: -122.3321 }
  ];

  const handleQuickLocation = async (location: { name: string; lat: number; lon: number }) => {
    setHasUserInteracted(true);
    setShowWelcomeMessage(false);
    
    // Center map on selected location
    if (mapInstanceRef.current && mapReady) {
      try {
        // Center map with smooth animation
        mapInstanceRef.current.setView([location.lat, location.lon], 8, {
          animate: true,
          duration: 1.0
        });
        
        // Auto-zoom in by 2 levels for better detail view
        setTimeout(() => {
          if (mapInstanceRef.current) {
            const currentZoom = mapInstanceRef.current.getZoom();
            const targetZoom = Math.min(currentZoom + 2, 18); // Respect max zoom limit
            
            mapInstanceRef.current.setZoom(targetZoom, {
              animate: true,
              duration: 0.8
            });
            
            console.log(`🔍 Quick location auto-zoomed from level ${currentZoom} to ${targetZoom}`);
          }
        }, 1200); // Wait for centering animation
        
        // Remove previous marker
        if (currentMarkerRef.current) {
          mapInstanceRef.current.removeLayer(currentMarkerRef.current);
        }

        // Add marker for selected location
        const marker = window.L.marker([location.lat, location.lon], {
          icon: window.L.divIcon({
            className: 'quick-location-marker',
            html: '<div style="background-color: #f59e0b; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })
        }).addTo(mapInstanceRef.current);

        currentMarkerRef.current = marker;
      } catch (error) {
        console.error('Failed to update map with quick location:', error);
      }
    }
    
    setSelectedCoords({ lat: location.lat, lon: location.lon });
    
    try {
      onLocationSelect(location.name, { lat: location.lat, lon: location.lon });
    } catch (error) {
      console.error('Failed to select location:', error);
      setError('Failed to select location. Please try again.');
    }
  };

  return (
    <div className="weather-card relative overflow-hidden">
      {/* Subtle animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 animate-pulse"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl shadow-lg">
            <MapIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="heading-secondary text-lg sm:text-xl lg:text-2xl">Interactive Weather Map</h3>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600 font-medium">
              Click anywhere on the map to get weather forecast for that location
            </p>
          </div>
          {currentLocation && (
            <div className="hidden sm:flex items-center gap-2 text-sm lg:text-base text-gray-600 
                           bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-2 rounded-xl 
                           border border-green-200 shadow-sm">
              <div className="p-1 bg-green-500 rounded-full">
                <MapPin className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
              </div>
              <div className="hidden lg:block">
                <span className="font-semibold text-green-700">Current:</span>
              </div>
              <span className="truncate max-w-24 lg:max-w-none font-bold text-green-700">
                {currentLocation}
              </span>
            </div>
          )}
        </div>

      {/* Welcome Message for First-Time Users */}
      {showWelcomeMessage && !hasUserInteracted && (
        <div className="mb-3 sm:mb-4 lg:mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 sm:p-4 lg:p-6">
          <div className="text-center">
            <h4 className="font-bold text-blue-800 mb-2 text-base sm:text-lg">Welcome to Cascade Cast! 🌤️</h4>
            <p className="text-blue-700 mb-3 sm:mb-4 text-xs sm:text-sm lg:text-base">
              Get started by choosing how you'd like to find weather information:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4">
              <button
                onClick={getCurrentLocation}
                disabled={isGettingLocation || !mapReady}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors duration-200 text-xs sm:text-sm touch-manipulation flex items-center justify-center gap-2"
              >
                <Navigation className="h-3 w-3 sm:h-4 sm:w-4" />
                Use My Location
              </button>
              
              <div className="text-center">
                <p className="text-blue-600 font-medium mb-1 sm:mb-2 text-xs sm:text-sm">Or try a popular city:</p>
                <div className="grid grid-cols-2 gap-1 sm:gap-2">
                  {quickLocations.slice(0, 4).map((location) => (
                    <button
                      key={location.name}
                      onClick={() => handleQuickLocation(location)}
                      disabled={!mapReady}
                      className="bg-orange-100 hover:bg-orange-200 disabled:bg-gray-100 text-orange-700 px-1 sm:px-2 py-1 rounded text-xs font-medium transition-colors duration-200 touch-manipulation"
                    >
                      {location.name.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="text-left bg-white/50 rounded-lg p-2 sm:p-3 text-xs text-blue-700">
              <p className="font-semibold mb-2">💡 Pro Tips:</p>
              <div className="space-y-1">
                <p>• <strong>Click anywhere</strong> on the map to get weather forecast (auto-zooms for detail)</p>
                <p>• <strong>Use Current Location</strong> button to center and zoom into your position</p>
                <p>• <strong>Auto-zoom</strong> provides detailed view after location selection</p>
              </div>
            </div>
            
            <p className="text-blue-600 text-xs mt-2">
              💡 You can also use the search form above or click anywhere on the map below
            </p>
          </div>
        </div>
      )}

      {/* Current Location Button */}
      {!showWelcomeMessage && (
        <div className="mb-3 sm:mb-4 lg:mb-6">
          <button
            onClick={getCurrentLocation}
            disabled={isGettingLocation || isLoading || !mapReady}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors duration-200 text-xs sm:text-sm lg:text-base touch-manipulation flex items-center justify-center gap-2"
          >
            {isGettingLocation ? (
              <>
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 animate-spin" />
                Getting Location...
              </>
            ) : (
              <>
                <Navigation className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                Use My Current Location
              </>
            )}
          </button>
        </div>
      )}

      {/* Quick Location Buttons for Returning Users */}
      {!showWelcomeMessage && hasUserInteracted && (
        <div className="mb-3 sm:mb-4 lg:mb-6">
          <p className="text-gray-600 text-xs mb-2">Quick locations:</p>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {quickLocations.map((location) => (
              <button
                key={location.name}
                onClick={() => handleQuickLocation(location)}
                disabled={!mapReady}
                className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 px-1 sm:px-2 py-1 rounded text-xs font-medium transition-colors duration-200 touch-manipulation"
              >
                {location.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-3 sm:mb-4 lg:mb-6 bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 lg:p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800 mb-1 text-sm sm:text-base">Notice</h4>
              <p className="text-red-600 text-xs sm:text-sm">{error}</p>
              {!currentLocation && (
                <p className="text-red-500 text-xs mt-1 sm:mt-2">
                  💡 Try using the search form above to find weather for your location
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="relative bg-gray-100 rounded-lg sm:rounded-xl overflow-hidden border-2 border-gray-200" style={{ height: '300px', minHeight: '300px' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
            <div className="text-center">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 animate-spin mx-auto mb-2 sm:mb-4 text-blue-500" />
              <p className="text-xs sm:text-sm lg:text-base font-medium text-gray-700">Loading Interactive Map...</p>
              <p className="text-xs text-gray-500 mt-1 sm:mt-2">Powered by OpenStreetMap</p>
            </div>
          </div>
        )}
        
        <div 
          ref={mapRef} 
          className="w-full h-full relative z-10"
          style={{ 
            minHeight: '300px',
            height: '300px',
            width: '100%',
            position: 'relative'
          }}
        />
        
        {/* Map Status Indicator */}
        {mapReady && (
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-green-500 text-white px-1 sm:px-2 py-1 rounded text-xs font-medium z-30">
            Map Ready
          </div>
        )}
      </div>

      {/* Selected Coordinates Display */}
      {selectedCoords && (
        <div className="mt-3 sm:mt-4 lg:mt-6 bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3 lg:p-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-green-700 mb-1 text-sm sm:text-base">Current Location</h4>
              <p className="text-green-700 text-xs sm:text-sm">
                Latitude: {selectedCoords.lat.toFixed(4)}, Longitude: {selectedCoords.lon.toFixed(4)}
              </p>
              {currentLocation && (
                <p className="font-bold text-green-700 text-xs sm:text-sm mt-1 truncate">{currentLocation}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!showWelcomeMessage && (
        <details className="mt-3 sm:mt-4 lg:mt-6 bg-blue-50 rounded-lg">
          <summary className="p-2 sm:p-3 font-semibold text-blue-800 text-xs sm:text-sm cursor-pointer hover:bg-blue-100 rounded-lg transition-colors">
            How to Use
          </summary>
          <div className="px-2 sm:px-3 pb-2 sm:pb-3 space-y-1 text-xs sm:text-sm text-blue-700">
            <p>• <strong>Click anywhere</strong> on the map to get weather forecast</p>
            <p>• <strong>Use Current Location</strong> button to center on your position</p>
            <p>• <strong>Blue marker</strong> shows selected forecast location</p>
            <p>• <strong className="text-green-700">Green marker</strong> indicates GPS location</p>
          </div>
        </details>
      )}

      {/* Attribution */}
      <div className="mt-2 sm:mt-3 lg:mt-4 text-xs text-gray-500 text-center">
        Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">OpenStreetMap</a> contributors • 
        Weather data powered by <a href="https://www.weather.gov" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">NOAA</a>
      </div>
    </div>
    </div>
  );
};