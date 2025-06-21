
import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import DownloadIcon from './icons/DownloadIcon';

interface GeneratedImageDisplayProps {
  imageUrl?: string;
  altText?: string;
  isLoading: boolean;
  prompt?: string;
}

const GeneratedImageDisplay: React.FC<GeneratedImageDisplayProps> = ({ imageUrl, altText = "Generated image", isLoading, prompt }) => {
  
  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    // Attempt to create a filename from the prompt, otherwise use a generic name
    const safePrompt = prompt ? prompt.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 50) : 'lua_ia_image';
    link.download = `${safePrompt}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="w-full aspect-square bg-slate-700/50 rounded-lg flex flex-col items-center justify-center p-4 shadow-inner">
        <LoadingSpinner size="lg" color="text-indigo-400" />
        <p className="mt-4 text-slate-300 text-center">Generating your masterpiece... <br/>
        {prompt && <span className="text-xs text-slate-400 truncate max-w-md block mt-1">Prompt: "{prompt}"</span>}
        </p>
      </div>
    );
  }

  if (!imageUrl) {
    return (
        <div className="w-full aspect-square bg-slate-700/30 rounded-lg flex items-center justify-center p-4 shadow-inner">
            <p className="text-slate-400 text-center">Your generated image will appear here.</p>
        </div>
    );
  }

  return (
    <div className="w-full p-2 bg-slate-700/50 rounded-lg shadow-lg">
        <img 
            src={imageUrl} 
            alt={altText} 
            className="w-full h-auto object-contain rounded-md aspect-square" 
        />
        {prompt && <p className="text-xs text-slate-400 mt-2 p-1 text-center">Prompt: "{prompt}"</p>}
        <button
          onClick={handleDownload}
          className="mt-3 w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-md shadow-md hover:shadow-lg transition-all duration-200 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-700"
          title="Download image"
        >
          <DownloadIcon className="w-5 h-5" />
          <span>Download Image</span>
        </button>
    </div>
  );
};

export default GeneratedImageDisplay;