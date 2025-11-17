import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Thermometer, TrendingUp, Radar, Waves, Sun } from 'lucide-react';

interface HourlyData {
  number: number;
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  icon: string;
  shortForecast: string;
  detailedForecast: string;
  probabilityOfPrecipitation?: {
    value: number | null;
  };
  relativeHumidity?: {
    value: number | null;
  };
  dewpoint?: {
    value: number | null;
  };
}

interface TemperatureGraphProps {
  hourlyData: HourlyData[];
  location: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
}

export const TemperatureGraph: React.FC<TemperatureGraphProps> = ({ hourlyData, location, coordinates }) => {
  const navigate = useNavigate();

  // This component is no longer needed since Current Weather Summary 
  // has been moved to WeatherForecast component
  return null;
};