
import React from 'react';

interface HeaderProps {
  title: string;
  subtitle: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">{title}</h2>
      <p className="text-neutral-400 text-lg">{subtitle}</p>
    </div>
  );
};

export default Header;
