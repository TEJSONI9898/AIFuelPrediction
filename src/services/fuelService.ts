import { GoogleGenAI, Type } from "@google/genai";
import { FuelDataResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function fetchMelbourneFuelData(): Promise<FuelDataResponse> {
  const prompt = `
    Get current live fuel price data for Melbourne, Victoria, Australia.
    Include:
    1. Average prices for Unleaded 91, Premium 95, Premium 98, and Diesel.
    2. A list of 5-8 major petrol stations (e.g., Coles Express, Woolworths/Ampol, 7-Eleven, United, BP) with their current approximate prices in different suburbs.
    3. A 7-day price prediction based on the current Melbourne fuel price cycle (identify if prices are rising, falling, or at the bottom).
    4. A clear recommendation: "Buy now" or "Wait".
    
    Return the data in strict JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            averages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  trend: { type: Type.STRING, enum: ["up", "down", "stable"] }
                },
                required: ["type", "price", "trend"]
              }
            },
            stations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  address: { type: Type.STRING },
                  suburb: { type: Type.STRING },
                  prices: {
                    type: Type.OBJECT,
                    properties: {
                      "Unleaded 91": { type: Type.NUMBER },
                      "Premium 95": { type: Type.NUMBER },
                      "Premium 98": { type: Type.NUMBER },
                      "Diesel": { type: Type.NUMBER }
                    }
                  }
                },
                required: ["id", "name", "address", "suburb", "prices"]
              }
            },
            predictions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  predictedPrice: { type: Type.NUMBER },
                  confidence: { type: Type.NUMBER }
                },
                required: ["date", "predictedPrice", "confidence"]
              }
            },
            cyclePhase: { type: Type.STRING },
            recommendation: { type: Type.STRING }
          },
          required: ["averages", "stations", "predictions", "cyclePhase", "recommendation"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data received from Gemini");
    return JSON.parse(text) as FuelDataResponse;
  } catch (error) {
    console.error("Error fetching fuel data:", error);
    // Fallback mock data if API fails or search is restricted
    return getMockData();
  }
}

function getMockData(): FuelDataResponse {
  const today = new Date();
  const predictions = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return {
      date: date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }),
      predictedPrice: 185.5 - (i * 1.5),
      confidence: 0.85 - (i * 0.05)
    };
  });

  return {
    averages: [
      { type: 'Unleaded 91', price: 189.9, trend: 'down' },
      { type: 'Premium 95', price: 204.9, trend: 'down' },
      { type: 'Premium 98', price: 212.9, trend: 'down' },
      { type: 'Diesel', price: 195.9, trend: 'stable' },
    ],
    stations: [
      { id: '1', name: '7-Eleven', address: '123 Lonsdale St', suburb: 'Melbourne CBD', prices: { 'Unleaded 91': 187.9, 'Diesel': 194.9 } },
      { id: '2', name: 'Coles Express', address: '456 Punt Rd', suburb: 'South Yarra', prices: { 'Unleaded 91': 191.9, 'Premium 98': 214.9 } },
      { id: '3', name: 'United Petroleum', address: '789 Sydney Rd', suburb: 'Brunswick', prices: { 'Unleaded 91': 185.5, 'Diesel': 192.9 } },
      { id: '4', name: 'Ampol', address: '101 Nepean Hwy', suburb: 'Brighton', prices: { 'Unleaded 91': 193.9, 'Premium 95': 208.9 } },
    ],
    predictions,
    cyclePhase: "Falling phase of the cycle",
    recommendation: "Wait if you can, prices are expected to drop further over the next few days."
  };
}
