export interface DashboardStatsResponse {
  recentActivities: RecentActivity[];
}

export interface RecentActivity {
  type: string;
  description: string;
  user: string;
  timestamp: string;
  entityId: string;
}
