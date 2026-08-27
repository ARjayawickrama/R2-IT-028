/**
 * Boiler System - Math Logic & Calculations
 */

// 1. ජල පරිමාව ගණනය කිරීම (Liters)
export const getWaterVolume = (length, width, thickness) => {
  const L = Number(length) || 0;
  const W = Number(width) || 0;
  const T = Number(thickness) || 0;
  
  // සූත්‍රය: (දිග * පළල * (ඝනකම / 10)) / 1000
  return (L * W * (T / 10)) / 1000;
};

// 2. ජල මට්ටමේ ප්‍රතිශතය (0 - 100%)
export const getWaterPercentage = (volume, maxCapacity = 50) => {
  const pct = (volume / maxCapacity) * 100;
  return Math.min(pct, 100);
};

// 3. උෂ්ණත්වය වෙනස් වීම Simulation කිරීම
export const simulateTemperature = (currentTemp, isCycling) => {
  if (isCycling && currentTemp < 100) {
    return currentTemp + 0.2;
  } else if (!isCycling && currentTemp > 22) {
    return currentTemp - 0.1;
  }
  return currentTemp;
};

// 4. Gauge එකේ කෝණය ගණනය කිරීම
export const getGaugeAngle = (value, max, startAngle = -210, span = 240) => {
  const pct = Math.min(value / max, 1);
  return startAngle + pct * span;
};