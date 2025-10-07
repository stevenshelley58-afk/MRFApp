import React, { useMemo, useState } from 'react';
import DonutChart from '../../../components/ui/DonutChart';
import StatusPill from '../../../components/ui/StatusPill';

type MRFStatus = 'Submitted' | 'Picking' | 'Ready for Collection' | 'In Transit' | 'Exception' | 'Delivered';

interface MRFRow { id: string; status: MRFStatus; priority: 'P1'|'P2'|'P3'|'P4'; items: number; workOrders: string; created: string; }

const seed: MRFRow[] = [
  { id:'MRF-1234', status:'In Transit', priority:'P2', items:5, workOrders:'822670', created:'07/12/2025' },
  { id:'MRF-1232', status:'Exception', priority:'P1', items:2, workOrders:'855798', created:'07/12/2025' },
  { id:'MRF-1198', status:'Delivered', priority:'P4', items:1, workOrders:'857330', created:'06/12/2025' },
];

const MaterialRequestView: React.FC = () => {
  const [filter, setFilter] = useState<'All'|MRFStatus|'Exceptions'>('All');
  const [openPanel, setOpenPanel] = useState<MRFRow|null>(null);

  const data = seed;
  const counts = useMemo(()=>({
    Submitted: 6, Picking: 3, 'Ready for Collection': 2, 'In Transit': 7, Total: 18, Exceptions: 1,
  }),[]);

  const filtered = useMemo(()=>{
    if(filter==='All') return data;
    if(filter==='Exceptions') return data.filter(d=> d.status==='Exception');
    return data.filter(d=> d.status===filter);
  },[filter,data]);

  const segments = [
    { label:'Submitted', value: counts.Submitted, color:'#6366f1' },
    { label:'Picking', value: counts.Picking, color:'#f59e0b' },
    { label:'Ready for Collection', value: counts['Ready for Collection'], color:'#06b6d4' },
    { label:'In Transit', value: counts['In Transit'], color:'#f97316' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600 font-medium mb-4">My Request Status</div>
          <DonutChart
            segments={segments}
            totalLabel={`You have ${counts.Exceptions} request with an exception.`}
            onSegmentClick={(label)=> setFilter(label as any)}
          />
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600 font-medium mb-4">Live Pick Queue</div>
          <div className="text-gray-800 mb-2">3 of Your Requests are in the Qube Queue</div>
          <div className="mb-2">Now Picking: <a className="text-blue-600 font-semibold cursor-pointer" onClick={()=> setOpenPanel(seed[1])}>MRF-1232</a> (<span className="text-red-600 font-semibold">P1</span>)</div>
          <div>Next Up: <a className="text-blue-600 font-semibold cursor-pointer" onClick={()=> setOpenPanel(seed[0])}>MRF-1234</a> (P2)</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {['All','Submitted','Picking','Exceptions','Delivered'].map(k => (
            <button key={k} onClick={()=> setFilter(k as any)} className={`px-3 py-1.5 rounded-md border text-sm ${filter===k?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-300'}`}>{k==='Exceptions'? '⚠️ Exceptions' : k}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-md border text-sm bg-white text-gray-700 border-gray-300">Columns▾</button>
          <button className="px-3 py-1.5 rounded-md border text-sm bg-white text-gray-700 border-gray-300">Group By▾</button>
          <button className="px-3 py-1.5 rounded-md border text-sm bg-white text-gray-700 border-gray-300">Export to CSV</button>
        </div>
      </div>

      {/* Master Request List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-2 text-left">Request ID</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Priority</th>
              <th className="px-4 py-2 text-left"># of Items</th>
              <th className="px-4 py-2 text-left">Work Order(s)</th>
              <th className="px-4 py-2 text-left">Created Date</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map(row => (
              <tr key={row.id} className="hover:bg-gray-50 cursor-pointer" onClick={()=> setOpenPanel(row)}>
                <td className="px-4 py-2 text-blue-700 font-semibold">{row.id}</td>
                <td className="px-4 py-2"><StatusPill status={row.status} /></td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${row.priority==='P1'?'bg-red-100 text-red-800':row.priority==='P2'?'bg-yellow-100 text-yellow-800':'bg-gray-100 text-gray-800'}`}>{row.priority}</span>
                </td>
                <td className="px-4 py-2">{row.items}</td>
                <td className="px-4 py-2">{row.workOrders}</td>
                <td className="px-4 py-2">{row.created}</td>
                <td className="px-4 py-2">
                  {row.status==='Delivered' ? (
                    <button className="px-3 py-1.5 rounded-md bg-green-600 text-white" onClick={(e)=>{ e.stopPropagation(); setOpenPanel(row); }}>📄 View POD</button>
                  ) : (
                    <button className="px-3 py-1.5 rounded-md border bg-white text-gray-700 border-gray-300" onClick={(e)=>{ e.stopPropagation(); setOpenPanel(row); }}>View</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      {openPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50" onClick={()=> setOpenPanel(null)}>
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-xl" onClick={(e)=> e.stopPropagation()}>
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <div className="font-semibold">Request ID: {openPanel.id}</div>
              <StatusPill status={openPanel.status} />
            </div>
            <div className="px-6 py-4 flex items-center gap-2 border-b">
              {openPanel.status==='Submitted' && (
                <>
                  <button className="px-3 py-1.5 rounded-md border bg-white text-gray-700 border-gray-300">✏️ Edit Request</button>
                  <button className="px-3 py-1.5 rounded-md border bg-white text-gray-700 border-gray-300">🗑️ Delete Request</button>
                </>
              )}
            </div>
            <div className="p-6 space-y-6 overflow-auto h-full">
              <section>
                <div className="text-sm text-gray-600 font-medium mb-2">Delivery Details</div>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">Deliver To: Warehouse 1 • Recipient: Jane Doe • Contact: 555-0101 • Priority: {openPanel.priority}</div>
              </section>
              <section>
                <div className="text-sm text-gray-600 font-medium mb-2">Line Items</div>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">5 items (mock)</div>
              </section>
              {openPanel.status==='Delivered' && (
                <section>
                  <div className="text-sm text-gray-600 font-medium mb-2">Delivery & POD Information</div>
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">POD Photo: [placeholder] • Signature: [placeholder] • Delivered on: 07/12/2025 15:22</div>
                </section>
              )}
              <section>
                <div className="text-sm text-gray-600 font-medium mb-2">History & Comments</div>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">Submitted → Picking → In Transit</div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialRequestView;
