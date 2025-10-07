import React, { useState, useEffect } from 'react';
import { WOMaterialRow, MaterialRequest, SummaryCard as SummaryCardType } from '../../../types';
import { woMaterialsService } from '../../../services/api';
import Table from '../../../components/ui/Table';
import SummaryCard from '../../../components/ui/SummaryCard';
import RequestTray from '../../../components/ui/RequestTray';
import DynamicRequestForm from '../../../components/ui/DynamicRequestForm';

const WOMaterialView: React.FC = () => {
  const [materials, setMaterials] = useState<WOMaterialRow[]>([]);
  const [config, setConfig] = useState<{ summaryCards: SummaryCardType[] } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPackModal, setShowPackModal] = useState(false);
  const [packToDeselect, setPackToDeselect] = useState<string | null>(null);
  const [selectedMRF, setSelectedMRF] = useState<MaterialRequest | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [formValues, setFormValues] = useState<Record<string,string>>({});

  useEffect(() => {
    // Load data and configuration
    const woMaterials = woMaterialsService.getWOMaterials();
    const woConfig = woMaterialsService.getConfig();
    
    setMaterials(woMaterials);
    setConfig(woConfig);
  }, []);

  const handleRowSelect = (index: number) => {
    const newMaterials = [...materials];
    const row = newMaterials[index];
    
    // If deselecting a row that has a pack number, show confirmation modal
    if (row.isSelected && row.stOpPackNumber) {
      setPackToDeselect(row.stOpPackNumber);
      setShowPackModal(true);
      return;
    }
    
    // Toggle selection
    newMaterials[index].isSelected = !newMaterials[index].isSelected;
    setMaterials(newMaterials);
  };

  const handlePackDeselect = (packNumber: string) => {
    const newMaterials = materials.map(row => ({
      ...row,
      isSelected: row.stOpPackNumber === packNumber ? false : row.isSelected
    }));
    setMaterials(newMaterials);
    setShowPackModal(false);
    setPackToDeselect(null);
  };

  const handleMRFClick = (mrfId: string) => {
    const mrf = woMaterialsService.getMaterialRequestById(mrfId);
    setSelectedMRF(mrf || null);
  };

  const filteredMaterials = materials.filter(material =>
    material.workOrder.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCount = materials.filter(m => m.isSelected).length;
  const selectedItemNumbers = materials.filter(m=>m.isSelected).map(m=> m.partNumber);

  const openReview = () => setShowSubmitModal(true);
  const closeReview = () => setShowSubmitModal(false);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {config && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {config.summaryCards.map((card) => (
            <SummaryCard key={card.id} card={card} />
          ))}
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-lg">
            <input
              type="text"
              placeholder="Search by Work Order, Part Number, or Description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="ml-4 text-sm text-gray-600">
            {selectedCount} items selected
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-white rounded-lg shadow-sm">
        <Table
          data={filteredMaterials}
          onRowSelect={handleRowSelect}
          onMRFClick={handleMRFClick}
          onPackDeselect={handlePackDeselect}
        />
      </div>

      {/* Request Tray */}
      <RequestTray selectedItemNumbers={selectedItemNumbers} onReview={openReview} />

      {/* Pack Deselection Confirmation Modal */}
      {showPackModal && packToDeselect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Pack Deselection
            </h3>
            <p className="text-gray-600 mb-6">
              This item is part of a pack. Unselecting it will unselect all other items in Pack #{packToDeselect}. Do you want to continue?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handlePackDeselect(packToDeselect)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Yes, Unselect All
              </button>
              <button
                onClick={() => {
                  setShowPackModal(false);
                  setPackToDeselect(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MRF Detail Side Panel */}
      {selectedMRF && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Material Request Details
              </h3>
              <button
                onClick={() => setSelectedMRF(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">MRF ID:</span>
                <span className="ml-2 text-gray-900">{selectedMRF.id}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Work Order:</span>
                <span className="ml-2 text-gray-900">{selectedMRF.workOrder}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Part Number:</span>
                <span className="ml-2 text-gray-900">{selectedMRF.partNumber}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className="ml-2 text-gray-900">{selectedMRF.status}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Requested By:</span>
                <span className="ml-2 text-gray-900">{selectedMRF.requestedBy}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Requested At:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(selectedMRF.requestedAt).toLocaleString()}
                </span>
              </div>
              {selectedMRF.packNumber && (
                <div>
                  <span className="font-medium text-gray-700">Pack Number:</span>
                  <span className="ml-2 text-gray-900">{selectedMRF.packNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-0 w-full max-w-5xl mx-4 overflow-hidden">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">New Material Request</h3>
              <button onClick={closeReview} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">1) Review Your Materials</h4>
                <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-2 text-left">Item Number</th>
                        <th className="px-4 py-2 text-left">Description</th>
                        <th className="px-4 py-2 text-left">WO Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {materials.filter(m=>m.isSelected).map(row => (
                        <tr key={`${row.workOrder}-${row.partNumber}`}>
                          <td className="px-4 py-2">{row.partNumber}</td>
                          <td className="px-4 py-2">{row.description}</td>
                          <td className="px-4 py-2">{row.packedQty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">2) Provide Delivery Details</h4>
                <DynamicRequestForm
                  config={woMaterialsService.getRequestFormConfig()}
                  currentUser={{ name: 'Jane Doe', phone: '555-0101' }}
                  onChange={setFormValues}
                />
              </div>
            </div>
            <div className="border-t px-6 py-4 flex items-center justify-between">
              <button onClick={closeReview} className="text-gray-600 hover:text-gray-800">Cancel</button>
              <button
                onClick={()=>{
                  const cfg = woMaterialsService.getRequestFormConfig();
                  for(const f of cfg){ if(f.required && !formValues[f.name]) { alert(`Please fill ${f.label}`); return; } }
                  const selected = materials.filter(m=>m.isSelected);
                  const res = woMaterialsService.submitMaterialRequest(selected, formValues);
                  // Refresh statuses in grid
                  const refreshed = woMaterialsService.getWOMaterials();
                  setMaterials(refreshed);
                  closeReview();
                  // simple toast
                  setTimeout(()=> alert(`✅ Success! Your request ${res.mrfId} has been submitted.`), 0);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >Submit Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WOMaterialView;
