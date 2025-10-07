import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SmartTable, { SmartTableColumn } from '../../../components/ui/SmartTable';
import StatusPill from '../../../components/ui/StatusPill';
import { woMaterialsService } from '../../../services/api';

interface PriorityQueueItem {
  id: string;
  requestor: string;
  items: number;
  created: string;
  acPriorityScore: number;
}

interface ScopeRequestItem {
  id: string;
  status: 'Submitted' | 'Picking' | 'Ready for Collection' | 'In Transit' | 'Exception' | 'Delivered';
  priority: 'P1'|'P2'|'P3'|'P4';
  requestor: string;
  items: number;
  created: string;
}

interface ScopeData {
  exceptionsCount: number;
  queuePosition: {
    totalInQueue: number;
    highestPriority: { id: string; position: number };
    nextToPick: { id: string; position: number };
  };
  lockedMaterialsCount: number;
  priorityQueue: PriorityQueueItem[];
  allScopeRequests: ScopeRequestItem[];
}

const AreaCoordinatorDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const [scopeData, setScopeData] = useState<ScopeData | null>(null);
  const [activeTab, setActiveTab] = useState<'priority' | 'all'>('priority');
  const [selectedRequest, setSelectedRequest] = useState<ScopeRequestItem | null>(null);
  const [comment, setComment] = useState('');
  const [showLockedModal, setShowLockedModal] = useState(false);

  useEffect(() => {
    const scopeId = 'welding-scope';
    const data = woMaterialsService.getACScopeData(scopeId);
    setScopeData(data);
  }, []);

  const handleCardClick = (filter: string) => {
    navigate(`/requests?filter=${filter}`);
  };

  const handleLockedMaterialsClick = () => {
    setShowLockedModal(true);
  };

  const handleAddComment = () => {
    if (selectedRequest && comment.trim()) {
      woMaterialsService.addComment(selectedRequest.id, comment);
      setComment('');
      setSelectedRequest(null);
      // Refresh scope data
      const scopeId = 'welding-scope';
      const data = woMaterialsService.getACScopeData(scopeId);
      setScopeData(data);
    }
  };

  const priorityQueueColumns: SmartTableColumn<PriorityQueueItem>[] = [
    { accessorKey: 'id', header: 'Request ID' },
    { accessorKey: 'requestor', header: 'Requestor' },
    { accessorKey: 'items', header: '# Items' },
    { accessorKey: 'created', header: 'Created Date' },
    { accessorKey: 'acPriorityScore', header: 'Priority Order' },
  ];

  const allRequestsColumns: SmartTableColumn<ScopeRequestItem>[] = [
    { accessorKey: 'id', header: 'Request ID' },
    { accessorKey: 'status', header: 'Status', cell: (r) => <StatusPill status={r.status} /> },
    { accessorKey: 'priority', header: 'Priority', cell: (r) => (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
        r.priority === 'P1' ? 'bg-red-100 text-red-800' :
        r.priority === 'P2' ? 'bg-yellow-100 text-yellow-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {r.priority}
      </span>
    ) },
    { accessorKey: 'requestor', header: 'Requestor' },
    { accessorKey: 'items', header: '# Items' },
    { accessorKey: 'created', header: 'Created Date' },
  ];

  if (!scopeData) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-2xl font-semibold text-gray-900">
        My Scope Dashboard: Welding Scope
      </div>

      {/* Summary & Control Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          className="bg-white rounded-lg border border-amber-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCardClick('exceptions')}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 font-medium mb-2">⚠️ My Scope's Exceptions</div>
              <div className="text-3xl font-bold text-amber-600">{scopeData.exceptionsCount}</div>
            </div>
            <div className="text-amber-500 text-2xl">⚠️</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-blue-200 p-6">
          <div className="text-sm text-gray-600 font-medium mb-2">📊 My Scope's Queue Position</div>
          <div className="space-y-2 text-sm">
            <div>You have {scopeData.queuePosition.totalInQueue} requests in the Qube queue.</div>
            <div>Highest Priority Item: <span className="font-semibold">{scopeData.queuePosition.highestPriority.id}</span> at position #{scopeData.queuePosition.highestPriority.position}</div>
            <div>Next Item to be Picked: <span className="font-semibold">{scopeData.queuePosition.nextToPick.id}</span> at position #{scopeData.queuePosition.nextToPick.position}</div>
          </div>
        </div>

        <div 
          className="bg-white rounded-lg border border-purple-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={handleLockedMaterialsClick}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 font-medium mb-2">🔒 Locked Materials</div>
              <div className="text-3xl font-bold text-purple-600">{scopeData.lockedMaterialsCount}</div>
            </div>
            <div className="text-purple-500 text-2xl">🔒</div>
          </div>
        </div>
      </div>

      {/* Tabbed Interface */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('priority')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'priority'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🚀 AC Priority Queue
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Scope Requests
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'priority' ? (
            <div>
              <div className="mb-4 text-sm text-gray-600">
                Drag and drop rows to reorder priority within your scope. MC priorities still take precedence globally.
              </div>
              <SmartTable
                tableId="ac-priority-queue"
                data={scopeData.priorityQueue}
                columns={priorityQueueColumns}
                onRowClick={(row) => {
                  const fullRequest = scopeData.allScopeRequests.find(r => r.id === row.id);
                  if (fullRequest) setSelectedRequest(fullRequest);
                }}
              />
            </div>
          ) : (
            <SmartTable
              tableId="ac-all-requests"
              data={scopeData.allScopeRequests}
              columns={allRequestsColumns}
              onRowClick={(row) => setSelectedRequest(row)}
            />
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50" onClick={() => setSelectedRequest(null)}>
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <div className="font-semibold">Request ID: {selectedRequest.id}</div>
              <StatusPill status={selectedRequest.status} />
            </div>
            
            <div className="px-6 py-4 border-b">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Priority:</span>
                  <span className="ml-2">{selectedRequest.priority}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Requestor:</span>
                  <span className="ml-2">{selectedRequest.requestor}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Items:</span>
                  <span className="ml-2">{selectedRequest.items}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <span className="ml-2">{selectedRequest.created}</span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6 overflow-auto h-full">
              <section>
                <div className="text-sm text-gray-600 font-medium mb-2">Delivery Details</div>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  Deliver To: Warehouse 1 • Recipient: {selectedRequest.requestor} • Contact: 555-0101 • Priority: {selectedRequest.priority}
                </div>
              </section>
              
              <section>
                <div className="text-sm text-gray-600 font-medium mb-2">Line Items</div>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">{selectedRequest.items} items (mock)</div>
              </section>
              
              <section>
                <div className="text-sm text-gray-600 font-medium mb-2">Comments</div>
                <div className="space-y-3">
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <div className="text-xs text-gray-500 mb-1">System • 07/12/2025 10:30</div>
                    <div>Request submitted and queued for picking</div>
                  </div>
                  
                  <div className="border border-gray-200 rounded p-3">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment... Use @mentions to notify specific users (e.g., @MC)"
                      className="w-full border-0 resize-none focus:ring-0 text-sm"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleAddComment}
                        disabled={!comment.trim()}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Add Comment
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {selectedRequest.status === 'Submitted' && (
                <section>
                  <div className="text-sm text-gray-600 font-medium mb-2">Actions</div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                      ✏️ Edit Request
                    </button>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Locked Materials Modal */}
      {showLockedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">🔒 Locked Materials</h3>
              <button
                onClick={() => setShowLockedModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              {woMaterialsService.getLockedMaterials().map((lock, index) => (
                <div key={index} className="border border-gray-200 rounded p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{lock.materialDescription}</div>
                      <div className="text-sm text-gray-600 mt-1">{lock.comment}</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Locked by {lock.lockedBy}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AreaCoordinatorDashboardView;
