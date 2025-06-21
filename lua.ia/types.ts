
export enum ChatRole {
  USER = "user",
  AI = "ai",
  SYSTEM = "system"
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  timestamp: number;
  imageUrl?: string; // For AI generated images
  uploadedImage?: UploadedFile; // For user-uploaded images associated with their message
  code?: string; // For displaying code blocks from AI
  isLoading?: boolean; // For AI responses that are streaming or loading
  sources?: GroundingChunk[]; // For Google Search grounding
}

export enum AppMode {
  LUA_CHAT = "lua_chat",
  IMAGE_GEN = "image_gen",
  FILE_EDITOR = "file_editor",
  GENERAL_CHAT = "general_chat"
}

export interface UploadedFile {
  name: string;
  type: string; // MIME type
  content: string; // For text files or base64 for images
}

// From Gemini API - for grounding metadata
export interface WebContent {
  uri?: string; 
  title?: string; 
}

export interface GroundingChunk {
  web?: WebContent;
  // Other types of chunks could be added here if needed
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  // Other grounding metadata fields can be added here
}

// For Gemini API response structure if needed for more detailed parsing beyond .text
// This is an example, actual structure might vary based on specific use cases
export interface Candidate {
  content: {
    parts: Array<{ text?: string; inlineData?: unknown; json?: unknown }>; // Simplified
    role: string;
  };
  finishReason?: string;
  safetyRatings?: unknown[];
  groundingMetadata?: GroundingMetadata;
}

export interface GeminiResponse {
  candidates?: Candidate[];
  // promptFeedback might also be relevant
  text: string; // The primary text output
}

export interface GeneratedImage {
  image: {
    imageBytes: string; // Base64 encoded image
    mimeType: string;
  };
  // Potentially other fields like seed, etc.
}

export interface GeminiImageResponse {
  generatedImages: GeneratedImage[];
}

export interface ChatHistoryItem {
  role: 'user' | 'model'; // As per Gemini API `chat.history`
  parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>;
}