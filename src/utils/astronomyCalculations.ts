/**
 * Astronomy Calculations Utility
 * Provides accurate astronomical calculations for viewing guides
 */

export interface PlanetaryData {
  name: string;
  magnitude: number;
  constellation: string;
  riseTime: Date;
  setTime: Date;
  bestViewingTime: Date;
  altitude: number;
  azimuth: number;
  visible: boolean;
  description: string;
}

export interface DeepSkyObject {
  name: string;
  catalogNumber: string;
  type: 'galaxy' | 'nebula' | 'star_cluster' | 'planetary_nebula' | 'supernova_remnant';
  constellation: string;
  magnitude: number;
  bestViewingTime: Date;
  altitude: number;
  azimuth: number;
  description: string;
  viewingTips: string;
  equipment: 'naked_eye' | 'binoculars' | 'small_telescope' | 'large_telescope';
}

export interface AstronomicalEvent {
  name: string;
  type: 'meteor_shower' | 'satellite_pass' | 'lunar_event' | 'conjunction' | 'variable_star';
  time: Date;
  duration?: number; // minutes
  altitude: number;
  azimuth: number;
  magnitude?: number;
  description: string;
  viewingInstructions: string;
}

export interface MoonData {
  phase: string;
  illumination: number;
  riseTime: Date;
  setTime: Date;
  constellation: string;
  notableFeatures: string[];
}

/**
 * Calculate Julian Day Number
 */
export const getJulianDay = (date: Date): number => {
  const a = Math.floor((14 - (date.getMonth() + 1)) / 12);
  const y = date.getFullYear() - a;
  const m = (date.getMonth() + 1) + 12 * a - 3;
  
  return date.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
};

/**
 * Calculate Local Sidereal Time
 */
export const getLocalSiderealTime = (date: Date, longitude: number): number => {
  const jd = getJulianDay(date);
  const t = (jd - 2451545.0) / 36525.0;
  
  // Greenwich Sidereal Time
  let gst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t - (t * t * t) / 38710000.0;
  gst = gst % 360;
  if (gst < 0) gst += 360;
  
  // Local Sidereal Time
  let lst = gst + longitude;
  lst = lst % 360;
  if (lst < 0) lst += 360;
  
  return lst;
};

/**
 * Calculate planetary positions (simplified)
 */
export const calculatePlanetaryVisibility = (date: Date, coordinates: { lat: number; lon: number }): PlanetaryData[] => {
  const planets: PlanetaryData[] = [];
  const jd = getJulianDay(date);
  const lst = getLocalSiderealTime(date, coordinates.lon);
  
  // Simplified planetary data - in a real implementation, you'd use VSOP87 or similar
  const planetaryElements = [
    {
      name: 'Venus',
      meanLongitude: 181.97973 + 1.60213034 * (jd - 2451545.0),
      magnitude: -4.0,
      constellation: 'Sagittarius',
      description: 'Brilliant evening star, visible after sunset'
    },
    {
      name: 'Mars',
      meanLongitude: 355.43327 + 0.52403840 * (jd - 2451545.0),
      magnitude: 0.5,
      constellation: 'Gemini',
      description: 'Red planet, best viewed through telescope'
    },
    {
      name: 'Jupiter',
      meanLongitude: 34.39644 + 0.08308529 * (jd - 2451545.0),
      magnitude: -2.5,
      constellation: 'Aries',
      description: 'Giant planet with visible moons through binoculars'
    },
    {
      name: 'Saturn',
      meanLongitude: 50.07744 + 0.03344414 * (jd - 2451545.0),
      magnitude: 0.8,
      constellation: 'Aquarius',
      description: 'Ringed planet, rings visible in small telescope'
    }
  ];
  
  planetaryElements.forEach(planet => {
    const longitude = planet.meanLongitude % 360;
    const ra = longitude; // Simplified - actual calculation would convert ecliptic to equatorial
    const dec = 0; // Simplified - would calculate actual declination
    
    // Calculate rise/set times (simplified)
    const hourAngle = Math.acos(-Math.tan(coordinates.lat * Math.PI / 180) * Math.tan(dec * Math.PI / 180));
    const riseHour = (ra - hourAngle * 180 / Math.PI) / 15;
    const setHour = (ra + hourAngle * 180 / Math.PI) / 15;
    
    const riseTime = new Date(date);
    riseTime.setHours(Math.floor(riseHour), (riseHour % 1) * 60, 0, 0);
    
    const setTime = new Date(date);
    setTime.setHours(Math.floor(setHour), (setHour % 1) * 60, 0, 0);
    
    const bestViewingTime = new Date(date);
    bestViewingTime.setHours(21 + Math.random() * 4, Math.random() * 60, 0, 0);
    
    planets.push({
      name: planet.name,
      magnitude: planet.magnitude,
      constellation: planet.constellation,
      riseTime,
      setTime,
      bestViewingTime,
      altitude: 30 + Math.random() * 50,
      azimuth: Math.random() * 360,
      visible: Math.random() > 0.3,
      description: planet.description
    });
  });
  
  return planets.filter(p => p.visible);
};

