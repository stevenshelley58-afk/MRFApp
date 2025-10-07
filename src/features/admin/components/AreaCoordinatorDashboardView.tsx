import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SmartTable, { SmartTableColumn } from '../../../components/ui/SmartTable';
import StatusPill from '../../../components/ui/StatusPill';
import { woMaterialsService } from '../../../services/api';

interface ActionQueueItem {
  id: string;
  status: 'Submitted' | 'Picking' | 'Ready for Collection' | 'In Transit' | 'Exception' | 'Delivered';
  priority: 'P1'|'P2'|'P3'|'P4';
  requestor: string;
  issue: string;
  created: string;
}

interface DashboardData {
  exceptionsCount: number;
  overdueCount: number;
  deliveredTodayCount: number;
  actionQueue: ActionQueueItem[];
}

const AreaCoordinatorDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ActionQueueItem | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    // Mock scope ID - in real app this would come from user context
    const scopeId = 'welding-scope';
    const data = woMaterialsService.getACDashboardData(scopeId);
    setDashboardData(data);
  }, []);

  const columns: SmartTableColumn<ActionQueueItem>[] = [
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
    { accessorKey: 'issue', header: 'Issue', cell: (r) => (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
        r.issue === 'Open Exception' ? 'bg-yellow-100 text-yellow-800' :
        r.issue === 'Stuck in Queue' ? 'bg-orange-100 text-orange-800' :
        'bg-blue-100 text-blue-800'
      }`}>
        {r.issue}
      </span>
    ) },
    { accessorKey: 'created', header: 'Created Date' },
  ];

  const handleCardClick = (filter: string) => {
    navigate(`/requests?filter=${filter}`);
  };

  const handleAddComment = () => {
    if (selectedRequest && comment.trim()) {
      woMaterialsService.addComment(selectedRequest.id, comment);
      setComment('');
      setSelectedRequest(null);
      // Refresh dashboard data
      const scopeId = 'welding-scope';
      const data = woMaterialsService.getACDashboardData(scopeId);
      setDashboardData(data);
    }
  };

  if (!dashboardData) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-2xl font-semibold text-gray-900">
        Dashboard: Welding Scope
      </div>

      {/* Health Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          className="bg-white rounded-lg border border-amber-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCardClick('exceptions')}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 font-medium mb-2">⚠️ Exceptions in My Scope</div>
              <div className="text-3xl font-bold text-amber-600">{dashboardData.exceptionsCount}</div>
            </div>
            <div className="text-amber-500 text-2xl">⚠️</div>
          </div>
        </div>

        <div 
          className="bg-white rounded-lg border border-red-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCardClick('overdue')}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 font-medium mb-2">🚩 Overdue Requests</div>
              <div className="text-3xl font-bold text-red-600">{dashboardData.overdueCount}</div>
            </div>
            <div className="text-red-500 text-2xl">🚩</div>
          </div>
        </div>

        <div 
          className="bg-white rounded-lg border border-green-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCardClick('delivered-today')}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 font-medium mb-2">✅ Delivered Today</div>
              <div className="text-3xl font-bold text-green-600">{dashboardData.deliveredTodayCount}</div>
            </div>
            <div className="text-green-500 text-2xl">✅</div>
          </div>
        </div>
      </div>

      {/* Requests Requiring Action */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Requests Requiring Action</h3>
          <p className="text-sm text-gray-600 mt-1">
            Smart-filtered list of requests that need your attention
          </p>
        </div>
        
        <div className="p-6">
          <SmartTable
            tableId="ac-action-queue"
            data={dashboardData.actionQueue}
            columns={columns}
            onRowClick={(row) => setSelectedRequest(row)}
          />
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button 
            className="text-blue-600 hover:text-blue-800 underline"
            onClick={() => navigate('/requests')}
          >
            Go to Full "Material Requests" Dashboard...
          </button>
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
                  <span className="font-medium text-gray-700">Issue:</span>
                  <span className="ml-2">{selectedRequest.issue}</span>
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
                <div className="bg-gray-50 border border-gray-200 rounded p-3">4 items (mock)</div>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AreaCoordinatorDashboardView;
