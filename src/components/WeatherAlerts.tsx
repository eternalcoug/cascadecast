import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  X, 
  Clock, 
  MapPin, 
  Info, 
  ExternalLink,
  Bell,
  BellOff,
  Settings,
  History,
  RefreshCw
} from 'lucide-react';
import { 
  WeatherAlert, 
  fetchWeatherAlerts, 
  getNotificationSettings, 
  updateNotificationSettings,
  dismissAlert,
  isAlertDismissed,
  addToAlertHistory,
  getAlertHistory,
  getAlertSeverityColor,
  getAlertUrgencyIcon,
  formatAlertTime,
  requestNotificationPermission,
  showAlertNotification,
  shouldNotify,
  NotificationSettings
} from '../utils/weatherAlerts';

interface WeatherAlertsProps {
  coordinates?: {
    lat: number;
    lon: number;
  };
  location?: string;
  className?: string;
  onAlertCountChange?: (count: number) => void;
}

export const WeatherAlerts: React.FC<WeatherAlertsProps> = ({ 
  coordinates, 
  location = 'Unknown Location',
  className = '',
  onAlertCountChange
}) => {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings());
  const [alertHistory, setAlertHistory] = useState(getAlertHistory());
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Fetch alerts on mount and when coordinates change
  useEffect(() => {
    if (coordinates) {
      fetchAlerts();
      
      // Set up auto-refresh interval
      const interval = setInterval(fetchAlerts, settings.autoRefreshInterval * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [coordinates, settings.autoRefreshInterval]);

  // Check for new alerts and show notifications
  useEffect(() => {
    alerts.forEach(alert => {
      if (shouldNotify(alert) && !isAlertDismissed(alert.id)) {
        showAlertNotification(alert);
        addToAlertHistory(alert);
      }
    });
    
    // Update alert history state
    setAlertHistory(getAlertHistory());
  }, [alerts]);

  const fetchAlerts = async () => {
    if (!coordinates) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedAlerts = await fetchWeatherAlerts(coordinates.lat, coordinates.lon);
      setAlerts(fetchedAlerts);
      
      // Update alert count for navbar
      const activeCount = fetchedAlerts.filter(alert => !isAlertDismissed(alert.id)).length;
      onAlertCountChange?.(activeCount);
      
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch weather alerts:', err);
      setError('Failed to load weather alerts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismissAlert = (alertId: string) => {
    dismissAlert(alertId);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleSettingsChange = async (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    updateNotificationSettings(newSettings);
    
    // Request notification permission if enabling notifications
    if (newSettings.enabled && !settings.enabled) {
      await requestNotificationPermission();
    }
  };

  const getAlertIcon = (alert: WeatherAlert) => {
    const urgencyIcon = getAlertUrgencyIcon(alert.urgency);
    return <span className="text-lg">{urgencyIcon}</span>;
  };

  const getSeverityBadge = (severity: string) => {
    const colorClass = getAlertSeverityColor(severity);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${colorClass}`}>
        {severity}
      </span>
    );
  };

  const activeAlerts = alerts.filter(alert => !isAlertDismissed(alert.id));

  if (!coordinates) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-bold text-gray-800">Weather Alerts</h3>
          {activeAlerts.length > 0 && (
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              {activeAlerts.length}
            </span>
          )}
        </div>
      </div>

      {/* Last Refresh Time */}
      {lastRefresh && (
        <div className="text-xs text-white flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-50 rounded-lg p-4 border">
          <h4 className="font-semibold text-gray-800 mb-3">Notification Settings</h4>
          
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => handleSettingsChange({ ...settings, enabled: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Enable notifications</span>
            </label>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alert Severity Levels
              </label>
              <div className="space-y-1">
                {['minor', 'moderate', 'severe', 'extreme'].map(level => (
                  <label key={level} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.severityLevels.includes(level as any)}
                      onChange={(e) => {
                        const newLevels = e.target.checked
                          ? [...settings.severityLevels, level as any]
                          : settings.severityLevels.filter(l => l !== level);
                        handleSettingsChange({ ...settings, severityLevels: newLevels });
                      }}
                      className="rounded"
                    />
                    <span className="text-sm capitalize">{level}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => handleSettingsChange({ ...settings, soundEnabled: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Sound notifications</span>
            </label>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auto-refresh interval (minutes)
              </label>
              <select
                value={settings.autoRefreshInterval}
                onChange={(e) => handleSettingsChange({ ...settings, autoRefreshInterval: Number(e.target.value) })}
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={5}>5 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Alert History */}
      {showHistory && (
        <div className="bg-gray-50 rounded-lg p-4 border">
          <h4 className="font-semibold text-gray-800 mb-3">Recent Alerts</h4>
          
          {alertHistory.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent alerts</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {alertHistory.slice(0, 10).map((alert) => (
                <div key={alert.id} className="bg-white rounded p-3 border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getSeverityBadge(alert.severity)}
                        <span className="text-xs text-gray-500">
                          {formatAlertTime(alert.effective)}
                        </span>
                      </div>
                      <h5 className="font-medium text-sm text-gray-800">{alert.headline}</h5>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-gray-600">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading weather alerts...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800">Error Loading Alerts</h4>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={fetchAlerts}
                className="mt-2 text-red-700 hover:text-red-800 text-sm font-medium"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {activeAlerts.length === 0 && !loading && !error ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-800 font-medium">No active weather alerts for {location}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg border-l-4 p-4 shadow-sm ${
                alert.severity === 'extreme' ? 'bg-red-50 border-red-500' :
                alert.severity === 'severe' ? 'bg-orange-50 border-orange-500' :
                alert.severity === 'moderate' ? 'bg-yellow-50 border-yellow-500' :
                'bg-blue-50 border-blue-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getAlertIcon(alert)}
                    {getSeverityBadge(alert.severity)}
                    <span className="text-xs text-gray-500 uppercase font-medium">
                      {alert.urgency}
                    </span>
                  </div>
                  
                  <h4 className="font-bold text-gray-800 mb-2">{alert.headline}</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Effective: {formatAlertTime(alert.effective)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Expires: {formatAlertTime(alert.expires)}</span>
                    </div>
                    {alert.areas.length > 0 && (
                      <div className="flex items-center gap-1 sm:col-span-2">
                        <MapPin className="h-3 w-3" />
                        <span>Areas: {alert.areas.slice(0, 2).join(', ')}{alert.areas.length > 2 ? '...' : ''}</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                    {alert.description.length > 200 
                      ? `${alert.description.substring(0, 200)}...` 
                      : alert.description
                    }
                  </p>
                  
                  {alert.instruction && (
                    <div className="bg-white bg-opacity-50 rounded p-3 mb-3">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-gray-800 text-sm mb-1">Instructions</h5>
                          <p className="text-gray-700 text-sm">{alert.instruction}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => handleDismissAlert(alert.id)}
                  className="ml-4 p-1 text-gray-400 hover:text-gray-600 hover:bg-white hover:bg-opacity-50 rounded transition-colors"
                  title="Dismiss alert"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};