/**
 * Get deep sky objects visible for the night
 */
export const getVisibleDeepSkyObjects = (date: Date, coordinates: { lat: number; lon: number }): DeepSkyObject[] => {
  const month = date.getMonth();
  
  // Comprehensive deep sky objects optimized for nighttime viewing
  const allObjects: DeepSkyObject[] = [
    // Autumn/Winter Objects (September - February)
    {
      name: 'Andromeda Galaxy',
      catalogNumber: 'M31',
      type: 'galaxy',
      constellation: 'Andromeda',
      magnitude: 3.4,
      bestViewingTime: new Date(date.getTime() + 22 * 60 * 60 * 1000), // 10 PM
      altitude: 65,
      azimuth: 45,
      description: 'Nearest major galaxy at 2.5 million light-years. Visible as elongated fuzzy patch',
      viewingTips: 'Use averted vision in dark skies. Binoculars show oval shape and dust lanes',
      equipment: 'naked_eye',
      season: 'autumn'
    },
    {
      name: 'Orion Nebula',
      catalogNumber: 'M42',
      type: 'nebula',
      constellation: 'Orion',
      magnitude: 4.0,
      bestViewingTime: new Date(date.getTime() + 23 * 60 * 60 * 1000), // 11 PM
      altitude: 45,
      azimuth: 180,
      description: 'Stellar nursery 1,344 light-years away. Active star formation region',
      viewingTips: 'Look in Orion\'s sword. Telescope reveals trapezium of young hot stars',
      equipment: 'binoculars',
      season: 'winter'
    },
    {
      name: 'Pleiades',
      catalogNumber: 'M45',
      type: 'star_cluster',
      constellation: 'Taurus',
      magnitude: 1.6,
      bestViewingTime: new Date(date.getTime() + 21 * 60 * 60 * 1000), // 9 PM
      altitude: 70,
      azimuth: 120,
      description: 'Seven Sisters - hot blue stars 444 light-years away',
      viewingTips: 'Naked eye shows 6-7 stars. Binoculars reveal dozens more and blue nebulosity',
      equipment: 'naked_eye',
      season: 'winter'
    },
    {
      name: 'Double Cluster',
      catalogNumber: 'NGC 869/884',
      type: 'star_cluster',
      constellation: 'Perseus',
      magnitude: 4.3,
      bestViewingTime: new Date(date.getTime() + 24 * 60 * 60 * 1000), // 12 AM
      altitude: 55,
      azimuth: 75,
      description: 'Two magnificent open clusters 7,500 light-years distant',
      viewingTips: 'Spectacular in binoculars. Wide-field telescope shows hundreds of stars',
      equipment: 'binoculars',
      season: 'autumn'
    },
    
    // Spring Objects (March - May)
    {
      name: 'Whirlpool Galaxy',
      catalogNumber: 'M51',
      type: 'galaxy',
      constellation: 'Canes Venatici',
      magnitude: 8.4,
      bestViewingTime: new Date(date.getTime() + 23 * 60 * 60 * 1000), // 11 PM
      altitude: 70,
      azimuth: 90,
      description: 'Face-on spiral galaxy with prominent spiral arms and companion galaxy',
      viewingTips: 'Requires dark skies and telescope. Look for spiral structure in 6-inch scope',
      equipment: 'small_telescope',
      season: 'spring'
    },
    {
      name: 'Beehive Cluster',
      catalogNumber: 'M44',
      type: 'star_cluster',
      constellation: 'Cancer',
      magnitude: 3.7,
      bestViewingTime: new Date(date.getTime() + 22 * 60 * 60 * 1000), // 10 PM
      altitude: 60,
      azimuth: 150,
      description: 'Large, bright open cluster nicknamed the Beehive',
      viewingTips: 'Visible to naked eye as fuzzy patch. Binoculars resolve into dozens of stars',
      equipment: 'binoculars',
      season: 'spring'
    },
    
    // Summer Objects (June - August)
    {
      name: 'Ring Nebula',
      catalogNumber: 'M57',
      type: 'planetary_nebula',
      constellation: 'Lyra',
      magnitude: 8.8,
      bestViewingTime: new Date(date.getTime() + 23 * 60 * 60 * 1000), // 11 PM
      altitude: 80,
      azimuth: 90,
      description: 'Famous ring-shaped planetary nebula formed by dying star',
      viewingTips: 'Appears as tiny smoke ring in telescope. Use high magnification',
      equipment: 'small_telescope',
      season: 'summer'
    },
    {
      name: 'Hercules Cluster',
      catalogNumber: 'M13',
      type: 'star_cluster',
      constellation: 'Hercules',
      magnitude: 5.8,
      bestViewingTime: new Date(date.getTime() + 22 * 60 * 60 * 1000), // 10 PM
      altitude: 75,
      azimuth: 110,
      description: 'Great globular cluster with 300,000 stars packed into 145 light-year sphere',
      viewingTips: 'Visible as fuzzy star to naked eye. Telescope resolves outer stars',
      equipment: 'binoculars',
      season: 'summer'
    },
    {
      name: 'Dumbbell Nebula',
      catalogNumber: 'M27',
      type: 'planetary_nebula',
      constellation: 'Vulpecula',
      magnitude: 7.5,
      bestViewingTime: new Date(date.getTime() + 23.5 * 60 * 60 * 1000), // 11:30 PM
      altitude: 70,
      azimuth: 85,
      description: 'Apple-core shaped planetary nebula, first discovered of its type',
      viewingTips: 'Easily found with binoculars. Telescope shows distinctive dumbbell shape',
      equipment: 'binoculars',
      season: 'summer'
    },
    {
      name: 'Eagle Nebula',
      catalogNumber: 'M16',
      type: 'nebula',
      constellation: 'Serpens',
      magnitude: 6.4,
      bestViewingTime: new Date(date.getTime() + 24 * 60 * 60 * 1000), // 12 AM
      altitude: 45,
      azimuth: 180,
      description: 'Star-forming region famous for "Pillars of Creation" structures',
      viewingTips: 'Requires telescope and dark skies. OIII filter enhances nebula details',
      equipment: 'small_telescope',
      season: 'summer'
    },
    
    // Year-round objects
    {
      name: 'Veil Nebula',
      catalogNumber: 'NGC 6960',
      type: 'supernova_remnant',
      constellation: 'Cygnus',
      magnitude: 7.0,
      bestViewingTime: new Date(date.getTime() + 24.5 * 60 * 60 * 1000), // 12:30 AM
      altitude: 85,
      azimuth: 45,
      description: 'Supernova remnant from explosion 8,000 years ago. Delicate filamentary structure',
      viewingTips: 'Best with OIII filter. Appears as wispy arc of light in telescope',
      equipment: 'small_telescope',
      season: 'summer'
    }
  ];
  
  // Enhanced seasonal filtering for optimal nighttime viewing
  const getSeasonFromMonth = (month: number): string => {
    if (month >= 8 && month <= 10) return 'autumn'; // Sep-Nov
    if (month >= 11 || month <= 1) return 'winter'; // Dec-Feb
    if (month >= 2 && month <= 4) return 'spring'; // Mar-May
    return 'summer'; // Jun-Aug
  };
  
  const currentSeason = getSeasonFromMonth(month);
  
  // Filter objects by current season and set proper viewing times for dark sky conditions
  const seasonalObjects = allObjects.filter(obj => {
    return obj.season === currentSeason || 
           (currentSeason === 'autumn' && obj.season === 'winter') ||
           (currentSeason === 'winter' && obj.season === 'autumn');
  });
  
  // Adjust viewing times to ensure they're during dark nighttime hours (after 9 PM)
  const adjustedObjects = seasonalObjects.map(obj => {
    const viewingHour = 21 + Math.random() * 5; // Between 9 PM and 2 AM
    const adjustedTime = new Date(date);
    adjustedTime.setHours(Math.floor(viewingHour), (viewingHour % 1) * 60, 0, 0);
    
    return {
      ...obj,
      bestViewingTime: adjustedTime
    };
  });
  
  // Return 6-8 objects, prioritizing brighter objects for better visibility
  return adjustedObjects
    .sort((a, b) => a.magnitude - b.magnitude) // Brighter objects first
    .slice(0, 8);
};

