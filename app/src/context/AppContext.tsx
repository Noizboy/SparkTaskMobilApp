import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Job, AppNotification, Review } from '../types';
import { mockJobs } from '../data/mockJobs';
import { storage } from '../utils/storage';
import { AUTH_CONFIG } from '../config/auth';
import { fetchJobs, apiToggleTodo, apiToggleAddOn, apiMarkSectionDone, apiMarkSectionUndone, apiUpdateStatus, apiUpdateOrder } from '../services/api';
import { useSSE } from '../hooks/useSSE';

const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: '1', type: 'upcoming', title: 'Job Starting Soon', message: 'Job #2847 will start in 2 hours at 456 Maple Drive', time: '10 min ago', isRead: false },
  { id: '2', type: 'new_job', title: 'New Job Assigned', message: 'Job #2851 has been added to your schedule for today at 2:00 PM', time: '1 hour ago', isRead: false },
  { id: '3', type: 'reminder', title: 'Upload Photos', message: "Job #2839 is in progress. Don't forget to upload before/after photos.", time: '3 hours ago', isRead: true },
  { id: '4', type: 'upcoming', title: 'Job Starting Soon', message: 'Job #2855 starts in 30 minutes at 12 Sunset Blvd', time: '5 hours ago', isRead: true },
  { id: '5', type: 'completed', title: 'Job Completed', message: 'Great job! Order #2831 has been marked as completed.', time: '1 day ago', isRead: true },
  { id: '6', type: 'new_job', title: 'New Job Assigned', message: 'Job #2855 (move-out clean) added for April 5 at 10:00 AM', time: '1 day ago', isRead: true },
];

const MOCK_REVIEWS: Review[] = [
  { id: 'r1', clientName: 'Emma Richardson', rating: 5, comment: 'Absolutely spotless! Sarah did an amazing job with the deep clean.', date: '2026-03-28', orderNumber: '2831' },
  { id: 'r2', clientName: 'Marcus Johnson', rating: 4, comment: 'Great work overall. Kitchen was perfect, would book again.', date: '2026-03-25', orderNumber: '2839' },
  { id: 'r3', clientName: 'Sophia Martinez', rating: 5, comment: 'Move-out clean was flawless. Landlord approved immediately!', date: '2026-03-27', orderNumber: '2843' },
  { id: 'r4', clientName: 'James Whitfield', rating: 5, comment: 'Very thorough and professional. Highly recommend.', date: '2026-03-20', orderNumber: '2820' },
  { id: 'r5', clientName: 'Priya Nair', rating: 4, comment: 'Good attention to detail. Bathroom sparkled!', date: '2026-03-18', orderNumber: '2815' },
  { id: 'r6', clientName: 'Carlos Reyes', rating: 5, comment: 'Best cleaning service we have ever had. 10/10!', date: '2026-03-15', orderNumber: '2810' },
  { id: 'r7', clientName: 'Natalie Brooks', rating: 3, comment: 'Decent job but missed a couple of spots under the couch.', date: '2026-03-12', orderNumber: '2805' },
  { id: 'r8', clientName: 'David Chen', rating: 5, comment: 'Exceeded expectations. Will definitely request Sarah again.', date: '2026-03-10', orderNumber: '2800' },
];

