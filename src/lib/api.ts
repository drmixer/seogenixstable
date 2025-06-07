import supabase from './supabaseClient';

// Types
export interface Site {
  id: string;
  user_id: string;
  url: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Audit {
  id: string;
  site_id: string;
  ai_visibility_score: number;
  schema_score: number;
  semantic_score: number;
  citation_score: number;
  technical_seo_score: number;
  created_at: string;
}

export interface Citation {
  id: string;
  site_id: string;
  source_type: string;
  snippet_text: string;
  url: string;
  detected_at: string;
}

export interface Summary {
  id: string;
  site_id: string;
  summary_type: string;
  content: string;
  created_at: string;
}

// Site API
export const siteApi = {
  async getSites(): Promise<Site[]> {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createSite(url: string, name: string): Promise<Site> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('sites')
      .insert([{ url, name, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSite(id: string): Promise<void> {
    const { error } = await supabase
      .from('sites')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Summary API
export const summaryApi = {
  async getSummaries(siteId: string): Promise<Summary[]> {
    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async generateSummary(siteId: string, url: string, summaryType: string): Promise<{
    summary: Summary;
    dataSource: string;
    wordCount: number;
  }> {
    try {
      console.log('🚀 Calling generateSummary edge function with:', { siteId, url, summaryType });
      
      // Call the edge function
      const { data, error } = await supabase.functions.invoke('generateSummary', {
        body: { siteId, url, summaryType }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(`Edge function failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from edge function');
      }

      console.log('✅ Edge function response:', data);

      // Save the summary to the database
      const { data: savedSummary, error: dbError } = await supabase
        .from('summaries')
        .insert([data.summary])
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database error:', dbError);
        throw new Error(`Failed to save summary: ${dbError.message}`);
      }

      return {
        summary: savedSummary,
        dataSource: data.dataSource,
        wordCount: data.wordCount
      };

    } catch (error) {
      console.error('❌ Summary generation failed:', error);
      throw new Error(`Failed to send a request to the Edge Function`);
    }
  }
};

// Audit API
export const auditApi = {
  async getAudits(siteId: string): Promise<Audit[]> {
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createAudit(siteId: string, url: string): Promise<Audit> {
    try {
      const { data, error } = await supabase.functions.invoke('analyzeSite', {
        body: { siteId, url }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating audit:', error);
      throw error;
    }
  }
};

// Citation API
export const citationApi = {
  async getCitations(siteId: string): Promise<Citation[]> {
    const { data, error } = await supabase
      .from('citations')
      .select('*')
      .eq('site_id', siteId)
      .order('detected_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async trackCitations(siteId: string, url: string): Promise<Citation[]> {
    try {
      const { data, error } = await supabase.functions.invoke('trackCitations', {
        body: { siteId, url }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error tracking citations:', error);
      throw error;
    }
  }
};