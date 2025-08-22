// 長期目標（宝島）
export interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  vision?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 中間目標（島々）
export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  targetDate: Date;
  completed: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// タスク
export interface Task {
  id: string;
  milestoneId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'postponed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  completedAt?: Date;
  dependencies?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 感情ログ（天候記録）
export interface EmotionLog {
  id: string;
  date: Date;
  mood: 1 | 2 | 3 | 4 | 5;
  energy: 1 | 2 | 3 | 4 | 5;
  note?: string;
  createdAt: Date;
}

// AI提案
export interface AIProposal {
  id: string;
  type: 'decompose' | 'reroute';
  input: any;
  output: any;
  applied: boolean;
  createdAt: Date;
}

// 設定
export interface Settings {
  theme: 'light' | 'dark' | 'system';
  openaiApiKey: string;
  aiModel: 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
  weeklyReviewDay: number;
}