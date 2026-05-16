'use server';

import { getDashboardStats } from './dashboard.actions';
import { getProductsAdvanced } from './product.actions';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { aiSearchSchema, AISearchParams } from '@/lib/validations/ai';

export async function generateDailySummary() {
  try {
    const statsResult = await getDashboardStats();
    if (!statsResult.success || !statsResult.data) {
      return { success: false, error: 'Could not retrieve stats for AI summary' };
    }

    const stats = statsResult.data;

    // Check if there is actual data today to summarize
    if (stats.todayOrders === 0 && stats.lowStockProducts.length === 0) {
       return { success: true, summary: "No sales recorded today yet. There are no immediate low stock alerts." };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'GEMINI_API_KEY is not configured' };
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
    You are an expert business analyst for a retail Point of Sale system.
    Please write a short, professional, 2-3 sentence daily business summary based on the following data:
    
    Today's Revenue: ₹${stats.todayRevenue.toFixed(2)}
    Today's Orders: ${stats.todayOrders}
    Top Selling Products overall: ${stats.topProducts.map(p => p.name).join(', ')}
    Low Stock Alerts: ${stats.lowStockProducts.map(p => `${p.name} (only ${p.stock} left)`).join(', ')}
    
    Make it actionable. Do not use markdown formatting like bold or italics. Keep it plain text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const summaryText = response.text?.trim() || "Unable to generate summary.";

    return { success: true, summary: summaryText };

  } catch (error) {
    console.error('generateDailySummary error:', error);
    return { success: false, error: 'Failed to generate AI summary due to an API error.' };
  }
}

export async function generateRestockInsights() {
  try {
    const statsResult = await getDashboardStats();
    if (!statsResult.success || !statsResult.data) {
      return { success: false, error: 'Could not retrieve data for restock insights' };
    }

    const stats = statsResult.data;

    if (stats.lowStockProducts.length === 0 && stats.topProducts.length === 0) {
      return { success: true, insights: "Inventory is stable. No immediate restock actions required." };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'GEMINI_API_KEY is not configured' };
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
    You are an expert inventory manager for a retail Point of Sale system.
    Analyze the following inventory data and provide practical, business-focused restock recommendations.
    
    Low Stock Items (Need immediate attention):
    ${stats.lowStockProducts.map(p => `- ${p.name} (Stock: ${p.stock}, Threshold: ${p.lowStockThreshold})`).join('\n')}
    
    Top Selling Products (Fast-moving, watch closely):
    ${stats.topProducts.map(p => `- ${p.name} (Units sold: ${p.quantity})`).join('\n')}
    
    Provide 2-3 concise, actionable sentences. Focus ONLY on restock priorities and urgency. 
    DO NOT use markdown formatting, conversational filler, or generic advice. Keep it strictly professional.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2, // low temperature for consistency
      }
    });

    const insightsText = response.text?.trim() || "Inventory looks stable, continue monitoring fast-moving items.";

    return { success: true, insights: insightsText };

  } catch (error) {
    console.error('generateRestockInsights error:', error);
    return { success: false, error: 'Failed to generate restock insights.' };
  }
}

export async function smartSearchProducts(query: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'GEMINI_API_KEY is not configured' };
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
    Convert the following user product search query into a STRICT JSON object representing search filters.
    
    User Query: "${query}"
    
    Requirements:
    - Respond ONLY with valid JSON.
    - No markdown formatting like \`\`\`json.
    - No explanations or conversational text.
    - Allowed keys: "keyword" (string), "maxPrice" (number), "minPrice" (number), "category" (string), "stockStatus" (string enum: "in_stock", "low_stock", "out_of_stock", "any"), "popularity" (boolean).
    - If a filter is not mentioned, omit the key or leave it null/undefined.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0,
        responseMimeType: 'application/json',
      }
    });

    let jsonStr = response.text || '{}';
    // Fallback: strip markdown if the model hallucinates it despite instructions
    jsonStr = jsonStr.replace(/^```json/g, '').replace(/```$/g, '').trim();

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON:', jsonStr);
      // Fallback: treat the whole query as a keyword if JSON fails
      parsedJson = { keyword: query, stockStatus: 'any' };
    }

    // Validate with Zod to ensure schema safety
    const validationResult = aiSearchSchema.safeParse(parsedJson);
    const safeFilters = validationResult.success 
      ? validationResult.data 
      : { keyword: query, stockStatus: 'any' as const };

    // Fetch products using the safe deterministic filters
    const searchResult = await getProductsAdvanced(safeFilters);
    
    return { 
      success: true, 
      data: searchResult.data || [], 
      filtersUsed: safeFilters 
    };

  } catch (error) {
    console.error('smartSearchProducts error:', error);
    return { success: false, error: 'AI search failed.' };
  }
}

