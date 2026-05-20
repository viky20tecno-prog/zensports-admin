export interface MrrDataPoint {
  month: string;   // 'YYYY-MM'
  mrr: number;
  arr: number;
  club_count: number;
}

export interface GrowthDataPoint {
  month: string;
  new_clubs: number;
  churned: number;
  net: number;
}

export interface AnalyticsSummary {
  mrr: number;
  arr: number;
  active_clubs: number;
  trial_clubs: number;
  suspended_clubs: number;
  total_clubs: number;
  conversion_rate: number;  // trial → paid %
  churn_rate: number;       // % churned last 30d
  mrr_series: MrrDataPoint[];
  growth_series: GrowthDataPoint[];
}

export interface FeatureUsage {
  module: string;
  enabled_count: number;
  total_clubs: number;
  pct: number;
}
