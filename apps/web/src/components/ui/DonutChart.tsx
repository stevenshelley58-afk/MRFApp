import React from 'react';

interface Segment { label: string; value: number; color: string; }
interface DonutChartProps {
  segments: Segment[];
  totalLabel?: string;
  onSegmentClick?: (label: string) => void;
}

const DonutChart: React.FC<DonutChartProps> = ({ segments, totalLabel, onSegmentClick }) => {
  const total = segments.reduce((s, x) => s + x.value, 0);
  let cumulative = 0;
  const radius = 54; const stroke = 18; const cx = 64; const cy = 64; const viewBox = 128;
  const circles = segments.map((seg, i) => {
    const pct = total ? seg.value / total : 0; const dash = 2 * Math.PI * radius;
    const strokeDasharray = `${pct * dash} ${dash}`;
    const strokeDashoffset = dash * (1 - cumulative) + 0.001; // prevent seams
    cumulative += pct;
    return (
      <circle key={i} r={radius} cx={cx} cy={cy}
        fill="transparent" stroke={seg.color} strokeWidth={stroke}
        strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset}
        style={{cursor:'pointer'}}
        onClick={()=> onSegmentClick && onSegmentClick(seg.label)} />
    );
  });

  return (
    <div style={{display:'grid',gridTemplateColumns:'128px 1fr',alignItems:'center',gap:12}}>
      <svg width={128} height={128} viewBox={`0 0 ${viewBox} ${viewBox}`}>{circles}
        <text x="64" y="64" dominantBaseline="middle" textAnchor="middle" fontSize="18" fontWeight={800}>{total}</text>
      </svg>
      <div>
        {segments.map(s => (
          <div key={s.label} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,cursor:'pointer'}} onClick={()=> onSegmentClick && onSegmentClick(s.label)}>
            <span style={{width:10,height:10,background:s.color,borderRadius:2,display:'inline-block'}}></span>
            <span style={{fontSize:14}}>{s.label}</span>
            <span style={{marginLeft:'auto',fontWeight:700}}>{s.value}</span>
          </div>
        ))}
        {totalLabel && (
          <div style={{marginTop:8,color:'#b45309',fontWeight:600,cursor:'pointer'}} onClick={()=> onSegmentClick && onSegmentClick('Exception')}>
            ⚠️ {totalLabel}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonutChart;
