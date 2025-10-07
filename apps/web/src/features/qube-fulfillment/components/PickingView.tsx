import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SmartTable, { SmartTableColumn } from '../../../components/ui/SmartTable';
import { woMaterialsService } from '../../../services/api';

interface LineItem {
  id: string;
  status: 'Open'|'Picked'|'Exception';
  qty: number;
  description: string;
  itemNumber: string;
  location: string;
  packNumber?: string | null;
}

const useQuery = () => new URLSearchParams(useLocation().search);

const PickingView: React.FC = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const mrfId = query.get('mrf') || 'MRF-1234';

  const [lines, setLines] = useState<LineItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [showConfirmAll, setShowConfirmAll] = useState(false);
  const [showPartial, setShowPartial] = useState<{ lineId: string }|null>(null);
  const [showException, setShowException] = useState<{ lineId: string }|null>(null);
  const [partialQty, setPartialQty] = useState('');
  const [exceptionReason, setExceptionReason] = useState('');
  const [exceptionComment, setExceptionComment] = useState('');

  useEffect(()=>{
    setLines(woMaterialsService.getRequestItems(mrfId));
  },[mrfId]);

  const allClosed = useMemo(()=> lines.every(l => l.status !== 'Open'), [lines]);

  const columns: SmartTableColumn<LineItem>[] = [
    { accessorKey:'status', header:'Status', cell:(r)=> (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${r.status==='Picked'?'bg-green-100 text-green-800':r.status==='Exception'?'bg-yellow-100 text-yellow-800':'bg-gray-100 text-gray-800'}`}>{r.status}</span>
    ) },
    { accessorKey:'qty', header:'Qty' },
    { accessorKey:'description', header:'Material Description' },
    { accessorKey:'itemNumber', header:'Item Number' },
    { accessorKey:'location', header:'Storage Location' },
    { accessorKey:'packNumber', header:'Pack #' },
    { accessorKey:'actions', header:'Actions', cell:(r)=> (
      <div className="relative">
        <details>
          <summary className="cursor-pointer select-none">…</summary>
          <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow">
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100" onClick={(e)=>{ e.preventDefault(); handleMarkPicked(r.id); }}>Mark as Picked</button>
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100" onClick={(e)=>{ e.preventDefault(); setShowPartial({ lineId: r.id }); }}>Log Partial Pick</button>
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100" onClick={(e)=>{ e.preventDefault(); setShowException({ lineId: r.id }); }}>Flag Exception</button>
          </div>
        </details>
      </div>
    ) },
  ];

  const getRowId = (row: LineItem) => row.id;

  const handleMarkAll = () => setShowConfirmAll(true);
  const confirmMarkAll = () => {
    woMaterialsService.markAllPicked(mrfId);
    setLines(prev => prev.map(l => ({ ...l, status:'Picked' })));
    setSelected([]);
    setShowConfirmAll(false);
  };

  const handleMarkPicked = (lineId: string) => {
    woMaterialsService.markLinePicked(lineId);
    setLines(prev => prev.map(l => l.id===lineId ? { ...l, status:'Picked' } : l));
  };

  const handlePartialSubmit = () => {
    const qty = Number(partialQty || '0');
    woMaterialsService.logPartialPick(showPartial!.lineId, qty);
    setLines(prev => prev.map(l => l.id===showPartial!.lineId ? { ...l, status:'Picked' } : l));
    setShowPartial(null); setPartialQty('');
  };

  const handleExceptionSubmit = () => {
    woMaterialsService.flagException(showException!.lineId, exceptionReason, exceptionComment);
    setLines(prev => prev.map(l => l.id===showException!.lineId ? { ...l, status:'Exception' } : l));
    setShowException(null); setExceptionReason(''); setExceptionComment('');
  };

  const handleStageComplete = () => {
    woMaterialsService.stageComplete(mrfId);
    navigate('/qube-picklist');
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="px-4 py-3 border-b bg-white flex items-center justify-between">
        <button className="text-blue-600 font-semibold" onClick={()=> navigate('/qube-picklist')}>⬅️ Back to Pick List</button>
        <div className="text-sm text-gray-700 font-medium">Picking Request: <span className="font-bold">{mrfId}</span></div>
        <div className="text-sm text-gray-700">Deliver To: <span className="font-semibold">Warehouse 1</span></div>
      </header>

      <div className="px-4 py-3 bg-white border-b flex items-center gap-2">
        <button className="px-3 py-2 rounded bg-green-600 text-white font-semibold" onClick={handleMarkAll}>✅ Mark All as Picked</button>
        <button className="px-3 py-2 rounded border text-gray-700">⬇️ Bulk Update Status</button>
      </div>

      <div className="p-4 flex-1 overflow-auto">
        <SmartTable
          tableId={`picking-${mrfId}`}
          data={lines}
          columns={columns}
          enableSelection
          getRowId={getRowId}
          selectedRowIds={selected}
          onSelectionChange={setSelected}
        />
      </div>

      {allClosed && (
        <div className="p-4 border-t bg-white">
          <button className="w-full py-3 rounded bg-green-600 text-white font-bold text-lg" onClick={handleStageComplete}>Stage Complete & Notify Logistics</button>
        </div>
      )}

      {showConfirmAll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-lg font-semibold mb-4">Confirm</div>
            <div className="mb-4">Are you sure you want to mark all {lines.length} items as picked?</div>
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 rounded bg-green-600 text-white" onClick={confirmMarkAll}>Yes</button>
              <button className="flex-1 px-3 py-2 rounded bg-gray-300" onClick={()=> setShowConfirmAll(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showPartial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-lg font-semibold mb-4">Log Partial Pick</div>
            <input value={partialQty} onChange={e=> setPartialQty(e.target.value)} type="number" placeholder="Quantity Picked" className="w-full border border-gray-300 rounded px-3 py-2 mb-3" />
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 rounded bg-blue-600 text-white" onClick={handlePartialSubmit}>Save</button>
              <button className="flex-1 px-3 py-2 rounded bg-gray-300" onClick={()=> setShowPartial(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showException && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-lg font-semibold mb-4">Flag Exception</div>
            <select value={exceptionReason} onChange={e=> setExceptionReason(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 mb-3">
              <option value="">Select Reason</option>
              <option value="damaged">Damaged</option>
              <option value="mismatch">Item Mismatch</option>
              <option value="not-found">Not Found</option>
            </select>
            <textarea value={exceptionComment} onChange={e=> setExceptionComment(e.target.value)} placeholder="Comment (optional)" className="w-full border border-gray-300 rounded px-3 py-2 mb-3" />
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 rounded bg-blue-600 text-white" onClick={handleExceptionSubmit}>Save</button>
              <button className="flex-1 px-3 py-2 rounded bg-gray-300" onClick={()=> setShowException(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PickingView;
