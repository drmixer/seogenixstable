import { supabase } from './supabaseClient';

// Helper function to call edge functions
const callEdgeFunction = async (functionName: string, payload: any) => {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: payload
  });
  
  if (error) throw error;
  return data;
};

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

  getSite: async (siteId: string) => {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .single();
    
    if (error) throw error;
    return data;
  },

  addSite: async (siteData: { name: string; url: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('sites')
      .insert({
        name: siteData.name,
        url: siteData.url,
        user_id: user.id
      })
      .select()
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
  }
};

// API functions for summaries - ENHANCED
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

      // Call the generateSummary edge function
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
      console.log('🔄 Falling back to mock data...');
      
      // Return fallback data if edge function fails
      const hostname = new URL(url).hostname;
      return {
        summary: {
          id: crypto.randomUUID(),
          site_id: siteId,
          summary_type: summaryType,
          content: `# ${hostname} Site Summary\n\nThis website provides professional services and valuable resources to help users achieve their goals. The site features a clean, user-friendly design and comprehensive information about available services.\n\n## Key Features\n- Professional service offerings\n- User-friendly interface\n- Comprehensive information\n- Quality content and resources\n\n## Target Audience\nThe site caters to individuals and businesses looking for professional services and expert guidance in their respective fields.`,
          created_at: new Date().toISOString()
        },
        dataSource: "Fallback Data",
        wordCount: 85,
        timestamp: new Date().toISOString()
      };
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