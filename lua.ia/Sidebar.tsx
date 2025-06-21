
import React from 'react';
import { AppMode } from '../types';
import LuaIcon from './icons/LuaIcon';
import ImageIcon from './icons/ImageIcon';
import FileCodeIcon from './icons/FileCodeIcon';
import ChatIcon from './icons/ChatIcon'; // Added for general chat

interface SidebarProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  mode: AppMode;
  currentMode: AppMode;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, mode, currentMode, onClick }) => {
  const isActive = mode === currentMode;
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex flex-col items-center justify-center w-full p-3 my-1 rounded-lg transition-all duration-200 ease-in-out group
                  ${isActive 
                    ? 'bg-indigo-600 shadow-lg shadow-indigo-500/50' 
                    : 'hover:bg-slate-700/50 transform hover:scale-105'}`}
    >
      <div className={`w-7 h-7 mb-1 ${isActive ? 'text-white' : 'text-indigo-300 group-hover:text-indigo-200'}`}>
        {icon}
      </div>
      <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
        {label}
      </span>
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentMode, onModeChange }) => {
  return (
    <nav className="w-24 bg-slate-900/70 backdrop-blur-md p-3 flex flex-col items-center fixed top-16 bottom-0 left-0 z-10 shadow-xl shadow-slate-950/50">
      <div className="mt-8 space-y-3 w-full">
        <NavItem
          icon={<LuaIcon />}
          label="Lua AI"
          mode={AppMode.LUA_CHAT}
          currentMode={currentMode}
          onClick={() => onModeChange(AppMode.LUA_CHAT)}
        />
        <NavItem
          icon={<ImageIcon />}
          label="Img Gen"
          mode={AppMode.IMAGE_GEN}
          currentMode={currentMode}
          onClick={() => onModeChange(AppMode.IMAGE_GEN)}
        />
        <NavItem
          icon={<FileCodeIcon />}
          label="Code Edit"
          mode={AppMode.FILE_EDITOR}
          currentMode={currentMode}
          onClick={() => onModeChange(AppMode.FILE_EDITOR)}
        />
         <NavItem
          icon={<ChatIcon />}
          label="Chat"
          mode={AppMode.GENERAL_CHAT}
          currentMode={currentMode}
          onClick={() => onModeChange(AppMode.GENERAL_CHAT)}
        />
      </div>
    </nav>
  );
};

export default Sidebar;
