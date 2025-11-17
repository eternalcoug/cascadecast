/**
 * Weather Alerts and Notifications System
 * Handles NOAA weather alerts and user notifications
 */

export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  instruction?: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  certainty: 'possible' | 'likely' | 'observed';
  urgency: 'future' | 'expected' | 'immediate';
  event: string;
  headline: string;
  areas: string[];
  effective: string;
  expires: string;
  onset?: string;
  ends?: string;
  status: 'actual' | 'exercise' | 'system' | 'test' | 'draft';
  messageType: 'alert' | 'update' | 'cancel';
  category: 'geo' | 'met' | 'safety' | 'security' | 'rescue' | 'fire' | 'health' | 'env' | 'transport' | 'infra' | 'cbrne' | 'other';
  responseType: 'shelter' | 'evacuate' | 'prepare' | 'execute' | 'avoid' | 'monitor' | 'assess' | 'allclear' | 'none';
  coordinates?: Array<[number, number]>;
  references?: string[];
}

export interface NotificationSettings {
  enabled: boolean;
  severityLevels: Array<'minor' | 'moderate' | 'severe' | 'extreme'>;
  categories: string[];
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showOnLockScreen: boolean;
  autoRefreshInterval: number; // minutes
}

const ALERTS_CACHE_KEY = 'weather_alerts_cache';
const NOTIFICATION_SETTINGS_KEY = 'notification_settings';
const DISMISSED_ALERTS_KEY = 'dismissed_alerts';
const ALERT_HISTORY_KEY = 'alert_history';

/**
 * Fetch weather alerts for coordinates
 */
