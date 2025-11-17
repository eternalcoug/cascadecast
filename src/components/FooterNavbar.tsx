import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Radar, 
  Fish, 
  Telescope, 
  TrendingUp,
  MapPin
} from 'lucide-react';

export const FooterNavbar: React.FC = () => {
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
        navigate('/astronomy');
      }
    } else if (path === '/fishing-conditions') {
      // Navigate to fishing conditions page with current location if available
      const currentWeatherData = JSON.parse(localStorage.getItem('cascade_cast_weather_data') || '{}');
      if (currentWeatherData.location && currentWeatherData.coordinates) {
        navigate('/fishing-conditions', {
          state: {
            location: currentWeatherData.location,
            coordinates: currentWeatherData.coordinates
          }
        });
      } else {
        navigate('/fishing-conditions');
      }
    } else if (path === '/radar') {
      // Navigate to radar page with current location if available
      const currentWeatherData = JSON.parse(localStorage.getItem('cascade_cast_weather_data') || '{}');
      if (currentWeatherData.location && currentWeatherData.coordinates) {
        navigate('/radar', {
          state: {
            location: currentWeatherData.location,
            coordinates: currentWeatherData.coordinates
          }
        });
      } else {
        navigate('/radar');
      }
    } else if (path === '/hourly-forecast') {
      // Navigate to hourly forecast with current data if available
      const currentWeatherData = JSON.parse(localStorage.getItem('cascade_cast_weather_data') || '{}');
      if (currentWeatherData.hourlyForecast && currentWeatherData.location) {
        navigate('/hourly-forecast', {
          state: {
            hourlyData: currentWeatherData.hourlyForecast.periods,
            location: currentWeatherData.location
          }
        });
      } else {
        navigate('/hourly-forecast');
      }
    } else {
      navigate(path);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path;
  };

  const navItems = [
    {
      path: '/',
      icon: Home,
      label: 'Weather',
      description: 'Current & 7-day forecast'
    },
    {
      path: '/hourly-forecast',
      icon: TrendingUp,
      label: 'Hourly',
      description: 'Detailed hourly forecast'
    },
    {
      path: '/radar',
      icon: Radar,
      label: 'Radar',
      description: 'Live weather radar'
    },
    {
      path: '/astronomy',
      icon: Telescope,
      label: 'Astronomy',
      description: 'Stargazing conditions'
    },
    {
      path: '/fishing-conditions',
      icon: Fish,
      label: 'Fishing',
      description: 'River & lake conditions'
    }
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200/50 shadow-lg">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-around py-2 sm:py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`flex flex-col items-center gap-1 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 touch-manipulation min-w-0 flex-1 max-w-20 sm:max-w-24 ${
                  active
                    ? 'bg-blue-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
                title={item.description}
              >
                <Icon className={`h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 ${
                  active ? 'text-white' : ''
                }`} />
                <span className={`text-xs sm:text-sm font-medium leading-tight text-center truncate w-full ${
                  active ? 'text-white' : ''
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Safe area padding for devices with home indicators */}
      <div className="h-safe-area-inset-bottom bg-white/95"></div>
    </footer>
  );
};