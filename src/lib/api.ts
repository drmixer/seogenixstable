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

export interface Schema {
  id: string;
  audit_id: string;
  schema_type: string;
  markup: string;
  created_at: string;
}

export interface Entity {
  id: string;
  site_id: string;
  entity_name: string;
  entity_type: string;
  mention_count: number;
  gap: boolean;
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

  async getSite(id: string): Promise<Site> {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async addSite(userId: string, url: string, name: string): Promise<Site> {
    const { data, error } = await supabase
      .from('sites')
      .insert([{ url, name, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
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
      
      // Validate inputs before making the call
      if (!siteId || !url || !summaryType) {
        throw new Error('Missing required parameters: siteId, url, or summaryType');
      }

      // Prepare the request body
      const requestBody = {
        siteId: siteId.trim(),
        url: url.trim(),
        summaryType: summaryType.trim()
      };

      console.log('📤 Request body:', requestBody);

      // Call the edge function - removed headers to prevent JSON serialization conflicts
      const { data, error } = await supabase.functions.invoke('generateSummary', {
        body: requestBody
      });

      console.log('📥 Edge function response:', { data, error });

      if (error) {
        console.error('❌ Edge function error:', error);
        
        // Try to extract more detailed error information
        let errorMessage = 'Edge function failed';
        if (error.message) {
          errorMessage += `: ${error.message}`;
        }
        if (error.details) {
          errorMessage += ` (${error.details})`;
        }
        if (error.hint) {
          errorMessage += ` - ${error.hint}`;
        }
        
        throw new Error(errorMessage);
      }

      if (!data) {
        throw new Error('No data returned from edge function');
      }

      // Check if the Edge Function returned an error in the response data
      if (data.error) {
        console.error('❌ Edge function returned error:', data.error);
        let errorMessage = `Edge function failed: ${data.error}`;
        if (data.details) {
          errorMessage += ` - ${data.details}`;
        }
        throw new Error(errorMessage);
      }

      console.log('✅ Edge function response:', data);

      // Validate the response structure
      if (!data.summary) {
        throw new Error('Invalid response: missing summary data');
      }

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
        dataSource: data.dataSource || 'Generated',
        wordCount: data.wordCount || 0
      };

    } catch (error) {
      console.error('❌ Summary generation failed:', error);
      throw error;
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

  async getLatestAudit(siteId: string): Promise<Audit | null> {
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async runAudit(siteId: string, url: string): Promise<{ audit: Audit; schemas?: Schema[] }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('🚀 Calling analyzeSite edge function with:', { siteId, url, user_id: user.id });

      // Call the analyzeSite edge function
      const { data, error } = await supabase.functions.invoke('analyzeSite', {
        body: { siteId, url, user_id: user.id }
      });

      console.log('📥 analyzeSite response:', { data, error });

      if (error) {
        console.error('❌ analyzeSite edge function error:', error);
        throw new Error(`Edge function failed: ${error.message || 'Unknown error'}`);
      }

      if (!data) {
        throw new Error('No data returned from analyzeSite edge function');
      }

      if (data.error) {
        console.error('❌ analyzeSite returned error:', data.error);
        throw new Error(`Analysis failed: ${data.error}`);
      }

      if (!data.audit) {
        throw new Error('Invalid response: missing audit data');
      }

      console.log('✅ analyzeSite completed successfully');

      // Save the audit to the database
      const { data: savedAudit, error: dbError } = await supabase
        .from('audits')
        .insert([data.audit])
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database error saving audit:', dbError);
        throw new Error(`Failed to save audit: ${dbError.message}`);
      }

      console.log('✅ Audit saved to database:', savedAudit);

      return { audit: savedAudit };
    } catch (error) {
      console.error('❌ Error running audit:', error);
      throw error;
    }
  },

  async createAudit(siteId: string, url: string): Promise<Audit> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('analyzeSite', {
        body: { siteId, url, user_id: user.id }
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

  async trackCitations(siteId: string, url: string): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('🚀 Calling trackCitations edge function with:', { siteId, url });

      // Call the trackCitations edge function
      const { data, error } = await supabase.functions.invoke('trackCitations', {
        body: { siteId, url, user_id: user.id }
      });

      console.log('📥 trackCitations response:', { data, error });

      if (error) {
        console.error('❌ trackCitations edge function error:', error);
        throw new Error(`Edge function failed: ${error.message || 'Unknown error'}`);
      }

      if (!data) {
        throw new Error('No data returned from trackCitations edge function');
      }

      if (data.error) {
        console.error('❌ trackCitations returned error:', data.error);
        throw new Error(`Citation tracking failed: ${data.error}`);
      }

      console.log('✅ trackCitations completed successfully');

      // Save citations to database if any were found
      if (data.citations && data.citations.length > 0) {
        const { data: savedCitations, error: citationError } = await supabase
          .from('citations')
          .insert(data.citations)
          .select();

        if (citationError) {
          console.error('❌ Database error saving citations:', citationError);
          // Don't throw here, just log the error
        } else {
          console.log('✅ Citations saved to database:', savedCitations);
          data.citations = savedCitations;
        }
      }

      return data;
    } catch (error) {
      console.error('❌ Error tracking citations:', error);
      throw error;
    }
  }
};

// Schema API
export const schemaApi = {
  async getSchemas(auditId: string): Promise<Schema[]> {
    const { data, error } = await supabase
      .from('schemas')
      .select('*')
      .eq('audit_id', auditId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async generateSchema(url: string, schemaType: string): Promise<{ schema: string }> {
    try {
      // Generate mock schema for now
      const domain = new URL(url).hostname;
      const siteName = domain.replace('www.', '').split('.')[0];
      
      let schema = '';
      
      switch (schemaType) {
        case 'Organization':
          schema = `{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "${siteName.charAt(0).toUpperCase() + siteName.slice(1)}",
  "url": "${url}",
  "description": "Professional services and solutions provider",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "url": "${url}"
  }
}`;
          break;
        case 'LocalBusiness':
          schema = `{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "${siteName.charAt(0).toUpperCase() + siteName.slice(1)}",
  "url": "${url}",
  "description": "Local business providing professional services",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "City",
    "addressRegion": "State",
    "addressCountry": "US"
  }
}`;
          break;
        default:
          schema = `{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "${siteName.charAt(0).toUpperCase() + siteName.slice(1)}",
  "url": "${url}",
  "description": "Professional website providing valuable services and information"
}`;
      }

      return { schema };
    } catch (error) {
      console.error('Error generating schema:', error);
      throw error;
    }
  }
};

// Entity API
export const entityApi = {
  async getEntities(siteId: string): Promise<Entity[]> {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('site_id', siteId)
      .order('mention_count', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async analyzeEntityCoverage(siteId: string, url: string): Promise<{ entities: Entity[] }> {
    try {
      // Generate mock entity data for now
      const mockEntities = [
        {
          site_id: siteId,
          entity_name: 'Professional Services',
          entity_type: 'Service Category',
          mention_count: 15,
          gap: false,
          created_at: new Date().toISOString()
        },
        {
          site_id: siteId,
          entity_name: 'Business Solutions',
          entity_type: 'Service Category',
          mention_count: 12,
          gap: false,
          created_at: new Date().toISOString()
        },
        {
          site_id: siteId,
          entity_name: 'Customer Support',
          entity_type: 'Service Feature',
          mention_count: 2,
          gap: true,
          created_at: new Date().toISOString()
        }
      ];

      // Save entities to database
      const { data: savedEntities, error: entityError } = await supabase
        .from('entities')
        .insert(mockEntities)
        .select();

      if (entityError) throw entityError;

      return { entities: savedEntities };
    } catch (error) {
      console.error('Error analyzing entity coverage:', error);
      throw error;
    }
  }
};

// Content API
export const contentApi = {
  async generateContent(topic: string, contentType: string, industry?: string, targetAudience?: string, tone?: string, length?: string, siteUrl?: string): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('generateContent', {
        body: { topic, contentType, industry, targetAudience, tone, length, siteUrl }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  }
};

// Prompt API
export const promptApi = {
  async generatePrompts(content: string, industry?: string, targetAudience?: string, contentType?: string, siteUrl?: string): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('generatePrompts', {
        body: { content, industry, targetAudience, contentType, siteUrl }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating prompts:', error);
      throw error;
    }
  }
};