interface AppContextType {
  jobs: Job[];
  reviews: Review[];
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  jobsLoaded: boolean;
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
  const [jobsLoaded, setJobsLoaded] = useState(false);

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
      try {
        const apiJobs = await fetchJobs();
        console.log('[API] Loaded', apiJobs.length, 'jobs from server');
        setJobs(apiJobs);
        await storage.setJSON('cleanerJobs', apiJobs);
      } catch (err) {
        console.warn('[API] fetchJobs failed, falling back to cache:', err);
        // Offline fallback: use cached jobs only (NOT mockJobs — mock IDs don't match DB)
        const saved = await storage.getJSON<Job[]>('cleanerJobs');
        if (saved) {
          console.log('[API] Using', saved.length, 'cached jobs');
          setJobs(saved);
        } else {
          console.warn('[API] No cache — app will show empty list until API is reachable');
          setJobs([]);
        }
      }
      setJobsLoaded(true);
    };
    loadJobs();
  }, [isAuthenticated]);

  const saveJobs = useCallback(async (updated: Job[]) => {
    setJobs(updated);
    await storage.setJSON('cleanerJobs', updated);
  }, []);

  // Convert API order (scheduled) to mobile Job (upcoming)
  const apiOrderToJob = (order: any): Job => ({
    ...order,
    status: order.status === 'scheduled' ? 'upcoming' : order.status,
    startedAt: order.startedAt ? new Date(order.startedAt).getTime() : undefined,
    completedAt: order.completedAt ? new Date(order.completedAt).getTime() : undefined,
    sections: (order.sections || []).map((s: any) => ({
      ...s,
      skipReason: s.skipReason ?? undefined,
      beforePhotos: s.beforePhotos ?? [],
      afterPhotos: s.afterPhotos ?? [],
    })),
    addOns: (order.addOns || []).map((a: any) => ({ ...a, skipReason: a.skipReason ?? undefined })),
  });

  // Real-time sync from dashboard/other sources via SSE
  useSSE({
    onOrderCreated: (order) => {
      const job = apiOrderToJob(order);
      setJobs((prev) => {
        if (prev.find((j) => j.id === job.id)) return prev;
        const updated = [...prev, job];
        storage.setJSON('cleanerJobs', updated);
        return updated;
      });
    },
    onOrderUpdated: (order) => {
      const job = apiOrderToJob(order);
      setJobs((prev) => {
        const updated = prev.map((j) => j.id === job.id ? job : j);
        storage.setJSON('cleanerJobs', updated);
        return updated;
      });
    },
    onOrderDeleted: ({ id }) => {
      setJobs((prev) => {
        const updated = prev.filter((j) => j.id !== id);
        storage.setJSON('cleanerJobs', updated);
        return updated;
      });
    },
  }, isAuthenticated);

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
    console.log('[toggleTodo]', { jobId, sectionId, todoId });
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
    // Sync to API in background
    apiToggleTodo(jobId, todoId).catch((err) => console.error('[API] toggleTodo failed:', err));
  };

  const markAllDone = (jobId: string, sectionId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    const section = job?.sections.find((s) => s.id === sectionId);
    const allDone = section?.todos.every((t) => t.completed) ?? false;
    const newCompleted = !allDone;

    const updated = jobs.map((j) => {
      if (j.id !== jobId) return j;
      return {
        ...j,
        sections: j.sections.map((s) => {
          if (s.id !== sectionId) return s;
          return {
            ...s,
            todos: s.todos.map((todo) => ({ ...todo, completed: newCompleted })),
          };
        }),
      };
    });
    saveJobs(updated);
    const apiCall = newCompleted
      ? apiMarkSectionDone(jobId, sectionId)
      : apiMarkSectionUndone(jobId, sectionId);
    apiCall.catch((err) => console.error('[API] markAllDone failed:', err));
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
    apiToggleAddOn(jobId, addOnId).catch((err) => console.error('[API] toggleAddOn failed:', err));
  };

  const photosChange = (jobId: string, sectionId: string, type: 'before' | 'after', photos: string[]) => {
    const updated = jobs.map((job) => {
      if (job.id !== jobId) return job;
      const updatedJob = {
        ...job,
        sections: job.sections.map((section) => {
          if (section.id !== sectionId) return section;
          return {
            ...section,
            [type === 'before' ? 'beforePhotos' : 'afterPhotos']: photos,
          };
        }),
      };
      // Sync photos to API
      apiUpdateOrder(jobId, updatedJob).catch((err) => console.error('[API] photosChange failed:', err));
      return updatedJob;
    });
    saveJobs(updated);
  };

  const startJob = (jobId: string) => {
    const startedAt = Date.now();
    const updated = jobs.map((job) =>
      job.id === jobId ? { ...job, status: 'in-progress' as const, startedAt } : job
    );
    saveJobs(updated);
    apiUpdateStatus(jobId, 'in-progress', { startedAt }).catch((err) => console.error('[API] startJob failed:', err));
  };

  const completeJob = (jobId: string, skipReasons?: Record<string, string>) => {
    const completedAt = Date.now();
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
      const completedJob = {
        ...job,
        status: 'completed' as const,
        completedAt,
        sections: updatedSections,
        addOns: updatedAddOns,
      };
      // Sync full order to API (includes sections with skipReasons + completedAt)
      apiUpdateOrder(jobId, completedJob).catch((err) => console.error('[API] completeJob failed:', err));
      return completedJob;
    });
    saveJobs(updated);
  };

  const cancelJob = (jobId: string) => {
    const updated = jobs.map((job) => {
      if (job.id !== jobId || job.status !== 'in-progress') return job;
      const resetJob = {
        ...job,
        status: 'upcoming' as const,
        startedAt: undefined,
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
      // Reset to scheduled in API
      apiUpdateStatus(jobId, 'upcoming').catch((err) => console.error('[API] cancelJob failed:', err));
      return resetJob;
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
        jobsLoaded,
        reviews: MOCK_REVIEWS,
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
