import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';

export type PlanTier = 'basic' | 'pro' | 'enterprise';

interface Plan {
  name: PlanTier;
  price: number;
  limits: {
    sites: number;
    auditFrequency: 'monthly' | 'weekly' | 'daily';
    citationsPerMonth: number;
    aiContentGenerations: number;
    features: {
      schemaGeneration: 'basic' | 'advanced' | 'custom';
      citationTracking: 'basic' | 'realtime' | 'advanced';
      voiceAssistant: boolean;
      aiContent: boolean;
      entityAnalysis: boolean;
      apiAccess: boolean;
      whiteLabel: boolean;
      prioritySupport: boolean;
      dedicatedManager: boolean;
    };
  };
}

interface Usage {
  citationsUsed: number;
  aiContentUsed: number;
  lastAuditDate: Date | null;
}

interface SubscriptionContextType {
  currentPlan: Plan | null;
  usage: Usage;
  isFeatureEnabled: (feature: keyof Plan['limits']['features']) => boolean;
  getSiteLimit: () => number;
  getAuditFrequency: () => string;
  canRunAudit: () => boolean;
  canGenerateContent: () => boolean;
  canTrackMoreCitations: () => boolean;
  loading: boolean;
}

const plans: Record<PlanTier, Plan> = {
  basic: {
    name: 'basic',
    price: 29,
    limits: {
      sites: 1,
      auditFrequency: 'monthly',
      citationsPerMonth: 100,
      aiContentGenerations: 10,
      features: {
        schemaGeneration: 'basic',
        citationTracking: 'basic',
        voiceAssistant: false,
        aiContent: false,
        entityAnalysis: false,
        apiAccess: false,
        whiteLabel: false,
        prioritySupport: false,
        dedicatedManager: false,
      },
    },
  },
  pro: {
    name: 'pro',
    price: 79,
    limits: {
      sites: 3,
      auditFrequency: 'weekly',
      citationsPerMonth: 500,
      aiContentGenerations: 50,
      features: {
        schemaGeneration: 'advanced',
        citationTracking: 'realtime',
        voiceAssistant: true,
        aiContent: true,
        entityAnalysis: true,
        apiAccess: false,
        whiteLabel: false,
        prioritySupport: true,
        dedicatedManager: false,
      },
    },
  },
  enterprise: {
    name: 'enterprise',
    price: 199,
    limits: {
      sites: Infinity,
      auditFrequency: 'daily',
      citationsPerMonth: Infinity,
      aiContentGenerations: Infinity,
      features: {
        schemaGeneration: 'custom',
        citationTracking: 'advanced',
        voiceAssistant: true,
        aiContent: true,
        entityAnalysis: true,
        apiAccess: true,
        whiteLabel: true,
        prioritySupport: true,
        dedicatedManager: true,
      },
    },
  },
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [usage, setUsage] = useState<Usage>({
    citationsUsed: 0,
    aiContentUsed: 0,
    lastAuditDate: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubscription = async () => {
      if (!user) {
        setCurrentPlan(null);
        setLoading(false);
        return;
      }

      try {
        // In a real implementation, fetch the user's subscription and usage from your database
        // For now, we'll default to the basic plan with no usage
        setCurrentPlan(plans.basic);
        setUsage({
          citationsUsed: 0,
          aiContentUsed: 0,
          lastAuditDate: null,
        });
      } catch (error) {
        console.error('Error loading subscription:', error);
        // Default to basic plan on error
        setCurrentPlan(plans.basic);
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, [user]);

  const isFeatureEnabled = (feature: keyof Plan['limits']['features']): boolean => {
    if (!currentPlan) return false;
    return currentPlan.limits.features[feature] !== false;
  };

  const getSiteLimit = (): number => {
    return currentPlan?.limits.sites || 0;
  };

  const getAuditFrequency = (): string => {
    return currentPlan?.limits.auditFrequency || 'monthly';
  };

  const canRunAudit = (): boolean => {
    if (!currentPlan || !usage.lastAuditDate) return true;

    const now = new Date();
    const lastAudit = new Date(usage.lastAuditDate);
    const daysSinceLastAudit = Math.floor((now.getTime() - lastAudit.getTime()) / (1000 * 60 * 60 * 24));

    switch (currentPlan.limits.auditFrequency) {
      case 'daily':
        return daysSinceLastAudit >= 1;
      case 'weekly':
        return daysSinceLastAudit >= 7;
      case 'monthly':
        return daysSinceLastAudit >= 30;
      default:
        return false;
    }
  };

  const canGenerateContent = (): boolean => {
    if (!currentPlan) return false;
    return usage.aiContentUsed < currentPlan.limits.aiContentGenerations;
  };

  const canTrackMoreCitations = (): boolean => {
    if (!currentPlan) return false;
    return usage.citationsUsed < currentPlan.limits.citationsPerMonth;
  };

  return (
    <SubscriptionContext.Provider 
      value={{ 
        currentPlan,
        usage,
        isFeatureEnabled,
        getSiteLimit,
        getAuditFrequency,
        canRunAudit,
        canGenerateContent,
        canTrackMoreCitations,
        loading 
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};