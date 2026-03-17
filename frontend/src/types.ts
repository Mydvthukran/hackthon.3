export interface ChartConfig {
  id: string;
  chart_type: "line" | "bar" | "stacked_bar" | "pie" | "donut" | "area" | "treemap" | "table" | "histogram" | "boxplot" | "choropleth" | "combo";
  title: string;
  description: string;
  sql: string | null;
  dataframe_ops: any;
  params: Record<string, string | number>;
  columns: string[];
  visual_encoding: {
    x?: string;
    y?: string;
    color?: string;
    size?: string;
    facet?: string;
  };
  annotations: string[];
  confidence: number;
  notes: string;
  warnings: string[];
  chart_data: any[];
  error?: string;
}

export interface KPIConfig {
  id: string;
  label: string;
  value_sql: string;
  value: any;
  confidence: number;
  error?: string;
}

export interface DashboardSpec {
  dashboard_id: string;
  spec_version: number;
  charts: ChartConfig[];
  kpis: KPIConfig[];
  warnings: string[];
  source_rows_sample: any[];
  can_follow_up: boolean;
  follow_up_suggestions: string[];
}
