export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export interface Section {
  id: string;
  name: string;
  icon: string;
  completed: boolean;
  beforePhotos: string[];
  afterPhotos: string[];
  todos: Todo[];
  skipReason?: string;
  estimatedTime?: number;
}

export interface AddOn {
  id: string;
  name: string;
  icon: string;
  price?: number;
  selected: boolean;
  skipReason?: string;
}

export interface Job {
  id: string;
  orderNumber: string;
  clientName: string;
  clientEmail?: string;
  address: string;
  phone?: string;
  date: string;
  time: string;
  status: 'upcoming' | 'scheduled' | 'in-progress' | 'completed' | 'canceled';
  serviceType: string;
  duration: string;
  assignedEmployees?: string[];
  specialInstructions?: string;
  accessInfo?: string;
  goal?: string;
  sections: Section[];
  addOns?: AddOn[];
  startedAt?: number;
  completedAt?: number;
  updatedAt?: string;
}

export interface Review {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
  orderNumber: string;
}

export interface AppNotification {
  id: string;
  type: 'upcoming' | 'new_job' | 'reminder' | 'completed';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

export type RootStackParamList = {
  Login: undefined;
  Onboarding: undefined;
  MainTabs: undefined;
  JobInfo: { jobId: string };
  Checklist: { jobId: string };
  OrderDetails: { jobId: string };
  DayJobs: { date: string };
  AllUpcomingJobs: undefined;
  AllCompletedJobs: undefined;
  JobCompleted: { jobId: string };
  PhotoGallery: { photos: string[]; label: string; sectionName: string };
};

export type MainTabParamList = {
  Home: undefined;
  Calendar: undefined;
  Hub: undefined;
  Profile: undefined;
  Notifications: undefined;
};
