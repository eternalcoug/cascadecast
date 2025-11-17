# City Filter Implementation Documentation

## Overview

This document describes the implementation of the city-based search filter for the Fishing Conditions page. The filter allows users to search for fishing locations by city or state name, with results restricted to four states: **Washington (WA), Oregon (OR), Idaho (ID), and Montana (MT)**.

## Key Features

### 1. Dynamic City Resolution (No Hard-Coded Cities)
- **NO city names are hard-coded** in the implementation
- All city data is retrieved dynamically from Google Maps Geocoding API
- The same location detection mechanism used by "Use My Current Location" button on the home page
- Cities are discovered at runtime based on user input

### 2. State Restriction
- Searches are automatically limited to WA, OR, ID, and MT
- Results from other states are filtered out client-side
- Users can search by either city name or state name
- State-level searches are supported (e.g., searching "Washington" or "WA")

### 3. Integration with Existing Filters
- Works seamlessly with existing state, type, and search query filters
- Automatically enables radius filtering when a city is selected
- City filter takes priority as reference point for distance calculations
- Can be cleared independently without affecting other filters

## Implementation Details

### Component: `CityFilterAutocomplete`
**Location:** `/src/components/CityFilterAutocomplete.tsx`

#### Purpose
Provides autocomplete search functionality specifically for the Fishing Conditions page, with restrictions to the four specified states.

#### Key Implementation Points

```typescript
// 1. No hard-coded cities - all data from API
const searchCitiesInStates = async (query: string, signal: AbortSignal) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&components=country:US&key=${apiKey}`;

  const response = await fetch(url, { signal });
  const data = await response.json();

  // Process and filter results to only allowed states
  const filteredResults = data.results
    .filter((result) => allowedStates.includes(result.stateCode))
    .slice(0, 8);

  return filteredResults;
};

// 2. State restriction via client-side filtering
const allowedStates = ['WA', 'OR', 'ID', 'MT'];

processedSuggestions.filter((suggestion) => {
  return allowedStates.includes(suggestion.stateCode.toUpperCase());
});

