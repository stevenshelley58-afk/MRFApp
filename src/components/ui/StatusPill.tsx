import React from 'react';

interface StatusPillProps {
  status: string;
  mrfId?: string;
  onClick?: (mrfId: string) => void;
}

const StatusPill: React.FC<StatusPillProps> = ({ status, mrfId, onClick }) => {
  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('not requested')) return 'bg-gray-100 text-gray-800';
    if (s.includes('submitted')) return 'bg-indigo-100 text-indigo-800';
    if (s.includes('requested')) return 'bg-blue-100 text-blue-800';
    if (s.includes('ready for collection')) return 'bg-cyan-100 text-cyan-800';
    if (s.includes('picking')) return 'bg-yellow-100 text-yellow-800';
    if (s.includes('in transit')) return 'bg-orange-100 text-orange-800';
    if (s.includes('exception')) return 'bg-red-100 text-red-800';
    if (s.includes('delivered')) return 'bg-green-100 text-green-800';
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
