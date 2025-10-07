import React from 'react';
import { WOMaterialRow } from '../../types';
import StatusPill from './StatusPill';

interface TableProps {
  data: WOMaterialRow[];
  onRowSelect: (index: number) => void;
  onMRFClick: (mrfId: string) => void;
  onPackDeselect: (packNumber: string) => void;
}

const Table: React.FC<TableProps> = ({ data, onRowSelect, onMRFClick, onPackDeselect }) => {
  const handleRowClick = (index: number, row: WOMaterialRow) => {
    // If this row has a pack number and is being selected, select the whole pack
    if (!row.isSelected && row.stOpPackNumber) {
      // Find all rows with the same pack number and select them
      data.forEach((dataRow, dataIndex) => {
        if (dataRow.stOpPackNumber === row.stOpPackNumber) {
          onRowSelect(dataIndex);
        }
      });
    } else {
      onRowSelect(index);
    }
  };

  const handlePackDeselectClick = (packNumber: string) => {
    onPackDeselect(packNumber);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Select
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Work Order
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Part Number
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Packed Qty
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Unit
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ST/OP Pack Number
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Priority
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              MRF Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr 
              key={`${row.workOrder}-${row.partNumber}`}
              className={`hover:bg-gray-50 ${row.isSelected ? 'bg-blue-50' : ''}`}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={row.isSelected}
                  onChange={() => handleRowClick(index, row)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {row.workOrder}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {row.partNumber}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {row.description}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {row.packedQty}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {row.unit}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {row.stOpPackNumber || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {row.location}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  row.priority === 'High' ? 'bg-red-100 text-red-800' :
                  row.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {row.priority}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {row.category}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusPill 
                  status={row.mrfStatus} 
                  mrfId={row.mrfId}
                  onClick={onMRFClick}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
