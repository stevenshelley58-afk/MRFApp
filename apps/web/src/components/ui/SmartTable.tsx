import React, { useEffect, useMemo, useRef, useState } from 'react';
import FilterDropdown from './FilterDropdown';

export type SortDir = 'asc' | 'desc';

export interface SmartTableColumn<T = any> {
  accessorKey: keyof T | string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
  cell?: (row: T) => React.ReactNode;
}

export interface SmartTableProps<T = any> {
  tableId: string;
  data: T[];
  columns: SmartTableColumn<T>[];
  isLoading?: boolean;
  enableSelection?: boolean;
  getRowId?: (row: T) => string;
  selectedRowIds?: string[]; // controlled selection
  onSelectionChange?: (ids: string[]) => void;
  onLoadMore?: () => void; // infinite scroll trigger
  onRowClick?: (row: T) => void;
}

interface ColumnPref { key: string; visible: boolean; }

const prefKey = (id: string) => `smarttable:prefs:${id}`;

function SmartTable<T = any>({
  tableId,
  data,
  columns,
  isLoading,
  enableSelection,
  getRowId = (row: any) => String(row.id ?? row.key ?? JSON.stringify(row)),
  selectedRowIds,
  onSelectionChange,
  onLoadMore,
  onRowClick,
}: SmartTableProps<T>) {
  // Column prefs (visibility and order)
  const [prefs, setPrefs] = useState<ColumnPref[]>(() => {
    const saved = localStorage.getItem(prefKey(tableId));
    if (saved) return JSON.parse(saved);
    return columns.map(c => ({ key: String(c.accessorKey), visible: true }));
  });
  useEffect(() => { localStorage.setItem(prefKey(tableId), JSON.stringify(prefs)); }, [prefs, tableId]);

  // Filters and sort
  const [filters, setFilters] = useState<Record<string, string[] | null>>({});
  const [sortState, setSortState] = useState<{ column: string; dir: SortDir } | null>(null);

  // Selection (controlled or uncontrolled)
  const [internalSel, setInternalSel] = useState<string[]>([]);
  const selected = selectedRowIds ?? internalSel;
  const setSelected = (ids: string[]) => {
    if (onSelectionChange) onSelectionChange(ids);
    else setInternalSel(ids);
  };

  // Compute visible columns based on prefs
  const visibleColumns = useMemo(() => {
    const map = new Map(prefs.map(p => [p.key, p.visible] as const));
    const order = prefs.map(p => p.key);
    return columns
      .filter(c => map.get(String(c.accessorKey)) !== false)
      .sort((a, b) => order.indexOf(String(a.accessorKey)) - order.indexOf(String(b.accessorKey)));
  }, [columns, prefs]);

  // Apply filters and sort to data (client-side)
  const filteredData = useMemo(() => {
    let rows = data.slice();
    // additive filters
    for (const [col, allowed] of Object.entries(filters)) {
      if (!allowed || allowed.length === 0) continue;
      rows = rows.filter((r: any) => allowed.includes(String(r[col as keyof typeof r])));
    }
    if (sortState) {
      const { column, dir } = sortState;
      rows.sort((a: any, b: any) => {
        const av = a[column]; const bv = b[column];
        if (av == null && bv == null) return 0;
        if (av == null) return dir === 'asc' ? -1 : 1;
        if (bv == null) return dir === 'asc' ? 1 : -1;
        const res = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
        return dir === 'asc' ? res : -res;
      });
    }
    return rows;
  }, [data, filters, sortState]);

  // Infinite scroll
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!onLoadMore) return;
    const el = containerRef.current; if (!el) return;
    const onScroll = () => {
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) onLoadMore();
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [onLoadMore]);

  // Header checkbox state (visible rows only)
  const visibleIds = filteredData.map(r => getRowId(r));
  const allChecked = visibleIds.length > 0 && visibleIds.every(id => selected.includes(id));
  const someChecked = visibleIds.some(id => selected.includes(id)) && !allChecked;

  const toggleAllVisible = (checked: boolean) => {
    if (checked) {
      const merged = Array.from(new Set([...selected, ...visibleIds]));
      setSelected(merged);
    } else {
      const remaining = selected.filter(id => !visibleIds.includes(id));
      setSelected(remaining);
    }
  };

  // Column manager (simple)
  const [showColumnMgr, setShowColumnMgr] = useState(false);
  const movePref = (idx: number, delta: number) => {
    const next = prefs.slice();
    const ni = Math.max(0, Math.min(next.length - 1, idx + delta));
    const [it] = next.splice(idx, 1);
    next.splice(ni, 0, it);
    setPrefs(next);
  };

  const getUniqueValuesForColumn = (key: string) => {
    // Per spec: unique values from already filtered results (excluding the column itself)
    let rows = data.slice();
    for (const [col, allowed] of Object.entries(filters)) {
      if (col === key) continue; // exclude current col
      if (!allowed || allowed.length === 0) continue;
      rows = rows.filter((r: any) => allowed.includes(String(r[col as keyof typeof r])));
    }
    return Array.from(new Set(rows.map((r: any) => String(r[key])))).sort((a,b)=>a.localeCompare(b));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Column manager */}
      <div className="p-2 border-b flex items-center justify-between bg-gray-50">
        <div className="text-sm text-gray-600">Smart Table</div>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1.5 rounded-md border text-sm bg-white text-gray-700 border-gray-300" onClick={()=> setShowColumnMgr(true)}>Columns▾</button>
        </div>
      </div>

      {showColumnMgr && (
        <div className="p-3 border-b">
          <div className="text-sm text-gray-700 font-medium mb-2">Show / Hide / Reorder Columns</div>
          <div className="space-y-1">
            {prefs.map((p, idx) => (
              <div key={p.key} className="flex items-center gap-2">
                <input type="checkbox" checked={p.visible} onChange={e=> setPrefs(prev=> prev.map((pp,i)=> i===idx? {...pp, visible: e.target.checked}:pp))} />
                <span className="flex-1 text-sm">{String(p.key)}</span>
                <button className="px-2 py-0.5 border rounded" onClick={()=> movePref(idx,-1)}>↑</button>
                <button className="px-2 py-0.5 border rounded" onClick={()=> movePref(idx, 1)}>↓</button>
              </div>
            ))}
          </div>
          <div className="mt-2 text-right"><button className="px-3 py-1.5 rounded bg-blue-600 text-white" onClick={()=> setShowColumnMgr(false)}>Done</button></div>
        </div>
      )}

      <div ref={containerRef} className="max-h-[60vh] overflow-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              {enableSelection && (
                <th className="px-4 py-2 text-left">
                  <input type="checkbox" checked={allChecked} ref={el=> { if(el) el.indeterminate = someChecked; }} onChange={e=> toggleAllVisible(e.target.checked)} />
                </th>
              )}
              {visibleColumns.map(col => {
                const key = String(col.accessorKey);
                const uniqueVals = getUniqueValuesForColumn(key);
                return (
                  <th key={key} className="px-4 py-2 text-left">
                    <div className="flex items-center gap-2">
                      <span>{col.header}</span>
                      <FilterDropdown
                        values={uniqueVals}
                        onApply={(sel, sort)=> {
                          setFilters(prev=> ({ ...prev, [key]: sel }));
                          if (sort) setSortState({ column: key, dir: sort });
                        }}
                        isActive={!!filters[key]}
                      />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((row: any) => {
              const rowId = getRowId(row);
              const checked = selected.includes(rowId);
              return (
                <tr key={rowId} className="hover:bg-gray-50 cursor-pointer" onClick={()=> onRowClick && onRowClick(row)}>
                  {enableSelection && (
                    <td className="px-4 py-2" onClick={e=> e.stopPropagation()}>
                      <input type="checkbox" checked={checked} onChange={e=> {
                        if (e.target.checked) setSelected(Array.from(new Set([...selected, rowId])));
                        else setSelected(selected.filter(id => id !== rowId));
                      }} />
                    </td>
                  )}
                  {visibleColumns.map(col => (
                    <td key={String(col.accessorKey)} className="px-4 py-2">
                      {col.cell ? col.cell(row) : String(row[col.accessorKey as keyof typeof row] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })}
            {isLoading && (
              <tr><td className="px-4 py-4 text-gray-500" colSpan={visibleColumns.length + (enableSelection?1:0)}>Loading…</td></tr>
            )}
            {!isLoading && filteredData.length === 0 && (
              <tr><td className="px-4 py-6 text-gray-500" colSpan={visibleColumns.length + (enableSelection?1:0)}>No records</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SmartTable;


