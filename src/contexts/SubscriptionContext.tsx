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

// Helper function to check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  return supabaseUrl && 
         supabaseAnonKey && 
         supabaseUrl !== 'your-supabase-url' && 
         supabaseAnonKey !== 'your-supabase-anon-key' &&
         supabaseUrl !== '' &&
         supabaseAnonKey !== '' &&
         supabaseUrl.startsWith('http') &&
         supabaseAnonKey.length > 20;
};

// Helper function to safely make Supabase calls with timeout and error handling
const safeSupabaseCall = async (operation: () => Promise<any>, timeoutMs: number = 10000) => {
  return Promise.race([
    operation(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
};

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
        setUsage({
          citationsUsed: 0,
          aiContentUsed: 0,
          lastAuditDate: null,
        });
        setLoading(false);
        return;
      }

      // Check if Supabase is properly configured
      if (!isSupabaseConfigured()) {
        console.warn('Supabase is not properly configured. Using default plan.');
        setCurrentPlan(plans.basic);
        setUsage({
          citationsUsed: 0,
          aiContentUsed: 0,
          lastAuditDate: null,
        });
        setLoading(false);
        return;
      }

      try {
        console.log('Loading subscription data for user:', user.id);

        // Test Supabase connection first with a simple query
        try {
          await safeSupabaseCall(async () => {
            const { error } = await supabase.from('subscriptions').select('count').limit(1);
            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found, which is OK
              throw error;
            }
          }, 5000);
          console.log('✅ Supabase connection test successful');
        } catch (connectionError) {
          console.error('❌ Supabase connection test failed:', connectionError);
          throw new Error('Unable to connect to Supabase');
        }

        // Fetch subscription and usage data with timeout
        const [subscriptionResult, usageResult] = await Promise.allSettled([
          safeSupabaseCall(async () => {
            const { data, error } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();
            
            if (error && error.code !== 'PGRST116') {
              throw error;
            }
            return data;
          }),
          safeSupabaseCall(async () => {
            const { data, error } = await supabase
              .from('subscription_usage')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();
            
            if (error && error.code !== 'PGRST116') {
              throw error;
            }
            return data;
          })
        ]);

        // Handle subscription data
        let subscriptionData = null;
        if (subscriptionResult.status === 'fulfilled') {
          subscriptionData = subscriptionResult.value;
          console.log('✅ Subscription data loaded:', subscriptionData);
        } else {
          console.warn('⚠️ Failed to load subscription data:', subscriptionResult.reason);
        }

        // Handle usage data
        let usageData = null;
        if (usageResult.status === 'fulfilled') {
          usageData = usageResult.value;
          console.log('✅ Usage data loaded:', usageData);
        } else {
          console.warn('⚠️ Failed to load usage data:', usageResult.reason);
        }

        // Set current plan based on subscription data
        if (subscriptionData?.plan_id && plans[subscriptionData.plan_id as PlanTier]) {
          const planTier = subscriptionData.plan_id as PlanTier;
          setCurrentPlan(plans[planTier]);
          console.log(`✅ Set plan to: ${planTier}`);
        } else {
          // Default to basic plan if no subscription found
          setCurrentPlan(plans.basic);
          console.log('✅ Set default plan: basic');
        }

        // Set usage data
        if (usageData) {
          setUsage({
            citationsUsed: usageData.citations_used || 0,
            aiContentUsed: usageData.ai_content_used || 0,
            lastAuditDate: usageData.last_audit_date ? new Date(usageData.last_audit_date) : null,
          });
          console.log('✅ Set usage data:', {
            citationsUsed: usageData.citations_used || 0,
            aiContentUsed: usageData.ai_content_used || 0,
          });
        } else {
          // If no usage data exists, initialize with default values
          setUsage({
            citationsUsed: 0,
            aiContentUsed: 0,
            lastAuditDate: null,
          });
          console.log('✅ Set default usage data');
        }
      } catch (error) {
        console.error('❌ Error loading subscription:', error);
        // Default to basic plan on error
        setCurrentPlan(plans.basic);
        setUsage({
          citationsUsed: 0,
          aiContentUsed: 0,
          lastAuditDate: null,
        });
        
        // Show user-friendly error message
        if (error instanceof Error) {
          if (error.message.includes('timeout') || error.message.includes('fetch')) {
            console.warn('⚠️ Network timeout - using offline mode');
          } else if (error.message.includes('connect')) {
            console.warn('⚠️ Connection failed - using offline mode');
          } else {
            console.warn('⚠️ Database error - using offline mode:', error.message);
          }
        }
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

  // DISABLED FOR TESTING: Always allow audits
  const canRunAudit = (): boolean => {
    return true; // Disabled limits for testing
    
    // Original logic (commented out):
    // if (!currentPlan || !usage.lastAuditDate) return true;
    // const now = new Date();
    // const lastAudit = new Date(usage.lastAuditDate);
    // const hoursSinceLastAudit = Math.floor((now.getTime() - lastAudit.getTime()) / (1000 * 60 * 60));
    // switch (currentPlan.limits.auditFrequency) {
    //   case 'daily':
    //     return hoursSinceLastAudit >= 24;
    //   case 'weekly':
    //     return hoursSinceLastAudit >= 168; // 7 days * 24 hours
    //   case 'monthly':
    //     return hoursSinceLastAudit >= 720; // 30 days * 24 hours
    //   default:
    //     return false;
    // }
  };

  // DISABLED FOR TESTING: Always allow content generation
  const canGenerateContent = (): boolean => {
    return true; // Disabled limits for testing
    
    // Original logic (commented out):
    // if (!currentPlan) return false;
    // return usage.aiContentUsed < currentPlan.limits.aiContentGenerations;
  };

  // DISABLED FOR TESTING: Always allow citation tracking
  const canTrackMoreCitations = (): boolean => {
    return true; // Disabled limits for testing
    
    // Original logic (commented out):
    // if (!currentPlan) return false;
    // return usage.citationsUsed < currentPlan.limits.citationsPerMonth;
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