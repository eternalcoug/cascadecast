/**
 * Location Favorites and History Management
 * Handles user's favorite locations and search history
 */

export interface FavoriteLocation {
  id: string;
  name: string;
  displayName: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  addedAt: number;
  lastAccessed: number;
  accessCount: number;
  tags?: string[];
  notes?: string;
}

export interface LocationHistory {
  id: string;
  location: string;
  displayName: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  searchedAt: number;
  resultCount: number;
}

const FAVORITES_KEY = 'weather_favorites';
const HISTORY_KEY = 'weather_history';
const MAX_HISTORY_ITEMS = 50;
const MAX_FAVORITES = 20;

/**
 * Add location to favorites
 */
export const addToFavorites = (location: FavoriteLocation): boolean => {
  try {
    const favorites = getFavorites();
    
    // Check if already exists
    const existingIndex = favorites.findIndex(fav => fav.id === location.id);
    if (existingIndex !== -1) {
      // Update existing favorite
      favorites[existingIndex] = {
        ...favorites[existingIndex],
        ...location,
        lastAccessed: Date.now(),
        accessCount: favorites[existingIndex].accessCount + 1
      };
    } else {
      // Add new favorite
      if (favorites.length >= MAX_FAVORITES) {
        // Remove least accessed favorite
        favorites.sort((a, b) => a.accessCount - b.accessCount);
        favorites.shift();
      }
      
      favorites.push({
        ...location,
        addedAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 1
      });
    }
    
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    console.log('Added to favorites:', location.name);
    return true;
  } catch (error) {
    console.error('Failed to add to favorites:', error);
    return false;
  }
};

/**
 * Remove location from favorites
 */
export const removeFromFavorites = (locationId: string): boolean => {
  try {
    const favorites = getFavorites();
    const filteredFavorites = favorites.filter(fav => fav.id !== locationId);
    
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(filteredFavorites));
    console.log('Removed from favorites:', locationId);
    return true;
  } catch (error) {
    console.error('Failed to remove from favorites:', error);
    return false;
  }
};

/**
 * Get all favorite locations
 */
export const getFavorites = (): FavoriteLocation[] => {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      const favorites: FavoriteLocation[] = JSON.parse(stored);
      // Sort by most recently accessed
      return favorites.sort((a, b) => b.lastAccessed - a.lastAccessed);
    }
    return [];
  } catch (error) {
    console.error('Failed to get favorites:', error);
    return [];
  }
};

/**
 * Check if location is favorited
 */
export const isFavorite = (locationId: string): boolean => {
  try {
    const favorites = getFavorites();
    return favorites.some(fav => fav.id === locationId);
  } catch (error) {
    console.error('Failed to check favorite status:', error);
    return false;
  }
};

/**
 * Update favorite location access
 */
export const updateFavoriteAccess = (locationId: string): void => {
  try {
    const favorites = getFavorites();
    const favoriteIndex = favorites.findIndex(fav => fav.id === locationId);
    
    if (favoriteIndex !== -1) {
      favorites[favoriteIndex].lastAccessed = Date.now();
      favorites[favoriteIndex].accessCount += 1;
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
  } catch (error) {
    console.error('Failed to update favorite access:', error);
  }
};

/**
 * Add location to search history
 */
export const addToHistory = (historyItem: Omit<LocationHistory, 'id' | 'searchedAt'>): void => {
  try {
    const history = getHistory();
    
    // Check if already exists in recent history
    const existingIndex = history.findIndex(item => 
      item.location.toLowerCase() === historyItem.location.toLowerCase()
    );
    
    const newItem: LocationHistory = {
      ...historyItem,
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      searchedAt: Date.now()
    };
    
    if (existingIndex !== -1) {
      // Remove existing and add to top
      history.splice(existingIndex, 1);
    }
    
    // Add to beginning of array
    history.unshift(newItem);
    
    // Limit history size
    if (history.length > MAX_HISTORY_ITEMS) {
      history.splice(MAX_HISTORY_ITEMS);
    }
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to add to history:', error);
  }
};

/**
 * Get search history
 */
export const getHistory = (): LocationHistory[] => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      const history: LocationHistory[] = JSON.parse(stored);
      // Sort by most recent
      return history.sort((a, b) => b.searchedAt - a.searchedAt);
    }
    return [];
  } catch (error) {
    console.error('Failed to get history:', error);
    return [];
  }
};

/**
 * Clear search history
 */
export const clearHistory = (): boolean => {
  try {
    localStorage.removeItem(HISTORY_KEY);
    console.log('Search history cleared');
    return true;
  } catch (error) {
    console.error('Failed to clear history:', error);
    return false;
  }
};

/**
 * Get recent searches (last 10)
 */
export const getRecentSearches = (): LocationHistory[] => {
  return getHistory().slice(0, 10);
};

/**
 * Search favorites and history
 */
export const searchFavoritesAndHistory = (query: string): Array<FavoriteLocation | LocationHistory> => {
  try {
    const favorites = getFavorites();
    const history = getHistory();
    const lowerQuery = query.toLowerCase();
    
    const matchingFavorites = favorites.filter(fav => 
      fav.name.toLowerCase().includes(lowerQuery) ||
      fav.displayName.toLowerCase().includes(lowerQuery) ||
      fav.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
    
    const matchingHistory = history.filter(item =>
      item.location.toLowerCase().includes(lowerQuery) ||
      item.displayName.toLowerCase().includes(lowerQuery)
    );
    
    // Combine and sort by relevance (favorites first, then by access frequency)
    const results = [
      ...matchingFavorites.map(fav => ({ ...fav, type: 'favorite' as const })),
      ...matchingHistory.slice(0, 5).map(hist => ({ ...hist, type: 'history' as const }))
    ];
    
    return results;
  } catch (error) {
    console.error('Failed to search favorites and history:', error);
    return [];
  }
};

/**
 * Export favorites for backup
 */
export const exportFavorites = (): string => {
  try {
    const favorites = getFavorites();
    return JSON.stringify({
      version: '1.0',
      exportedAt: Date.now(),
      favorites
    }, null, 2);
  } catch (error) {
    console.error('Failed to export favorites:', error);
    return '';
  }
};

/**
 * Import favorites from backup
 */
export const importFavorites = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);
    if (data.favorites && Array.isArray(data.favorites)) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(data.favorites));
      console.log('Favorites imported successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to import favorites:', error);
    return false;
  }
};

/**
 * Get favorites statistics
 */
export const getFavoritesStats = (): {
  totalFavorites: number;
  totalAccesses: number;
  mostAccessed: FavoriteLocation | null;
  oldestFavorite: FavoriteLocation | null;
} => {
  try {
    const favorites = getFavorites();
    
    if (favorites.length === 0) {
      return {
        totalFavorites: 0,
        totalAccesses: 0,
        mostAccessed: null,
        oldestFavorite: null
      };
    }
    
    const totalAccesses = favorites.reduce((sum, fav) => sum + fav.accessCount, 0);
    const mostAccessed = favorites.reduce((prev, current) => 
      prev.accessCount > current.accessCount ? prev : current
    );
    const oldestFavorite = favorites.reduce((prev, current) => 
      prev.addedAt < current.addedAt ? prev : current
    );
    
    return {
      totalFavorites: favorites.length,
      totalAccesses,
      mostAccessed,
      oldestFavorite
    };
  } catch (error) {
    console.error('Failed to get favorites stats:', error);
    return {
      totalFavorites: 0,
      totalAccesses: 0,
      mostAccessed: null,
      oldestFavorite: null
    };
  }
};