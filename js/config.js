/**
 * @fileoverview EcoTrace CO2 emission coefficients and thresholds.
 * All constants here — never hardcode values elsewhere.
 * @module config
 */

/** @type {Object} CO2 emission factors per activity unit */
export const CO2 = {
  TRANSPORT: {
    /** kg CO2 per km driven by car */
    CAR_PER_KM: 0.21,
    /** kg CO2 per km of flight (economy, per passenger) */
    FLIGHT_PER_KM: 0.255,
    /** kg CO2 per km of public transport */
    PUBLIC_PER_KM: 0.089,
  },
  ENERGY: {
    /** kg CO2 per kWh of electricity (India grid average) */
    ELECTRICITY_PER_KWH: 0.233,
    /** kg CO2 per kWh of natural gas */
    GAS_PER_KWH: 0.203,
  },
  DIET: {
    /** kg CO2 per month for vegan diet */
    VEGAN: 19.8,
    /** kg CO2 per month for moderate meat diet */
    MODERATE_MEAT: 59.4,
    /** kg CO2 per month for heavy meat diet */
    HEAVY_MEAT: 99.0,
  },
  SHOPPING: {
    /** kg CO2 per month for low shopping level */
    LOW: 10.0,
    /** kg CO2 per month for medium shopping level */
    MEDIUM: 25.0,
    /** kg CO2 per month for high shopping level */
    HIGH: 45.0,
  },
  THRESHOLDS: {
    /** Max kg/month to qualify as "low" footprint */
    LOW_MAX: 200,
    /** Min kg/month to qualify as "high" footprint */
    HIGH_MIN: 400,
    /** India monthly average kg CO2 per person */
    INDIA_AVG: 125,
    /** World monthly average kg CO2 per person */
    WORLD_AVG: 333,
  },
};

/** Input clamp limits for UI validation */
export const INPUT_LIMITS = {
  CAR_KM:       { min: 0, max: 5000 },
  FLIGHT_KM:    { min: 0, max: 50000 },
  PUBLIC_KM:    { min: 0, max: 5000 },
  ELECTRICITY:  { min: 0, max: 10000 },
  GAS:          { min: 0, max: 10000 },
};

/** Material Symbol icons per category */
export const CATEGORY_ICONS = {
  transport: 'directions_car',
  energy:    'bolt',
  diet:      'restaurant',
  shopping:  'shopping_bag',
};
