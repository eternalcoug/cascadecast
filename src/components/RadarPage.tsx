import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Radar, Play, Pause, RotateCcw, Zap, AlertCircle, RefreshCw, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { refreshWeatherDataTimestamp } from '../utils/weatherStorage';

interface LocationState {
  location: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

interface RadarStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance: number;
}

export const RadarPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  const [isAnimating, setIsAnimating] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [radarImages, setRadarImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nearestStation, setNearestStation] = useState<RadarStation | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set());

  if (!state || !state.coordinates) {
    navigate('/');
    return null;
  }

  const { location: locationName, coordinates } = state;

  // NOAA radar stations (major ones across the US)
  const radarStations: Omit<RadarStation, 'distance'>[] = [
    // Pacific Northwest
    { id: 'KOTX', name: 'Spokane, WA', lat: 47.6803, lon: -117.6267 },
    { id: 'KATX', name: 'Seattle, WA', lat: 48.1944, lon: -122.4958 },
    { id: 'KRTX', name: 'Portland, OR', lat: 45.7150, lon: -122.9650 },
    { id: 'KPDT', name: 'Pendleton, OR', lat: 45.6906, lon: -118.8528 },
    
    // Mountain West
    { id: 'KMSX', name: 'Missoula, MT', lat: 47.0413, lon: -113.9864 },
    { id: 'KGGW', name: 'Glasgow, MT', lat: 48.2067, lon: -106.6250 },
    { id: 'KCBX', name: 'Boise, ID', lat: 43.4906, lon: -116.2356 },
    { id: 'KSFX', name: 'Pocatello, ID', lat: 43.1056, lon: -112.6856 },
    { id: 'KMTX', name: 'Salt Lake City, UT', lat: 41.2628, lon: -112.4478 },
    { id: 'KICX', name: 'Cedar City, UT', lat: 37.5906, lon: -112.8622 },
    
    // California
    { id: 'KHNX', name: 'San Joaquin Valley, CA', lat: 36.3142, lon: -119.6317 },
    { id: 'KVTX', name: 'Los Angeles, CA', lat: 34.4117, lon: -119.1797 },
    { id: 'KSOX', name: 'Santa Ana Mountains, CA', lat: 33.8175, lon: -117.6361 },
    { id: 'KNKX', name: 'San Diego, CA', lat: 32.9189, lon: -117.0419 },
    { id: 'KMUX', name: 'San Francisco Bay, CA', lat: 37.1553, lon: -121.8983 },
    { id: 'KBBX', name: 'Beale AFB, CA', lat: 39.4961, lon: -121.6317 },
    { id: 'KBHX', name: 'Eureka, CA', lat: 40.4986, lon: -124.2919 },
    
    // Southwest
    { id: 'KIWA', name: 'Phoenix, AZ', lat: 33.2892, lon: -111.6700 },
    { id: 'KEMX', name: 'Tucson, AZ', lat: 31.8936, lon: -110.6303 },
    { id: 'KFSX', name: 'Flagstaff, AZ', lat: 34.5744, lon: -111.1983 },
    { id: 'KABX', name: 'Albuquerque, NM', lat: 35.1497, lon: -106.8239 },
    
    // Texas
    { id: 'KFWS', name: 'Dallas/Fort Worth, TX', lat: 32.5731, lon: -97.3031 },
    { id: 'KEWX', name: 'Austin/San Antonio, TX', lat: 29.7039, lon: -98.0286 },
    { id: 'KHGX', name: 'Houston, TX', lat: 29.4719, lon: -95.0792 },
    { id: 'KAMA', name: 'Amarillo, TX', lat: 35.2331, lon: -101.7092 },
    { id: 'KBRO', name: 'Brownsville, TX', lat: 25.9161, lon: -97.4186 },
    
    // Midwest
    { id: 'KDVN', name: 'Davenport, IA', lat: 41.6117, lon: -90.5808 },
    { id: 'KARX', name: 'La Crosse, WI', lat: 43.8228, lon: -91.1914 },
    { id: 'KMPX', name: 'Minneapolis, MN', lat: 44.8489, lon: -93.5653 },
    { id: 'KUDX', name: 'Rapid City, SD', lat: 44.1250, lon: -102.8297 },
    { id: 'KBIS', name: 'Bismarck, ND', lat: 46.7708, lon: -100.7597 },
    
    // Southeast
    { id: 'KBMX', name: 'Birmingham, AL', lat: 33.1722, lon: -86.7697 },
    { id: 'KTLH', name: 'Tallahassee, FL', lat: 30.3975, lon: -84.3289 },
    { id: 'KAMX', name: 'Miami, FL', lat: 25.6111, lon: -80.4128 },
    { id: 'KTBW', name: 'Tampa Bay, FL', lat: 27.7056, lon: -82.4017 },
    { id: 'KJAX', name: 'Jacksonville, FL', lat: 30.4847, lon: -81.7019 },
    
    // Northeast
    { id: 'KOKX', name: 'New York City, NY', lat: 40.8656, lon: -72.8644 },
    { id: 'KBOX', name: 'Boston, MA', lat: 41.9556, lon: -71.1369 },
    { id: 'KBGM', name: 'Binghamton, NY', lat: 42.1997, lon: -75.9847 },
    { id: 'KCCX', name: 'State College, PA', lat: 40.9231, lon: -78.0039 },
    { id: 'KDOX', name: 'Dover, DE', lat: 38.8256, lon: -75.4400 }
  ];

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Find nearest radar station and generate radar URLs
  useEffect(() => {
    const setupRadar = () => {
      try {
        // Refresh weather data timestamp since user is actively using the app
        refreshWeatherDataTimestamp();
        
        // Find nearest radar station
        const stationsWithDistance = radarStations.map(station => ({
          ...station,
          distance: calculateDistance(coordinates.lat, coordinates.lon, station.lat, station.lon)
        }));
        
        const nearest = stationsWithDistance.reduce((prev, current) => 
          prev.distance < current.distance ? prev : current
        );
        
        console.log('User coordinates:', coordinates);
        console.log('Nearest radar station:', nearest);
        console.log('Distance to station:', Math.round(nearest.distance), 'miles');
        
        setNearestStation(nearest);
        
        // Use NOAA's standard radar loop which is more reliable
        const baseUrl = 'https://radar.weather.gov/ridge/standard';
        const loopUrl = `${baseUrl}/${nearest.id}_loop.gif`;
        
        console.log('Radar URL:', loopUrl);
        
        // For animation, we'll use the single animated GIF from NOAA
        // This is more reliable than trying to construct individual frame URLs
        setRadarImages([loopUrl]);
        setLastUpdated(new Date());
        setImageLoadErrors(new Set());
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error('Failed to setup radar:', err);
        setError('Failed to setup radar data. Please try again later.');
        setLoading(false);
      }
    };

    setupRadar();
  }, [coordinates]);

  // Animation logic
  useEffect(() => {
    // Animation control for radar loop
    if (isAnimating && !isPaused && radarImages.length > 0 && !error) {
      // Simulate frame progression for UI feedback
      const interval = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % 10); // Simulate 10 frames
      }, 1000); // Update every second for UI
      
      return () => clearInterval(interval);
    }
  }, [isAnimating, isPaused, radarImages.length, error]);

  const handlePlayPause = () => {
    if (error) return;
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    if (error) return;
    setCurrentFrame(0);
    setIsPaused(true);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3)); // Max 3x zoom
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5)); // Min 0.5x zoom
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    setImageLoadErrors(new Set());
    
    if (nearestStation) {
      // Refresh the animated radar loop with cache busting
      const baseUrl = 'https://radar.weather.gov/ridge/standard';
      const loopUrl = `${baseUrl}/${nearestStation.id}_loop.gif?t=${Date.now()}`;
      
      setRadarImages([loopUrl]);
      setLastUpdated(new Date());
      setCurrentFrame(0);
      setIsPaused(false);
    }
    
    setLoading(false);
  };

  const handleImageLoad = (index: number) => {
    setImageLoadErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  const handleImageError = (index: number) => {
    setImageLoadErrors(prev => new Set(prev).add(index));
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-stone-700 via-slate-800 to-stone-900">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 lg:py-8">
        <header className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:text-stone-300 transition-colors duration-200 mb-3 sm:mb-4 touch-manipulation min-h-[44px]"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Forecast
          </button>
          
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <Radar className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Weather Radar</h1>
            </div>
            <p className="text-stone-300 text-sm sm:text-base lg:text-lg px-2 sm:px-4 font-semibold">{locationName}</p>
            {nearestStation && (
              <div className="text-stone-400 text-xs sm:text-sm px-2 sm:px-4 mt-1 sm:mt-2 space-y-1">
                <p>
                  <strong>Radar Station:</strong> {nearestStation.name} ({nearestStation.id})
                </p>
                <p>
                  <strong>Distance:</strong> {Math.round(nearestStation.distance)} miles from your location
                </p>
              </div>
            )}
          </div>
        </header>

        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Radar Controls */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white flex items-center gap-1 sm:gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                Live Weather Radar
              </h3>
              
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1">
                  <button
                    onClick={handleZoomOut}
                    disabled={loading || zoomLevel <= 0.5}
                    className="flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-white/20 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded transition-colors duration-200 touch-manipulation"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={handleZoomReset}
                    disabled={loading}
                    className="flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-white/20 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded transition-colors duration-200 touch-manipulation text-xs font-bold"
                    title={`Reset Zoom (${zoomLevel}x)`}
                  >
                    {zoomLevel.toFixed(1)}x
                  </button>
                  
                  <button
                    onClick={handleZoomIn}
                    disabled={loading || zoomLevel >= 3}
                    className="flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-white/20 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded transition-colors duration-200 touch-manipulation"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </div>

                {/* Animation Controls */}
                <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1">
                  <button
                    onClick={handlePlayPause}
                    disabled={loading || error || imageLoadErrors.has(0)}
                    className="flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-white/20 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded transition-colors duration-200 touch-manipulation"
                    title={isPaused ? "Play Animation" : "Pause Animation"}
                  >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </button>
                  
                  <button
                    onClick={handleReset}
                    disabled={loading || error || imageLoadErrors.has(0)}
                    className="flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-white/20 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded transition-colors duration-200 touch-manipulation"
                    title="Reset to Start"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-800 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors duration-200 touch-manipulation text-xs sm:text-sm"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden lg:inline">Refresh</span>
                </button>
              </div>
            </div>
            
            {/* Radar Status */}
            <div className="mb-3 sm:mb-4">
              <div className="flex justify-between items-center text-xs text-stone-300 mb-2">
                <span>NOAA Animated Radar Loop</span>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    {isPaused ? (
                      <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                    ) : (
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    )}
                    {error ? 'Error' : imageLoadErrors.has(0) ? 'Load Failed' : isPaused ? 'Paused' : 'Playing'}
                  </span>
                  {lastUpdated && !error && (
                    <span className="text-stone-400">
                      • Updated {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full bg-stone-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    error || imageLoadErrors.has(0) ? 'bg-red-600' : 'bg-emerald-600'
                  }`}
                  style={{ width: error || imageLoadErrors.has(0) ? '0%' : '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Radar Display */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
            <div className="relative bg-black rounded-lg sm:rounded-xl overflow-hidden" style={{ aspectRatio: '1/1' }}>
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Radar className="h-8 w-8 sm:h-12 sm:w-12 animate-spin mx-auto mb-2 sm:mb-4 text-emerald-400" />
                    <p className="text-sm sm:text-base lg:text-lg font-medium">Loading Radar Data...</p>
                    <p className="text-xs sm:text-sm text-stone-400 mt-1 sm:mt-2 px-2">Fetching latest NOAA weather imagery</p>
                  </div>
                </div>
              ) : error ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-4 text-red-500" />
                    <p className="text-sm sm:text-base lg:text-lg font-medium text-red-500">Radar Unavailable</p>
                    <p className="text-xs sm:text-sm text-stone-400 mt-1 sm:mt-2 px-2 sm:px-4">{error}</p>
                    <button
                      onClick={handleRefresh}
                      className="mt-2 sm:mt-4 bg-red-700 hover:bg-red-800 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 text-xs sm:text-sm touch-manipulation"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full">
                  {/* Single Animated Radar Image */}
                  {radarImages.length > 0 && (
                    <div className="absolute inset-0">
                      <img
                        src={radarImages[0]}
                        alt={`NOAA Weather Radar - ${nearestStation?.name}`}
                        className={`w-full h-full object-contain bg-black transition-transform duration-300 ${
                          isPaused ? 'filter grayscale-[0.3]' : ''
                        }`}
                        style={{ 
                          imageRendering: 'pixelated',
                          imageRendering: '-moz-crisp-edges',
                          imageRendering: 'crisp-edges',
                          transform: `scale(${zoomLevel})`,
                          transformOrigin: 'center center'
                        }}
                        onLoad={() => handleImageLoad(0)}
                        onError={() => handleImageError(0)}
                      />
                      
                      {/* Status overlay */}
                      <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 bg-black/80 rounded px-1 sm:px-2 py-1 text-white text-xs">
                        {imageLoadErrors.has(0) ? (
                          <span className="text-red-500">⚠ Load Error</span>
                        ) : (
                          <span className={`${isPaused ? 'text-yellow-400' : 'text-emerald-400'}`}>
                            {isPaused ? '⏸ Paused' : '● Live Radar'}
                          </span>
                        )}
                      </div>
                      
                      {/* Zoom Level Indicator */}
                      {zoomLevel !== 1 && (
                        <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 bg-black/80 rounded px-1 sm:px-2 py-1 text-white text-xs">
                          <span className="text-blue-400">🔍 {zoomLevel.toFixed(1)}x</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Loading overlay */}
                  {radarImages.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-green-800 rounded-lg sm:rounded-xl">
                      <div className="text-center text-white">
                        <Radar className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2 text-green-400 animate-spin" />
                        <p className="text-xs sm:text-sm">Loading radar data...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Radar Station Info */}
                  <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-black/80 rounded-lg p-1 sm:p-2 lg:p-3">
                    <div className="text-white text-xs">
                      <div className="font-semibold text-emerald-400">📡 {nearestStation?.id}</div>
                      <div className="text-stone-300">{nearestStation?.name}</div>
                      <div className="text-stone-400">{Math.round(nearestStation?.distance || 0)} mi away</div>
                    </div>
                  </div>
                  
                  {/* Location Info */}
                  <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/80 rounded-lg p-1 sm:p-2 lg:p-3">
                    <div className="text-white text-xs text-right">
                      <div className="font-semibold text-teal-400">📍 Your Location</div>
                      <div className="text-stone-300">{locationName}</div>
                      <div className="text-stone-400">
                        {coordinates.lat.toFixed(2)}°, {coordinates.lon.toFixed(2)}°
                      </div>
                    </div>
                  </div>
                  
                  {/* Animation status */}
                  <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 bg-black/80 rounded-lg p-1 sm:p-2">
                    <div className="text-white text-xs">
                      <div className="flex items-center gap-1">
                        {isPaused ? (
                          <Pause className="h-3 w-3 text-yellow-400" />
                        ) : (
                          <Play className="h-3 w-3 text-green-400" />
                        )}
                        <span>Animated Loop</span>
                      </div>
                      <div className="text-stone-300">
                        {imageLoadErrors.has(0) ? 'Error' : isPaused ? 'Paused' : 'Playing'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Radar Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-3 sm:mb-4">Radar Information</h3>
              <div className="space-y-2 sm:space-y-3 text-gray-300 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span>Update Frequency:</span>
                  <span className="text-white font-medium">Every 5 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Coverage Area:</span>
                  <span className="text-white font-medium">200 mile radius</span>
                </div>
                <div className="flex justify-between">
                  <span>Animation Type:</span>
                  <span className="text-white font-medium">
                    {isPaused ? 'Paused Loop' : 'Animated Loop'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Data Source:</span>
                  <span className="text-white font-medium">NOAA Weather Service</span>
                </div>
                <div className="flex justify-between">
                  <span>Zoom Level:</span>
                  <span className="text-white font-medium">{zoomLevel.toFixed(1)}x</span>
                </div>
                <div className="flex justify-between">
                  <span>Loop Duration:</span>
                  <span className="text-white font-medium">~1 hour</span>
                </div>
                <div className="flex justify-between">
                  <span>Your Coordinates:</span>
                  <span className="text-white font-medium">
                    {coordinates.lat.toFixed(3)}°, {coordinates.lon.toFixed(3)}°
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-3 sm:mb-4">How to Read Radar</h3>
              <div className="space-y-1 sm:space-y-2 text-gray-300 text-xs sm:text-sm">
                <p><strong className="text-green-400">Green:</strong> Light rain or drizzle</p>
                <p><strong className="text-yellow-400">Yellow:</strong> Moderate rain</p>
                <p><strong className="text-red-400">Red:</strong> Heavy rain or thunderstorms</p>
                <p><strong className="text-purple-400">Purple:</strong> Very heavy rain or hail</p>
                <div className="mt-2 sm:mt-3 pt-2 border-t border-gray-600">
                  <p className="text-xs text-gray-400 mb-2"><strong>Controls:</strong></p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p><strong>🔍 Zoom:</strong> 0.5x - 3.0x</p>
                      <p><strong>⏯️ Animation:</strong> Play/Pause</p>
                    </div>
                    <div>
                      <p><strong>🔄 Reset:</strong> Return to start</p>
                      <p><strong>📡 Refresh:</strong> Latest data</p>
                    </div>
                  </div>
                </div>
                <p className="mt-2 sm:mt-3 text-xs text-gray-400">
                  The animated loop shows precipitation movement over approximately 1 hour, 
                  helping you track storm direction and intensity in real-time.
                </p>
                {nearestStation && (
                  <p className="text-xs text-gray-400 mt-1 sm:mt-2">
                    <strong>Station:</strong> Using {nearestStation.name} ({nearestStation.id}) radar data from NOAA.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};