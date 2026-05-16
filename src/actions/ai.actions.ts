'use server';

import { getDashboardStats } from './dashboard.actions';
import { GoogleGenAI } from '@google/genai';

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
