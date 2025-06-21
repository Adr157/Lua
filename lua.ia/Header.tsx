
import React from 'react';
import { APP_TITLE } from '../constants';

const Header: React.FC = () => {
  return (
    <header className="py-4 px-6 fixed top-0 left-0 right-0 z-20 bg-slate-950/80 backdrop-blur-md">
      <h1 className="text-3xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-sky-400 select-none">
        {APP_TITLE}
      </h1>
    </header>
  );
};

export default Header;
