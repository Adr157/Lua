
import React from 'react';
import FileCodeIcon from './icons/FileCodeIcon'; 
import DownloadIcon from './icons/DownloadIcon';

interface CodeDisplayProps {
  code: string;
  onCodeChange?: (newCode: string) => void; 
  fileName?: string;
  isLoading?: boolean; 
  isEditable?: boolean; 
}

const CodeDisplay: React.FC<CodeDisplayProps> = ({ code, onCodeChange, fileName, isLoading, isEditable = false }) => {
  const handleCodeChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onCodeChange) {
      onCodeChange(event.target.value);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code)
      .then(() => { /* Maybe show a temporary "Copied!" message */ })
      .catch(err => console.error('Failed to copy code: ', err));
  };

  const handleDownloadFile = () => {
    if (!code) return;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `lua-ia-code-${Date.now()}.${fileName?.split('.').pop() || 'txt'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!code && !fileName && !isLoading) {
     return (
        <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-xl text-center text-slate-400 min-h-[200px] flex flex-col justify-center items-center border border-slate-700/50">
            <FileCodeIcon className="w-16 h-16 text-slate-500/70 mb-4" />
            <p className="text-slate-300">Upload a .txt or .lua file to view its content.</p>
            <p className="text-sm mt-1 text-slate-400">Then, instruct lua.ia to make changes in the chat below!</p>
        </div>
     );
  }

  return (
    <div className="bg-slate-800/70 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden border border-slate-700/50">
      {(fileName || code) && ( // Show header if there's a filename or any code
        <div className="px-4 py-2.5 bg-slate-900/80 text-slate-300 font-mono text-sm flex justify-between items-center border-b border-slate-700/50">
          <span className="truncate" title={fileName}>{fileName || "Untitled"}</span>
          <div className="flex space-x-2">
            <button
              onClick={handleCopyCode}
              disabled={!code}
              className="text-xs text-indigo-300 hover:text-indigo-100 p-1.5 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:opacity-50"
              title="Copy code to clipboard"
            >
              Copy Code
            </button>
            <button
              onClick={handleDownloadFile}
              disabled={!code}
              className="text-xs text-indigo-300 hover:text-indigo-100 p-1.5 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-400 flex items-center space-x-1 disabled:opacity-50"
              title="Download file"
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>
      )}
      <div className="relative p-0.5">
        <textarea
          value={code}
          onChange={handleCodeChange}
          readOnly={!isEditable || isLoading}
          className="w-full h-96 min-h-[200px] p-3 font-mono text-sm bg-transparent text-slate-200 border-0 focus:ring-0 resize-none custom-scrollbar placeholder-slate-500/80 focus:outline-none"
          placeholder={isLoading ? "lua.ia is updating the code..." : (isEditable ? "Enter or paste your code here..." : "Code will appear here...")}
          spellCheck="false"
          aria-label={fileName || "Code editor"}
        />
        {isLoading && (
          <div className="absolute inset-0 bg-slate-800/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center p-4">
              <svg className="animate-spin h-10 w-10 text-indigo-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-3 text-slate-300 font-medium">lua.ia is modifying code...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeDisplay;