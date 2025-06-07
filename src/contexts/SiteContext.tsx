import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { siteApi } from '../lib/api';

interface Site {
  id: string;
  name: string;
  url: string;
  created_at: string;
  updated_at: string;
}

interface SiteContextType {
  sites: Site[];
  selectedSite: Site | null;
  setSelectedSite: (site: Site | null) => void;
  loading: boolean;
  refreshSites: () => Promise<void>;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export const SiteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSites = async () => {
    if (!user) {
      setSites([]);
      setSelectedSite(null);
      setLoading(false);
      return;
    }

    try {
      const sitesData = await siteApi.getSites(user.id);
      setSites(sitesData);
      
      // Auto-select the first site if none is selected
      if (sitesData.length > 0 && !selectedSite) {
        setSelectedSite(sitesData[0]);
      }
      
      // If selected site no longer exists, select the first available
      if (selectedSite && !sitesData.find(s => s.id === selectedSite.id)) {
        setSelectedSite(sitesData.length > 0 ? sitesData[0] : null);
      }
    } catch (error) {
      console.error('Error loading sites:', error);
      setSites([]);
      setSelectedSite(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSites();
  }, [user]);

  const value = {
    sites,
    selectedSite,
    setSelectedSite,
    loading,
    refreshSites
  };

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
};

export const useSites = () => {
  const context = useContext(SiteContext);
  if (context === undefined) {
    throw new Error('useSites must be used within a SiteProvider');
  }
  return context;
};