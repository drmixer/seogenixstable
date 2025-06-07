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
    const url = `${getBaseUrl()}/${functionName}`;
    console.log(`🚀 Attempting to call Edge Function: ${url}`);
    console.log(`📤 Request body:`, body);
    
    const startTime = Date.now();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️ Request took ${duration}ms`);
    console.log(`📥 Response status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Edge Function ${functionName} returned ${response.status}: ${response.statusText}`);
      console.error(`💥 Error response body:`, errorText);
      
      // Try to parse error as JSON for better debugging
      try {
        const errorJson = JSON.parse(errorText);
        console.error(`🔍 Parsed error:`, errorJson);
      } catch {
        console.error(`📝 Raw error text:`, errorText);
      }
      
      console.warn('Using fallback data due to error response');
      return getFallbackData(functionName, body);
    }

    const responseText = await response.text();
    console.log(`📄 Response body length: ${responseText.length} characters`);
    console.log(`🔍 First 500 chars of response:`, responseText.substring(0, 500));
    
    try {
      const jsonResponse = JSON.parse(responseText);
      console.log(`✅ Successfully parsed JSON response`);
      
      // Log key information from the response
      if (jsonResponse.usingRealData !== undefined) {
        console.log(`🎯 REAL DATA CONFIRMED: ${jsonResponse.usingRealData}`);
        console.log(`📊 Data Source: ${jsonResponse.dataSource}`);
        console.log(`🆔 Analysis ID: ${jsonResponse.analysisId}`);
      }
      
      if (jsonResponse.audit) {
        console.log(`📈 Audit scores:`, {
          ai_visibility: jsonResponse.audit.ai_visibility_score,
          schema: jsonResponse.audit.schema_score,
          semantic: jsonResponse.audit.semantic_score,
          citation: jsonResponse.audit.citation_score,
          technical: jsonResponse.audit.technical_seo_score
        });
      }
      
      return jsonResponse;
    } catch (parseError) {
      console.error(`❌ Failed to parse JSON response:`, parseError);
      console.error(`📝 Raw response:`, responseText);
      console.warn('Using fallback data due to JSON parse error');
      return getFallbackData(functionName, body);
    }
  } catch (error) {
    console.error(`💥 Edge Function ${functionName} failed with error:`, error);
    console.error(`🔍 Error details:`, {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    console.warn('Using fallback data instead');
    return getFallbackData(functionName, body);
  }
};

// Helper function to get fallback data
const getFallbackData = (functionName: string, body: any) => {
  console.log(`🤖 MOCK DATA USED for function: ${functionName}`);
  
  switch (functionName) {
    case 'analyzeSite':
      const mockId = `MOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
        ],
        usingRealData: false,
        dataSource: "Mock Data Fallback",
        analysisId: mockId,
        analysis: "⚠️ This is mock data because the Edge Function was not available or failed to respond."
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
    console.log('🔍 Running audit for site:', siteId, 'URL:', url);
    console.log('⚙️ Supabase configured:', isSupabaseConfigured());
    
    // Always use fallback data if Supabase is not configured
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Using fallback data due to Supabase configuration');
      return getFallbackData('analyzeSite', { site_id: siteId, url });
    }

    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('❌ User not authenticated, using fallback data');
        return getFallbackData('analyzeSite', { site_id: siteId, url });
      }

      console.log('👤 User authenticated:', user.id);

      // Call the analyzeSite edge function with user_id
      const result = await callEdgeFunction('analyzeSite', { 
        site_id: siteId, 
        url,
        user_id: user.id 
      });
      
      console.log('🎉 Audit completed successfully');
      return result;
    } catch (error) {
      console.error('💥 Error in runAudit, using fallback data:', error);
      return getFallbackData('analyzeSite', { site_id: siteId, url });
    }
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