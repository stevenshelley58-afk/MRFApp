import React from 'react';

interface StatusPillProps {
  status: string;
  mrfId?: string;
  onClick?: (mrfId: string) => void;
}

const StatusPill: React.FC<StatusPillProps> = ({ status, mrfId, onClick }) => {
  const getStatusColor = (status: string) => {
    if (status.includes('Not Requested')) return 'bg-gray-100 text-gray-800';
    if (status.includes('Requested')) return 'bg-blue-100 text-blue-800';
    if (status.includes('Picking')) return 'bg-yellow-100 text-yellow-800';
    if (status.includes('In Transit')) return 'bg-orange-100 text-orange-800';
    if (status.includes('Delivered')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const isClickable = mrfId && onClick;

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)} ${
        isClickable ? 'cursor-pointer hover:opacity-80' : ''
      }`}
      onClick={isClickable ? () => onClick(mrfId) : undefined}
    >
      {status}
    </span>
  );
};

export default StatusPill;
