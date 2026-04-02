import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Job, AppNotification } from '../types';
import { mockJobs } from '../data/mockJobs';
import { storage } from '../utils/storage';
import { AUTH_CONFIG } from '../config/auth';

const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: '1', type: 'upcoming', title: 'Job Starting Soon', message: 'Job #2847 will start in 2 hours at 456 Maple Drive', time: '10 min ago', isRead: false },
  { id: '2', type: 'new_job', title: 'New Job Assigned', message: 'Job #2851 has been added to your schedule for today at 2:00 PM', time: '1 hour ago', isRead: false },
  { id: '3', type: 'reminder', title: 'Upload Photos', message: "Job #2839 is in progress. Don't forget to upload before/after photos.", time: '3 hours ago', isRead: true },
  { id: '4', type: 'upcoming', title: 'Job Starting Soon', message: 'Job #2855 starts in 30 minutes at 12 Sunset Blvd', time: '5 hours ago', isRead: true },
  { id: '5', type: 'completed', title: 'Job Completed', message: 'Great job! Order #2831 has been marked as completed.', time: '1 day ago', isRead: true },
  { id: '6', type: 'new_job', title: 'New Job Assigned', message: 'Job #2855 (move-out clean) added for April 5 at 10:00 AM', time: '1 day ago', isRead: true },
];

