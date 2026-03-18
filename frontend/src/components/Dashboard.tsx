import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { Maximize2, X, AlertTriangle, BarChart2, Download, Lightbulb, TrendingUp, Target } from 'lucide-react';
import type { DashboardSpec, ChartConfig, KPIConfig } from '../types';

interface DashboardProps {
  spec: DashboardSpec;
}

const COLORS = ['#06b6d4', '#10b981', '#fb7185', '#fb923c', '#22d3ee', '#34d399', '#f472b6'];

// ── Helpers ─────────────────────────────────────────────────────────
function formatKpiValue(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return '--';
  if (typeof value === 'number') {
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000)     return `${(value / 1_000).toFixed(1)}K`;
    return value % 1 !== 0 ? value.toFixed(2) : String(value);
  }
  return String(value);
}

function exportDashboardCSV(spec: DashboardSpec) {
  const rows: string[] = [`Dashboard: ${spec.dashboard_id}`];
  spec.charts.forEach(chart => {
    if (!chart.chart_data?.length) return;
    rows.push('');
    rows.push(`Chart: ${chart.title}`);
    const headers = Object.keys(chart.chart_data[0]);
    rows.push(headers.join(','));
    chart.chart_data.forEach(row => {
      rows.push(headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
    });
  });
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${spec.dashboard_id || 'dashboard'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Generate AI-like insights from dashboard data
function generateInsights(spec: DashboardSpec): Array<{icon: React.ComponentType<any>, title: string, description: string, color: string}> {
  const insights = [];

  // Insight from KPIs
  if (spec.kpis && spec.kpis.length > 0) {
    const topKPI = spec.kpis[0];
    if (topKPI && topKPI.value !== null) {
      insights.push({
        icon: Target,
        title: 'Key Metric',
        description: `${topKPI.label}: ${formatKpiValue(topKPI.value)}`,
        color: '#06b6d4'
      });
    }
  }

  // Insight from charts
  if (spec.charts && spec.charts.length > 0) {
    insights.push({
      icon: TrendingUp,
      title: 'Data Trends',
      description: `Analysis includes ${spec.charts.length} visualization${spec.charts.length > 1 ? 's' : ''} across different dimensions`,
      color: '#10b981'
    });

    // Find charts with most data points
    const chartWithMostData = spec.charts.reduce((max, chart) =>
      (chart.chart_data?.length || 0) > (max.chart_data?.length || 0) ? chart : max
    , spec.charts[0]);

    if (chartWithMostData?.chart_data?.length) {
      insights.push({
        icon: Lightbulb,
        title: 'Rich Dataset',
        description: `${chartWithMostData.title} contains ${chartWithMostData.chart_data.length} data points for detailed analysis`,
        color: '#fb7185'
      });
    }
  }

  return insights;
}

// ── Dashboard ────────────────────────────────────────────────────────
export const Dashboard: React.FC<DashboardProps> = ({ spec }) => {
  const [fullscreenChart, setFullscreenChart] = useState<ChartConfig | null>(null);
  const [chartSearch, setChartSearch] = useState('');
  const [activeChartType, setActiveChartType] = useState<string>('all');

  const insights = useMemo(() => generateInsights(spec), [spec]);

  const chartTypes = useMemo(
    () => Array.from(new Set((spec.charts ?? []).map(c => c.chart_type))),
    [spec.charts]
  );

  const visibleCharts = useMemo(() => {
    const q = chartSearch.trim().toLowerCase();
    return (spec.charts ?? []).filter(chart => {
      const typeMatch = activeChartType === 'all' || chart.chart_type === activeChartType;
      const textMatch = !q
        || chart.title.toLowerCase().includes(q)
        || chart.description.toLowerCase().includes(q)
        || chart.chart_type.toLowerCase().includes(q);
      return typeMatch && textMatch;
    });
  }, [spec.charts, chartSearch, activeChartType]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <h1>{spec.dashboard_id || 'Dashboard'}</h1>
          {spec.warnings && spec.warnings.length > 0 && (
            <div className="dashboard-warnings">
              {spec.warnings.map((w, i) => (
                <span key={i} className="dashboard-warning-badge">
                  <AlertTriangle size={11} />
                  {w}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="dashboard-header-actions">
          <button
            className="icon-btn"
            onClick={() => exportDashboardCSV(spec)}
            title="Export dashboard data as CSV"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {spec.kpis && spec.kpis.length > 0 && (
        <div className="kpi-row">
          {spec.kpis.map((kpi: KPIConfig, idx: number) => (
            <div
              key={kpi.id || idx}
              className="glass-panel kpi-card"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <span className="kpi-label">{kpi.label}</span>
              <span className="kpi-value">
                {kpi.error ? 'Error' : formatKpiValue(kpi.value)}
              </span>
              {kpi.error && (
                <span className="kpi-error">
                  <AlertTriangle size={10} />
                  {kpi.error}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* AI Insights Summary */}
      {insights.length > 0 && (
        <div className="insights-row">
          {insights.map((insight, idx) => {
            const IconComponent = insight.icon;
            return (
              <div
                key={idx}
                className="glass-panel insight-card"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="insight-icon" style={{ color: insight.color }}>
                  <IconComponent size={20} />
                </div>
                <div className="insight-content">
                  <h4 className="insight-title">{insight.title}</h4>
                  <p className="insight-description">{insight.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {spec.charts && spec.charts.length > 0 && (
        <div className="dashboard-controls glass-panel">
          <div className="dashboard-controls-row">
            <input
              className="dashboard-search-input"
              type="text"
              placeholder="Search charts by title, description, or type"
              value={chartSearch}
              onChange={e => setChartSearch(e.target.value)}
              aria-label="Search charts"
            />
            <span className="dashboard-result-count">
              {visibleCharts.length} of {spec.charts.length} charts
            </span>
          </div>
          <div className="chart-type-filter-row">
            <button
              className={`chart-filter-chip${activeChartType === 'all' ? ' active' : ''}`}
              onClick={() => setActiveChartType('all')}
              type="button"
            >
              All
            </button>
            {chartTypes.map(type => (
              <button
                key={type}
                className={`chart-filter-chip${activeChartType === type ? ' active' : ''}`}
                onClick={() => setActiveChartType(type)}
                type="button"
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {visibleCharts.map((chart: ChartConfig, idx: number) => (
          <div
            key={chart.id || idx}
            className="glass-panel chart-card"
            style={{ animationDelay: `${idx * 70}ms` }}
          >
            <div className="chart-header">
              <div className="chart-header-left">
                <h3>{chart.title}</h3>
                <p>{chart.description}</p>
              </div>
              <div className="chart-header-actions">
                <span className="chart-type-badge">
                  <BarChart2 size={9} style={{ marginRight: 3 }} />
                  {chart.chart_type}
                </span>
                <button
                  className="icon-btn"
                  title="Expand chart"
                  onClick={() => setFullscreenChart(chart)}
                >
                  <Maximize2 size={13} />
                </button>
              </div>
            </div>

            <div className="chart-body">
              {chart.error ? (
                <div className="chart-error">
                  <AlertTriangle size={14} />
                  {chart.error}
                </div>
              ) : !chart.chart_data || chart.chart_data.length === 0 ? (
                <div className="chart-no-data">
                  <BarChart2 size={28} opacity={0.2} />
                  No data available
                </div>
              ) : (
                <ChartRenderer chart={chart} />
              )}
            </div>
          </div>
        ))}

        {visibleCharts.length === 0 && (
          <div className="glass-panel chart-card chart-empty-filter-state">
            <div className="chart-no-data">
              <BarChart2 size={30} opacity={0.2} />
              No charts match this filter. Try changing type or search terms.
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen chart modal */}
      {fullscreenChart && (
        <div className="modal-overlay" onClick={() => setFullscreenChart(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{fullscreenChart.title}</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {fullscreenChart.description}
                </p>
              </div>
              <button
                className="icon-btn"
                onClick={() => setFullscreenChart(null)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              {fullscreenChart.chart_data && fullscreenChart.chart_data.length > 0
                ? <ChartRenderer chart={fullscreenChart} />
                : <div className="chart-no-data">No data available</div>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Chart renderer ────────────────────────────────────────────────────
const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'rgba(13,17,23,0.95)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: '10px',
    fontSize: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
  itemStyle: { color: '#e6edf3' },
  labelStyle: { color: '#7d8590', fontWeight: 600 },
};

const ChartRenderer: React.FC<{ chart: ChartConfig }> = ({ chart }) => {
  const data = chart.chart_data;
  const { chart_type, visual_encoding } = chart;
  const xKey   = visual_encoding?.x || Object.keys(data[0])[0];
  const yKeys  = visual_encoding?.y
    ? [visual_encoding.y]
    : Object.keys(data[0]).filter(k => k !== xKey && typeof data[0][k] === 'number');
  const axisStyle = { stroke: '#4d5560', fontSize: 11, tickLine: false };

  switch (chart_type) {
    case 'line':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey={xKey} {...axisStyle} />
            <YAxis {...axisStyle} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {yKeys.map((k, i) => (
              <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]}
                strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }}
                isAnimationActive animationDuration={900} animationEasing="ease-out" />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );

    case 'area':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
            <defs>
              {yKeys.map((k, i) => (
                <linearGradient key={k} id={`areaGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey={xKey} {...axisStyle} />
            <YAxis {...axisStyle} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {yKeys.map((k, i) => (
              <Area key={k} type="monotone" dataKey={k}
                stroke={COLORS[i % COLORS.length]} strokeWidth={2}
                fill={`url(#areaGrad-${i})`}
                isAnimationActive animationDuration={900} animationEasing="ease-out" />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );

    case 'bar':
    case 'histogram':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey={xKey} {...axisStyle} />
            <YAxis {...axisStyle} />
            <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {yKeys.map((k, i) => (
              <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={48}
                isAnimationActive animationDuration={850} animationEasing="ease-out" />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );

    case 'pie':
    case 'donut': {
      const nameKey = visual_encoding?.x || visual_encoding?.color
        || Object.keys(data[0]).find(k => typeof data[0][k] === 'string')
        || Object.keys(data[0])[0];
      const valKey  = visual_encoding?.y || visual_encoding?.size
        || Object.keys(data[0]).find(k => typeof data[0][k] === 'number')
        || Object.keys(data[0])[1];
      const innerRadius = chart_type === 'donut' ? 55 : 0;
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius={innerRadius} outerRadius={90}
              paddingAngle={chart_type === 'donut' ? 4 : 0}
              dataKey={valKey} nameKey={nameKey} labelLine={false}
              isAnimationActive animationDuration={900} animationEasing="ease-out">
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    case 'scatter': {
      const xCol = visual_encoding?.x || Object.keys(data[0])[0];
      const yCol = visual_encoding?.y || Object.keys(data[0])[1];
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey={xCol} {...axisStyle} type="number" />
            <YAxis dataKey={yCol} {...axisStyle} type="number" />
            <Tooltip {...tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Scatter name={chart.title} data={data} fill={COLORS[0]} isAnimationActive animationDuration={850} />
          </ScatterChart>
        </ResponsiveContainer>
      );
    }

    case 'stacked_bar': {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey={xKey} {...axisStyle} />
            <YAxis {...axisStyle} />
            <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {yKeys.map((k, i) => (
              <Bar key={k} dataKey={k} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === yKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                isAnimationActive animationDuration={850} animationEasing="ease-out" />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    case 'table': {
      const columns = Object.keys(data[0]);
      return (
        <div style={{ overflowX: 'auto', width: '100%', height: '100%' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
            color: 'var(--text-primary)'
          }}>
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th key={i} style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderBottom: '1px solid var(--panel-border)',
                    fontWeight: 600,
                    color: 'var(--accent)',
                    position: 'sticky',
                    top: 0,
                    background: 'var(--panel-bg)',
                    backdropFilter: 'var(--glass-blur)'
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} style={{
                  borderBottom: '1px solid rgba(255,255,255,0.03)'
                }}>
                  {columns.map((col, j) => (
                    <td key={j} style={{
                      padding: '10px 12px',
                      color: 'var(--text-secondary)'
                    }}>
                      {String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    default:
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey={xKey} {...axisStyle} />
            <YAxis {...axisStyle} />
            <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {yKeys.map((k, i) => (
              <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={48}
                isAnimationActive animationDuration={850} animationEasing="ease-out" />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
  }
};
