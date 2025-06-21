
import React from 'react';

const LuaIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
    <path d="M12 6v12" />
    <path d="M16 9l-4 4-4-4" />
  </svg>
);
export default LuaIcon;
