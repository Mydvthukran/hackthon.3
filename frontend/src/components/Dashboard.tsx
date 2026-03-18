import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import type { DashboardSpec, ChartConfig, KPIConfig } from '../types';

interface DashboardProps {
  spec: DashboardSpec;
}

const COLORS = ['#58a6ff', '#8957e5', '#3fb950', '#d29922', '#f85149', '#a371f7'];

export const Dashboard: React.FC<DashboardProps> = ({ spec }) => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>{spec.dashboard_id || "Dashboard"}</h1>
        {spec.warnings && spec.warnings.length > 0 && (
          <div style={{ color: '#f85149', fontSize: '12px', marginTop: '8px' }}>
            {spec.warnings.join(', ')}
          </div>
        )}
      </div>

      {spec.kpis && spec.kpis.length > 0 && (
        <div className="kpi-row">
          {spec.kpis.map((kpi: KPIConfig, idx: number) => (
            <div key={kpi.id || idx} className="glass-panel kpi-card">
              <span className="kpi-label">{kpi.label}</span>
              <span className="kpi-value">
                {kpi.error ? "Error" : kpi.value !== null ? kpi.value : "--"}
              </span>
              {kpi.error && <span style={{color:'red', fontSize:'10px'}}>{kpi.error}</span>}
            </div>
          ))}
        </div>
      )}

      <div className="dashboard-grid">
        {spec.charts && spec.charts.map((chart: ChartConfig, idx: number) => (
          <div key={chart.id || idx} className="glass-panel chart-card">
            <div className="chart-header">
              <h3>{chart.title}</h3>
              <p>{chart.description}</p>
            </div>
            
            <div className="chart-body">
               {chart.error ? (
                 <div style={{color:'red', padding:'20px'}}>{chart.error}</div>
               ) : !chart.chart_data || chart.chart_data.length === 0 ? (
                 <div style={{color:'gray', padding:'20px', display:'flex', alignItems:'center', justifyContent:'center', height:'100%'}}>No data available</div>
               ) : (
                 <ChartRenderer chart={chart} />
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ChartRenderer: React.FC<{ chart: ChartConfig }> = ({ chart }) => {
  const data = chart.chart_data;
  const { chart_type, visual_encoding } = chart;
  const xKey = visual_encoding?.x || Object.keys(data[0])[0];
  const yKeys = visual_encoding?.y ? [visual_encoding.y] : Object.keys(data[0]).filter(k => k !== xKey && typeof data[0][k] === 'number');

  switch (chart_type) {
    case 'line':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey={xKey} stroke="#8b949e" />
            <YAxis stroke="#8b949e" />
            <Tooltip contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--panel-border)', borderRadius: '8px' }} />
            <Legend />
            {yKeys.map((k, i) => (
              <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} strokeWidth={3} dot={{r:4}} activeDot={{r:6}} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    case 'bar':
    case 'histogram':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey={xKey} stroke="#8b949e" />
            <YAxis stroke="#8b949e" />
            <Tooltip contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--panel-border)', borderRadius: '8px' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
            <Legend />
            {yKeys.map((k, i) => (
              <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    case 'area':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey={xKey} stroke="#8b949e" />
            <YAxis stroke="#8b949e" />
            <Tooltip contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--panel-border)', borderRadius: '8px' }} />
            <Legend />
            {yKeys.map((k, i) => (
              <Area key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.3} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );
    case 'pie':
    case 'donut': {
      const nameKey = visual_encoding?.x || visual_encoding?.color || Object.keys(data[0]).find(k => typeof data[0][k] === 'string') || Object.keys(data[0])[0];
      const valKey = visual_encoding?.y || visual_encoding?.size || Object.keys(data[0]).find(k => typeof data[0][k] === 'number') || Object.keys(data[0])[1];
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={chart_type === 'donut' ? 60 : 0}
              outerRadius={100}
              paddingAngle={chart_type === 'donut' ? 5 : 0}
              dataKey={valKey}
              nameKey={nameKey}
              labelLine={false}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--panel-border)', borderRadius: '8px' }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    default:
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey={xKey} stroke="#8b949e" />
            <YAxis stroke="#8b949e" />
            <Tooltip contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--panel-border)', borderRadius: '8px' }} />
            <Legend />
            {yKeys.map((k, i) => (
              <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[4,4,0,0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
  }
};