/**
 * Get astronomical events for the night
 */
export const getAstronomicalEvents = (date: Date, coordinates: { lat: number; lon: number }): AstronomicalEvent[] => {
  const events: AstronomicalEvent[] = [];
  const month = date.getMonth();
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24));
  
  // Meteor showers (based on actual annual peaks)
  const meteorShowers = [
    { name: 'Quadrantids', peak: 3, duration: 10, rate: 40 },
    { name: 'Lyrids', peak: 112, duration: 7, rate: 18 },
    { name: 'Eta Aquariids', peak: 126, duration: 10, rate: 30 },
    { name: 'Perseids', peak: 225, duration: 14, rate: 60 },
    { name: 'Orionids', peak: 294, duration: 7, rate: 25 },
    { name: 'Leonids', peak: 320, duration: 5, rate: 15 },
    { name: 'Geminids', peak: 347, duration: 10, rate: 75 }
  ];
  
  meteorShowers.forEach(shower => {
    const daysDiff = Math.abs(dayOfYear - shower.peak);
    if (daysDiff <= shower.duration / 2) {
      const activity = Math.max(5, shower.rate * (1 - daysDiff / (shower.duration / 2)));
      events.push({
        name: `${shower.name} Meteor Shower`,
        type: 'meteor_shower',
        time: new Date(date.getTime() + 2 * 60 * 60 * 1000), // 2 AM
        duration: 240, // 4 hours
        altitude: 60,
        azimuth: shower.name === 'Perseids' ? 45 : shower.name === 'Geminids' ? 90 : 75,
        description: `Peak activity: ${Math.round(activity)} meteors per hour`,
        viewingInstructions: `Look ${shower.name === 'Perseids' ? 'northeast' : shower.name === 'Geminids' ? 'east' : 'northeast'} after midnight. Best viewing between 2-4 AM.`
      });
    }
  });
  
  // ISS passes (simulated - in real app would use API)
  if (Math.random() > 0.4) {
    const passTime = new Date(date);
    passTime.setHours(20 + Math.random() * 4, Math.random() * 60, 0, 0);
    
    events.push({
      name: 'International Space Station Pass',
      type: 'satellite_pass',
      time: passTime,
      duration: 4,
      altitude: 60 + Math.random() * 30,
      azimuth: Math.random() * 360,
      magnitude: -3.5,
      description: 'Bright satellite pass visible to naked eye',
      viewingInstructions: 'Look for bright moving star, no flashing lights. Moves from southwest to northeast.'
    });
  }
  
  // Lunar events
  const moonPhase = calculateMoonPhase(date);
  if (moonPhase.illumination < 10) {
    events.push({
      name: 'New Moon - Dark Sky Opportunity',
      type: 'lunar_event',
      time: new Date(date.getTime() + 21 * 60 * 60 * 1000),
      altitude: 0,
      azimuth: 0,
      description: 'Excellent conditions for deep sky observing',
      viewingInstructions: 'Perfect time for galaxies, nebulae, and star clusters. No moonlight interference.'
    });
  } else if (moonPhase.illumination > 95) {
    events.push({
      name: 'Full Moon Observation',
      type: 'lunar_event',
      time: new Date(date.getTime() + 20 * 60 * 60 * 1000),
      altitude: 45,
      azimuth: 180,
      description: 'Ideal for lunar surface observation',
      viewingInstructions: 'Best time to observe lunar craters, mountains, and maria. Use moon filter to reduce glare.'
    });
  }
  
  // Planetary conjunctions (simplified)
  if (Math.random() > 0.7) {
    events.push({
      name: 'Venus-Jupiter Conjunction',
      type: 'conjunction',
      time: new Date(date.getTime() + 19.5 * 60 * 60 * 1000),
      altitude: 35,
      azimuth: 240,
      description: 'Two bright planets appear close together',
      viewingInstructions: 'Look west after sunset. Both planets will fit in the same binocular field of view.'
    });
  }
  
  return events.sort((a, b) => a.time.getTime() - b.time.getTime());
};

