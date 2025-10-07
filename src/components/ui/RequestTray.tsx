import React, { useState } from 'react';

interface RequestTrayProps {
  selectedItemNumbers: string[];
  onReview: () => void;
}

const RequestTray: React.FC<RequestTrayProps> = ({ selectedItemNumbers, onReview }) => {
  const [open, setOpen] = useState(false);
  const count = selectedItemNumbers.length;
  if (count === 0) return null;

  return (
    <div style={{position:'fixed',left:0,right:0,bottom:0,zIndex:40}}>
      <div style={{
        margin:'0 auto',
        maxWidth:1200,
        background:'white',
        border:'1px solid #e5e7eb',
        borderRadius:'12px 12px 0 0',
        boxShadow:'0 -10px 30px rgba(0,0,0,.08)',
        padding:'12px 16px',
      }}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
          <div style={{fontWeight:700}}>{count} Line{count>1?'s':''} Selected</div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <button onClick={()=>setOpen(o=>!o)} style={{border:'none',background:'transparent',cursor:'pointer',color:'#4b5563'}}>▾</button>
            <button onClick={onReview} style={{background:'#2563eb',color:'white',border:'none',borderRadius:10,padding:'10px 14px',fontWeight:700,cursor:'pointer'}}>Review & Add Details →</button>
          </div>
        </div>
        {open && (
          <div style={{marginTop:8,color:'#4b5563',fontSize:12}}>
            {selectedItemNumbers.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestTray;


