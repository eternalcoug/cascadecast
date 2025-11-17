import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Star, 
  MapPin, 
  Clock, 
  Trash2, 
  Download, 
  Upload, 
  Search,
  Plus,
  Edit3,
  Save,
  X,
  BarChart3
} from 'lucide-react';
import { 
  FavoriteLocation, 
  LocationHistory,
  getFavorites, 
  addToFavorites, 
  removeFromFavorites, 
  isFavorite,
  updateFavoriteAccess,
  getHistory,
  clearHistory,
  searchFavoritesAndHistory,
  exportFavorites,
  importFavorites,
  getFavoritesStats
} from '../utils/favorites';

interface FavoritesManagerProps {
  onLocationSelect: (location: string, coordinates?: { lat: number; lon: number }) => void;
  currentLocation?: string;
  className?: string;
}

export const FavoritesManager: React.FC<FavoritesManagerProps> = ({ 
  onLocationSelect, 
  currentLocation,
  className = '' 
}) => {
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [history, setHistory] = useState<LocationHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'favorites' | 'history' | 'stats'>('favorites');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', notes: '', tags: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', displayName: '', lat: '', lon: '', tags: '', notes: '' });
  const [stats, setStats] = useState(getFavoritesStats());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setFavorites(getFavorites());
    setHistory(getHistory());
    setStats(getFavoritesStats());
  };

  const handleAddToFavorites = (location: FavoriteLocation) => {
    const success = addToFavorites(location);
    if (success) {
      loadData();
    }
  };

  const handleRemoveFromFavorites = (locationId: string) => {
    const success = removeFromFavorites(locationId);
    if (success) {
      loadData();
    }
  };

  const handleLocationClick = (location: string, coordinates?: { lat: number; lon: number }) => {
    onLocationSelect(location, coordinates);
    
    // Update access count if it's a favorite
    const favorite = favorites.find(fav => fav.name === location || fav.displayName === location);
    if (favorite) {
      updateFavoriteAccess(favorite.id);
      loadData();
    }
  };

  const handleEditStart = (favorite: FavoriteLocation) => {
    setEditingId(favorite.id);
    setEditForm({
      name: favorite.name,
      notes: favorite.notes || '',
      tags: favorite.tags?.join(', ') || ''
    });
  };

  const handleEditSave = () => {
    if (!editingId) return;
    
    const favorite = favorites.find(fav => fav.id === editingId);
    if (favorite) {
      const updatedFavorite: FavoriteLocation = {
        ...favorite,
        name: editForm.name,
        notes: editForm.notes || undefined,
        tags: editForm.tags ? editForm.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined
      };
      
      addToFavorites(updatedFavorite);
      setEditingId(null);
      loadData();
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({ name: '', notes: '', tags: '' });
  };

  const handleAddNew = () => {
    if (!addForm.name || !addForm.lat || !addForm.lon) return;
    
    const newFavorite: FavoriteLocation = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: addForm.name,
      displayName: addForm.displayName || addForm.name,
      coordinates: {
        lat: parseFloat(addForm.lat),
        lon: parseFloat(addForm.lon)
      },
      addedAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
      tags: addForm.tags ? addForm.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
      notes: addForm.notes || undefined
    };
    
    addToFavorites(newFavorite);
    setShowAddForm(false);
    setAddForm({ name: '', displayName: '', lat: '', lon: '', tags: '', notes: '' });
    loadData();
  };

  const handleExport = () => {
    const exportData = exportFavorites();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weather-favorites-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = importFavorites(content);
      if (success) {
        loadData();
        alert('Favorites imported successfully!');
      } else {
        alert('Failed to import favorites. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const filteredFavorites = searchQuery 
    ? favorites.filter(fav => 
        fav.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fav.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fav.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : favorites;

  const filteredHistory = searchQuery
    ? history.filter(item =>
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : history.slice(0, 20);

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Locations
          </h3>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Add Location"
            >
              <Plus className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleExport}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Export Favorites"
            >
              <Download className="h-4 w-4" />
            </button>
            
            <label className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer" title="Import Favorites">
              <Upload className="h-4 w-4" />
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search locations..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Tabs */}
        <div className="flex mt-4 border-b">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'favorites'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Favorites ({favorites.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            History ({history.length})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'stats'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Stats
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="p-4 bg-blue-50 border-b">
          <h4 className="font-medium text-gray-800 mb-3">Add New Location</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              placeholder="Location name *"
              className="px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <input
              type="text"
              value={addForm.displayName}
              onChange={(e) => setAddForm({ ...addForm, displayName: e.target.value })}
              placeholder="Display name"
              className="px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <input
              type="number"
              value={addForm.lat}
              onChange={(e) => setAddForm({ ...addForm, lat: e.target.value })}
              placeholder="Latitude *"
              step="any"
              className="px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <input
              type="number"
              value={addForm.lon}
              onChange={(e) => setAddForm({ ...addForm, lon: e.target.value })}
              placeholder="Longitude *"
              step="any"
              className="px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <input
              type="text"
              value={addForm.tags}
              onChange={(e) => setAddForm({ ...addForm, tags: e.target.value })}
              placeholder="Tags (comma separated)"
              className="px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <input
              type="text"
              value={addForm.notes}
              onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
              placeholder="Notes"
              className="px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleAddNew}
              disabled={!addForm.name || !addForm.lat || !addForm.lon}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Location
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'favorites' && (
          <div className="space-y-3">
            {filteredFavorites.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Heart className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No favorite locations yet</p>
                <p className="text-sm">Add locations to quickly access weather forecasts</p>
              </div>
            ) : (
              filteredFavorites.map((favorite) => (
                <div key={favorite.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  {editingId === favorite.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="text"
                        value={editForm.tags}
                        onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                        placeholder="Tags (comma separated)"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <textarea
                        value={editForm.notes}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        placeholder="Notes"
                        rows={2}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleEditSave}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => handleLocationClick(favorite.displayName, favorite.coordinates)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <h4 className="font-medium text-gray-800">{favorite.name}</h4>
                          {favorite.accessCount > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              {favorite.accessCount} uses
                            </span>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">📍 {favorite.displayName.split(',')[0]}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs">Lat: {favorite.coordinates.lat.toFixed(4)}, Lon: {favorite.coordinates.lon.toFixed(4)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Added {new Date(favorite.addedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        {favorite.tags && favorite.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {favorite.tags.map((tag, index) => (
                              <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {favorite.notes && (
                          <p className="text-xs text-gray-600 mt-2 italic">{favorite.notes}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleEditStart(favorite)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleRemoveFromFavorites(favorite.id)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {history.length > 0 && (
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">Recent searches</span>
                <button
                  onClick={() => {
                    clearHistory();
                    loadData();
                  }}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear all
                </button>
              </div>
            )}
            
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No search history</p>
              </div>
            ) : (
              filteredHistory.map((item) => (
                <div key={item.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => handleLocationClick(item.location, item.coordinates)}
                    >
                      <h4 className="font-medium text-gray-800">{item.displayName}</h4>
                      <div className="text-xs text-gray-500 mt-1">
                        <span>Searched {new Date(item.searchedAt).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        const favoriteLocation: FavoriteLocation = {
                          id: `from_history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                          name: item.location,
                          displayName: item.displayName,
                          coordinates: item.coordinates || { lat: 0, lon: 0 },
                          addedAt: Date.now(),
                          lastAccessed: Date.now(),
                          accessCount: 0
                        };
                        handleAddToFavorites(favoriteLocation);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                      title="Add to favorites"
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalFavorites}</div>
                <div className="text-sm text-blue-800">Total Favorites</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalAccesses}</div>
                <div className="text-sm text-green-800">Total Uses</div>
              </div>
            </div>
            
            {stats.mostAccessed && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Most Used Location
                </h4>
                <div className="text-sm text-yellow-700">
                  <div className="font-medium">{stats.mostAccessed.name}</div>
                  <div>{stats.mostAccessed.accessCount} uses</div>
                </div>
              </div>
            )}
            
            {stats.oldestFavorite && (
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Oldest Favorite
                </h4>
                <div className="text-sm text-purple-700">
                  <div className="font-medium">{stats.oldestFavorite.name}</div>
                  <div>Added {new Date(stats.oldestFavorite.addedAt).toLocaleDateString()}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};