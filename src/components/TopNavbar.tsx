import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, MapPin, RefreshCw, Bell } from 'lucide-react';
import { CascadeCastIcon } from './CascadeCastIcon';

interface TopNavbarProps {
  onRefresh?: () => void;
  onShowAlerts?: () => void;
  onShowNotifications?: () => void;
  onShowNotificationSettings?: () => void;
  alertCount?: number;
  isRefreshing?: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onRefresh,
  onShowAlerts,
  onShowNotifications,
  onShowNotificationSettings,
  alertCount = 0,
  isRefreshing = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    if (path === '/') {
      navigate('/');
    } else if (path === '/astronomy') {
      // Navigate to astronomy page with current location if available
      const currentWeatherData = JSON.parse(localStorage.getItem('cascade_cast_weather_data') || '{}');
      if (currentWeatherData.location && currentWeatherData.coordinates) {
        navigate('/astronomy', {
          state: {
            location: currentWeatherData.location,
            coordinates: currentWeatherData.coordinates
          }
        });
      } else {
        // Navigate without state - component will handle redirect
        navigate('/astronomy');
      }
    } else {
      navigate(path);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 w-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 sm:h-20 w-full">
          {/* Left: Logo and Brand */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-shrink-0 min-w-0">
            <div className="relative">
              <CascadeCastIcon 
                className="drop-shadow-lg" 
                size={window.innerWidth < 640 ? 28 : window.innerWidth < 1024 ? 36 : 44}
              />
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <div className="min-w-0 flex-shrink">
              <h1 className="text-white font-bold text-lg sm:text-xl lg:text-2xl xl:text-3xl drop-shadow-sm">
                Cascade Cast
              </h1>
            </div>
          </div>

          {/* Center: Navigation Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 flex-1 justify-center">
            <button
              onClick={() => handleNavigation('/')}
              className={`px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-all duration-200 ${
                isActive('/') 
                  ? 'bg-white/20 text-white border border-white/30' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Weather
            </button>
            <button
              onClick={() => handleNavigation('/astronomy')}
              className={`px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-all duration-200 ${
                isActive('/astronomy') 
                  ? 'bg-white/20 text-white border border-white/30' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Astronomy
            </button>
            <button
              onClick={() => handleNavigation('/fishing-conditions')}
              className={`px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-all duration-200 ${
                isActive('/fishing-conditions') 
                  ? 'bg-white/20 text-white border border-white/30' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Fishing
            </button>
          </div>


          {/* Right: Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-shrink-0 ml-auto">
            {/* Alerts */}
            <button
              onClick={onShowAlerts}
              className="relative p-3 text-white hover:bg-white/10 rounded-lg transition-all duration-200 touch-manipulation min-w-[48px] min-h-[48px] flex items-center justify-center"
              title="Weather Alerts"
            >
              <AlertTriangle className="h-6 w-6 text-white" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </button>

            {/* Notification Settings */}
            <button
              onClick={onShowNotificationSettings}
              className="p-3 text-white hover:bg-white/10 rounded-lg transition-all duration-200 touch-manipulation min-w-[48px] min-h-[48px] flex items-center justify-center"
              title="Notification Settings"
            >
              <Bell className="h-6 w-6 text-white" />
            </button>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-3 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200 touch-manipulation min-w-[48px] min-h-[48px] flex items-center justify-center"
              title="Refresh Data"
            >
              <RefreshCw className={`h-6 w-6 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Favorites & Locations */}
            <button
              onClick={onShowNotifications}
              className="p-3 text-white hover:bg-white/10 rounded-lg transition-all duration-200 touch-manipulation min-w-[48px] min-h-[48px] flex items-center justify-center"
              title="Favorites & Locations"
            >
              <MapPin className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};