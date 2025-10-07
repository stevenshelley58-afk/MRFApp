import React, { useEffect, useMemo, useState } from 'react';
import { FormFieldDefinition, RequestFormConfig, SelectOption } from '../../types';
import { woMaterialsService } from '../../services/api';

interface DynamicRequestFormProps {
  config: RequestFormConfig;
  currentUser: { name: string; phone?: string };
  onChange: (values: Record<string, string>) => void;
}

const FieldRenderer: React.FC<{
  def: FormFieldDefinition;
  value: string;
  options: SelectOption[];
  onChange: (v: string) => void;
}> = ({ def, value, options, onChange }) => {
  const id = `f_${def.name}`;
  return (
    <div style={{display:'grid',gap:6}}>
      <label htmlFor={id} style={{fontSize:12,color:'#4b5563'}}>
        {def.label}{def.required && ' *'}
      </label>
      {def.type === 'text' && (
        <input id={id} value={value||''} onChange={e=>onChange(e.target.value)} style={{border:'1px solid #d1d5db',borderRadius:8,padding:'10px 12px'}} />
      )}
      {def.type === 'textarea' && (
        <textarea id={id} value={value||''} onChange={e=>onChange(e.target.value)} rows={4} style={{border:'1px solid #d1d5db',borderRadius:8,padding:'10px 12px'}} />
      )}
      {def.type === 'select' && (
        <select id={id} value={value||''} onChange={e=>onChange(e.target.value)} style={{border:'1px solid #d1d5db',borderRadius:8,padding:'10px 12px'}}>
          <option value="">Select...</option>
          {options.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
    </div>
  );
};

const DynamicRequestForm: React.FC<DynamicRequestFormProps> = ({ config, currentUser, onChange }) => {
  const [values, setValues] = useState<Record<string,string>>({});
  const [options, setOptions] = useState<Record<string, SelectOption[]>>({});

  useEffect(()=>{
    const initial: Record<string,string> = {};
    for(const def of config){
      if (def.default === 'currentUser.name') initial[def.name] = currentUser.name;
      if (def.default === 'currentUser.phone') initial[def.name] = currentUser.phone || '';
    }
    setValues(initial);
  },[config,currentUser]);

  useEffect(()=>{
    const load = async ()=>{
      const map: Record<string, SelectOption[]> = {};
      for(const def of config){
        if(def.type==='select' && def.options_key){
          map[def.name] = woMaterialsService.getListByKey(def.options_key);
        }
      }
      setOptions(map);
    };
    load();
  },[config]);

  useEffect(()=>{ onChange(values); },[values,onChange]);

  const cols = 2;
  return (
    <div style={{display:'grid',gridTemplateColumns:`repeat(${cols}, minmax(0,1fr))`,gap:16}}>
      {config.map(def => (
        <FieldRenderer
          key={def.name}
          def={def}
          value={values[def.name] || ''}
          options={options[def.name] || []}
          onChange={(v)=> setValues(prev=> ({...prev,[def.name]:v}))}
        />
      ))}
    </div>
  );
};

export default DynamicRequestForm;


