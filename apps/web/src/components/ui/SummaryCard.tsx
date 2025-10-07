import React from 'react';
import { SummaryCard as SummaryCardType } from '../../types';

interface SummaryCardProps {
  card: SummaryCardType;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ card }) => {
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'clock':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'check':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'green':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'red':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${getColorClasses(card.color)}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{card.title}</p>
          <p className="text-3xl font-bold">{card.value}</p>
        </div>
        <div className={`${getColorClasses(card.color).split(' ')[0]} p-3 rounded-full`}>
          {getIconComponent(card.icon)}
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