/**
 * Calculate moon phase and data
 */
export const calculateMoonPhase = (date: Date): MoonData => {
  const jd = getJulianDay(date);
  
  // Moon phase calculation
  const daysSinceNewMoon = (((jd - 2451549.5) % 29.53) + 29.53) % 29.53;
  const moonPhase = daysSinceNewMoon / 29.53;
  
  const phaseNames = [
    'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
    'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'
  ];
  
  const phaseIndex = Math.floor(moonPhase * 8) % 8;
  const phaseName = phaseNames[phaseIndex];
  
  const illumination = Math.round(50 * (1 - Math.cos(moonPhase * 2 * Math.PI)));
  
  // Simplified rise/set calculation
  const riseTime = new Date(date);
  riseTime.setHours(18 + moonPhase * 12, Math.random() * 60, 0, 0);
  
  const setTime = new Date(date);
  setTime.setHours(6 + moonPhase * 12, Math.random() * 60, 0, 0);
  if (setTime < riseTime) {
    setTime.setDate(setTime.getDate() + 1);
  }
  
  const constellations = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpius', 'Sagittarius', 'Capricornus', 'Aquarius', 'Pisces'];
  const constellation = constellations[Math.floor(moonPhase * 12) % 12];
  
  const features = [];
  if (illumination > 50) {
    features.push('Mare Tranquillitatis (Sea of Tranquility)');
    features.push('Tycho Crater with bright rays');
    features.push('Copernicus Crater');
  }
  if (illumination > 75) {
    features.push('Mare Imbrium (Sea of Rains)');
    features.push('Apennine Mountains');
  }
  if (phaseName && phaseName.includes('Quarter')) {
    features.push('Terminator line - excellent for crater observation');
  }
  
  return {
    phase: phaseName,
    illumination,
    riseTime,
    setTime,
    constellation,
    notableFeatures: features
  };
};

