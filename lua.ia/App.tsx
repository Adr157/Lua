
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GenerateContentResponse } from '@google/genai';
import { AppMode, ChatMessage, ChatRole, UploadedFile, ChatHistoryItem, GroundingChunk } from './types';
import { LUA_SYSTEM_PROMPT, FILE_EDITOR_SYSTEM_PROMPT, IMAGE_GENERATION_PROMPT_PREFIX, GENERAL_CHAT_SYSTEM_PROMPT, APP_TITLE } from './constants';
import { generateText, generateImage, streamTextResponse } from './services/geminiService';
import AnimatedBackground from './components/AnimatedBackground';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatInput from './components/ChatInput';
import ChatMessageDisplay from './components/ChatMessage';
import FileUpload from './components/FileUpload';
import CodeDisplay from './components/CodeDisplay';
import GeneratedImageDisplay from './components/GeneratedImageDisplay';
import TrashIcon from './components/icons/TrashIcon'; // For Clear Chat

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.LUA_CHAT);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fileEditorContent, setFileEditorContent] = useState<string>('');
  const [fileEditorName, setFileEditorName] = useState<string | null>(null);

  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | undefined>(undefined);
  const [imageGenPrompt, setImageGenPrompt] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null); 

  const getStorageKey = (mode: AppMode) => `lua-ia-messages-${mode}`;

  const createWelcomeMessage = (mode: AppMode): ChatMessage => {
    let text = "Welcome to lua.ia!";
    switch (mode) {
      case AppMode.LUA_CHAT: text = "Hello! I'm lua.ia, your Lua and Roblox scripting assistant. How can I help you code today?"; break;
      case AppMode.IMAGE_GEN: text = "Welcome to the Image Generation zone! Describe the image you'd like me to create."; break;
      case AppMode.FILE_EDITOR: text = "File Editor mode: Upload a .txt or .lua file, then tell me how to modify it in the chat below. Your code is displayed above."; break;
      case AppMode.GENERAL_CHAT: text = "Hi there! I'm lua.ia. Feel free to chat with me about anything, or ask for help with Lua or images!"; break;
    }
    return { id: `welcome-${mode}-${Date.now()}`, role: ChatRole.SYSTEM, text, timestamp: Date.now() };
  };
  
  useEffect(() => {
    const storedMessages = localStorage.getItem(getStorageKey(currentMode));
    if (storedMessages) {
      try {
        setMessages(JSON.parse(storedMessages));
      } catch (e) {
        console.error("Failed to parse stored messages:", e);
        setMessages([createWelcomeMessage(currentMode)]);
      }
    } else {
      setMessages([createWelcomeMessage(currentMode)]);
    }
    setFileEditorContent('');
    setFileEditorName(null);
    const storedFileContent = localStorage.getItem(`lua-ia-file-content-${currentMode}`);
    const storedFileName = localStorage.getItem(`lua-ia-file-name-${currentMode}`);
    if (currentMode === AppMode.FILE_EDITOR) {
      if (storedFileContent) setFileEditorContent(storedFileContent);
      if (storedFileName) setFileEditorName(storedFileName);
    }

    setGeneratedImageUrl(undefined);
    setImageGenPrompt('');
    setError(null);
    setIsLoading(false);
  }, [currentMode]);

  useEffect(() => {
    if (messages.length > 0) {
        const isJustWelcome = messages.length === 1 && messages[0].id.startsWith('welcome-');
        if (!isJustWelcome || messages[0].text !== createWelcomeMessage(currentMode).text) {
             localStorage.setItem(getStorageKey(currentMode), JSON.stringify(messages));
        }
    } else if (localStorage.getItem(getStorageKey(currentMode))) { 
        localStorage.removeItem(getStorageKey(currentMode));
    }
    if (currentMode === AppMode.FILE_EDITOR) {
        if (fileEditorContent) localStorage.setItem(`lua-ia-file-content-${currentMode}`, fileEditorContent);
        else localStorage.removeItem(`lua-ia-file-content-${currentMode}`);
        if (fileEditorName) localStorage.setItem(`lua-ia-file-name-${currentMode}`, fileEditorName);
        else localStorage.removeItem(`lua-ia-file-name-${currentMode}`);
    }

  }, [messages, currentMode, fileEditorContent, fileEditorName]);

  const smartScrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      // Scroll if user is already near the bottom or if content isn't scrollable yet (initial messages)
      if (scrollHeight - scrollTop <= clientHeight + 150 || scrollHeight <= clientHeight) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    } else {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, []);


  useEffect(() => {
    smartScrollToBottom();
  }, [messages, smartScrollToBottom]);

  const handleModeChange = (mode: AppMode) => {
    setCurrentMode(mode);
  };

  const addMessage = (text: string, role: ChatRole, options?: {imageUrl?: string, code?: string, sources?: GroundingChunk[], isLoading?: boolean, idOverride?: string, uploadedImage?: UploadedFile}): string => {
    const newMessageId = options?.idOverride || Date.now().toString() + Math.random().toString(36).substring(2,7);
    const newMessage: ChatMessage = { 
        id: newMessageId, 
        role, 
        text, 
        timestamp: Date.now(), 
        imageUrl: options?.imageUrl, 
        code: options?.code, 
        sources: options?.sources, 
        isLoading: options?.isLoading,
        uploadedImage: options?.uploadedImage
    };
    
    setMessages(prevMessages => {
        if (options?.isLoading && options?.idOverride && prevMessages.find(m => m.id === options?.idOverride)) {
            // This is for streaming, update existing loading message part by part
            return prevMessages.map(msg => msg.id === options?.idOverride ? { ...msg, text: msg.text + text, sources: options?.sources || msg.sources } : msg);
        }
        return [...prevMessages, newMessage];
    });
    return newMessageId;
  };
  
  const updateMessage = (id: string, newText: string, options?: {imageUrl?: string, code?: string, sources?: GroundingChunk[], finishedLoading?: boolean}) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === id
          ? { ...msg, text: newText, imageUrl: options?.imageUrl, code: options?.code, sources: options?.sources || msg.sources, isLoading: !(options?.finishedLoading), timestamp: Date.now() }
          : msg
      )
    );
  };

  const processStream = async (stream: AsyncGenerator<GenerateContentResponse, any, undefined>, messageId: string) => {
    let accumulatedText = "";
    let finalSources: GroundingChunk[] | undefined = undefined;
    try {
      for await (const chunk of stream) {
        accumulatedText += chunk.text; 
        if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            finalSources = chunk.candidates[0].groundingMetadata.groundingChunks;
        }
        // Update message with accumulated text for streaming effect, keep isLoading true
        updateMessage(messageId, accumulatedText, { sources: finalSources, finishedLoading: false });
      }
      // Final update when stream ends
      updateMessage(messageId, accumulatedText, { sources: finalSources, finishedLoading: true }); 
    } catch (e) {
      console.error("Streaming error:", e);
      let errorText = "Error processing stream.";
      if (e instanceof Error) { errorText = `Error: ${e.message}`; }
      updateMessage(messageId, accumulatedText + `\n\n[ERROR: ${errorText}]`, { sources: finalSources, finishedLoading: true });
    } finally {
      setIsLoading(false); // Ensure loading is set to false once stream is fully processed or errors
      smartScrollToBottom();
    }
  };

  const handleSendMessageInternal = async (
    inputText: string, 
    imageFile?: UploadedFile, 
    existingChatHistory?: ChatHistoryItem[]
  ) => {
    setIsLoading(true);
    // Create an empty AI message that will be populated by the stream
    const loadingMessageId = addMessage("", ChatRole.AI, { isLoading: true });
    smartScrollToBottom();


    const historyToUse = existingChatHistory || messages
      .filter(msg => msg.id !== loadingMessageId && msg.role !== ChatRole.SYSTEM) // Exclude the current loading message and system messages
      .slice(-10) // Take last 10 relevant messages
      .map(msg => {
          const parts: ChatHistoryItem['parts'] = [];
           if (msg.role === ChatRole.USER && msg.uploadedImage) {
              parts.push({ inlineData: { mimeType: msg.uploadedImage.type, data: msg.uploadedImage.content } });
          }
          parts.push({ text: msg.text }); // Always include text part

          return {
              role: msg.role === ChatRole.USER ? 'user' : 'model',
              parts
          };
      });

    try {
      if (currentMode === AppMode.LUA_CHAT || currentMode === AppMode.GENERAL_CHAT) {
        const systemPrompt = currentMode === AppMode.LUA_CHAT ? LUA_SYSTEM_PROMPT : GENERAL_CHAT_SYSTEM_PROMPT;
        const useSearch = currentMode === AppMode.GENERAL_CHAT;
        const stream = await streamTextResponse(inputText, systemPrompt, imageFile, historyToUse, useSearch);
        await processStream(stream, loadingMessageId);
      } else if (currentMode === AppMode.IMAGE_GEN) {
        setImageGenPrompt(inputText);
        const result = await generateImage(IMAGE_GENERATION_PROMPT_PREFIX + inputText);
        if (result.imageUrl) {
          setGeneratedImageUrl(result.imageUrl);
          updateMessage(loadingMessageId, `Here's an image for: "${inputText}"`, { imageUrl: result.imageUrl, finishedLoading: true });
        } else {
          updateMessage(loadingMessageId, result.error || "Failed to generate image.", { finishedLoading: true });
          setError(result.error || "Failed to generate image.");
        }
         setIsLoading(false); // Explicitly set loading false for non-streaming image gen
      } else if (currentMode === AppMode.FILE_EDITOR) {
        if (!fileEditorContent && !imageFile) { 
          updateMessage(loadingMessageId, "Please upload a file first or provide context for modifications.", { finishedLoading: true });
          setError("No file loaded to modify, and no contextual image provided.");
          setIsLoading(false);
          return;
        }
        const codeContext = fileEditorContent ? `\n\nOriginal Code (${fileEditorName || 'untitled'}):\n\`\`\`\n${fileEditorContent}\n\`\`\`\n` : "";
        const fullPrompt = `${codeContext}\nUser Request: ${inputText}\n\nModified Code (output only the raw modified code block):`;
        
        // File editor can also stream if we expect explanations or longer text. For now, using generateText for direct code.
        // If streaming is preferred for file editor (e.g., if it might explain changes):
        // const stream = await streamTextResponse(fullPrompt, FILE_EDITOR_SYSTEM_PROMPT, imageFile, historyToUse);
        // await processStream(stream, loadingMessageId); // Then parse final accumulated text for code
        // For now, simpler non-streaming for direct code output:
        const { text: modifiedCodeResponse, sources } = await generateText(fullPrompt, FILE_EDITOR_SYSTEM_PROMPT, imageFile, historyToUse);
        let finalCode = modifiedCodeResponse.replace(/^```(lua|txt|[\w\s-]+)?\s*|```$/g, '').trim(); // More robust regex for code block languages
        setFileEditorContent(finalCode);
        updateMessage(loadingMessageId, `Code updated for "${fileEditorName || 'file'}" based on your instruction: "${inputText}"`, { code: finalCode, sources, finishedLoading: true });
        setIsLoading(false); // Explicitly set loading false
      }
    } catch (e) {
      console.error("API Error:", e);
      let errorText = "An unexpected error occurred.";
       if (e instanceof Error) { errorText = `Error: ${e.message}`; }
      updateMessage(loadingMessageId, `[ERROR: ${errorText}]`, { finishedLoading: true });
      setError(errorText);
      setIsLoading(false); // Ensure loading is false on error
    } finally {
      // setIsLoading(false); // Moved into specific branches or processStream's finally
      smartScrollToBottom();
    }
  };

  const handleSendMessage = useCallback(async (inputText: string, imageFile?: UploadedFile) => {
    if (!inputText.trim() && !imageFile) return;
    setError(null);

    const userMessageText = imageFile ? `${inputText || `(Analyzing image: ${imageFile.name})`}` : inputText;
    addMessage(userMessageText, ChatRole.USER, { uploadedImage: imageFile });
    
    await handleSendMessageInternal(inputText, imageFile);
  }, [currentMode, fileEditorContent, fileEditorName, messages, smartScrollToBottom]); 

  const handleRegenerateMessage = useCallback(async (aiMessageIdToRegenerate: string) => {
    const aiMessageIndex = messages.findIndex(msg => msg.id === aiMessageIdToRegenerate);
    if (aiMessageIndex > 0) {
        const userMessageIndex = aiMessageIndex -1; // Assumes user message is directly before AI message
        const userMessage = messages[userMessageIndex];
        if (userMessage.role === ChatRole.USER) {
            setError(null);
            
            const systemRegenMsgId = `system-regen-${Date.now()}`;
            addMessage(`Regenerating response for: "${userMessage.text.substring(0, 50)}${userMessage.text.length > 50 ? '...' : ''}"`, ChatRole.SYSTEM, { idOverride: systemRegenMsgId});

            // Remove the old AI message and the system regeneration message before sending to history
            const chatHistoryForRegen = messages
                .slice(0, userMessageIndex) // History *before* the user message we are retrying
                .filter(msg => msg.role !== ChatRole.SYSTEM && msg.id !== systemRegenMsgId && msg.id !== aiMessageIdToRegenerate)
                .map((msg): ChatHistoryItem => ({ 
                    role: msg.role === ChatRole.USER ? 'user' : 'model',
                    parts: msg.uploadedImage ? 
                           [
                             { inlineData: { mimeType: msg.uploadedImage.type, data: msg.uploadedImage.content } },
                             { text: msg.text }
                           ] :
                           [ { text: msg.text } ]
                }));
            
            // Remove the old AI message that is being regenerated from the current message list
            setMessages(prev => prev.filter(msg => msg.id !== aiMessageIdToRegenerate));

            await handleSendMessageInternal(userMessage.text, userMessage.uploadedImage, chatHistoryForRegen);
        } else {
            setError("Could not find the original user prompt to regenerate.");
        }
    } else {
        setError("Could not find the message to regenerate or its preceding prompt.");
    }
  }, [messages, currentMode, fileEditorContent, fileEditorName, smartScrollToBottom]);


  const handleFileUpload = (file: UploadedFile) => {
    if (file.type === "text/plain" || file.name.endsWith(".lua") || file.type === "application/x-lua") {
      setFileEditorContent(file.content);
      setFileEditorName(file.name);
      setError(null);
      addMessage(`File "${file.name}" loaded and displayed above. Instruct lua.ia below on how to modify it.`, ChatRole.SYSTEM);
    } else {
      setError("Invalid file type. Please upload a .txt or .lua file.");
      addMessage(`Failed to load "${file.name}". Please upload a .txt or .lua file.`, ChatRole.SYSTEM);
    }
  };

  const handleClearChat = () => {
    if (window.confirm(`Are you sure you want to clear the chat history for ${APP_TITLE} - ${currentMode.replace('_', ' ')}? This cannot be undone.`)) {
      setMessages([createWelcomeMessage(currentMode)]); 
      localStorage.removeItem(getStorageKey(currentMode)); 
      if (currentMode === AppMode.IMAGE_GEN) {
        setGeneratedImageUrl(undefined);
        setImageGenPrompt('');
      }
      if (currentMode === AppMode.FILE_EDITOR) {
        setFileEditorContent('');
        setFileEditorName(null);
        localStorage.removeItem(`lua-ia-file-content-${currentMode}`);
        localStorage.removeItem(`lua-ia-file-name-${currentMode}`);
      }
      setError(null);
    }
  };
  
  const ModeSpecificHeader: React.FC = () => {
    let title = "";
    switch(currentMode) {
        case AppMode.LUA_CHAT: title = "Lua AI Chat"; break;
        case AppMode.IMAGE_GEN: title = "Image Generation Studio"; break;
        case AppMode.FILE_EDITOR: title = "AI File Editor"; break;
        case AppMode.GENERAL_CHAT: title = "General Chat"; break;
    }
    return (
        <div className="p-3 px-4 md:px-6 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 flex justify-between items-center sticky top-0 z-10">
            <h2 className="text-lg font-semibold text-slate-200">{title}</h2>
            <button
                onClick={handleClearChat}
                title="Clear Chat History for this Mode"
                className="p-2 rounded-md hover:bg-red-700/30 text-red-400 hover:text-red-300 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
    );
  }

  const renderContent = () => {
    // This container itself does not scroll, its children do. Added min-h-0 for better flex behavior.
    const chatViewBaseClasses = "flex flex-col flex-grow min-h-0"; 
    const messagesContainerClasses = "flex-grow overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 custom-scrollbar min-h-0";

    switch (currentMode) {
      case AppMode.LUA_CHAT:
      case AppMode.GENERAL_CHAT:
        return (
          <div className={chatViewBaseClasses}>
            <ModeSpecificHeader />
            <div ref={chatContainerRef} className={messagesContainerClasses}>
              {messages.map(msg => <ChatMessageDisplay key={msg.id} message={msg} onRegenerate={handleRegenerateMessage} />)}
              <div ref={messagesEndRef} />
            </div>
          </div>
        );
      case AppMode.IMAGE_GEN:
        return (
          <div className={chatViewBaseClasses}>
            <ModeSpecificHeader />
            {/* Combined classes, allow this to scroll all content */}
            <div ref={chatContainerRef} className={`${messagesContainerClasses} flex flex-col items-center`}> 
              <div className="w-full max-w-xl mx-auto space-y-4"> {/* Container for image and messages */}
                <GeneratedImageDisplay imageUrl={generatedImageUrl} isLoading={isLoading && !generatedImageUrl && !!imageGenPrompt} prompt={imageGenPrompt} />
                {/* Render messages if there are any beyond the initial welcome message, or if it's the only message */}
                { (messages.length > 1 || (messages.length === 1 && messages[0].id.startsWith('welcome-'))) && (
                    <div className="w-full mt-4 space-y-4">
                        {messages.map(msg => <ChatMessageDisplay key={msg.id} message={msg} onRegenerate={handleRegenerateMessage} />)}
                    </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        );
      case AppMode.FILE_EDITOR:
        return (
          <div className={chatViewBaseClasses}>
            <ModeSpecificHeader />
            <div ref={chatContainerRef} className={messagesContainerClasses}> {/* Main scroll container */}
              <FileUpload onFileUploaded={handleFileUpload} disabled={isLoading}/>
              {error && <p className="text-red-400 bg-red-900/40 p-3 rounded-md text-sm animate-message-in">{error}</p>}
              <CodeDisplay 
                  code={fileEditorContent} 
                  fileName={fileEditorName ?? undefined} 
                  onCodeChange={setFileEditorContent} 
                  isEditable={!isLoading}
                  isLoading={isLoading && messages.some(m => m.isLoading && m.role === ChatRole.AI && m.text === "")} 
              />
              {/* Messages area, now part of the parent scroll */}
              {(messages.length > 0 && !(messages.length === 1 && messages[0].id.startsWith('welcome-') && !fileEditorName)) && ( // Only show message list if actual chat happened or file loaded
                <div className="mt-4 space-y-4 border-t border-slate-700/50 pt-4">
                    {messages.map(msg => <ChatMessageDisplay key={msg.id} message={msg} onRegenerate={handleRegenerateMessage} />)}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        );
      default:
        return <div className="p-6 text-slate-400">Select a mode from the sidebar.</div>;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col antialiased font-inter overflow-hidden">
      <AnimatedBackground />
      <Header />
      <div className="flex flex-grow pt-16"> 
        <Sidebar currentMode={currentMode} onModeChange={handleModeChange} />
        {/* Main content area: flex-grow, flex-col. Removed overflow-hidden to allow children to manage scroll. */}
        <main className="flex-grow flex flex-col ml-24 bg-slate-900/40 backdrop-blur-md shadow-2xl shadow-slate-950/30"> 
          {(!process.env.API_KEY) && (
             <div className="absolute inset-0 bg-red-900/95 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-8 text-center">
                <h2 className="text-3xl font-bold text-red-100 mb-4 font-orbitron">API Key Missing!</h2>
                <p className="text-red-200 mb-2 text-lg">The <code>API_KEY</code> environment variable is not set.</p>
                <p className="text-red-200">This application requires a valid Google Gemini API key to function.</p>
                <p className="text-sm text-red-300 mt-6">Please ensure the <code>API_KEY</code> is correctly configured in your environment and reload the application.</p>
             </div>
          )}
          {renderContent()}
          <ChatInput 
            onSendMessage={handleSendMessage} 
            currentMode={currentMode}
            onFileUpload={currentMode === AppMode.FILE_EDITOR ? handleFileUpload : undefined}
            isLoading={isLoading}
          />
        </main>
      </div>
    </div>
  );
};

export default App;
