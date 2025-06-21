import React, { useState, useRef, useEffect } from 'react';
import SendIcon from './icons/SendIcon';
import UploadIcon from './icons/UploadIcon';
import { AppMode, UploadedFile } from '../types';

interface ChatInputProps {
  onSendMessage: (message: string, image?: UploadedFile) => void;
  currentMode: AppMode;
  onFileUpload?: (file: UploadedFile) => void; 
  placeholderText?: string;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, currentMode, onFileUpload, placeholderText, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const [inputImage, setInputImage] = useState<UploadedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const defaultPlaceholders: Record<AppMode, string> = {
    [AppMode.LUA_CHAT]: "Ask lua.ia about Lua, Roblox, or generate code...",
    [AppMode.IMAGE_GEN]: "Describe the image you want to create...",
    [AppMode.FILE_EDITOR]: "Instruct lua.ia how to modify the code...",
    [AppMode.GENERAL_CHAT]: "Chat with lua.ia...",
  };
  
  const placeholder = placeholderText || defaultPlaceholders[currentMode];
  const canUploadImageForChat = currentMode === AppMode.GENERAL_CHAT || currentMode === AppMode.LUA_CHAT;
  const canUploadTextFile = currentMode === AppMode.FILE_EDITOR;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; 
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`; // Max height ~4 lines
    }
  }, [inputValue]);


  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleSend = () => {
    if (inputValue.trim() || inputImage) {
      onSendMessage(inputValue.trim(), inputImage ?? undefined);
      setInputValue('');
      setInputImage(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; 
      if (textareaRef.current) { 
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      const fileType = file.type;
      const fileName = file.name;

      reader.onloadend = () => {
        const result = reader.result as string;
        if (fileType.startsWith('image/') && canUploadImageForChat) {
          const base64String = result.split(',')[1];
          setInputImage({ name: fileName, type: fileType, content: base64String });
        } else if ((fileType === 'text/plain' || fileName.endsWith('.lua') || fileType === 'application/x-lua') && onFileUpload && canUploadTextFile) {
           onFileUpload({ name: fileName, type: fileType, content: result });
        } else if (fileType === 'text/plain' && canUploadImageForChat) { // User might upload a .txt to discuss its content
           // This case can be refined. For now, we allow sending text files as prompts.
           // The onSendMessage function might need to handle this differently if we want to display .txt content.
           // For now, it will be part of the text prompt.
           setInputValue(prev => `${prev}\n\n--- Start of ${fileName} ---\n${result}\n--- End of ${fileName} ---`);
        } else {
            console.warn("Unsupported file type for this mode or no handler: ", fileType);
            // Optionally, inform the user about unsupported file type
        }
      };

      if (fileType.startsWith('image/')) {
        reader.readAsDataURL(file); 
      } else if (fileType === 'text/plain' || fileName.endsWith('.lua') || fileType === 'application/x-lua') {
        reader.readAsText(file);
      }
    }
  };


  return (
    <div className="p-3 sm:p-4 bg-slate-800/60 backdrop-blur-md border-t border-slate-700/60 shadow-2xl shadow-slate-950/50">
      {inputImage && (
        <div className="mb-2 p-2 bg-slate-700/80 rounded-lg flex items-center justify-between animate-message-in">
          <div className="flex items-center space-x-2 overflow-hidden">
            <img src={`data:${inputImage.type};base64,${inputImage.content}`} alt="Preview" className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
            <span className="text-sm text-slate-300 truncate">{inputImage.name}</span>
          </div>
          <button 
            onClick={() => {setInputImage(null); if (fileInputRef.current) fileInputRef.current.value = "";}} 
            className="text-slate-400 hover:text-red-400 p-1 rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-red-500"
            aria-label="Remove image"
          >
            &times;
          </button>
        </div>
      )}
      <div className="flex items-end space-x-2 sm:space-x-3">
        {(canUploadImageForChat || canUploadTextFile) && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            title={canUploadTextFile ? "Upload .txt or .lua file" : "Upload image"}
            className="p-2.5 sm:p-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-800 transform active:scale-95"
            aria-label={canUploadTextFile ? "Upload code file" : "Upload image file"}
          >
            <UploadIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileSelect} 
          accept={canUploadTextFile ? ".txt,.lua,text/plain,application/x-lua" : "image/*"}
        />
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={isLoading ? "lua.ia is processing..." : placeholder}
          rows={1}
          disabled={isLoading}
          className="flex-grow p-2.5 sm:p-3 bg-slate-700/80 border border-slate-600/80 rounded-lg text-slate-100 placeholder-slate-400/80 focus:ring-2 focus:ring-indigo-500/80 focus:border-indigo-500/80 transition-all duration-200 resize-none overflow-y-auto max-h-40 custom-scrollbar focus:outline-none"
          style={{caretColor: 'rgb(129, 140, 248)'}} 
          aria-label="Chat input"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || (!inputValue.trim() && !inputImage)}
          className="p-2.5 sm:p-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-800 transform active:scale-95"
          aria-label="Send message"
        >
          <SendIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;