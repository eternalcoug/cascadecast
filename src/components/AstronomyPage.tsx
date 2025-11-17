import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { refreshWeatherDataTimestamp } from '../utils/weatherStorage';
import { ArrowLeft, Sun, Moon, Sunrise, Sunset, Eye, Calendar, Clock, Star, CloudSun, Telescope, Camera, Wind, Thermometer, Droplets, Cloud, Zap, Target, Settings, TrendingUp, AlertTriangle, MapPin, Layers, Activity, Navigation, Binary as Binoculars, Globe } from 'lucide-react';
import {
  calculatePlanetaryVisibility,
  getVisibleDeepSkyObjects,
  getAstronomicalEvents,
  calculateMoonPhase,
  calculateViewingTimes,
  getVisibleConstellations,
  calculateLightPollution,
  generateAstronomyForecast,
  calculateCurrentConditions,
  PlanetaryData,
  DeepSkyObject,
  AstronomicalEvent,
  MoonData
} from '../utils/astronomyCalculations';

interface LocationState {
  location: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
}

export const AstronomyPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  const [selectedView, setSelectedView] = useState<'tonight' | 'planets' | 'deepsky' | 'events'>('tonight');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [planetaryData, setPlanetaryData] = useState<PlanetaryData[]>([]);
  const [deepSkyObjects, setDeepSkyObjects] = useState<DeepSkyObject[]>([]);
  const [astronomicalEvents, setAstronomicalEvents] = useState<AstronomicalEvent[]>([]);
  const [moonData, setMoonData] = useState<MoonData | null>(null);
  const [viewingTimes, setViewingTimes] = useState<any>(null);
  const [lightPollution, setLightPollution] = useState<any>(null);
  const [visibleConstellations, setVisibleConstellations] = useState<string[]>([]);
  const [astronomyForecast, setAstronomyForecast] = useState<any[]>([]);
  const [currentConditions, setCurrentConditions] = useState<any>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    refreshWeatherDataTimestamp();
  }, []);

  // Calculate astronomical data when component mounts or date changes
  useEffect(() => {
    if (!state?.coordinates) return;

    const coords = state.coordinates;
    
    // Calculate all astronomical data
    const planets = calculatePlanetaryVisibility(selectedDate, coords);
    const deepSky = getVisibleDeepSkyObjects(selectedDate, coords);
    const events = getAstronomicalEvents(selectedDate, coords);
    const moon = calculateMoonPhase(selectedDate);
    const times = calculateViewingTimes(selectedDate, coords);
    const pollution = calculateLightPollution(coords);
    const constellations = getVisibleConstellations(selectedDate, coords);
    const forecast = generateAstronomyForecast(selectedDate, coords);
    const conditions = calculateCurrentConditions(selectedDate, coords);
    
    setPlanetaryData(planets);
    setDeepSkyObjects(deepSky);
    setAstronomicalEvents(events);
    setMoonData(moon);
    setViewingTimes(times);
    setLightPollution(pollution);
    setVisibleConstellations(constellations);
    setAstronomyForecast(forecast);
    setCurrentConditions(conditions);
  }, [state?.coordinates, selectedDate]);

  if (!state) {
    navigate('/');
    return null;
  }

  const { location: locationName, coordinates } = state;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEquipmentIcon = (equipment: string) => {
    switch (equipment) {
      case 'naked_eye': return <Eye className="h-4 w-4" />;
      case 'binoculars': return <Binoculars className="h-4 w-4" />;
      case 'small_telescope': return <Telescope className="h-4 w-4" />;
      case 'large_telescope': return <Settings className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getEquipmentColor = (equipment: string) => {
    switch (equipment) {
      case 'naked_eye': return 'text-green-700 bg-green-100';
      case 'binoculars': return 'text-blue-700 bg-blue-100';
      case 'small_telescope': return 'text-purple-700 bg-purple-100';
      case 'large_telescope': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getMagnitudeColor = (magnitude: number) => {
    if (magnitude <= 2) return 'text-green-700 bg-green-100';
    if (magnitude <= 4) return 'text-blue-700 bg-blue-100';
    if (magnitude <= 6) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
  };

  const getDirectionFromAzimuth = (azimuth: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(azimuth / 22.5) % 16;
    return directions[index];
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 lg:py-8">
        <header className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:text-indigo-100 transition-colors duration-200 mb-3 sm:mb-4 touch-manipulation min-h-[44px]"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Forecast
          </button>
          
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="bg-indigo-500 p-2 rounded-lg">
                <Telescope className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Astronomy Viewing Guide</h1>
            </div>
            <p className="text-indigo-100 text-sm sm:text-base lg:text-lg px-2 sm:px-4">
              Complete nightly viewing guide for {locationName}
            </p>
            {coordinates && (
              <p className="text-indigo-200 text-xs sm:text-sm px-2 sm:px-4 mt-1 sm:mt-2">
                {coordinates.lat.toFixed(3)}°N, {Math.abs(coordinates.lon).toFixed(3)}°W
              </p>
            )}
          </div>
        </header>

        {/* Date Selector */}
        <div className="max-w-6xl mx-auto mb-6 sm:mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center justify-center gap-4">
            <label className="text-white font-medium">Viewing Date:</label>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-3 py-2 rounded-lg bg-white text-gray-900 font-medium"
            />
          </div>
        </div>

        {/* View Selection Tabs */}
        <div className="max-w-6xl mx-auto mb-6 sm:mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-1 flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedView('forecast')}
              className={`py-2 px-2 sm:px-3 lg:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex-1 min-w-0 ${
                selectedView === 'forecast'
                  ? 'bg-white text-indigo-900 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <span className="truncate">7-Day Forecast</span>
            </button>
            <button
              onClick={() => setSelectedView('tonight')}
              className={`py-2 px-2 sm:px-3 lg:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex-1 min-w-0 ${
                selectedView === 'tonight'
                  ? 'bg-white text-indigo-900 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <span className="truncate">Tonight's Guide</span>
            </button>
            <button
              onClick={() => setSelectedView('planets')}
              className={`py-2 px-2 sm:px-3 lg:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex-1 min-w-0 ${
                selectedView === 'planets'
                  ? 'bg-white text-indigo-900 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <span className="truncate">Planets</span>
            </button>
            <button
              onClick={() => setSelectedView('deepsky')}
              className={`py-2 px-2 sm:px-3 lg:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex-1 min-w-0 ${
                selectedView === 'deepsky'
                  ? 'bg-white text-indigo-900 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <span className="truncate">Deep Sky</span>
            </button>
            <button
              onClick={() => setSelectedView('events')}
              className={`py-2 px-2 sm:px-3 lg:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex-1 min-w-0 ${
                selectedView === 'events'
                  ? 'bg-white text-indigo-900 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <span className="truncate">Special Events</span>
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          {selectedView === 'forecast' && (
            <>
              {/* Current Sky Conditions */}
              {currentConditions && (
                <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-700" />
                    </div>
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">Current Sky Conditions</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                      <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Visibility Index
                      </h4>
                      <div className="text-center">
                        <div className={`text-4xl font-bold mb-2 ${
                          currentConditions.visibilityIndex >= 8 ? 'text-green-600' :
                          currentConditions.visibilityIndex >= 6 ? 'text-blue-600' :
                          currentConditions.visibilityIndex >= 4 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {currentConditions.visibilityIndex}/10
                        </div>
                        <div className="text-sm text-blue-700 font-medium">{currentConditions.visibilityDescription}</div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-4">
                      <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                        <Cloud className="h-5 w-5" />
                        Atmospheric Transparency
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-purple-700">Seeing:</span>
                          <span className="font-bold">{currentConditions.seeing}" (arcsec)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-700">Transparency:</span>
                          <span className="font-bold">{currentConditions.transparency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-700">Cloud Cover:</span>
                          <span className="font-bold">{currentConditions.cloudCover}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4">
                      <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Observing Conditions
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-emerald-700">Overall Rating:</span>
                          <span className={`font-bold px-2 py-1 rounded-full text-xs ${
                            currentConditions.overallRating === 'Excellent' ? 'bg-green-100 text-green-800' :
                            currentConditions.overallRating === 'Good' ? 'bg-blue-100 text-blue-800' :
                            currentConditions.overallRating === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {currentConditions.overallRating}
                          </span>
                        </div>
                        <div className="text-emerald-600 text-xs">
                          {currentConditions.recommendation}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 7-Day Astronomy Forecast */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-indigo-700" />
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">7-Day Astronomy Forecast</h3>
                </div>
                
                <div className="space-y-4">
                  {astronomyForecast.map((day, index) => (
                    <div key={index} className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-4 border-l-4 border-indigo-500">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                            {day.date}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              day.conditions.overall === 'Excellent' ? 'bg-green-100 text-green-800' :
                              day.conditions.overall === 'Good' ? 'bg-blue-100 text-blue-800' :
                              day.conditions.overall === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {day.conditions.overall}
                            </span>
                          </h4>
                          <p className="text-gray-600 text-sm">{day.conditions.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-indigo-800">Visibility: {day.visibilityIndex}/10</div>
                          <div className="text-sm text-indigo-600">Best: {day.bestViewingWindow}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3 text-sm">
                        <div>
                          <span className="text-gray-600">Cloud Cover:</span>
                          <div className="font-medium">{day.cloudCover}%</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Transparency:</span>
                          <div className="font-medium">{day.transparency}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Seeing:</span>
                          <div className="font-medium">{day.seeing}" arcsec</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Moon Phase:</span>
                          <div className="font-medium">{day.moonPhase} ({day.moonIllumination}%)</div>
                        </div>
                      </div>
                      
                      <div className="bg-white/70 rounded p-3">
                        <p className="text-gray-700 text-sm mb-2"><strong>Tonight's Highlights:</strong></p>
                        <ul className="text-gray-600 text-sm space-y-1">
                          {day.highlights.map((highlight: string, idx: number) => (
                            <li key={idx}>• {highlight}</li>
                          ))}
                        </ul>
                        
                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <p className="text-gray-700 text-xs"><strong>Observing Strategy:</strong> {day.observingStrategy}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Celestial Events Schedule */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <Target className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-yellow-700" />
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">Upcoming Celestial Events</h3>
                </div>
                
                <div className="space-y-4">
                  {astronomyForecast.slice(0, 3).map((day, dayIndex) => 
                    day.celestialEvents.map((event: any, eventIndex: number) => (
                      <div key={`${dayIndex}-${eventIndex}`} className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-4 border-l-4 border-yellow-500">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-yellow-800 text-lg flex items-center gap-2">
                              {event.name}
                              <span className="text-sm bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                                {event.type.replace('_', ' ')}
                              </span>
                            </h4>
                            <p className="text-yellow-600 text-sm">{day.date}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-yellow-800">{event.time}</div>
                            <div className="text-sm text-yellow-600">{event.direction}</div>
                          </div>
                        </div>
                        
                        <div className="bg-white/70 rounded p-3">
                          <p className="text-gray-700 text-sm mb-2">{event.description}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <strong>Equipment:</strong> {event.equipment}
                            </div>
                            <div>
                              <strong>Duration:</strong> {event.duration}
                            </div>
                          </div>
                          <p className="text-gray-600 text-xs mt-2"><strong>Viewing Tips:</strong> {event.viewingTips}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {selectedView === 'tonight' && (
            <>
              {/* Tonight's Overview */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-indigo-700" />
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">Tonight's Viewing Overview</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Viewing Times */}
                  {viewingTimes && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                      <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Optimal Viewing Times
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700">Astronomical Twilight Ends:</span>
                          <span className="font-bold">{formatTime(viewingTimes.astronomicalTwilightEvening)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Best Observing Window:</span>
                          <span className="font-bold">
                            {formatTime(viewingTimes.bestObservingStart)} - {formatTime(viewingTimes.bestObservingEnd)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Astronomical Twilight Begins:</span>
                          <span className="font-bold">{formatTime(viewingTimes.astronomicalTwilightMorning)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Light Pollution */}
                  {lightPollution && (
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-4">
                      <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Sky Quality Assessment
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-purple-700">Bortle Class:</span>
                          <span className="font-bold">{lightPollution.bortleClass} - {lightPollution.description}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-700">Limiting Magnitude:</span>
                          <span className="font-bold">{lightPollution.limitingMagnitude}</span>
                        </div>
                        <div className="mt-3">
                          <p className="text-purple-700 font-medium mb-1">Recommendations:</p>
                          <ul className="text-purple-600 text-xs space-y-1">
                            {lightPollution.recommendations.map((rec: string, index: number) => (
                              <li key={index}>• {rec}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Moon Information */}
                {moonData && (
                  <div className="mt-6 bg-gradient-to-br from-slate-50 to-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Moon className="h-5 w-5" />
                      Moon Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <div className="text-gray-600 text-sm">Phase</div>
                        <div className="font-bold text-gray-800">{moonData.phase}</div>
                        <div className="text-gray-600 text-xs">{moonData.illumination}% illuminated</div>
                      </div>
                      <div>
                        <div className="text-gray-600 text-sm">Rise/Set</div>
                        <div className="font-bold text-gray-800">{formatTime(moonData.riseTime)} - {formatTime(moonData.setTime)}</div>
                        <div className="text-gray-600 text-xs">In {moonData.constellation}</div>
                      </div>
                      <div>
                        <div className="text-gray-600 text-sm">Observable Features</div>
                        <div className="text-xs text-gray-700">
                          {moonData.notableFeatures.length > 0 ? (
                            moonData.notableFeatures.slice(0, 2).join(', ')
                          ) : (
                            'Best for deep sky observing'
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Visible Constellations */}
                <div className="mt-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4">
                  <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                    <Navigation className="h-5 w-5" />
                    Prominent Constellations Tonight
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {visibleConstellations.map((constellation, index) => (
                      <span key={index} className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
                        {constellation}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedView === 'planets' && (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Sun className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-orange-700" />
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">Planetary Visibility</h3>
              </div>
              
              {planetaryData.length > 0 ? (
                <div className="space-y-4">
                  {planetaryData.map((planet, index) => (
                    <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-l-4 border-blue-500">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-blue-800 text-lg flex items-center gap-2">
                            {planet.name}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMagnitudeColor(planet.magnitude)}`}>
                              Mag {planet.magnitude}
                            </span>
                          </h4>
                          <p className="text-blue-600 text-sm">In constellation {planet.constellation}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-800">{formatTime(planet.bestViewingTime)}</div>
                          <div className="text-sm text-blue-600">Best viewing</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3 text-sm">
                        <div>
                          <span className="text-gray-600">Rise Time:</span>
                          <div className="font-medium">{formatTime(planet.riseTime)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Set Time:</span>
                          <div className="font-medium">{formatTime(planet.setTime)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Altitude:</span>
                          <div className="font-medium">{Math.round(planet.altitude)}°</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Direction:</span>
                          <div className="font-medium">{getDirectionFromAzimuth(planet.azimuth)}</div>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 text-sm bg-white/50 rounded p-3">{planet.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sun className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-medium">No planets visible tonight</p>
                  <p className="text-gray-500 text-sm mt-2">Check back tomorrow for updated planetary positions</p>
                </div>
              )}
            </div>
          )}

          {selectedView === 'deepsky' && (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-700" />
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">Deep Sky Objects</h3>
              </div>
              
              <div className="space-y-4">
                {deepSkyObjects.map((object, index) => (
                  <div key={index} className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-purple-800 text-lg flex items-center gap-2">
                          {object.name}
                          <span className="text-sm text-purple-600">({object.catalogNumber})</span>
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium capitalize">
                            {object.type.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMagnitudeColor(object.magnitude)}`}>
                            Mag {object.magnitude}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getEquipmentColor(object.equipment)}`}>
                            {getEquipmentIcon(object.equipment)}
                            {object.equipment.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-purple-800">{formatTime(object.bestViewingTime)}</div>
                        <div className="text-sm text-purple-600">Best viewing</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {Math.round(object.altitude)}° {getDirectionFromAzimuth(object.azimuth)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="bg-white/70 rounded p-3">
                        <p className="text-gray-700 text-sm mb-2"><strong>In {object.constellation}:</strong> {object.description}</p>
                        <p className="text-gray-600 text-xs"><strong>Viewing Tips:</strong> {object.viewingTips}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedView === 'events' && (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-yellow-700" />
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">Special Astronomical Events</h3>
              </div>
              
              {astronomicalEvents.length > 0 ? (
                <div className="space-y-4">
                  {astronomicalEvents.map((event, index) => (
                    <div key={index} className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-4 border-l-4 border-yellow-500">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-yellow-800 text-lg">{event.name}</h4>
                          <p className="text-yellow-600 text-sm capitalize">{event.type.replace('_', ' ')}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-yellow-800">{formatTime(event.time)}</div>
                          {event.duration && (
                            <div className="text-sm text-yellow-600">{event.duration} min duration</div>
                          )}
                          {event.magnitude && (
                            <div className="text-sm text-yellow-600">Mag {event.magnitude}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                        <div>
                          <span className="text-gray-600">Altitude:</span>
                          <span className="font-medium ml-2">{Math.round(event.altitude)}°</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Direction:</span>
                          <span className="font-medium ml-2">{getDirectionFromAzimuth(event.azimuth)}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="bg-white/70 rounded p-3">
                          <p className="text-gray-700 text-sm mb-2">{event.description}</p>
                          <p className="text-gray-600 text-xs"><strong>Viewing Instructions:</strong> {event.viewingInstructions}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-medium">No special events tonight</p>
                  <p className="text-gray-500 text-sm mt-2">Check back for meteor showers, satellite passes, and other events</p>
                </div>
              )}
            </div>
          )}

          {/* Professional Observing Guide */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <Telescope className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-emerald-700" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">Observing Guide & Tips</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 text-sm sm:text-base">Equipment Recommendations</h4>
                <div className="space-y-3 text-xs sm:text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <Eye className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p><strong>Naked Eye:</strong> Planets, bright stars, constellations, Milky Way</p>
                      <p className="text-xs text-gray-500">Limiting magnitude: {lightPollution?.limitingMagnitude || '6.0'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Binoculars className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p><strong>Binoculars (7x50):</strong> Star clusters, double stars, Jupiter's moons</p>
                      <p className="text-xs text-gray-500">Recommended for wide-field views</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Telescope className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p><strong>Small Telescope (4-8"):</strong> Planetary details, nebulae, galaxies</p>
                      <p className="text-xs text-gray-500">Saturn's rings, lunar craters, deep sky objects</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 text-sm sm:text-base">Tonight's Observing Strategy</h4>
                <div className="space-y-2 text-xs sm:text-sm text-gray-600">
                  <p><strong>Start Early (sunset + 1 hour):</strong> Observe planets while they're high in the sky</p>
                  <p><strong>Mid-Evening (9-11 PM):</strong> Bright deep sky objects, double stars</p>
                  <p><strong>Late Night (11 PM - 2 AM):</strong> Faint galaxies and nebulae</p>
                  <p><strong>Pre-Dawn (2-5 AM):</strong> Morning planets, zodiacal light</p>
                  
                  {moonData && moonData.illumination > 50 && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                      <p className="text-yellow-800 text-xs">
                        <strong>Moon Notice:</strong> Bright moon ({moonData.illumination}% illuminated) will wash out faint objects. 
                        Focus on planets, bright stars, and lunar observation.
                      </p>
                    </div>
                  )}
                  
                  {lightPollution && lightPollution.bortleClass > 5 && (
                    <div className="mt-3 p-2 bg-orange-50 rounded border border-orange-200">
                      <p className="text-orange-800 text-xs">
                        <strong>Light Pollution Notice:</strong> Consider driving 30+ minutes away from city lights 
                        for better views of faint deep sky objects.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};