export interface DashboardStatsResponse {
  general: GeneralStats;
  requesters?: ModuleStats;
  tasks?: ModuleStats;
  projects?: ModuleStats;
  deliveries?: ModuleStats;
  billing?: ModuleStats;
  tasksChart?: ChartData[];
  tasksByStatus?: StatusCount[];
  deliveriesByStatus?: StatusCount[];
  recentActivities: RecentActivity[];
}

export interface GeneralStats {
  totalUsers: number;
  totalRevenue: number;
  completedTasks: number;
  completionRate: number;
}

export interface ModuleStats {
  total: number;
  active: number;
  completed: number;
  totalValue: number;
  averageValue: number;
  thisMonth: number;
  lastMonth: number;
  growthPercentage: number;
}

export interface ChartData {
  label: string;
  value: number;
  count: number;
}

export interface StatusCount {
  status: string;
  count: number;
  percentage: number;
}

export interface RecentActivity {
  type: string;
  description: string;
  user: string;
  timestamp: string;
  entityId: string;
}