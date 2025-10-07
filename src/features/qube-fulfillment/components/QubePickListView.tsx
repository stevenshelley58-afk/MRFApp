import React, { useEffect, useMemo, useState } from 'react';
import SmartTable, { SmartTableColumn } from '../../../components/ui/SmartTable';
import { woMaterialsService } from '../../../services/api';

interface PickRow {
  id: string;
  status: string; // Submitted here
  mcPriorityFlag: boolean;
  priority: 'P1'|'P2'|'P3'|'P4';
  items: number;
  requiredBy: string; // ISO
  deliveryLocation: string;
  workOrders: string;
}

const QubePickListView: React.FC = () => {
  const [rows, setRows] = useState<PickRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    setRows(woMaterialsService.getPickList());
    setLoading(false);
  },[]);

  const columns: SmartTableColumn<PickRow>[] = [
    { accessorKey:'priority', header:'Priority', filterable:true, cell:(r)=> (
      <span className={`font-extrabold ${r.priority==='P1' || r.mcPriorityFlag ? 'text-red-600' : 'text-gray-800'}`}>{r.mcPriorityFlag ? '🚩 P1' : r.priority}</span>
    ) },
    { accessorKey:'id', header:'Request ID', filterable:true },
    { accessorKey:'status', header:'Status', filterable:true },
    { accessorKey:'items', header:'# of Items' },
    { accessorKey:'requiredBy', header:'Required Time', filterable:true, cell:(r)=> new Date(r.requiredBy).toLocaleString() },
    { accessorKey:'deliveryLocation', header:'Delivery Location', filterable:true },
    { accessorKey:'workOrders', header:'Work Order(s)', filterable:true },
    { accessorKey:'actions', header:'Actions', cell:(r)=> (
      <div className="relative">
        <details>
          <summary className="cursor-pointer select-none">…</summary>
          <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow">
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100" onClick={(e)=>{ e.preventDefault(); handleSplit(r); }}>Split Request</button>
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100" onClick={(e)=>{ e.preventDefault(); handlePrint(r); }}>Print Pick Slip</button>
          </div>
        </details>
      </div>
    ) },
  ];

  const handleRowClick = (r: PickRow) => {
    // Start picking (background) and navigate
    woMaterialsService.startPick(r.id);
    alert(`Navigating to Picking page for ${r.id} (mock)`);
  };

  const handleSplit = (r: PickRow) => {
    alert(`Split Request for ${r.id} (mock)`);
  };

  const handlePrint = (r: PickRow) => {
    const html = `<!doctype html><html><head><title>Pick Slip ${r.id}</title></head><body>
      <h1>Pick Slip ${r.id}</h1>
      <p>Priority: ${r.mcPriorityFlag ? 'P1 (MC)' : r.priority}</p>
      <p>Status: ${r.status}</p>
      <p>Required: ${new Date(r.requiredBy).toLocaleString()}</p>
      <p>Delivery Location: ${r.deliveryLocation}</p>
      <p>Work Orders: ${r.workOrders}</p>
      <hr />
      <p>Lines: ${r.items} (mock)</p>
    </body></html>`;
    const w = window.open('','_blank'); if (w) { w.document.write(html); w.document.close(); w.focus(); w.print(); }
  };

  return (
    <div className="space-y-4">
      <div className="text-2xl font-semibold text-gray-900">Warehouse Pick List</div>
      <SmartTable
        tableId="qube-picklist"
        data={rows}
        columns={columns}
        isLoading={loading}
        onRowClick={handleRowClick}
      />
    </div>
  );
};

export default QubePickListView;