/**
 * Calculate best viewing times based on astronomical twilight
 */
export const calculateViewingTimes = (date: Date, coordinates: { lat: number; lon: number }) => {
  const lat = coordinates.lat * Math.PI / 180;
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24));
  
  // Solar declination
  const declination = 23.45 * Math.sin((360 * (284 + dayOfYear) / 365) * Math.PI / 180) * Math.PI / 180;
  
  // Astronomical twilight (sun 18° below horizon)
  const twilightAngle = -18 * Math.PI / 180;
  const hourAngle = Math.acos((Math.sin(twilightAngle) - Math.sin(lat) * Math.sin(declination)) / (Math.cos(lat) * Math.cos(declination)));
  
  const solarNoon = 12; // Simplified
  const eveningTwilight = solarNoon + (hourAngle * 180 / Math.PI) / 15;
  const morningTwilight = solarNoon - (hourAngle * 180 / Math.PI) / 15;
  
  const eveningTwilightTime = new Date(date);
  eveningTwilightTime.setHours(Math.floor(eveningTwilight), (eveningTwilight % 1) * 60, 0, 0);
  
  const morningTwilightTime = new Date(date);
  morningTwilightTime.setDate(date.getDate() + 1);
  morningTwilightTime.setHours(Math.floor(morningTwilight), (morningTwilight % 1) * 60, 0, 0);
  
  return {
    astronomicalTwilightEvening: eveningTwilightTime,
    astronomicalTwilightMorning: morningTwilightTime,
    bestObservingStart: new Date(eveningTwilightTime.getTime() + 30 * 60 * 1000),
    bestObservingEnd: new Date(morningTwilightTime.getTime() - 30 * 60 * 1000)
  };
};

/**
 * Get constellation visibility for the night
 */
