import { GoogleGenAI, GenerateContentResponse, Chat, Part, Content, GenerateContentParameters } from "@google/genai";
import { GEMINI_TEXT_MODEL, GEMINI_IMAGE_MODEL } from '../constants';
import { UploadedFile, ChatHistoryItem, Candidate, GroundingChunk } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This will be caught by the UI in a real scenario, or the app just won't work.
  // For this environment, we assume API_KEY is set.
  console.warn("API_KEY environment variable not found. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! }); // Non-null assertion as it's expected to be set

// Helper to convert UploadedFile (image) to Gemini Part
const fileToGenerativePart = (file: UploadedFile): Part | null => {
  if (!file.type.startsWith('image/')) {
    console.error("Non-image file provided to fileToGenerativePart");
    return null;
  }
  return {
    inlineData: {
      mimeType: file.type,
      data: file.content, // Assuming content is base64 for images
    },
  };
};

const cleanJsonString = (jsonStr: string): string => {
  let cleaned = jsonStr.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s; // Matches ```json ... ``` or ``` ... ```
  const match = cleaned.match(fenceRegex);
  if (match && match[2]) {
    cleaned = match[2].trim();
  }
  return cleaned;
};


export const streamTextResponse = async (
  prompt: string,
  systemInstruction?: string,
  imageFile?: UploadedFile,
  chatHistory?: ChatHistoryItem[],
  useGoogleSearch?: boolean
): Promise<AsyncGenerator<GenerateContentResponse, any, undefined>> => {
  const model = GEMINI_TEXT_MODEL;
  const parts: Part[] = [{ text: prompt }];

  if (imageFile) {
    const imagePart = fileToGenerativePart(imageFile);
    if (imagePart) {
      parts.unshift(imagePart); // Image first, then text prompt
    }
  }
  
  const contents: Content[] = [];
  if (chatHistory && chatHistory.length > 0) {
    contents.push(...chatHistory.map(item => ({ role: item.role, parts: item.parts })));
  }
  contents.push({ role: 'user', parts });


  const generateParams: GenerateContentParameters = {
    model,
    contents: contents,
    config: {
      ...(systemInstruction && { systemInstruction }),
      ...(useGoogleSearch && { tools: [{ googleSearch: {} }] }),
      // Add other configs like temperature, topK, topP if needed.
      // For general chat, default thinkingConfig is fine.
    },
  };

  return ai.models.generateContentStream(generateParams);
};


export const generateText = async (
  prompt: string,
  systemInstruction?: string,
  imageFile?: UploadedFile,
  chatHistory?: ChatHistoryItem[],
  useGoogleSearch?: boolean
): Promise<{ text: string; sources?: GroundingChunk[] }> => {
  try {
    const model = GEMINI_TEXT_MODEL;
    const parts: Part[] = [{ text: prompt }];

    if (imageFile) {
      const imagePart = fileToGenerativePart(imageFile);
      if (imagePart) {
        parts.unshift(imagePart); // Image first, then text prompt
      }
    }
    
    const contents: Content[] = [];
    if (chatHistory && chatHistory.length > 0) {
      contents.push(...chatHistory.map(item => ({ role: item.role, parts: item.parts })));
    }
    contents.push({ role: 'user', parts });

    const generateParams: GenerateContentParameters = {
      model,
      contents: contents,
      config: {
        ...(systemInstruction && { systemInstruction }),
        ...(useGoogleSearch && { tools: [{ googleSearch: {} }] }),
        // For general chat, default thinkingConfig is fine.
      },
    };
    
    const response: GenerateContentResponse = await ai.models.generateContent(generateParams);
    
    const text = response.text;
    const groundingMetadata = (response.candidates?.[0] as Candidate | undefined)?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks;

    return { text, sources };

  } catch (error) {
    console.error("Error generating text:", error);
    let errorMessage = "Sorry, I encountered an error while processing your request.";
    if (error instanceof Error) {
        errorMessage += ` Details: ${error.message}`;
    }
    // Check for specific GoogleGenAI errors if the SDK exports them, or inspect error object.
    // For now, a generic message.
    return { text: errorMessage };
  }
};


export const generateImage = async (
  prompt: string
): Promise<{ imageUrl?: string; error?: string }> => {
  try {
    const response = await ai.models.generateImages({
      model: GEMINI_IMAGE_MODEL,
      prompt: prompt,
      config: { numberOfImages: 1, outputMimeType: 'image/jpeg' }, // or 'image/png'
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      const mimeType = response.generatedImages[0].image.mimeType || 'image/jpeg';
      return { imageUrl: `data:${mimeType};base64,${base64ImageBytes}` };
    }
    return { error: "No image was generated. The response might be empty or malformed." };
  } catch (error) {
    console.error("Error generating image:", error);
    let errorMessage = "Sorry, I couldn't generate the image.";
    if (error instanceof Error) {
        errorMessage += ` Details: ${error.message}`;
    }
    return { error: errorMessage };
  }
};

// Simple chat session management (can be expanded)
// This is a placeholder for potential stateful chat. For the current App.tsx structure, chat history is managed in the component.
// If truly stateful server-side chat is needed, this would interact with `ai.chats.create`.
// For now, `generateText` with `chatHistory` serves the purpose of stateless chat turns.

export const createChatSession = (systemInstruction?: string, history?: ChatHistoryItem[]): Chat => {
    return ai.chats.create({
        model: GEMINI_TEXT_MODEL,
        config: {
            ...(systemInstruction && { systemInstruction }),
        },
        history: history || [],
    });
};

export const parseJsonFromResponse = <T,>(responseText: string): T | null => {
  const cleanedJsonStr = cleanJsonString(responseText);
  try {
    return JSON.parse(cleanedJsonStr) as T;
  } catch (e) {
    console.error("Failed to parse JSON response:", e, "Raw string:", responseText, "Cleaned string:", cleanedJsonStr);
    return null;
  }
};