
import React, { useRef } from 'react';
import { UploadedFile } from '../types';
import UploadIcon from './icons/UploadIcon';

interface FileUploadProps {
  onFileUploaded: (file: UploadedFile) => void;
  acceptedMimeTypes?: string; // e.g., "text/plain,application/lua"
  buttonText?: string;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileUploaded, 
  acceptedMimeTypes = "text/plain,.lua", 
  buttonText = "Upload .txt or .lua File",
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileUploaded({
          name: file.name,
          type: file.type,
          content: content,
        });
      };
      reader.readAsText(file); // Assuming text files for code editor
    }
     // Reset file input to allow uploading the same file again
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="my-4 flex flex-col items-center">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={acceptedMimeTypes}
        className="hidden"
        disabled={disabled}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed flex items-center space-x-2"
      >
        <UploadIcon className="w-5 h-5" />
        <span>{buttonText}</span>
      </button>
    </div>
  );
};

export default FileUpload;
