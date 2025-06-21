
import React, { useState } from 'react';
import { ChatMessage as ChatMessageType, ChatRole, GroundingChunk } from '../types';
import LoadingSpinner from './LoadingSpinner';
import CopyIcon from './icons/CopyIcon';
import RefreshIcon from './icons/RefreshIcon';
import DownloadIcon from './icons/DownloadIcon';

interface ChatMessageProps {
  message: ChatMessageType;
  onRegenerate?: (messageId: string) => void;
}

const SourceLink: React.FC<{ chunk: GroundingChunk, index: number }> = ({ chunk, index }) => {
  if (chunk.web && chunk.web.uri) {
    return (
      <a
        href={chunk.web.uri}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-indigo-300 hover:text-indigo-200 underline break-all transition-colors duration-150"
        title={chunk.web.title || chunk.web.uri}
      >
        [{index + 1}] {chunk.web.title || chunk.web.uri}
      </a>
    );
  }
  return null;
};


const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRegenerate }) => {
  const isUser = message.role === ChatRole.USER;
  const isAI = message.role === ChatRole.AI;
  const [showCopied, setShowCopied] = useState(false);

  const handleCopyText = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
    }).catch(err => console.error("Failed to copy text: ", err));
  };
  
  const handleDownloadImage = (imageUrl: string, imageName?: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageName || `lua-ia-generated-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatText = (text: string): React.ReactNode => {
    const parts = text.split(/(```(?:lua|javascript|python|html|css|json|bash)?\s*[\s\S]*?\s*```)/g);
    
    return parts.map((part, index) => {
      const codeBlockMatch = part.match(/^```(lua|javascript|python|html|css|json|bash)?\s*([\s\S]*?)\s*```$/);
      if (codeBlockMatch) {
        const lang = codeBlockMatch[1] || 'plaintext'; 
        const code = codeBlockMatch[2];
        return (
          <div key={`code-${index}`} className="my-2 bg-slate-800/80 rounded-md overflow-hidden shadow-sm">
            <div className="text-xs text-slate-400 bg-slate-900/70 px-3 py-1.5 flex justify-between items-center">
              <span className="font-semibold">{lang}</span>
              <button 
                onClick={() => handleCopyText(code)}
                className="text-xs text-indigo-300 hover:text-indigo-100 p-1 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-400"
                title="Copy code"
              >
                Copy
              </button>
            </div>
            <pre className="p-3.5 text-sm whitespace-pre-wrap break-all overflow-x-auto custom-scrollbar">
              <code>{code}</code>
            </pre>
          </div>
        );
      }
      let currentPartStr = String(part);
      currentPartStr = currentPartStr.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); 
      currentPartStr = currentPartStr.replace(/\*(.*?)\*/g, '<em>$1</em>'); 
      currentPartStr = currentPartStr.replace(/`(.*?)`/g, '<code class="bg-slate-700/60 text-indigo-300 px-1.5 py-0.5 rounded text-sm">$1</code>'); 
      
      return <span key={`text-${index}`} dangerouslySetInnerHTML={{ __html: currentPartStr }} />;
    });
  };

  return (
    <div className={`flex mb-4 animate-message-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-xl lg:max-w-2xl px-4 py-3 rounded-xl shadow-lg relative group ${
          isUser 
            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-none' 
            : 'bg-slate-700/70 backdrop-blur-sm text-slate-100 rounded-bl-none'
        }`}
      >
        {message.isLoading ? (
          <div className="flex items-center space-x-2 py-1">
            <LoadingSpinner size="sm" color="text-slate-300" /> 
            <span className="text-sm text-slate-300">lua.ia is thinking...</span>
          </div>
        ) : (
          <>
            <div className="prose prose-sm prose-invert max-w-none break-words"> 
              {formatText(message.text)}
            </div>
            {message.imageUrl && (
              <div className="mt-2.5">
                <img 
                  src={message.imageUrl} 
                  alt="Generated content" 
                  className="rounded-lg max-w-xs sm:max-w-sm md:max-w-md shadow-lg border-2 border-slate-600/50"
                />
              </div>
            )}
            {message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-slate-600/70">
                <p className="text-xs font-semibold text-slate-300 mb-1.5">Sources:</p>
                <ul className="space-y-1">
                  {message.sources.map((chunk, idx) => (
                    <li key={idx}><SourceLink chunk={chunk} index={idx} /></li>
                  ))}
                </ul>
              </div>
            )}
            {isAI && !message.isLoading && (message.text || message.imageUrl) && (
              <div className="absolute -top-2 -right-2 sm:top-1 sm:right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1 bg-slate-800/80 backdrop-blur-sm p-1 rounded-md shadow-md">
                {message.text && (
                    <button 
                        onClick={() => handleCopyText(message.text)}
                        title={showCopied ? "Copied!" : "Copy text"}
                        className="p-1.5 text-slate-300 hover:text-indigo-300 hover:bg-slate-700/70 rounded transition-colors"
                    >
                        <CopyIcon className="w-4 h-4" />
                    </button>
                )}
                {message.imageUrl && (
                    <button 
                        onClick={() => handleDownloadImage(message.imageUrl!)}
                        title="Download image"
                        className="p-1.5 text-slate-300 hover:text-indigo-300 hover:bg-slate-700/70 rounded transition-colors"
                    >
                        <DownloadIcon className="w-4 h-4" />
                    </button>
                )}
                {onRegenerate && (
                    <button 
                        onClick={() => onRegenerate(message.id)}
                        title="Regenerate response"
                        className="p-1.5 text-slate-300 hover:text-indigo-300 hover:bg-slate-700/70 rounded transition-colors"
                    >
                        <RefreshIcon className="w-4 h-4" />
                    </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;