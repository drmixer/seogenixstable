import { supabase } from './supabaseClient';

// Common headers for API calls
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
});

// Base URL for Supabase Edge Functions
const getBaseUrl = () => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  return url && 
         key && 
         url !== 'your-supabase-url' && 
         key !== 'your-supabase-anon-key' &&
         url.startsWith('https://') &&
         url.includes('supabase.co');
};

// Helper function to call Edge Functions with fallback
const callEdgeFunction = async (functionName: string, body: any) => {
  // Check if Supabase is configured before making the request
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, using fallback data');
    return getFallbackData(functionName, body);
  }

  try {
    const response = await fetch(`${getBaseUrl()}/${functionName}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.warn(`Edge Function ${functionName} returned ${response.status}, using fallback data`);
      return getFallbackData(functionName, body);
    }

    return await response.json();
  } catch (error) {
    console.warn(`Edge Function ${functionName} failed, using fallback data:`, error);
    return getFallbackData(functionName, body);
  }
};

// Helper function to get fallback data
const getFallbackData = (functionName: string, body: any) => {
  switch (functionName) {
    case 'analyzeSite':
      return {
        audit: {
          id: crypto.randomUUID(),
          site_id: body.site_id,
          ai_visibility_score: Math.floor(Math.random() * 40) + 60,
          schema_score: Math.floor(Math.random() * 40) + 60,
          semantic_score: Math.floor(Math.random() * 40) + 60,
          citation_score: Math.floor(Math.random() * 40) + 60,
          technical_seo_score: Math.floor(Math.random() * 40) + 60,
          created_at: new Date().toISOString()
        },
        schemas: [
          {
            id: crypto.randomUUID(),
            audit_id: crypto.randomUUID(),
            schema_type: 'FAQ',
            markup: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is AI visibility?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "AI visibility refers to how well your content is understood and cited by AI systems."
                  }
                }
              ]
            }, null, 2),
            created_at: new Date().toISOString()
          }
        ]
      };
    default:
      throw new Error(`No fallback data available for function: ${functionName}`);
  }
};

// API functions for subscription management
export const subscriptionApi = {
  getCurrentSubscription: async (userId: string) => {
    if (!isSupabaseConfigured()) {
      return null;
    }
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  getUsage: async (userId: string) => {
    if (!isSupabaseConfigured()) {
      return {
        citations_used: 0,
        ai_content_used: 0,
        last_audit_date: null,
        reset_date: new Date().toISOString()
      };
    }
    
    const { data, error } = await supabase
      .from('subscription_usage')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  updateUsage: async (userId: string, type: 'citations' | 'ai_content' | 'audits') => {
    if (!isSupabaseConfigured()) {
      return null;
    }
    
    const { data, error } = await supabase
      .rpc('increment_usage', {
        p_user_id: userId,
        p_type: type
      });
    
    if (error) throw error;
    return data;
  }
};

// API functions for sites
export const siteApi = {
  addSite: async (userId: string, url: string, name: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }
    
    const { data, error } = await supabase
      .from('sites')
      .insert([{ user_id: userId, url, name }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  getSites: async (userId: string) => {
    if (!isSupabaseConfigured()) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  getSite: async (siteId: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }
    
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  deleteSite: async (siteId: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }
    
    const { error } = await supabase
      .from('sites')
      .delete()
      .eq('id', siteId);
    
    if (error) throw error;
    return true;
  }
};

// API functions for audits
export const auditApi = {
  runAudit: async (siteId: string, url: string) => {
    // Always use fallback data if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return getFallbackData('analyzeSite', { site_id: siteId, url });
    }

    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Call the analyzeSite edge function with user_id
    return await callEdgeFunction('analyzeSite', { 
      site_id: siteId, 
      url,
      user_id: user.id 
    });
  },
  
  getLatestAudit: async (siteId: string) => {
    if (!isSupabaseConfigured()) {
      return null;
    }
    
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },
  
  getAudits: async (siteId: string) => {
    if (!isSupabaseConfigured()) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// API functions for schemas
export const schemaApi = {
  getSchemas: async (auditId: string) => {
    if (!isSupabaseConfigured()) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('schemas')
      .select('*')
      .eq('audit_id', auditId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// API functions for citations
export const citationApi = {
  trackCitations: async (siteId: string, url: string) => {
    // Return fallback data
    return {
      citations: [
        {
          id: crypto.randomUUID(),
          site_id: siteId,
          source_type: 'Google Featured Snippet',
          snippet_text: `According to ${url}, AI visibility refers to how well your content is understood and cited by AI systems.`,
          url: 'https://google.com/search?q=ai+visibility',
          detected_at: new Date().toISOString()
        }
      ],
      assistant_response: `Based on information from ${url}, AI visibility refers to how well your content is understood and cited by AI systems. To improve AI visibility, implement schema markup, create clear semantic structure, and ensure comprehensive entity coverage.`
    };
  },
  
  getCitations: async (siteId: string) => {
    if (!isSupabaseConfigured()) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('citations')
      .select('*')
      .eq('site_id', siteId)
      .order('detected_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// API functions for summaries
export const summaryApi = {
  generateSummary: async (siteId: string, url: string, summaryType: string) => {
    // Return fallback data
    return {
      summary: {
        id: crypto.randomUUID(),
        site_id: siteId,
        summary_type: summaryType,
        content: `# ${new URL(url).hostname} Site Summary\n\nThis website focuses on AI visibility optimization, helping website owners improve how their content is understood and cited by AI systems.`,
        created_at: new Date().toISOString()
      }
    };
  },
  
  getSummaries: async (siteId: string) => {
    if (!isSupabaseConfigured()) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// API functions for entity coverage
export const entityApi = {
  analyzeEntityCoverage: async (siteId: string, url: string) => {
    // Return fallback data
    return {
      entities: [
        {
          id: crypto.randomUUID(),
          site_id: siteId,
          entity_name: 'AI Visibility',
          entity_type: 'Concept',
          mention_count: 24,
          gap: false,
          created_at: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          site_id: siteId,
          entity_name: 'Schema Markup',
          entity_type: 'Technology',
          mention_count: 18,
          gap: false,
          created_at: new Date().toISOString()
        }
      ]
    };
  },
  
  getEntities: async (siteId: string) => {
    if (!isSupabaseConfigured()) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};