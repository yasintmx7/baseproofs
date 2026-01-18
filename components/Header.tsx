
import React from 'react';

interface HeaderProps {
  title: string;
  subtitle: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="mb-8 animate-in fade-in slide-in-from-left-6 duration-1000">
      <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tighter italic uppercase">{title}</h2>
      <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed max-w-2xl">{subtitle}</p>
    </div>
  );
};

export default Header;
