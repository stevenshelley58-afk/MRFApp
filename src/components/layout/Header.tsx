import React from 'react';

const Header = () => {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">WO Materials</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Welcome, Requestor
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
