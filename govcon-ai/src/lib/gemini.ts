import { GoogleGenAI } from "@google/genai";
import { RFPDocument } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const govAI = {
  async generateComplianceMatrix(documents: RFPDocument[]) {
    const combinedText = documents.map(d => `[Document: ${d.name} (${d.type})]\n${d.content}`).join("\n\n");
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Analyze the following RFP documents and extract a compliance matrix. 
      Return a JSON array of objects with these keys: 
      id (unique string), requirement (the text), source (e.g. Section L.1), status (default "unknown"), strategy (brief compliance approach).
      
      Documents:
      ${combinedText.substring(0, 15000)}`,
      config: {
        responseMimeType: "application/json",
      }
    });
    return JSON.parse(response.text || "[]");
  },

  async extractKeyDetails(documents: RFPDocument[]) {
    const combinedText = documents.map(d => `[Document: ${d.name} (${d.type})]\n${d.content}`).join("\n\n");
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Analyze the following RFP documents and find "Key Details" that are often buried or require "reading between the lines".
      Return a JSON array of objects with these keys:
      id (unique string), type ("Red Flag", "Evaluation Criteria", "Win Theme", "Constraint"), detail (the finding), source (where it was found), impact (why it matters).
      
      Focus on hidden risks, specific evaluation weights, and strategic opportunities.
      
      Documents:
      ${combinedText.substring(0, 15000)}`,
      config: {
        responseMimeType: "application/json",
      }
    });
    return JSON.parse(response.text || "[]");
  },

  async draftExecutiveSummary(context: { companyInfo: string, documents: RFPDocument[] }) {
    const combinedText = context.documents.map(d => `[Document: ${d.name}]\n${d.content}`).join("\n\n");
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Draft a professional Executive Summary for a government proposal.
      Company Context: ${context.companyInfo}
      RFP Context: ${combinedText.substring(0, 10000)}
      
      Focus on cost-effectiveness, minimal disruption, and WOSB status if applicable. Use placeholders like [Value] or [Metric] where specific data is needed.`,
    });
    return response.text || "";
  },

  async chat(messages: { role: 'user' | 'model', text: string }[], systemInstruction: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })),
      config: {
        systemInstruction,
      }
    });
    return response.text || "";
  }
};
