import React, { useEffect, useMemo, useState } from 'react';

type SortDir = 'asc'|'desc'|undefined;

interface FilterDropdownProps {
  values: string[]; // unique values from currently visible dataset
  onApply: (selected: string[] | null, sort?: SortDir) => void; // null = clear
  isActive?: boolean; // visual indicator
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ values, onApply, isActive }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortDir>(undefined);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = useState(true);

  useEffect(()=>{
    const init: Record<string, boolean> = {};
    values.forEach(v => { init[v] = true; });
    setSelected(init);
    setSelectAll(true);
  },[values]);

  const filteredList = useMemo(()=>{
    const needle = search.toLowerCase();
    return values.filter(v => v.toLowerCase().includes(needle));
  },[values,search]);

  const apply = () => {
    const chosen = Object.entries(selected).filter(([,checked])=>checked).map(([v])=>v);
    if (chosen.length === values.length) {
      onApply(null, sort); // no filter applied
    } else {
      onApply(chosen, sort);
    }
    setOpen(false);
  };

  const clear = () => {
    const reset: Record<string, boolean> = {};
    values.forEach(v=> reset[v] = true);
    setSelected(reset);
    setSelectAll(true);
    setSort(undefined);
    onApply(null, undefined);
    setOpen(false);
  };

  const toggleAll = (checked: boolean) => {
    setSelectAll(checked);
    const map: Record<string, boolean> = {};
    values.forEach(v=> map[v]=checked);
    setSelected(map);
  };

  const triggerStyle = isActive
    ? 'inline-flex items-center gap-1 text-blue-700'
    : 'inline-flex items-center gap-1 text-gray-500 hover:text-gray-700';

  return (
    <div className="relative inline-block">
      <button className={triggerStyle} onClick={()=> setOpen(o=>!o)} aria-label="Filter">
        {isActive ? '⏳' : '▼'}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2">
          <div className="text-sm text-gray-700">
            <button className="w-full text-left px-2 py-1 rounded hover:bg-gray-100" onClick={()=> setSort('asc')}>Sort A to Z</button>
            <button className="w-full text-left px-2 py-1 rounded hover:bg-gray-100" onClick={()=> setSort('desc')}>Sort Z to A</button>
            <div className="my-2 h-px bg-gray-200" />
            <input value={search} onChange={e=> setSearch(e.target.value)} placeholder="Search" className="w-full border border-gray-300 rounded px-2 py-1 mb-2" />
            <div className="max-h-48 overflow-auto border border-gray-200 rounded">
              <label className="flex items-center gap-2 px-2 py-1 border-b border-gray-200">
                <input type="checkbox" checked={selectAll} onChange={e=> toggleAll(e.target.checked)} />
                <span>(Select All)</span>
              </label>
              {filteredList.map(v => (
                <label key={v} className="flex items-center gap-2 px-2 py-1">
                  <input type="checkbox" checked={!!selected[v]} onChange={e=> setSelected(s=> ({...s, [v]: e.target.checked}))} />
                  <span className="truncate" title={v}>{v}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button className="px-3 py-1.5 rounded border border-gray-300" onClick={clear}>Clear</button>
              <button className="px-3 py-1.5 rounded bg-blue-600 text-white" onClick={apply}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;