export const fetchWeatherAlerts = async (lat: number, lon: number): Promise<WeatherAlert[]> => {
  try {
    console.log('Fetching weather alerts for:', lat, lon);
    
    // NOAA Weather Alerts API endpoint
    const alertsUrl = `https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`;
    
    const response = await fetch(alertsUrl, {
      headers: {
        'User-Agent': 'CascadeCast Weather App (contact@cascadecast.com)'
      }
    });
    
    if (!response.ok) {
      console.warn('Weather alerts API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.features || !Array.isArray(data.features)) {
      console.warn('Invalid alerts response format');
      return [];
    }
    
    const alerts: WeatherAlert[] = data.features.map((feature: any) => {
      const props = feature.properties;
      return {
        id: props.id || `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: props.headline || props.event || 'Weather Alert',
        description: props.description || '',
        instruction: props.instruction,
        severity: mapSeverity(props.severity),
        certainty: props.certainty?.toLowerCase() || 'possible',
        urgency: props.urgency?.toLowerCase() || 'future',
        event: props.event || 'Weather Event',
        headline: props.headline || '',
        areas: props.areaDesc ? props.areaDesc.split(';').map((area: string) => area.trim()) : [],
        effective: props.effective || new Date().toISOString(),
        expires: props.expires || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        onset: props.onset,
        ends: props.ends,
        status: props.status?.toLowerCase() || 'actual',
        messageType: props.messageType?.toLowerCase() || 'alert',
        category: props.category?.toLowerCase() || 'met',
        responseType: props.response?.toLowerCase() || 'monitor',
        coordinates: feature.geometry?.coordinates?.[0] || undefined,
        references: props.references ? props.references.split(',') : undefined
      };
    });
    
    // Cache the alerts
    cacheAlerts(alerts, lat, lon);
    
    console.log(`Retrieved ${alerts.length} weather alerts`);
    return alerts;
    
  } catch (error) {
    console.error('Failed to fetch weather alerts:', error);
    
    // Try to return cached alerts as fallback
    const cached = getCachedAlerts(lat, lon);
    if (cached.length > 0) {
      console.log('Using cached alerts as fallback');
      return cached;
    }
    
    return [];
  }
};

/**
 * Map NOAA severity to our severity levels
 */
const mapSeverity = (noaaSeverity: string): 'minor' | 'moderate' | 'severe' | 'extreme' => {
  const severity = noaaSeverity?.toLowerCase();
  switch (severity) {
    case 'extreme':
      return 'extreme';
    case 'severe':
      return 'severe';
    case 'moderate':
      return 'moderate';
    case 'minor':
    default:
      return 'minor';
  }
};

/**
 * Cache weather alerts
 */
const cacheAlerts = (alerts: WeatherAlert[], lat: number, lon: number): void => {
  try {
    const cacheData = {
      alerts,
      coordinates: { lat, lon },
      timestamp: Date.now(),
      expiresAt: Date.now() + (15 * 60 * 1000) // 15 minutes
    };
    
    localStorage.setItem(ALERTS_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache weather alerts:', error);
  }
};

/**
 * Get cached weather alerts
 */
const getCachedAlerts = (lat: number, lon: number): WeatherAlert[] => {
  try {
    const cached = localStorage.getItem(ALERTS_CACHE_KEY);
    if (!cached) return [];
    
    const cacheData = JSON.parse(cached);
    
    // Check if cache is expired
    if (Date.now() > cacheData.expiresAt) {
      return [];
    }
    
    // Check if coordinates match (within reasonable distance)
    const distance = Math.sqrt(
      Math.pow(cacheData.coordinates.lat - lat, 2) + 
      Math.pow(cacheData.coordinates.lon - lon, 2)
    );
    
    if (distance > 0.5) { // ~50km tolerance
      return [];
    }
    
    return cacheData.alerts || [];
  } catch (error) {
    console.warn('Failed to get cached alerts:', error);
    return [];
  }
};

/**
 * Get notification settings
 */
export const getNotificationSettings = (): NotificationSettings => {
  try {
    const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Default settings
    return {
      enabled: true,
      severityLevels: ['moderate', 'severe', 'extreme'],
      categories: ['met', 'safety', 'fire', 'health'],
      soundEnabled: true,
      vibrationEnabled: true,
      showOnLockScreen: true,
      autoRefreshInterval: 15
    };
  } catch (error) {
    console.error('Failed to get notification settings:', error);
    return {
      enabled: false,
      severityLevels: [],
      categories: [],
      soundEnabled: false,
      vibrationEnabled: false,
      showOnLockScreen: false,
      autoRefreshInterval: 30
    };
  }
};

/**
 * Update notification settings
 */
export const updateNotificationSettings = (settings: NotificationSettings): boolean => {
  try {
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    console.log('Notification settings updated');
    return true;
  } catch (error) {
    console.error('Failed to update notification settings:', error);
    return false;
  }
};

/**
 * Check if alert should trigger notification
 */
export const shouldNotify = (alert: WeatherAlert): boolean => {
  const settings = getNotificationSettings();
  
  if (!settings.enabled) return false;
  
  // Check severity level
  if (!settings.severityLevels.includes(alert.severity)) return false;
  
  // Check category
  if (!settings.categories.includes(alert.category)) return false;
  
  // Check if alert is dismissed
  if (isAlertDismissed(alert.id)) return false;
  
  // Check if alert is still active
  const now = new Date();
  const expires = new Date(alert.expires);
  if (now > expires) return false;
  
  return true;
};

/**
 * Dismiss alert
 */
export const dismissAlert = (alertId: string): void => {
  try {
    const dismissed = getDismissedAlerts();
    dismissed.push({
      alertId,
      dismissedAt: Date.now()
    });
    
    localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(dismissed));
  } catch (error) {
    console.error('Failed to dismiss alert:', error);
  }
};

/**
 * Check if alert is dismissed
 */
export const isAlertDismissed = (alertId: string): boolean => {
  try {
    const dismissed = getDismissedAlerts();
    return dismissed.some(d => d.alertId === alertId);
  } catch (error) {
    console.error('Failed to check dismissed status:', error);
    return false;
  }
};

/**
 * Get dismissed alerts
 */
const getDismissedAlerts = (): Array<{ alertId: string; dismissedAt: number }> => {
  try {
    const stored = localStorage.getItem(DISMISSED_ALERTS_KEY);
    if (stored) {
      const dismissed = JSON.parse(stored);
      // Clean up old dismissed alerts (older than 7 days)
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      return dismissed.filter((d: any) => d.dismissedAt > weekAgo);
    }
    return [];
  } catch (error) {
    console.error('Failed to get dismissed alerts:', error);
    return [];
  }
};

/**
 * Add alert to history
 */
export const addToAlertHistory = (alert: WeatherAlert): void => {
  try {
    const history = getAlertHistory();
    
    // Check if already exists
    const existingIndex = history.findIndex(h => h.id === alert.id);
    if (existingIndex === -1) {
      history.unshift({
        ...alert,
        viewedAt: Date.now()
      });
      
      // Limit history to 100 items
      if (history.length > 100) {
        history.splice(100);
      }
      
      localStorage.setItem(ALERT_HISTORY_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.error('Failed to add to alert history:', error);
  }
};

/**
 * Get alert history
 */
export const getAlertHistory = (): Array<WeatherAlert & { viewedAt: number }> => {
  try {
    const stored = localStorage.getItem(ALERT_HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Failed to get alert history:', error);
    return [];
  }
};

/**
 * Get alert severity color
 */
export const getAlertSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'extreme':
      return 'bg-red-600 text-white';
    case 'severe':
      return 'bg-orange-600 text-white';
    case 'moderate':
      return 'bg-yellow-600 text-white';
    case 'minor':
    default:
      return 'bg-blue-600 text-white';
  }
};

/**
 * Get alert urgency icon
 */
export const getAlertUrgencyIcon = (urgency: string): string => {
  switch (urgency) {
    case 'immediate':
      return '🚨';
    case 'expected':
      return '⚠️';
    case 'future':
    default:
      return 'ℹ️';
  }
};

/**
 * Format alert time
 */
export const formatAlertTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return 'Unknown time';
  }
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission === 'denied') {
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
};

/**
 * Show browser notification for alert
 */
export const showAlertNotification = (alert: WeatherAlert): void => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  
  const settings = getNotificationSettings();
  if (!settings.enabled || !shouldNotify(alert)) {
    return;
  }
  
  try {
    const notification = new Notification(alert.headline || alert.title, {
      body: alert.description.substring(0, 200) + (alert.description.length > 200 ? '...' : ''),
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: alert.id,
      requireInteraction: alert.severity === 'extreme',
      silent: !settings.soundEnabled,
      vibrate: settings.vibrationEnabled ? [200, 100, 200] : undefined,
      data: {
        alertId: alert.id,
        severity: alert.severity,
        urgency: alert.urgency
      }
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
      // Could navigate to alerts page here
    };
    
    // Auto-close after 10 seconds for non-extreme alerts
    if (alert.severity !== 'extreme') {
      setTimeout(() => {
        notification.close();
      }, 10000);
    }
    
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
};