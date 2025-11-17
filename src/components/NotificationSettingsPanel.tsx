import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellOff, 
  X, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Clock,
  AlertTriangle,
  MapPin,
  Settings,
  Save,
  RotateCcw
} from 'lucide-react';
import { 
  getNotificationSettings, 
  updateNotificationSettings, 
  requestNotificationPermission,
  NotificationSettings 
} from '../utils/weatherAlerts';

interface NotificationSettingsPanelProps {
  onClose: () => void;
  onSettingsChange: (settings: NotificationSettings) => void;
}

export const NotificationSettingsPanel: React.FC<NotificationSettingsPanelProps> = ({
  onClose,
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings());
  const [hasPermission, setHasPermission] = useState(Notification.permission === 'granted');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasPermission(Notification.permission === 'granted');
  }, []);

  const handleSettingChange = (newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    setHasChanges(true);
  };

  const handleSave = async () => {
    // Request permission if enabling notifications and don't have permission
    if (settings.enabled && !hasPermission) {
      setIsRequestingPermission(true);
      const granted = await requestNotificationPermission();
      setHasPermission(granted);
      setIsRequestingPermission(false);
      
      if (!granted) {
        // Disable notifications if permission denied
        const disabledSettings = { ...settings, enabled: false };
        setSettings(disabledSettings);
        updateNotificationSettings(disabledSettings);
        onSettingsChange(disabledSettings);
        return;
      }
    }
    
    updateNotificationSettings(settings);
    onSettingsChange(settings);
    setHasChanges(false);
  };

  const handleReset = () => {
    const defaultSettings: NotificationSettings = {
      enabled: true,
      severityLevels: ['moderate', 'severe', 'extreme'],
      categories: ['met', 'safety', 'fire', 'health'],
      soundEnabled: true,
      vibrationEnabled: true,
      showOnLockScreen: true,
      autoRefreshInterval: 15
    };
    
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  const severityOptions = [
    { value: 'minor', label: 'Minor', color: 'bg-blue-100 text-blue-800', description: 'Low impact weather events' },
    { value: 'moderate', label: 'Moderate', color: 'bg-yellow-100 text-yellow-800', description: 'Moderate impact events' },
    { value: 'severe', label: 'Severe', color: 'bg-orange-100 text-orange-800', description: 'High impact events' },
    { value: 'extreme', label: 'Extreme', color: 'bg-red-100 text-red-800', description: 'Life-threatening events' }
  ];

  const categoryOptions = [
    { value: 'met', label: 'Weather', icon: '🌦️', description: 'General weather conditions' },
    { value: 'safety', label: 'Safety', icon: '⚠️', description: 'Public safety alerts' },
    { value: 'fire', label: 'Fire', icon: '🔥', description: 'Fire weather warnings' },
    { value: 'health', label: 'Health', icon: '🏥', description: 'Health-related weather alerts' },
    { value: 'env', label: 'Environmental', icon: '🌍', description: 'Environmental hazards' },
    { value: 'transport', label: 'Transportation', icon: '🚗', description: 'Travel-related alerts' }
  ];

  const refreshIntervalOptions = [
    { value: 5, label: '5 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' }
  ];

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Bell className="h-5 w-5 text-blue-700" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Notification Settings</h3>
        </div>
        
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 touch-manipulation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Permission Status */}
        {!hasPermission && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-amber-800">Browser Permission Required</h4>
                <p className="text-amber-700 text-sm mt-1">
                  To receive notifications, please allow notifications when prompted.
                </p>
                <button
                  onClick={async () => {
                    setIsRequestingPermission(true);
                    const granted = await requestNotificationPermission();
                    setHasPermission(granted);
                    setIsRequestingPermission(false);
                  }}
                  disabled={isRequestingPermission}
                  className="mt-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
                >
                  {isRequestingPermission ? 'Requesting...' : 'Request Permission'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Master Enable/Disable */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.enabled ? (
                <Bell className="h-5 w-5 text-green-600" />
              ) : (
                <BellOff className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <h4 className="font-medium text-gray-800">Enable Notifications</h4>
                <p className="text-gray-600 text-sm">Receive weather alerts and updates</p>
              </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => handleSettingChange({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Alert Severity Levels */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            Alert Severity Levels
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {severityOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.severityLevels.includes(option.value as any)}
                  onChange={(e) => {
                    const newLevels = e.target.checked
                      ? [...settings.severityLevels, option.value as any]
                      : settings.severityLevels.filter(level => level !== option.value);
                    handleSettingChange({ severityLevels: newLevels });
                  }}
                  disabled={!settings.enabled}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
                      {option.label}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Alert Categories */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-800 flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-600" />
            Alert Categories
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.categories.includes(option.value)}
                  onChange={(e) => {
                    const newCategories = e.target.checked
                      ? [...settings.categories, option.value]
                      : settings.categories.filter(cat => cat !== option.value);
                    handleSettingChange({ categories: newCategories });
                  }}
                  disabled={!settings.enabled}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{option.icon}</span>
                    <span className="font-medium text-gray-800 text-sm">{option.label}</span>
                  </div>
                  <p className="text-gray-600 text-xs">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-800 flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-purple-600" />
            Notification Preferences
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => handleSettingChange({ soundEnabled: e.target.checked })}
                disabled={!settings.enabled}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                {settings.soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-green-600" />
                ) : (
                  <VolumeX className="h-4 w-4 text-gray-400" />
                )}
                <span className="font-medium text-gray-800 text-sm">Sound Alerts</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.vibrationEnabled}
                onChange={(e) => handleSettingChange({ vibrationEnabled: e.target.checked })}
                disabled={!settings.enabled}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-gray-800 text-sm">Vibration</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showOnLockScreen}
                onChange={(e) => handleSettingChange({ showOnLockScreen: e.target.checked })}
                disabled={!settings.enabled}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-gray-800 text-sm">Show on Lock Screen</span>
              </div>
            </label>

            <div className="p-3 bg-gray-50 rounded-lg">
              <label className="block">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  <span className="font-medium text-gray-800 text-sm">Auto-refresh Interval</span>
                </div>
                <select
                  value={settings.autoRefreshInterval}
                  onChange={(e) => handleSettingChange({ autoRefreshInterval: Number(e.target.value) })}
                  disabled={!settings.enabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                >
                  {refreshIntervalOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* Browser Notification Status */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Browser Notification Status
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-blue-700">Permission Status:</span>
              <span className={`font-medium ${
                hasPermission ? 'text-green-700' : 'text-red-700'
              }`}>
                {hasPermission ? '✅ Granted' : '❌ Not Granted'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-blue-700">Notifications Supported:</span>
              <span className={`font-medium ${
                'Notification' in window ? 'text-green-700' : 'text-red-700'
              }`}>
                {'Notification' in window ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            
            {!hasPermission && 'Notification' in window && (
              <button
                onClick={async () => {
                  setIsRequestingPermission(true);
                  const granted = await requestNotificationPermission();
                  setHasPermission(granted);
                  setIsRequestingPermission(false);
                }}
                disabled={isRequestingPermission}
                className="mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                {isRequestingPermission ? 'Requesting...' : 'Enable Browser Notifications'}
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors duration-200 touch-manipulation"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors duration-200 touch-manipulation"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 touch-manipulation"
            >
              <Save className="h-4 w-4" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};