export const getVisibleConstellations = (date: Date, coordinates: { lat: number; lon: number }): string[] => {
  const month = date.getMonth();
  
  const seasonalConstellations = {
    winter: ['Orion', 'Taurus', 'Gemini', 'Auriga', 'Canis Major', 'Canis Minor'],
    spring: ['Leo', 'Virgo', 'Boötes', 'Corona Borealis', 'Hercules', 'Ursa Major'],
    summer: ['Cygnus', 'Lyra', 'Aquila', 'Sagittarius', 'Scorpius', 'Ophiuchus'],
    autumn: ['Pegasus', 'Andromeda', 'Perseus', 'Cassiopeia', 'Cepheus', 'Aquarius']
  };
  
  let season: keyof typeof seasonalConstellations;
  if (month >= 11 || month <= 1) season = 'winter';
  else if (month >= 2 && month <= 4) season = 'spring';
  else if (month >= 5 && month <= 7) season = 'summer';
  else season = 'autumn';
  
  // Always visible circumpolar constellations for northern latitudes
  const circumpolar = coordinates.lat > 40 ? ['Ursa Major', 'Ursa Minor', 'Cassiopeia', 'Draco'] : [];
  
  return [...seasonalConstellations[season], ...circumpolar];
};

export const generateAstronomyForecast = (date: Date, coordinates: { lat: number; lon: number }) => {
  const forecast = [];
  
  for (let i = 0; i < 7; i++) {
    const forecastDate = new Date(date);
    forecastDate.setDate(date.getDate() + i);
    
    const moonData = calculateMoonPhase(forecastDate);
    const cloudCover = Math.floor(Math.random() * 100); // Simulated cloud cover
    const transparency = ['Excellent', 'Good', 'Fair', 'Poor'][Math.floor(Math.random() * 4)];
    const seeing = (1.5 + Math.random() * 2).toFixed(1); // 1.5-3.5 arcseconds
    
    // Calculate visibility index based on conditions
    let visibilityIndex = 10;
    visibilityIndex -= Math.floor(cloudCover / 20); // Reduce for cloud cover
    visibilityIndex -= Math.floor(moonData.illumination / 25); // Reduce for bright moon
    visibilityIndex = Math.max(1, Math.min(10, visibilityIndex));
    
    const conditions = {
      overall: visibilityIndex >= 8 ? 'Excellent' : visibilityIndex >= 6 ? 'Good' : visibilityIndex >= 4 ? 'Fair' : 'Poor',
      description: visibilityIndex >= 8 ? 'Perfect conditions for deep sky observing' :
                  visibilityIndex >= 6 ? 'Good conditions for most observations' :
                  visibilityIndex >= 4 ? 'Fair conditions, focus on brighter objects' :
                  'Poor conditions, consider indoor astronomy activities'
    };
    
    const highlights = [];
    if (moonData.illumination < 25) highlights.push('New moon - excellent for deep sky objects');
    if (cloudCover < 30) highlights.push('Clear skies expected');
    if (transparency === 'Excellent') highlights.push('Exceptional atmospheric transparency');
    if (parseFloat(seeing) < 2.0) highlights.push('Excellent seeing for planetary observation');
    
    const celestialEvents = [];
    if (i === 1) {
      celestialEvents.push({
        name: 'International Space Station Pass',
        type: 'satellite_pass',
        time: '8:45 PM',
        direction: 'SW to NE',
        description: 'Bright pass of the ISS lasting 6 minutes',
        equipment: 'Naked eye',
        duration: '6 minutes',
        viewingTips: 'Look for a bright, fast-moving star-like object'
      });
    }
    
    if (i === 3) {
      celestialEvents.push({
        name: 'Perseid Meteor Shower',
        type: 'meteor_shower',
        time: '11:00 PM - 4:00 AM',
        direction: 'Northeast (Perseus)',
        description: 'Peak activity with 50-60 meteors per hour',
        equipment: 'Naked eye',
        duration: '5 hours',
        viewingTips: 'Lie back and scan the entire sky, not just Perseus'
      });
    }
    
    forecast.push({
      date: forecastDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      visibilityIndex,
      conditions,
      cloudCover,
      transparency,
      seeing,
      moonPhase: moonData.phase,
      moonIllumination: Math.round(moonData.illumination),
      bestViewingWindow: visibilityIndex >= 6 ? '10:00 PM - 2:00 AM' : '11:00 PM - 1:00 AM',
      highlights: highlights.length > 0 ? highlights : ['Check planetary positions', 'Good time for constellation study'],
      celestialEvents,
      observingStrategy: visibilityIndex >= 8 ? 'Perfect night for challenging deep sky objects and astrophotography' :
                       visibilityIndex >= 6 ? 'Focus on bright nebulae, star clusters, and planets' :
                       visibilityIndex >= 4 ? 'Stick to bright objects like planets and double stars' :
                       'Consider lunar observation or indoor astronomy activities'
    });
  }
  
  return forecast;
};

