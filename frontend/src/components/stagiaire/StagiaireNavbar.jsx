import React from 'react';
import { LogOut, Bell, Search, User } from 'lucide-react';

const StagiaireNavbar = () => {
  return (
    <header className="bg-white border-b border-gray-200 h-20 flex items-center justify-between px-8">
      <div className="relative w-96 hidden sm:block">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
          <Search size={18} />
        </span>
        <input 
          className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm" 
          placeholder="Search modules or grades..." 
          type="search" 
        />
      </div>

      <div className="flex items-center space-x-6">
        <button className="text-gray-500 hover:text-indigo-600 transition-colors relative">
          <Bell size={22} />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">3</span>
        </button>
        
        <div className="flex items-center space-x-4 border-l pl-6 border-gray-100">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800">Mohammed Amine</p>
            <p className="text-xs text-gray-500">Stagiaire (DEVWFS)</p>
          </div>
          <button className="bg-indigo-100 p-2 rounded-full text-indigo-600 hover:bg-indigo-200 transition-all">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default StagiaireNavbar;