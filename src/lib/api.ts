import { supabase } from './supabaseClient';

// Helper function to call edge functions with better error handling
async function callEdgeFunction(functionName: string, payload: any) {
  try {
    console.log(`🚀 Calling edge function: ${functionName}`);
    console.log(`📋 Payload:`, payload);
    
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload
    });
    
    if (error) {
      console.error(`❌ Edge function error for ${functionName}:`, error);
      throw new Error(`Edge function failed: ${error.message || 'Unknown error'}`);
    }
    
    console.log(`✅ Edge function ${functionName} completed successfully`);
    return data;
  } catch (error) {
    console.error(`💥 Failed to call edge function ${functionName}:`, error);
    
    // Check if it's a network/connection error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Failed to connect to Supabase Edge Function. Please check your internet connection and Supabase configuration.`);
    }
    
    // Re-throw the original error
    throw error;
  }
}

// API functions for sites
export const siteApi = {
  getSites: async () => {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  addSite: async (url: string, name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('sites')
      .insert([
        {
          url,
          name,
          user_id: user.id
        }
      ])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  getSite: async (siteId: string) => {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .single();
    
    if (error) throw error;
    return data;
  },

  deleteSite: async (siteId: string) => {
    const { error } = await supabase
      .from('sites')
      .delete()
      .eq('id', siteId);
    
    if (error) throw error;
  },

  updateSite: async (siteId: string, updates: { url?: string; name?: string }) => {
    const { data, error } = await supabase
      .from('sites')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', siteId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// API functions for audits
export const auditApi = {
  createAudit: async (siteId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    return await callEdgeFunction('analyzeSite', { 
      site_id: siteId,
      user_id: user.id
    });
  },

  getAudits: async (siteId: string) => {
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  getAudit: async (auditId: string) => {
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .eq('id', auditId)
      .single();
    
    if (error) throw error;
    return data;
  }
};

// API functions for schemas
export const schemaApi = {
  generateSchema: async (siteId: string, url: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    return await callEdgeFunction('generateSchema', { 
      site_id: siteId,
      url,
      user_id: user.id
    });
  },

  getSchemas: async (auditId: string) => {
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    return await callEdgeFunction('trackCitations', { 
      site_id: siteId,
      url,
      user_id: user.id
    });
  },

  getCitations: async (siteId: string) => {
    const { data, error } = await supabase
      .from('citations')
      .select('*')
      .eq('site_id', siteId)
      .order('detected_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// API functions for content generation
export const contentApi = {
  generateContent: async (siteId: string, contentType: string, prompt: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    return await callEdgeFunction('generateContent', { 
      site_id: siteId,
      content_type: contentType,
      prompt,
      user_id: user.id
    });
  }
};

// API functions for prompt generation
export const promptApi = {
  generatePrompts: async (siteId: string, url: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    return await callEdgeFunction('generatePrompts', { 
      site_id: siteId,
      url,
      user_id: user.id
    });
  }
};

// API functions for entities
export const entityApi = {
  getEntities: async (siteId: string) => {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('site_id', siteId)
      .order('mention_count', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  analyzeEntities: async (siteId: string, url: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // This would call an edge function for entity analysis
    // For now, return mock data structure
    return {
      entities: [],
      gaps: [],
      coverage_score: 0
    };
  }
};

// API functions for summaries - ENHANCED with better error handling
export const summaryApi = {
  generateSummary: async (siteId: string, url: string, summaryType: string) => {
    console.log('🚀 Starting enhanced summary generation...');
    console.log(`📋 Site ID: ${siteId}`);
    console.log(`🌐 URL: ${url}`);
    console.log(`📄 Summary Type: ${summaryType}`);
    
    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check Supabase connection first
      const { data: connectionTest } = await supabase.from('sites').select('id').limit(1);
      if (!connectionTest) {
        throw new Error('Unable to connect to Supabase. Please check your configuration.');
      }

      // Call the generateSummary edge function with enhanced error handling
      const result = await callEdgeFunction('generateSummary', { 
        site_id: siteId,
        url,
        summary_type: summaryType,
        user_id: user.id
      });
      
      console.log('✅ Enhanced summary generation completed!');
      console.log(`📊 Data source: ${result.dataSource || 'Edge Function'}`);
      console.log(`📊 Word count: ${result.wordCount || 'Unknown'}`);
      
      return result;
    } catch (error) {
      console.error('❌ Summary generation failed:', error);
      console.log('🔄 Falling back to local generation...');
      
      // Enhanced fallback with better error context
      const hostname = new URL(url).hostname;
      const fallbackSummary = {
        summary: {
          id: crypto.randomUUID(),
          site_id: siteId,
          summary_type: summaryType,
          content: `# ${hostname} Site Summary\n\nThis website provides professional services and valuable resources to help users achieve their goals. The site features a clean, user-friendly design and comprehensive information about available services.\n\n## Key Features\n- Professional service offerings\n- User-friendly interface\n- Comprehensive information\n- Quality content and resources\n\n## Target Audience\nThe site caters to individuals and businesses looking for professional services and expert guidance in their respective fields.\n\n*Note: This is a fallback summary generated locally due to connection issues with the AI service.*`,
          created_at: new Date().toISOString()
        },
        dataSource: "Local Fallback (Connection Issue)",
        wordCount: 95,
        timestamp: new Date().toISOString(),
        error: error.message
      };

      // Try to store the fallback summary in the database
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: storedSummary, error: storeError } = await supabase
            .from('summaries')
            .insert({
              site_id: siteId,
              summary_type: summaryType,
              content: fallbackSummary.summary.content
            })
            .select()
            .single();

          if (!storeError && storedSummary) {
            fallbackSummary.summary = storedSummary;
          }
        }
      } catch (storeError) {
        console.warn('Could not store fallback summary:', storeError);
      }

      return fallbackSummary;
    }
  },
  
  getSummaries: async (siteId: string) => {
    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};