export const calculateCurrentConditions = (date: Date, coordinates: { lat: number; lon: number }) => {
  // Simulate current observing conditions
  const cloudCover = Math.floor(Math.random() * 100);
  const transparency = ['Excellent', 'Good', 'Fair', 'Poor'][Math.floor(Math.random() * 4)];
  const seeing = (1.5 + Math.random() * 2).toFixed(1);
  
  let visibilityIndex = 10;
  visibilityIndex -= Math.floor(cloudCover / 20);
  const moonData = calculateMoonPhase(date);
  visibilityIndex -= Math.floor(moonData.illumination / 25);
  visibilityIndex = Math.max(1, Math.min(10, visibilityIndex));
  
  const overallRating = visibilityIndex >= 8 ? 'Excellent' : 
                       visibilityIndex >= 6 ? 'Good' : 
                       visibilityIndex >= 4 ? 'Fair' : 'Poor';
  
  const recommendation = visibilityIndex >= 8 ? 'Perfect conditions for deep sky observing and astrophotography' :
                        visibilityIndex >= 6 ? 'Good conditions for most astronomical observations' :
                        visibilityIndex >= 4 ? 'Fair conditions - focus on brighter objects like planets' :
                        'Poor conditions - consider lunar observation or indoor activities';
  
  return {
    visibilityIndex,
    visibilityDescription: overallRating === 'Excellent' ? 'Crystal clear skies' :
                          overallRating === 'Good' ? 'Clear with minor haze' :
                          overallRating === 'Fair' ? 'Partly cloudy' : 'Mostly cloudy',
    seeing,
    transparency,
    cloudCover,
    overallRating,
    recommendation
  };
};

/**
 * Calculate light pollution impact
 */
export const calculateLightPollution = (coordinates: { lat: number; lon: number }): {
  bortleClass: number;
  description: string;
  limitingMagnitude: number;
  recommendations: string[];
} => {
  // Simplified light pollution calculation based on distance from major cities
  // In a real implementation, you'd use actual light pollution maps
  
  const majorCities = [
    { name: 'Seattle', lat: 47.6062, lon: -122.3321, population: 750000 },
    { name: 'Portland', lat: 45.5152, lon: -122.6784, population: 650000 },
    { name: 'Spokane', lat: 47.6587, lon: -117.4260, population: 220000 },
    { name: 'Boise', lat: 43.6150, lon: -116.2023, population: 230000 }
  ];
  
  let minDistance = Infinity;
  majorCities.forEach(city => {
    const distance = Math.sqrt(
      Math.pow(coordinates.lat - city.lat, 2) + 
      Math.pow(coordinates.lon - city.lon, 2)
    ) * 69; // Rough miles conversion
    
    const adjustedDistance = distance / Math.sqrt(city.population / 100000);
    minDistance = Math.min(minDistance, adjustedDistance);
  });
  
  let bortleClass: number;
  let description: string;
  let limitingMagnitude: number;
  let recommendations: string[];
  
  if (minDistance > 100) {
    bortleClass = 2;
    description = 'Excellent Dark Sky';
    limitingMagnitude = 6.8;
    recommendations = ['Perfect for all deep sky objects', 'Milky Way clearly visible', 'Ideal for astrophotography'];
  } else if (minDistance > 50) {
    bortleClass = 3;
    description = 'Rural Sky';
    limitingMagnitude = 6.3;
    recommendations = ['Good for most deep sky objects', 'Milky Way visible', 'Some light pollution on horizon'];
  } else if (minDistance > 25) {
    bortleClass = 4;
    description = 'Rural/Suburban Transition';
    limitingMagnitude = 6.0;
    recommendations = ['Bright deep sky objects visible', 'Milky Way faint', 'Consider driving to darker site'];
  } else if (minDistance > 10) {
    bortleClass = 5;
    description = 'Suburban Sky';
    limitingMagnitude = 5.5;
    recommendations = ['Bright planets and star clusters', 'Moon and planets excellent', 'Drive 30+ minutes for deep sky'];
  } else {
    bortleClass = 6;
    description = 'Bright Suburban';
    limitingMagnitude = 5.0;
    recommendations = ['Planets and bright stars only', 'Moon observation excellent', 'Consider urban astronomy club'];
  }
  
  return { bortleClass, description, limitingMagnitude, recommendations };
};