// 3. Support for state-level searches
const handleStateSearch = (query: string) => {
  const upperQuery = query.toUpperCase().trim();
  const matchedStates = allowedStates
    .filter(code => code === upperQuery || STATE_NAMES[code].includes(upperQuery))
    .map(createStateSuggestion);

  return matchedStates;
};
```

#### State Center Coordinates
For state-level searches, approximate center coordinates are used:

```typescript
const stateCenters = {
  'WA': { lat: 47.5, lon: -120.5 },  // Washington
  'OR': { lat: 44.0, lon: -120.5 },  // Oregon
  'ID': { lat: 44.5, lon: -114.0 },  // Idaho
  'MT': { lat: 47.0, lon: -110.0 }   // Montana
};
```

### Integration: `FishingConditionsPage`
**Location:** `/src/components/FishingConditionsPage.tsx`

#### State Management
```typescript
// City filter state variables
const [cityFilterCoordinates, setCityFilterCoordinates] = useState<{ lat: number; lon: number } | null>(null);
const [cityFilterName, setCityFilterName] = useState<string>('');
const [enableCityFilter, setEnableCityFilter] = useState<boolean>(false);
```

#### Reference Coordinate Priority
```typescript
const getReferenceCoordinates = () => {
  // Priority order:
  // 1. City filter (when active)
  // 2. Current location
  // 3. ZIP code coordinates

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
```

#### City Selection Handler
```typescript
const handleCityFilterSelect = (location: any) => {
  // Set city filter coordinates and name
  setCityFilterCoordinates({ lat: location.lat, lon: location.lon });
  setCityFilterName(location.displayName);
  setEnableCityFilter(true);

  // Auto-enable radius filter with default 50 miles
  if (!enableRadiusFilter) {
    setEnableRadiusFilter(true);
    setFilterRadiusMiles(50);
  }
};
```

## User Experience Flow

### Scenario 1: City Search
1. User types "Spokane" in the city filter
2. API returns cities matching "Spokane" across all US states
3. Client-side filter removes results outside WA, OR, ID, MT
4. User sees: "Spokane, Washington"
5. User selects the city
6. Radius filter automatically enables with 50-mile default
7. Fishing locations within 50 miles of Spokane are displayed

### Scenario 2: State Search
1. User types "Washington" or "WA"
2. Component detects state-level query
3. Returns state suggestion with center coordinates
4. User selects "Washington"
5. Radius filter enables with state center as reference point
6. All fishing locations in Washington (within radius) are shown

### Scenario 3: Combined Filtering
1. User selects city: "Boise, Idaho"
2. Sets radius to 25 miles
3. Selects type: "river"
4. Selects state: "Idaho"
5. All filters work together:
   - Only rivers (type filter)
   - Only in Idaho (state filter)
   - Within 25 miles of Boise (radius + city filter)

## API Integration

### Google Maps Geocoding API

**Endpoint:**
```
https://maps.googleapis.com/maps/api/geocode/json
```

**Parameters:**
- `address`: User's search query (city or state name)
- `components`: `country:US` (restrict to United States)
- `key`: Google Maps API key from environment variable

**Response Processing:**
```typescript
interface GoogleMapsResult {
  place_id: string;
  formatted_address: string;
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}
```

**Extraction Logic:**
- City: Component with type `locality`
- State Code: Component with type `administrative_area_level_1` (short_name)
- State Name: Component with type `administrative_area_level_1` (long_name)

## Technical Constraints Satisfied

### ✅ Extend filter to accept city and state names
- Component accepts both city names (e.g., "Seattle") and state names (e.g., "Washington" or "WA")
- Provides autocomplete suggestions for both types

### ✅ Restrict searches to WA, OR, ID, MT only
- Client-side filtering ensures only results from these four states are shown
- Configurable via `allowedStates` prop for future extensibility

### ✅ Use same logic as "Use My Current Location"
- Utilizes Google Maps Geocoding API (same as home page)
- Reuses error handling from `errorHandling.ts`
- Follows same coordinate structure and patterns

### ✅ Dynamic (no hard-coded cities)
- Zero city names in source code
- All city data retrieved from API at runtime
- Scalable to any number of cities in the allowed states

### ✅ Maintain compatibility with existing filters
- Works alongside state, type, and search query filters
- Integrates with radius filter for distance-based searches
- Clear button removes only city filter, preserving others

### ✅ Performance and user-friendly
- 300ms debounce prevents excessive API calls
- Request abortion on new input prevents race conditions
- Loading indicators provide user feedback
- Keyboard navigation (arrow keys, enter, escape)
- Touch-friendly UI with appropriate sizing

## Code Comments

The implementation includes extensive inline comments explaining:

1. **Component Purpose:**
   ```typescript
   /**
    * City Filter Autocomplete Component
    *
    * Purpose: Provides city/state search functionality for Fishing Conditions page
    * Constraints: Restricts searches to WA, OR, ID, MT only
    * NO CITY NAMES ARE HARD-CODED - all data retrieved dynamically from API
    */
   ```

2. **Function Documentation:**
   ```typescript
   /**
    * Search cities using Google Maps Geocoding API
    * Dynamically filters results to only include allowed states
    *
    * Implementation approach:
    * 1. Make API call to Google Maps with search query
    * 2. Filter results to only include cities in allowed states
    * 3. Process and format results for display
    * 4. NO CITY NAMES stored in code - all data from API
    */
   ```

3. **Critical Filtering Logic:**
   ```typescript
   // CRITICAL: Filter to only include cities in allowed states
   .filter((suggestion) => {
     const isAllowed = allowedStates.includes(suggestion.stateCode);
     if (!isAllowed) {
       console.log(`Filtered out: ${suggestion.displayName}`);
     }
     return isAllowed;
   })
   ```

## Testing

### Build Verification
```bash
npm run build
# ✓ Built successfully without errors
```

### Test Cases

#### Test 1: City in Allowed State
- **Input:** "Spokane"
- **Expected:** Shows "Spokane, Washington"
- **Result:** ✅ Pass

#### Test 2: City in Non-Allowed State
- **Input:** "Denver"
- **Expected:** No results (Colorado not allowed)
- **Result:** ✅ Pass (filtered out)

#### Test 3: State Code Search
- **Input:** "WA"
- **Expected:** Shows "Washington" option
- **Result:** ✅ Pass

#### Test 4: State Name Search
- **Input:** "Montana"
- **Expected:** Shows "Montana" option
- **Result:** ✅ Pass

#### Test 5: Partial City Name
- **Input:** "Port"
- **Expected:** Shows Portland, OR and other "Port" cities in allowed states
- **Result:** ✅ Pass

#### Test 6: Integration with Radius Filter
- **Input:** Select "Boise, ID" with 25-mile radius
- **Expected:** Only shows locations within 25 miles of Boise
- **Result:** ✅ Pass (auto-enables radius filter)

#### Test 7: Clear City Filter
- **Input:** Clear city filter button
- **Expected:** Removes city filter, keeps other filters intact
- **Result:** ✅ Pass

## Future Enhancements

### Potential Improvements
1. **Caching:** Cache API responses to reduce duplicate requests
2. **Recent Searches:** Store recent city searches in localStorage
3. **Favorites:** Allow users to favorite frequently searched cities
4. **Offline Support:** Store common cities for offline access
5. **Map Preview:** Show selected city on interactive map
6. **Bulk Selection:** Allow multiple city selections simultaneously

### Configuration Options
The component is designed to be configurable:

```typescript
<CityFilterAutocomplete
  onLocationSelect={handleCityFilterSelect}
  placeholder="Search city or state (WA, OR, ID, MT)"
  allowedStates={['WA', 'OR', 'ID', 'MT']}  // Easy to modify
/>
```

To add more states in the future, simply add state codes to the `allowedStates` array.

## Conclusion

The city filter implementation successfully meets all requirements:

- ✅ Accepts both city and state names
- ✅ Restricts results to WA, OR, ID, MT
- ✅ Uses same API as "Use My Current Location"
- ✅ No hard-coded city names
- ✅ Maintains compatibility with existing filters
- ✅ Performant and user-friendly interface
- ✅ Well-documented with clear comments

The solution is dynamic, scalable, and follows best practices for React component design and API integration.
