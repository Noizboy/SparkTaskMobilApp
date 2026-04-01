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
  estimatedTime?: string;
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
  address: string;
  date: string;
  time: string;
  status: 'upcoming' | 'in-progress' | 'completed';
  serviceType: string;
  duration: string;
  specialInstructions?: string;
  accessInfo?: string;
  goal?: string;
  sections: Section[];
  addOns?: AddOn[];
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
  PhotoGallery: { photos: string[]; label: string; sectionName: string };
};

export type MainTabParamList = {
  Home: undefined;
  Calendar: undefined;
  Notifications: undefined;
  Profile: undefined;
};
