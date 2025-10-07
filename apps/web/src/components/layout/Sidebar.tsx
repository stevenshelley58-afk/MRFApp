import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="w-64 bg-gray-100 min-h-screen p-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800">MRF APP</h2>
      </div>
      
      <nav className="space-y-2">
        <Link
          to="/materials"
          className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive('/materials') 
              ? 'bg-blue-100 text-blue-800' 
              : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
          }`}
        >
          WO Materials
        </Link>
        
        <Link
          to="/requests"
          className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive('/requests') 
              ? 'bg-blue-100 text-blue-800' 
              : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
          }`}
        >
          Material Requests
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;
