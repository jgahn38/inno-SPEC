import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/APIService';
import { ScreenConfig, LNBConfig } from '@inno-spec/shared';

interface APIContextType {
  screens: ScreenConfig[];
  lnbConfigs: LNBConfig[];
  loading: boolean;
  error: string | null;
  refreshScreens: () => Promise<void>;
  refreshLNBConfigs: () => Promise<void>;
  createScreen: (screen: Omit<ScreenConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateScreen: (id: string, screen: Partial<ScreenConfig>) => Promise<boolean>;
  deleteScreen: (id: string) => Promise<boolean>;
  createLNBConfig: (config: Omit<LNBConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateLNBConfig: (id: string, config: Partial<LNBConfig>) => Promise<boolean>;
  deleteLNBConfig: (id: string) => Promise<boolean>;
}

const APIContext = createContext<APIContextType | undefined>(undefined);

export const useAPI = () => {
  const context = useContext(APIContext);
  if (context === undefined) {
    throw new Error('useAPI must be used within an APIProvider');
  }
  return context;
};

interface APIProviderProps {
  children: ReactNode;
}

export const APIProvider: React.FC<APIProviderProps> = ({ children }) => {
  const [screens, setScreens] = useState<ScreenConfig[]>([]);
  const [lnbConfigs, setLnbConfigs] = useState<LNBConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshScreens = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getScreens();
      if (response.success && response.data) {
        setScreens(response.data);
      } else {
        setError(response.error || 'Failed to load screens');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const refreshLNBConfigs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getLNBConfigs();
      if (response.success && response.data) {
        setLnbConfigs(response.data);
      } else {
        setError(response.error || 'Failed to load LNB configs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createScreen = async (screen: Omit<ScreenConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const response = await apiService.createScreen(screen);
      if (response.success) {
        await refreshScreens();
        return true;
      } else {
        setError(response.error || 'Failed to create screen');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const updateScreen = async (id: string, screen: Partial<ScreenConfig>): Promise<boolean> => {
    try {
      const response = await apiService.updateScreen(id, screen);
      if (response.success) {
        await refreshScreens();
        return true;
      } else {
        setError(response.error || 'Failed to update screen');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const deleteScreen = async (id: string): Promise<boolean> => {
    try {
      const response = await apiService.deleteScreen(id);
      if (response.success) {
        await refreshScreens();
        return true;
      } else {
        setError(response.error || 'Failed to delete screen');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const createLNBConfig = async (config: Omit<LNBConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const response = await apiService.createLNBConfig(config);
      if (response.success) {
        await refreshLNBConfigs();
        return true;
      } else {
        setError(response.error || 'Failed to create LNB config');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const updateLNBConfig = async (id: string, config: Partial<LNBConfig>): Promise<boolean> => {
    try {
      const response = await apiService.updateLNBConfig(id, config);
      if (response.success) {
        await refreshLNBConfigs();
        return true;
      } else {
        setError(response.error || 'Failed to update LNB config');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const deleteLNBConfig = async (id: string): Promise<boolean> => {
    try {
      const response = await apiService.deleteLNBConfig(id);
      if (response.success) {
        await refreshLNBConfigs();
        return true;
      } else {
        setError(response.error || 'Failed to delete LNB config');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    refreshScreens();
    refreshLNBConfigs();
  }, []);

  const value: APIContextType = {
    screens,
    lnbConfigs,
    loading,
    error,
    refreshScreens,
    refreshLNBConfigs,
    createScreen,
    updateScreen,
    deleteScreen,
    createLNBConfig,
    updateLNBConfig,
    deleteLNBConfig,
  };

  return (
    <APIContext.Provider value={value}>
      {children}
    </APIContext.Provider>
  );
};
