export type FuelType = 'Unleaded 91' | 'Premium 95' | 'Premium 98' | 'Diesel' | 'E10';

export interface FuelPrice {
  type: FuelType;
  price: number;
  trend: 'up' | 'down' | 'stable';
}

export interface Station {
  id: string;
  name: string;
  address: string;
  suburb: string;
  prices: Partial<Record<FuelType, number>>;
  distance?: number;
}

export interface PredictionDay {
  date: string;
  predictedPrice: number;
  confidence: number;
}

export interface FuelDataResponse {
  averages: FuelPrice[];
  stations: Station[];
  predictions: PredictionDay[];
  cyclePhase: string;
  recommendation: string;
}
