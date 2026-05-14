import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateManagementSummary(records: any[]) {
  const dataString = JSON.stringify(records.map(r => ({
    supplier: r.supplierName,
    average: r.averageScore,
    comments: r.comments
  })));

  const prompt = `
    Based on the following performance evaluation data of external providers, generate a concise "Management Review Summary".
    Include:
    1. Overall High-Performers (count and average range).
    2. Opportunities for Improvement (identify trends in feedback or poor ratings).
    3. Recommendations for procurement.
    
    Data: ${dataString}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt
  });

  return response.text || "No summary generated.";
}
