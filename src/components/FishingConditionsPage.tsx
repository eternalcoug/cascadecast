import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Fish, Droplets, Thermometer, Activity, MapPin, RefreshCw, Filter, X, Clock, TrendingUp, AlertCircle, Eye, Waves, Wind, Calendar, Star, Target, Navigation, Settings, BarChart3, Zap, Globe, Loader2, Search, AlertTriangle } from 'lucide-react';
import { refreshWeatherDataTimestamp } from '../utils/weatherStorage';
import { getSavedCoordinates, getSavedLocationName } from '../utils/locationStorage';
import {
  generateFishingLocations,
  fetchLiveWaterData,
  getLocationsNearCoordinates,
  getTopFishingLocations,
  FishingLocation
} from '../utils/fishingData';
import { CityFilterAutocomplete } from './CityFilterAutocomplete';

interface LocationState {
  location: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

interface FishingLocation {
  id: string;
  name: string;
  state: string;
  type: 'river' | 'lake' | 'stream';
  coordinates: {
    lat: number;
    lon: number;
  };
  waterTemp: {
    fahrenheit: number;
    celsius: number;
  };
  flowRate?: {
    value: number;
    unit: 'cfs' | 'feet';
    trend: 'rising' | 'falling' | 'stable';
  };
  clarity: {
    rating: 'excellent' | 'good' | 'fair' | 'poor';
    visibilityDepth: number; // feet
    turbidity: number; // NTU
  };
  fishingScore: number;
  fishingRating: 'excellent' | 'good' | 'fair' | 'poor';
  species: string[];
  conditions: string;
  lastUpdated: Date;
  dataSource: string;
  alerts?: string[];
  historicalData?: {
    avgTemp: number;
    avgFlow: number;
    comparison: 'above' | 'below' | 'normal';
  };
}

interface FishingReport {
  id: string;
  locationId: string;
  angler: string;
  date: string;
  species: string;
  size: string;
  bait: string;
  success: boolean;
  notes: string;
}

export const FishingConditionsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  const [currentLocation, setCurrentLocation] = useState<{
    name: string;
    coordinates: { lat: number; lon: number };
  } | null>(null);
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [zipCode, setZipCode] = useState<string>('');
  const [zipRadius, setZipRadius] = useState<number>(25);
  const [zipCoordinates, setZipCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [zipCodeLoading, setZipCodeLoading] = useState(false);
  const [zipCodeError, setZipCodeError] = useState<string | null>(null);
  const [allLocations, setAllLocations] = useState<FishingLocation[]>([]);
  const [fishingLocations, setFishingLocations] = useState<FishingLocation[]>([]);
  const [fishingReports, setFishingReports] = useState<FishingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [radiusMiles, setRadiusMiles] = useState(25); // miles from zip code
  const [selectedDistance, setSelectedDistance] = useState(25); // Default 25 miles
  const [currentZipCode, setCurrentZipCode] = useState('');
  const [locationName, setLocationName] = useState<string>('');
  const [filterRadiusMiles, setFilterRadiusMiles] = useState<number>(100); // Default 100 miles (show most locations)
  const [enableRadiusFilter, setEnableRadiusFilter] = useState<boolean>(false); // Only enable when coordinates available
  const [cityFilterCoordinates, setCityFilterCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [cityFilterName, setCityFilterName] = useState<string>('');
  const [enableCityFilter, setEnableCityFilter] = useState<boolean>(false);
  const [filterStats, setFilterStats] = useState({
    total: 0,
    filtered: 0,
    byState: {} as Record<string, number>,
    byType: {} as Record<string, number>
  });
  const refreshInterval = 15; // minutes

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    refreshWeatherDataTimestamp();
    
    // Auto-populate location from stored data
    const initializeLocation = () => {
      // First priority: use location passed via navigation state
      if (state?.location && state?.coordinates) {
        setCurrentLocation({
          name: state.location,
          coordinates: state.coordinates
        });
        setLocationName(state.location);
        console.log('Using location from navigation state:', state.location);
        return;
      }
      
      // Second priority: use saved location data
      const savedCoordinates = getSavedCoordinates();
      const savedLocationName = getSavedLocationName();
      
      if (savedCoordinates && savedLocationName) {
        setCurrentLocation({
          name: savedLocationName,
          coordinates: savedCoordinates
        });
        setLocationName(savedLocationName);
        console.log('Auto-populated location from storage:', savedLocationName);
        return;
      }
      
      // No location available - user will need to set one
      console.log('No location data available - user needs to set location');
    };
    
    initializeLocation();
  }, [state]);

  // Generate fishing data for the four specified states
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🎣 Loading fishing locations data...');
        