interface AppContextType {
  jobs: Job[];
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  isAuthenticated: boolean;
  showOnboarding: boolean;
  profileImage: string | null;
  isLoading: boolean;
  handleLogin: () => Promise<void>;
  handleLogout: () => Promise<void>;
  handleOnboardingComplete: () => Promise<void>;
  toggleTodo: (jobId: string, sectionId: string, todoId: string) => void;
  markAllDone: (jobId: string, sectionId: string) => void;
  toggleAddOn: (jobId: string, addOnId: string) => void;
  photosChange: (jobId: string, sectionId: string, type: 'before' | 'after', photos: string[]) => void;
  startJob: (jobId: string) => void;
  completeJob: (jobId: string, skipReasons?: Record<string, string>) => void;
  cancelJob: (jobId: string) => void;
  resetAllJobs: () => void;
  updateSkipReason: (jobId: string, sectionId: string, reason: string) => void;
  clearSkipReason: (jobId: string, sectionId: string) => void;
  setProfileImage: (image: string | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  useEffect(() => {
    const initAuth = async () => {
      const saved = await storage.get(AUTH_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      if (saved === 'true') {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadJobs = async () => {
      const saved = await storage.getJSON<Job[]>('cleanerJobs');
      if (saved) {
        const reset = saved.map((job: Job) => ({
          ...job,
          addOns: job.addOns?.map((addon) => ({
            ...addon,
            selected: job.status === 'upcoming' ? false : addon.selected,
          })),
        }));
        setJobs(reset);
        await storage.setJSON('cleanerJobs', reset);
      } else {
        setJobs(mockJobs);
        await storage.setJSON('cleanerJobs', mockJobs);
      }
    };
    loadJobs();
  }, [isAuthenticated]);

  const saveJobs = useCallback(async (updated: Job[]) => {
    setJobs(updated);
    await storage.setJSON('cleanerJobs', updated);
  }, []);

  const handleLogin = async () => {
    await storage.set(AUTH_CONFIG.STORAGE_KEYS.AUTH_TOKEN, 'true');
    setIsAuthenticated(true);
    const hasOnboarded = await storage.get(AUTH_CONFIG.STORAGE_KEYS.ONBOARDING_COMPLETED);
    if (!hasOnboarded) setShowOnboarding(true);
  };

  const handleLogout = async () => {
    await storage.remove(AUTH_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    await storage.remove(AUTH_CONFIG.STORAGE_KEYS.ONBOARDING_COMPLETED);
    await storage.remove('cleanerJobs');
    setIsAuthenticated(false);
    setShowOnboarding(false);
    setJobs([]);
  };

  const handleOnboardingComplete = async () => {
    await storage.set(AUTH_CONFIG.STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    setShowOnboarding(false);
  };

  const toggleTodo = (jobId: string, sectionId: string, todoId: string) => {
    const updated = jobs.map((job) => {
      if (job.id !== jobId) return job;
      return {
        ...job,
        sections: job.sections.map((section) => {
          if (section.id !== sectionId) return section;
          return {
            ...section,
            todos: section.todos.map((todo) =>
              todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
            ),
          };
        }),
      };
    });
    saveJobs(updated);
  };

  const markAllDone = (jobId: string, sectionId: string) => {
    const updated = jobs.map((job) => {
      if (job.id !== jobId) return job;
      return {
        ...job,
        sections: job.sections.map((section) => {
          if (section.id !== sectionId) return section;
          return {
            ...section,
            todos: section.todos.map((todo) => ({ ...todo, completed: true })),
          };
        }),
      };
    });
    saveJobs(updated);
  };

  const toggleAddOn = (jobId: string, addOnId: string) => {
    const updated = jobs.map((job) => {
      if (job.id !== jobId) return job;
      return {
        ...job,
        addOns: job.addOns?.map((addon) =>
          addon.id === addOnId ? { ...addon, selected: !addon.selected } : addon
        ),
      };
    });
    saveJobs(updated);
  };

  const photosChange = (jobId: string, sectionId: string, type: 'before' | 'after', photos: string[]) => {
    const updated = jobs.map((job) => {
      if (job.id !== jobId) return job;
      return {
        ...job,
        sections: job.sections.map((section) => {
          if (section.id !== sectionId) return section;
          return {
            ...section,
            [type === 'before' ? 'beforePhotos' : 'afterPhotos']: photos,
          };
        }),
      };
    });
    saveJobs(updated);
  };

  const startJob = (jobId: string) => {
    const updated = jobs.map((job) =>
      job.id === jobId ? { ...job, status: 'in-progress' as const } : job
    );
    saveJobs(updated);
  };

  const completeJob = (jobId: string, skipReasons?: Record<string, string>) => {
    const updated = jobs.map((job) => {
      if (job.id !== jobId) return job;
      const updatedSections = skipReasons
        ? job.sections.map((section) => ({
            ...section,
            skipReason: skipReasons[section.id] || section.skipReason,
          }))
        : job.sections;
      const updatedAddOns =
        skipReasons && skipReasons['addons'] && job.addOns
          ? job.addOns.map((addon) => ({
              ...addon,
              skipReason: addon.selected ? undefined : skipReasons['addons'],
            }))
          : job.addOns;
      return {
        ...job,
        status: 'completed' as const,
        completedAt: Date.now(),
        sections: updatedSections,
        addOns: updatedAddOns,
      };
    });
    saveJobs(updated);
  };

  const cancelJob = (jobId: string) => {
    const updated = jobs.map((job) => {
      if (job.id !== jobId || job.status !== 'in-progress') return job;
      return {
        ...job,
        status: 'upcoming' as const,
        sections: job.sections.map((section) => ({
          ...section,
          completed: false,
          skipReason: undefined,
          beforePhotos: [],
          afterPhotos: [],
          todos: section.todos.map((todo) => ({ ...todo, completed: false })),
        })),
        addOns: job.addOns?.map((addon) => ({ ...addon, selected: false })),
      };
    });
    saveJobs(updated);
  };

  const resetAllJobs = () => {
    const updated = jobs.map((job) => {
      if (job.status !== 'in-progress') return job;
      return {
        ...job,
        status: 'upcoming' as const,
        sections: job.sections.map((section) => ({
          ...section,
          completed: false,
          beforePhotos: [],
          afterPhotos: [],
          todos: section.todos.map((todo) => ({ ...todo, completed: false })),
        })),
        addOns: job.addOns?.map((addon) => ({ ...addon, selected: false })),
      };
    });
    saveJobs(updated);
  };

  const updateSkipReason = (jobId: string, sectionId: string, reason: string) => {
    const updated = jobs.map((job) => {
      if (job.id !== jobId) return job;
      return {
        ...job,
        sections: job.sections.map((section) =>
          section.id === sectionId ? { ...section, skipReason: reason } : section
        ),
      };
    });
    saveJobs(updated);
  };

  const clearSkipReason = (jobId: string, sectionId: string) => {
    const updated = jobs.map((job) => {
      if (job.id !== jobId) return job;
      return {
        ...job,
        sections: job.sections.map((section) =>
          section.id === sectionId ? { ...section, skipReason: undefined } : section
        ),
      };
    });
    saveJobs(updated);
  };

  return (
    <AppContext.Provider
      value={{
        jobs,
        notifications,
        unreadCount,
        markAsRead,
        markAllRead,
        isAuthenticated,
        showOnboarding,
        profileImage,
        isLoading,
        handleLogin,
        handleLogout,
        handleOnboardingComplete,
        toggleTodo,
        markAllDone,
        toggleAddOn,
        photosChange,
        startJob,
        completeJob,
        cancelJob,
        resetAllJobs,
        updateSkipReason,
        clearSkipReason,
        setProfileImage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
