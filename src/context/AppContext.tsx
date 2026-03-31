import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Job } from '../types';
import { mockJobs } from '../data/mockJobs';
import { storage } from '../utils/storage';
import { AUTH_CONFIG } from '../config/auth';

interface AppContextType {
  jobs: Job[];
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
  setProfileImage: (image: string | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <AppContext.Provider
      value={{
        jobs,
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