        const locations: FishingLocation[] = [
          // Washington
          {
            id: 'wa-columbia-river',
            name: 'Columbia River',
            state: 'Washington',
            type: 'river',
            coordinates: { lat: 45.6387, lon: -121.1948 },
            waterTemp: {
              fahrenheit: 52,
              celsius: 11
            },
            flowRate: {
              value: 180000,
              unit: 'cfs',
              trend: 'stable'
            },
            clarity: {
              rating: 'good',
              visibilityDepth: 4.5,
              turbidity: 12
            },
            fishingScore: 8.5,
            fishingRating: 'excellent',
            species: ['Salmon', 'Steelhead', 'Sturgeon'],
            conditions: 'Excellent salmon runs, moderate flow',
            lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000),
            dataSource: 'USGS Station 14105700',
            alerts: ['Peak salmon season through October'],
            historicalData: {
              avgTemp: 54,
              avgFlow: 175000,
              comparison: 'normal'
            }
          },
          {
            id: 'wa-lake-chelan',
            name: 'Lake Chelan',
            state: 'Washington',
            type: 'lake',
            coordinates: { lat: 47.8421, lon: -120.0421 },
            waterTemp: {
              fahrenheit: 58,
              celsius: 14
            },
            flowRate: {
              value: 1098.5,
              unit: 'feet',
              trend: 'stable'
            },
            clarity: {
              rating: 'excellent',
              visibilityDepth: 25,
              turbidity: 2
            },
            fishingScore: 7.8,
            fishingRating: 'good',
            species: ['Lake Trout', 'Rainbow Trout', 'Kokanee'],
            conditions: 'Clear water, good visibility',
            lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000),
            dataSource: 'Lake Chelan Monitoring Station',
            historicalData: {
              avgTemp: 56,
              avgFlow: 1098,
              comparison: 'above'
            }
          },
          {
            id: 'wa-snake-river',
            name: 'Snake River',
            state: 'Washington',
            type: 'river',
            coordinates: { lat: 46.2396, lon: -118.9711 },
            waterTemp: {
              fahrenheit: 55,
              celsius: 13
            },
            flowRate: {
              value: 45000,
              unit: 'cfs',
              trend: 'falling'
            },
            clarity: {
              rating: 'fair',
              visibilityDepth: 2.5,
              turbidity: 25
            },
            fishingScore: 7.2,
            fishingRating: 'good',
            species: ['Steelhead', 'Smallmouth Bass', 'Walleye'],
            conditions: 'Moderate flow, some turbidity',
            lastUpdated: new Date(Date.now() - 3 * 60 * 60 * 1000),
            dataSource: 'USGS Station 13334300',
            alerts: ['Flow decreasing - fish may concentrate in pools'],
            historicalData: {
              avgTemp: 57,
              avgFlow: 52000,
              comparison: 'below'
            }
          },

          // Oregon
          {
            id: 'or-deschutes-river',
            name: 'Deschutes River',
            state: 'Oregon',
            type: 'river',
            coordinates: { lat: 44.7581, lon: -121.0681 },
            waterTemp: {
              fahrenheit: 48,
              celsius: 9
            },
            flowRate: {
              value: 5800,
              unit: 'cfs',
              trend: 'stable'
            },
            clarity: {
              rating: 'excellent',
              visibilityDepth: 12,
              turbidity: 1
            },
            fishingScore: 9.1,
            fishingRating: 'excellent',
            species: ['Rainbow Trout', 'Brown Trout', 'Steelhead'],
            conditions: 'Perfect conditions, clear water',
            lastUpdated: new Date(Date.now() - 30 * 60 * 1000),
            dataSource: 'USGS Station 14076500',
            alerts: ['Prime trout fishing conditions'],
            historicalData: {
              avgTemp: 50,
              avgFlow: 5900,
              comparison: 'normal'
            }
          },
          {
            id: 'or-crater-lake',
            name: 'Crater Lake',
            state: 'Oregon',
            type: 'lake',
            coordinates: { lat: 42.9446, lon: -122.1090 },
            waterTemp: {
              fahrenheit: 42,
              celsius: 6
            },
            clarity: {
              rating: 'excellent',
              visibilityDepth: 100,
              turbidity: 0.5
            },
            fishingScore: 6.5,
            fishingRating: 'fair',
            species: ['Rainbow Trout', 'Kokanee'],
            conditions: 'Deep, clear water - challenging fishing',
            lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000),
            dataSource: 'Crater Lake NP Monitoring',
            alerts: ['Cold water - use deep techniques'],
            historicalData: {
              avgTemp: 45,
              avgFlow: 0,
              comparison: 'below'
            }
          },
          {
            id: 'or-rogue-river',
            name: 'Rogue River',
            state: 'Oregon',
            type: 'river',
            coordinates: { lat: 42.4267, lon: -123.3307 },
            waterTemp: {
              fahrenheit: 54,
              celsius: 12
            },
            flowRate: {
              value: 3200,
              unit: 'cfs',
              trend: 'rising'
            },
            clarity: {
              rating: 'good',
              visibilityDepth: 6,
              turbidity: 8
            },
            fishingScore: 8.3,
            fishingRating: 'excellent',
            species: ['Salmon', 'Steelhead', 'Rainbow Trout'],
            conditions: 'Good salmon runs, optimal flow',
            lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000),
            dataSource: 'USGS Station 14372300',
            alerts: ['Salmon runs active - excellent timing'],
            historicalData: {
              avgTemp: 52,
              avgFlow: 3000,
              comparison: 'above'
            }
          },

          // Idaho
          {
            id: 'id-snake-river',
            name: 'Snake River (Idaho)',
            state: 'Idaho',
            type: 'river',
            coordinates: { lat: 43.6150, lon: -116.2023 },
            waterTemp: {
              fahrenheit: 51,
              celsius: 11
            },
            flowRate: {
              value: 12000,
              unit: 'cfs',
              trend: 'stable'
            },
            clarity: {
              rating: 'good',
              visibilityDepth: 5,
              turbidity: 15
            },
            fishingScore: 7.9,
            fishingRating: 'good',
            species: ['Rainbow Trout', 'Mountain Whitefish', 'Smallmouth Bass'],
            conditions: 'Stable flows, good insect activity',
            lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000),
            dataSource: 'USGS Station 13213000',
            historicalData: {
              avgTemp: 53,
              avgFlow: 11500,
              comparison: 'normal'
            }
          },
          {
            id: 'id-redfish-lake',
            name: 'Redfish Lake',
            state: 'Idaho',
            type: 'lake',
            coordinates: { lat: 44.1548, lon: -114.9228 },
            waterTemp: {
              fahrenheit: 46,
              celsius: 8
            },
            clarity: {
              rating: 'excellent',
              visibilityDepth: 30,
              turbidity: 1
            },
            fishingScore: 8.7,
            fishingRating: 'excellent',
            species: ['Rainbow Trout', 'Bull Trout', 'Mountain Whitefish'],
            conditions: 'Crystal clear alpine lake',
            lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000),
            dataSource: 'Sawtooth NRA Monitoring',
            alerts: ['Alpine conditions - dress warmly'],
            historicalData: {
              avgTemp: 48,
              avgFlow: 0,
              comparison: 'below'
            }
          },
          {
            id: 'id-salmon-river',
            name: 'Salmon River',
            state: 'Idaho',
            type: 'river',
            coordinates: { lat: 45.1804, lon: -114.8420 },
            waterTemp: {
              fahrenheit: 49,
              celsius: 9
            },
            flowRate: {
              value: 8500,
              unit: 'cfs',
              trend: 'stable'
            },
            clarity: {
              rating: 'excellent',
              visibilityDepth: 15,
              turbidity: 3
            },
            fishingScore: 8.9,
            fishingRating: 'excellent',
            species: ['Chinook Salmon', 'Steelhead', 'Rainbow Trout'],
            conditions: 'Excellent salmon habitat, clear water',
            lastUpdated: new Date(Date.now() - 45 * 60 * 1000),
            dataSource: 'USGS Station 13302500',
            alerts: ['Peak salmon season - book guides early'],
            historicalData: {
              avgTemp: 51,
              avgFlow: 8200,
              comparison: 'above'
            }
          },

          // Montana
          {
            id: 'mt-yellowstone-river',
            name: 'Yellowstone River',
            state: 'Montana',
            type: 'river',
            coordinates: { lat: 45.7833, lon: -108.5007 },
            waterTemp: {
              fahrenheit: 53,
              celsius: 12
            },
            flowRate: {
              value: 13500,
              unit: 'cfs',
              trend: 'falling'
            },
            clarity: {
              rating: 'good',
              visibilityDepth: 4,
              turbidity: 18
            },
            fishingScore: 8.4,
            fishingRating: 'excellent',
            species: ['Brown Trout', 'Rainbow Trout', 'Mountain Whitefish'],
            conditions: 'Classic trout water, good hatches',
            lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000),
            dataSource: 'USGS Station 06214500',
            alerts: ['Fall brown trout spawning - use barbless hooks'],
            historicalData: {
              avgTemp: 55,
              avgFlow: 15000,
              comparison: 'below'
            }
          },
          {
            id: 'mt-flathead-lake',
            name: 'Flathead Lake',
            state: 'Montana',
            type: 'lake',
            coordinates: { lat: 47.8960, lon: -114.0730 },
            waterTemp: {
              fahrenheit: 56,
              celsius: 13
            },
            clarity: {
              rating: 'good',
              visibilityDepth: 8,
              turbidity: 10
            },
            fishingScore: 7.6,
            fishingRating: 'good',
            species: ['Lake Trout', 'Yellow Perch', 'Northern Pike'],
            conditions: 'Large lake, variable conditions',
            lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000),
            dataSource: 'Flathead Lake Biological Station',
            historicalData: {
              avgTemp: 54,
              avgFlow: 0,
              comparison: 'above'
            }
          },
          {
            id: 'mt-missouri-river',
            name: 'Missouri River',
            state: 'Montana',
            type: 'river',
            coordinates: { lat: 47.0527, lon: -111.3005 },
            waterTemp: {
              fahrenheit: 50,
              celsius: 10
            },
            flowRate: {
              value: 8200,
              unit: 'cfs',
              trend: 'stable'
            },
            clarity: {
              rating: 'excellent',
              visibilityDepth: 20,
              turbidity: 2
            },
            fishingScore: 9.3,
            fishingRating: 'excellent',
            species: ['Brown Trout', 'Rainbow Trout'],
            conditions: 'World-class trout fishing, perfect conditions',
            lastUpdated: new Date(Date.now() - 30 * 60 * 1000),
            dataSource: 'USGS Station 06115200',
            alerts: ['World-class fishing - consider guided trips'],
            historicalData: {
              avgTemp: 52,
              avgFlow: 8000,
              comparison: 'normal'
            }
          }
        ];

        const reports: FishingReport[] = [
          {
            id: 'report-1',
            locationId: 'or-deschutes-river',
            angler: 'Mike Johnson',
            date: 'Today',
            species: 'Rainbow Trout',
            size: '16 inches',
            bait: 'Dry fly - Adams',
            success: true,
            notes: 'Great morning bite, fish were rising to mayflies'
          },
          {
            id: 'report-2',
            locationId: 'mt-missouri-river',
            angler: 'Sarah Chen',
            date: 'Yesterday',
            species: 'Brown Trout',
            size: '18 inches',
            bait: 'Nymph - Pheasant Tail',
            success: true,
            notes: 'Beautiful fish, fought hard in the current'
          },
          {
            id: 'report-3',
            locationId: 'id-salmon-river',
            angler: 'Tom Wilson',
            date: 'Yesterday',
            species: 'Chinook Salmon',
            size: '24 inches',
            bait: 'Spinner - Blue Fox',
            success: true,
            notes: 'Amazing salmon run this year!'
          },
          {
            id: 'report-4',
            locationId: 'wa-columbia-river',
            angler: 'Lisa Rodriguez',
            date: '2 days ago',
            species: 'Steelhead',
            size: '22 inches',
            bait: 'Drift fishing - Roe',
            success: true,
            notes: 'Perfect conditions, multiple hookups'
          }
        ];

        setFishingLocations(locations);
        setAllLocations(locations);
        setFishingReports(reports);
        setLastRefresh(new Date());
        setLoading(false);
      } catch (err) {
        console.error('Failed to load fishing data:', err);
        setError('Failed to load fishing conditions. Please try again.');
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);
  
  // Update filter statistics
  const updateFilterStats = (locations: FishingLocation[]) => {
    const byState: Record<string, number> = {};
    const byType: Record<string, number> = {};
    
    locations.forEach(location => {
      byState[location.state] = (byState[location.state] || 0) + 1;
      byType[location.type] = (byType[location.type] || 0) + 1;
    });
    
    setFilterStats({
      total: locations.length,
      filtered: filteredLocations.length,
      byState,
      byType
    });
  };
  
  // Calculate distance between two coordinates using Haversine formula
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

  // Get reference coordinates for radius filter
  // Priority: city filter → current location → zip coordinates
  const getReferenceCoordinates = (): { lat: number; lon: number } | null => {
    if (enableCityFilter && cityFilterCoordinates) {
      return cityFilterCoordinates;
    }
    if (currentLocation?.coordinates) {
      return currentLocation.coordinates;
    }
    if (zipCoordinates) {
      return zipCoordinates;
    }
    return null;
  };

  // Handle city filter selection
  const handleCityFilterSelect = (location: any) => {
    console.log('🏙️ City filter selected:', location);
    setCityFilterCoordinates({ lat: location.lat, lon: location.lon });
    setCityFilterName(location.displayName);
    setEnableCityFilter(true);

    // When city filter is active, enable radius filter automatically with default 50 miles
    if (!enableRadiusFilter) {
      setEnableRadiusFilter(true);
      setFilterRadiusMiles(50);
    }
  };

  // Clear city filter
  const handleClearCityFilter = () => {
    setCityFilterCoordinates(null);
    setCityFilterName('');
    setEnableCityFilter(false);
    // When clearing city filter, keep radius filter state as user set it
  };

  // Validate ZIP code format
  const validateZipCode = (zip: string): boolean => {
    return /^\d{5}(-\d{4})?$/.test(zip.trim());
  };

  // Geocode ZIP code to coordinates
  const geocodeZipCode = async (zip: string): Promise<{ lat: number; lon: number } | null> => {
    if (!validateZipCode(zip)) {
      throw new Error('Invalid ZIP code format. Please enter a 5-digit ZIP code.');
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Geocoding service not available.');
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(zip)}&components=country:US&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Failed to geocode ZIP code. Please try again.');
    }

    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error('ZIP code not found. Please enter a valid US ZIP code.');
    }

    const location = data.results[0].geometry.location;
    return {
      lat: location.lat,
      lon: location.lng
    };
  };

  // Handle ZIP code input and geocoding
  const handleZipCodeChange = async (newZipCode: string) => {
    setZipCode(newZipCode);
    setZipCodeError(null);

    if (!newZipCode.trim()) {
      setZipCoordinates(null);
      return;
    }

    if (!validateZipCode(newZipCode)) {
      setZipCodeError('Please enter a valid 5-digit ZIP code');
      return;
    }

    setZipCodeLoading(true);
    
    try {
      const coordinates = await geocodeZipCode(newZipCode);
      setZipCoordinates(coordinates);
      setZipCodeError(null);
    } catch (error) {
      console.error('ZIP code geocoding error:', error);
      setZipCodeError(error instanceof Error ? error.message : 'Failed to find ZIP code location');
      setZipCoordinates(null);
    } finally {
      setZipCodeLoading(false);
    }
  };

  // Enhanced filtering logic with debugging and radius filter
  const filteredLocations = React.useMemo(() => {
    console.log('🔍 Filtering locations with:', {
      selectedState,
      selectedType,
      searchQuery,
      filterRadiusMiles,
      enableRadiusFilter,
      enableCityFilter,
      cityFilterName
    });
    console.log('📊 Total locations available:', allLocations.length);

    if (allLocations.length === 0) {
      console.warn('⚠️ No locations available to filter');
      return [];
    }

    const referenceCoords = getReferenceCoordinates();

    if (enableCityFilter && referenceCoords) {
      console.log(`🏙️ City filter active: ${cityFilterName} at (${referenceCoords.lat}, ${referenceCoords.lon})`);
      console.log(`📏 Filtering within ${filterRadiusMiles} miles radius`);
    }

    let filtered = allLocations.filter(location => {
      // Radius filter (if enabled and coordinates available)
      let radiusMatch = true;
      let distance = 0;
      if (enableRadiusFilter && referenceCoords) {
        distance = calculateDistance(
          referenceCoords.lat,
          referenceCoords.lon,
          location.coordinates.lat,
          location.coordinates.lon
        );
        radiusMatch = distance <= filterRadiusMiles;

        if (enableCityFilter && !radiusMatch) {
          console.log(`⛔ ${location.name} filtered out - ${distance.toFixed(1)} miles from ${cityFilterName} (limit: ${filterRadiusMiles} miles)`);
        } else if (enableCityFilter && radiusMatch) {
          console.log(`✅ ${location.name} included - ${distance.toFixed(1)} miles from ${cityFilterName}`);
        }
      }

      // State filter
      const stateMatch = selectedState === 'all' || location.state === selectedState;

      // Type filter
      const typeMatch = selectedType === 'all' || location.type === selectedType;

      // Search query filter (case-insensitive, multiple fields)
      const searchMatch = searchQuery === '' ||
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.species.some(species => species.toLowerCase().includes(searchQuery.toLowerCase())) ||
        location.conditions.toLowerCase().includes(searchQuery.toLowerCase());

      const matches = radiusMatch && stateMatch && typeMatch && searchMatch;

      if (!matches) {
        console.log(`❌ Location filtered out: ${location.name} (radius: ${radiusMatch}, state: ${stateMatch}, type: ${typeMatch}, search: ${searchMatch})`);
      }

      return matches;
    });

    console.log(`✅ Filtered results: ${filtered.length} out of ${allLocations.length} locations`);

    // Sort by fishing score (best first), then by distance if radius filter is enabled
    if (enableRadiusFilter && referenceCoords) {
      filtered = filtered.sort((a, b) => {
        // Primary sort by fishing score
        if (Math.abs(a.fishingScore - b.fishingScore) > 0.1) {
          return b.fishingScore - a.fishingScore;
        }
        // Secondary sort by distance
        const distA = calculateDistance(referenceCoords.lat, referenceCoords.lon, a.coordinates.lat, a.coordinates.lon);
        const distB = calculateDistance(referenceCoords.lat, referenceCoords.lon, b.coordinates.lat, b.coordinates.lon);
        return distA - distB;
      });
    } else {
      filtered = filtered.sort((a, b) => b.fishingScore - a.fishingScore);
    }

    return filtered;
  }, [allLocations, selectedState, selectedType, searchQuery, filterRadiusMiles, enableRadiusFilter, enableCityFilter, cityFilterName]);
  
  // Update filter stats when filtered results change
  useEffect(() => {
    if (allLocations.length > 0) {
      setFilterStats(prev => ({
        ...prev,
        filtered: filteredLocations.length
      }));
    }
  }, [filteredLocations, allLocations]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;
    
    const handleRefreshAll = async () => {
      console.log('🔄 Auto-refreshing fishing data...');
      setRefreshing(true);
      
      try {
        // Check for saved location data first
        const savedCoordinates = getSavedCoordinates();
        const savedLocationName = getSavedLocationName();
        
        console.log('🎣 Loading fishing data...');
        console.log('Saved coordinates:', savedCoordinates);
        console.log('Saved location name:', savedLocationName);
        
        let locations: FishingLocation[] = [];
        
        if (savedCoordinates) {
          // Use saved coordinates to get nearby locations
          console.log('Using saved coordinates for fishing locations');
          locations = getLocationsNearCoordinates(savedCoordinates, radiusMiles);
          setZipCoordinates(savedCoordinates);
          
          // Try to extract zip code from saved location name
          if (savedLocationName) {
            const zipMatch = savedLocationName.match(/\b\d{5}\b/);
            if (zipMatch) {
              setCurrentZipCode(zipMatch[0]);
            }
          }
        } else if (state?.coordinates) {
          // Use navigation state coordinates
          console.log('Using navigation state coordinates for fishing locations');
          locations = getLocationsNearCoordinates(state.coordinates, radiusMiles);
          setZipCoordinates(state.coordinates);
        } else {
          // Generate all locations as fallback
          console.log('No coordinates available, generating all locations');
          locations = generateFishingLocations();
        }
        console.log(`📊 Generated ${locations.length} fishing locations`);
        setAllLocations(locations);
        
        // If user has coordinates, show nearby locations first
        if (currentLocation?.coordinates) {
          const nearbyLocations = getLocationsNearCoordinates(currentLocation.coordinates, 50);
          console.log(`📍 Found ${nearbyLocations.length} locations within 50 miles`);
          setFishingLocations(nearbyLocations.length > 0 ? nearbyLocations : locations);
        } else {
          // Show top-rated locations if no coordinates
          const topLocations = getTopFishingLocations(20);
          setFishingLocations(topLocations);
        }
        
        setLastRefresh(new Date());
      } catch (err) {
        console.error('❌ Failed to load fishing data:', err);
        setError('Failed to load fishing conditions data. Please check your connection and try again.');
      } finally {
        setRefreshing(false);
      }
    };
    
    const interval = setInterval(handleRefreshAll, refreshInterval * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, radiusMiles, currentLocation, state]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update all locations with fresh data
      const updatedLocations = allLocations.map(location => ({
        ...location,
        lastUpdated: new Date(),
        waterTemp: {
          ...location.waterTemp,
          fahrenheit: location.waterTemp.fahrenheit + (Math.random() - 0.5) * 3,
          celsius: Math.round((location.waterTemp.fahrenheit + (Math.random() - 0.5) * 3 - 32) * 5/9)
        },
        fishingScore: Math.max(1, Math.min(10, location.fishingScore + (Math.random() - 0.5) * 1)),
        flowRate: location.flowRate ? {
          ...location.flowRate,
          value: Math.max(0, location.flowRate.value + (Math.random() - 0.5) * location.flowRate.value * 0.1),
          trend: ['rising', 'falling', 'stable'][Math.floor(Math.random() * 3)] as 'rising' | 'falling' | 'stable'
        } : undefined
      }));
      
      setAllLocations(updatedLocations);
      setFishingLocations(updatedLocations);
      
      setLastRefresh(new Date());
      
      // Calculate filter statistics
      updateFilterStats(updatedLocations);
      
      console.log('✅ Data refreshed successfully');
    } catch (err) {
      console.error('❌ Refresh failed:', err);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  // Clear filters function
  const clearFilters = () => {
    setSelectedState('all');
    setSelectedType('all');
    setSearchQuery('');
    setEnableRadiusFilter(false);
    setFilterRadiusMiles(100);
    handleClearCityFilter();
    console.log('🔄 Filters cleared');
  };

  // Clear all filters function
  const clearAllFilters = () => {
    setSelectedState('all');
    setSelectedType('all');
    setEnableRadiusFilter(false);
    setFilterRadiusMiles(100);
    handleClearCityFilter();
    console.log('🔄 All filters cleared');
    setZipRadius(25);
  };
  
  // Get unique states from locations
  const availableStates = React.useMemo(() => {
    const states = [...new Set(allLocations.map(loc => loc.state))].sort();
    console.log('📍 Available states:', states);
    return states;
  }, [allLocations]);
  
  // Get unique types from locations
  const availableTypes = React.useMemo(() => {
    const types = [...new Set(allLocations.map(loc => loc.type))].sort();
    console.log('🏞️ Available types:', types);
    return types;
  }, [allLocations]);

  const getScoreColor = (score: number) => {
    if (score >= 8.5) return 'text-green-700 bg-green-100';
    if (score >= 7.0) return 'text-blue-700 bg-blue-100';
    if (score >= 5.5) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-green-700 bg-green-100';
      case 'good': return 'text-blue-700 bg-blue-100';
      case 'fair': return 'text-yellow-700 bg-yellow-100';
      case 'poor': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'falling': return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />;
      case 'stable': return <Activity className="h-3 w-3 text-blue-600" />;
      default: return null;
    }
  };

  const getComparisonText = (comparison: string) => {
    switch (comparison) {
      case 'above': return 'Above Average';
      case 'below': return 'Below Average';
      case 'normal': return 'Normal';
      default: return 'Unknown';
    }
  };

  const getComparisonColor = (comparison: string) => {
    switch (comparison) {
      case 'above': return 'text-orange-700';
      case 'below': return 'text-blue-700';
      case 'normal': return 'text-green-700';
      default: return 'text-gray-700';
    }
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Show location prompt if no location is available
  if (!currentLocation && !loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-800">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 lg:py-8">
          <header className="mb-8">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white hover:text-teal-100 transition-colors duration-200 mb-3 sm:mb-4 touch-manipulation min-h-[44px]"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Forecast
            </button>
            
            <div className="text-center text-white">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <div className="bg-teal-500 p-2 rounded-lg">
                  <Fish className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Fishing Conditions</h1>
              </div>
            </div>
          </header>
          
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <MapPin className="h-12 w-12 text-white mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Location Required</h3>
              <p className="text-white/90 mb-6">
                To show fishing conditions near you, please set your location first.
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-white text-teal-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
              >
                Set Location on Home Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-800">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 lg:py-8">
        <header className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:text-teal-100 transition-colors duration-200 mb-3 sm:mb-4 touch-manipulation min-h-[44px]"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Forecast
          </button>
          
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="bg-teal-500 p-2 rounded-lg">
                <Fish className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Fishing Conditions</h1>
            </div>
            <div className="space-y-1">
              <p className="text-blue-100 text-sm sm:text-base lg:text-lg px-2 sm:px-4">
                {locationName || 'Real-time river and lake conditions'}
              </p>
              {currentZipCode && zipCoordinates && (
                <p className="text-blue-200 text-xs sm:text-sm px-2 sm:px-4">
                  📍 Showing locations within {radiusMiles} miles of ZIP {currentZipCode}
                </p>
              )}
              {currentLocation && (
                <p className="text-teal-200 text-xs sm:text-sm px-2 sm:px-4">
                  {currentLocation.coordinates.lat.toFixed(3)}°N, {Math.abs(currentLocation.coordinates.lon).toFixed(3)}°W
                </p>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Live Data Status */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-emerald-700" />
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">Live Data Status</h3>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  className="bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium flex items-center gap-2 touch-manipulation"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Updating...' : 'Refresh'}
                </button>
                
                <label className="flex items-center gap-2 text-white text-sm">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded"
                  />
                  Auto-refresh
                </label>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-white">
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Data Sources</span>
                </div>
                <p className="text-xs text-white/80">USGS, NPS, Local Monitoring Stations</p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-3 w-3" />
                  <span className="text-sm font-medium">Update Frequency</span>
                </div>
                <p className="text-xs text-white/80">Every {refreshInterval} minutes</p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCw className="h-3 w-3" />
                  <span className="text-sm font-medium">Last Updated</span>
                </div>
                <p className="text-xs text-white/80">
                  {lastRefresh ? formatLastUpdated(lastRefresh) : 'Never'}
                </p>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 bg-red-500/20 border border-red-400/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-red-100">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Filter className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-700" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">Filter Locations</h3>
            </div>
            
            <div className="space-y-4">
              {/* Main Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search locations..."
                    className="w-full pl-10 pr-4 py-2 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* State Filter */}
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-4 py-2 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="all">All States</option>
                  {availableStates.map(state => (
                    <option key={state} value={state}>
                      {state} ({filterStats.byState[state] || 0})
                    </option>
                  ))}
                </select>

                {/* Type Filter */}
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-2 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="all">All Types</option>
                  {availableTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}s ({filterStats.byType[type] || 0})
                    </option>
                  ))}
                </select>

                {/* Filter Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={clearFilters}
                    className="flex-1 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2 touch-manipulation"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </button>
                </div>
              </div>

              {/* City/State Filter - Restricted to WA, OR, ID, MT */}
              <div className="bg-white/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-white" />
                    <label className="text-white font-medium text-sm">Filter by City/State</label>
                  </div>
                  {enableCityFilter && (
                    <button
                      onClick={handleClearCityFilter}
                      className="text-white/80 hover:text-white text-xs flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Clear
                    </button>
                  )}
                </div>

                <CityFilterAutocomplete
                  onLocationSelect={handleCityFilterSelect}
                  placeholder="Search city or state (WA, OR, ID, MT)"
                  allowedStates={['WA', 'OR', 'ID', 'MT']}
                />

                {enableCityFilter && cityFilterName && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-white/90 bg-white/10 rounded p-2">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span>Active filter: {cityFilterName}</span>
                    </div>
                    <div className="text-xs text-white/70 italic">
                      Showing locations within {filterRadiusMiles === 100 ? '100+' : filterRadiusMiles} miles. Adjust radius below.
                    </div>
                  </div>
                )}
              </div>

              {/* Distance Radius Filter */}
              <div className="bg-white/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-white" />
                    <label className="text-white font-medium text-sm">Distance Radius</label>
                  </div>
                  <label className="flex items-center gap-2 text-white text-sm">
                    <input
                      type="checkbox"
                      checked={enableRadiusFilter}
                      onChange={(e) => setEnableRadiusFilter(e.target.checked)}
                      disabled={!getReferenceCoordinates() || enableCityFilter}
                      className="rounded"
                      title={enableCityFilter ? "Radius filter is automatically enabled with city filter" : ""}
                    />
                    {enableCityFilter ? 'Auto-enabled' : 'Enable'}
                  </label>
                </div>

                {getReferenceCoordinates() ? (
                  <>
                    <div className="mb-3">
                      <input
                        type="range"
                        min="5"
                        max="100"
                        step="5"
                        value={filterRadiusMiles}
                        onChange={(e) => setFilterRadiusMiles(Number(e.target.value))}
                        disabled={!enableRadiusFilter}
                        className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
                      />
                    </div>

                    <div className="flex items-center justify-between text-white text-sm mb-2">
                      <span className="text-white/70">5 mi</span>
                      <span className="font-bold text-lg">
                        {filterRadiusMiles === 100 ? '100+' : filterRadiusMiles} miles
                      </span>
                      <span className="text-white/70">100+ mi</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-white/90 bg-white/10 rounded p-2">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span>
                        From: {enableCityFilter && cityFilterName
                          ? cityFilterName
                          : (currentLocation?.name || (currentZipCode ? `ZIP ${currentZipCode}` : 'Current Location'))}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-white/70 text-sm bg-white/10 rounded p-3 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>Set a location or use city filter to enable distance filtering</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Filter Results Summary */}
            <div className="mt-4 flex items-center justify-between text-white text-sm">
              <div className="flex items-center gap-4">
                <span>
                  Showing <strong>{filteredLocations.length}</strong> of <strong>{filterStats.total}</strong> locations
                </span>
                {(selectedState !== 'all' || selectedType !== 'all' || searchQuery || enableRadiusFilter) && (
                  <span className="text-white/80">
                    (filtered{enableRadiusFilter ? ` within ${filterRadiusMiles === 100 ? '100+' : filterRadiusMiles} mi` : ''})
                  </span>
                )}
              </div>
              
              {filteredLocations.length === 0 && filterStats.total > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-yellow-300 hover:text-yellow-100 underline"
                >
                  Clear filters to show all
                </button>
              )}
            </div>
          </div>

          {/* Fishing Locations */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="bg-teal-100 p-2 rounded-lg">
                <Fish className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-teal-700" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">
                Fishing Locations ({filteredLocations.length})
              </h3>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading fishing conditions...</p>
              </div>
            ) : filteredLocations.length === 0 ? (
              <div className="text-center py-12">
                <Fish className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-xl font-medium text-gray-600 mb-2">No Locations Found</h4>
                
                {filterStats.total === 0 ? (
                  <div className="space-y-2">
                    <p className="text-gray-500">No fishing locations are currently available.</p>
                    <button
                      onClick={handleManualRefresh}
                      disabled={refreshing}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 mx-auto"
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                      {refreshing ? 'Loading...' : 'Load Data'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-500">
                      No locations match your current filters.
                    </p>
                    
                    <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                      <h5 className="font-medium text-blue-800 mb-2">Current Filters:</h5>
                      <div className="space-y-1 text-sm text-blue-700">
                        {enableCityFilter && cityFilterName && (
                          <div>• City: <strong>{cityFilterName}</strong></div>
                        )}
                        {selectedState !== 'all' && (
                          <div>• State: <strong>{selectedState}</strong></div>
                        )}
                        {selectedType !== 'all' && (
                          <div>• Type: <strong>{selectedType}</strong></div>
                        )}
                        {searchQuery && (
                          <div>• Search: <strong>"{searchQuery}"</strong></div>
                        )}
                        {enableRadiusFilter && (
                          <div>• Distance: <strong>Within {filterRadiusMiles === 100 ? '100+' : filterRadiusMiles} miles</strong></div>
                        )}
                      </div>
                      {enableCityFilter && filterRadiusMiles < 100 && (
                        <div className="mt-3 pt-3 border-t border-blue-200 text-sm text-blue-700">
                          💡 Try increasing the radius to see more locations
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-gray-600 text-sm">Try:</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {enableCityFilter && filterRadiusMiles < 100 && (
                          <button
                            onClick={() => setFilterRadiusMiles(Math.min(filterRadiusMiles + 25, 100))}
                            className="bg-teal-100 hover:bg-teal-200 text-teal-800 px-3 py-1 rounded-full text-sm font-medium"
                          >
                            Increase Radius to {Math.min(filterRadiusMiles + 25, 100)} mi
                          </button>
                        )}
                        {selectedState !== 'all' && (
                          <button
                            onClick={() => setSelectedState('all')}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm"
                          >
                            All States
                          </button>
                        )}
                        {selectedType !== 'all' && (
                          <button
                            onClick={() => setSelectedType('all')}
                            className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm"
                          >
                            All Types
                          </button>
                        )}
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm"
                          >
                            Clear Search
                          </button>
                        )}
                        <button
                          onClick={clearFilters}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {filteredLocations.map((location) => {
                  const referenceCoords = getReferenceCoordinates();
                  const distance = referenceCoords
                    ? calculateDistance(
                        referenceCoords.lat,
                        referenceCoords.lon,
                        location.coordinates.lat,
                        location.coordinates.lon
                      )
                    : null;

                  return (
                    <div key={location.id} className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg p-4 sm:p-5 border border-blue-200 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 text-lg">{location.name}</h4>
                          <div className="flex items-center flex-wrap gap-2 text-sm">
                            <span className="text-gray-600">{location.state} • {location.type}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getRatingColor(location.fishingRating)}`}>
                              {location.fishingRating}
                            </span>
                            {distance !== null && (
                              <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                <Navigation className="h-3 w-3" />
                                {distance.toFixed(1)} mi
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(location.fishingScore)}`}>
                          {location.fishingScore}/10
                        </div>
                      </div>
                    
                    {/* Alerts */}
                    {location.alerts && location.alerts.length > 0 && (
                      <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                          <span className="text-xs font-medium text-amber-800">Alert</span>
                        </div>
                        <p className="text-xs text-amber-700">{location.alerts[0]}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                      <div className="bg-white/70 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Thermometer className="h-4 w-4 text-orange-600" />
                          <span className="text-xs font-medium text-gray-700">Water Temp</span>
                        </div>
                        <div className="text-sm font-bold text-orange-700">
                          {Math.round(location.waterTemp.fahrenheit)}°F
                          <span className="text-xs text-gray-600 ml-1">
                            ({Math.round(location.waterTemp.celsius)}°C)
                          </span>
                        </div>
                        {location.historicalData && (
                          <div className={`text-xs mt-1 ${getComparisonColor(location.historicalData.comparison)}`}>
                            {getComparisonText(location.historicalData.comparison)}
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-white/70 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Eye className="h-4 w-4 text-blue-600" />
                          <span className="text-xs font-medium text-gray-700">Clarity</span>
                        </div>
                        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${getRatingColor(location.clarity.rating)}`}>
                          {location.clarity.rating}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {location.clarity.visibilityDepth}ft visibility
                        </div>
                      </div>
                      
                      {location.flowRate && (
                        <div className="bg-white/70 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Waves className="h-4 w-4 text-teal-600" />
                            <span className="text-xs font-medium text-gray-700">
                              {location.type === 'lake' ? 'Water Level' : 'Flow Rate'}
                            </span>
                            {getTrendIcon(location.flowRate.trend)}
                          </div>
                          <div className="text-sm font-bold text-teal-700">
                            {location.flowRate.value.toLocaleString()} {location.flowRate.unit.toUpperCase()}
                          </div>
                          <div className="text-xs text-gray-600 mt-1 capitalize">
                            {location.flowRate.trend}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Environmental Details */}
                    <div className="mb-3 bg-white/50 rounded-lg p-3">
                      <h5 className="font-semibold text-gray-700 mb-2 text-sm">Environmental Data</h5>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-600">Turbidity:</span>
                          <span className="font-medium ml-1">{location.clarity.turbidity} NTU</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Data Source:</span>
                          <span className="font-medium ml-1">{location.dataSource}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <h5 className="font-semibold text-gray-700 mb-2 text-sm">Fish Species</h5>
                      <div className="flex flex-wrap gap-1">
                        {location.species.map((species, index) => (
                          <span key={index} className="bg-teal-100 text-teal-800 px-2 py-1 rounded-full text-xs font-medium">
                            {species}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="bg-white/50 rounded p-2">
                        <p className="text-gray-700 text-sm">{location.conditions}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Updated {formatLastUpdated(location.lastUpdated)}</span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span>Live Data</span>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Data Explanation */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-indigo-700" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">Understanding the Data</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Environmental Measurements</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <strong className="text-blue-700">Flow Rate (CFS):</strong>
                    <p className="text-gray-600">Cubic feet per second. Higher flows can make fishing challenging but bring fresh oxygen.</p>
                  </div>
                  <div>
                    <strong className="text-orange-700">Water Temperature:</strong>
                    <p className="text-gray-600">Optimal range: 50-70°F. Fish are more active in comfortable temperatures.</p>
                  </div>
                  <div>
                    <strong className="text-teal-700">Water Clarity:</strong>
                    <p className="text-gray-600">Visibility depth in feet. Clear water requires more stealth and natural presentations.</p>
                  </div>
                  <div>
                    <strong className="text-purple-700">Turbidity (NTU):</strong>
                    <p className="text-gray-600">Nephelometric Turbidity Units. Lower values indicate clearer water.</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Fishing Success Indicators</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span><strong>Excellent (8.5-10):</strong> Prime conditions, high success probability</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span><strong>Good (7.0-8.4):</strong> Favorable conditions, good fishing expected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span><strong>Fair (5.5-6.9):</strong> Moderate conditions, patience required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span><strong>Poor (1.0-5.4):</strong> Challenging conditions, consider alternatives</span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-2">Pro Tips</h5>
                  <ul className="text-blue-700 text-xs space-y-1">
                    <li>• Rising water often triggers feeding activity</li>
                    <li>• Stable conditions are ideal for consistent fishing</li>
                    <li>• Clear water requires lighter lines and natural baits</li>
                    <li>• Cooler water slows fish metabolism - fish deeper</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Fishing Reports */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="bg-green-100 p-2 rounded-lg">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-700" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">Recent Fishing Reports</h3>
            </div>
            
            <div className="space-y-4">
              {fishingReports.map((report) => {
                const location = fishingLocations.find(loc => loc.id === report.locationId);
                return (
                  <div key={report.id} className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-gray-800">{location?.name}</h4>
                        <p className="text-gray-600 text-sm">{location?.state}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-700">{report.date}</div>
                        <div className={`text-xs px-2 py-1 rounded-full ${report.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {report.success ? 'Success' : 'No Luck'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-sm">
                      <div>
                        <span className="text-gray-600">Species:</span>
                        <div className="font-medium text-gray-800">{report.species}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Size:</span>
                        <div className="font-medium text-gray-800">{report.size}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Bait:</span>
                        <div className="font-medium text-gray-800">{report.bait}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Angler:</span>
                        <div className="font-medium text-gray-800">{report.angler}</div>
                      </div>
                    </div>
                    
                    <div className="bg-white/70 rounded p-3">
                      <p className="text-gray-700 text-sm italic">"{report.notes}"</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};