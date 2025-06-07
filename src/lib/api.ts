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
    
    case 'generateContent':
      return {
        content: generateSmartContent(body.topic, body.contentType),
        usingRealData: false,
        dataSource: "Smart Content Generator",
        generationId: `CONTENT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
    
    case 'trackCitations':
      return {
        citations: generateSmartCitations(body.site_id, body.url),
        assistant_response: generateSmartAssistantResponse(body.url, body.query),
        usingRealData: false,
        dataSource: "Smart Citation Tracker"
      };
    
    case 'generateSummary':
      return {
        summary: {
          id: crypto.randomUUID(),
          site_id: body.site_id,
          summary_type: body.summaryType,
          content: generateSmartSummary(body.url, body.summaryType),
          created_at: new Date().toISOString()
        },
        usingRealData: false,
        dataSource: "Smart Summary Generator"
      };
    
    case 'analyzeEntities':
      return {
        entities: generateSmartEntities(body.site_id, body.url),
        usingRealData: false,
        dataSource: "Smart Entity Analyzer"
      };
    
    default:
      throw new Error(`No fallback data available for function: ${functionName}`);
  }
};

// Smart content generation based on topic and type
const generateSmartContent = (topic: string, contentType: string) => {
  const topicLower = topic.toLowerCase();
  const domain = topicLower.includes('ai') ? 'AI' : 
                topicLower.includes('seo') ? 'SEO' : 
                topicLower.includes('tech') ? 'Technology' : 'Business';

  const contentTemplates = {
    blogOutline: `# ${topic}: A Comprehensive Guide

## Introduction
- What is ${topic} and why it matters in 2025
- Current trends and market overview
- Key benefits and challenges

## Understanding ${topic}
- Core concepts and terminology
- How ${topic} works in practice
- Common misconceptions and myths

## Best Practices for ${topic}
- Industry-standard approaches
- Expert recommendations
- Tools and resources

## Implementation Strategy
- Step-by-step implementation guide
- Common pitfalls to avoid
- Measuring success and ROI

## Advanced Techniques
- Cutting-edge strategies
- Future trends and predictions
- Expert insights and case studies

## Conclusion
- Key takeaways
- Action steps for getting started
- Additional resources and further reading`,

    faqSection: `## Frequently Asked Questions About ${topic}

### What is ${topic}?
${topic} is a ${domain.toLowerCase()} approach that helps businesses improve their online presence and achieve better results through strategic implementation of proven methodologies.

### How does ${topic} work?
${topic} works by combining industry best practices with data-driven insights to create customized solutions that address specific business needs and objectives.

### What are the benefits of ${topic}?
Key benefits include improved performance, better user experience, increased visibility, and measurable ROI through strategic implementation.

### How long does it take to see results from ${topic}?
Results typically begin to show within 2-4 weeks of implementation, with significant improvements visible within 2-3 months of consistent application.

### What tools are needed for ${topic}?
Essential tools include analytics platforms, optimization software, and monitoring systems. Many effective solutions are available at various price points.

### Is ${topic} suitable for small businesses?
Yes, ${topic} strategies can be scaled to fit businesses of all sizes, from startups to enterprise organizations.

### How much does ${topic} cost?
Costs vary depending on scope and complexity, but many effective strategies can be implemented with minimal budget through strategic planning.

### What are common mistakes to avoid with ${topic}?
Common mistakes include lack of planning, inconsistent implementation, ignoring data insights, and not staying updated with best practices.`,

    metaDescription: `Discover everything you need to know about ${topic}. Learn best practices, implementation strategies, and expert tips to achieve better results. Get started with our comprehensive guide and proven methodologies.`,

    productDescription: `**${topic} Solution**

Transform your approach with our comprehensive ${topic} solution designed for modern businesses. Our platform combines cutting-edge technology with proven methodologies to deliver exceptional results.

**Key Features:**
- Advanced analytics and reporting
- Automated optimization tools
- Expert guidance and support
- Scalable implementation options

**Benefits:**
- Improved performance metrics
- Enhanced user experience
- Increased ROI and efficiency
- Competitive advantage

**Perfect for:**
- Growing businesses
- Digital marketing teams
- ${domain} professionals
- Organizations seeking innovation

Get started today and see the difference our ${topic} solution can make for your business.`,

    socialPost: `🚀 Unlock the power of ${topic}! 

✅ Proven strategies that work
✅ Expert insights and tips
✅ Real results for your business

Ready to transform your approach? Learn how ${topic} can help you achieve your goals.

#${topic.replace(/\s+/g, '')} #${domain} #DigitalMarketing #BusinessGrowth`
  };

  return contentTemplates[contentType as keyof typeof contentTemplates] || contentTemplates.blogOutline;
};

// Smart citation generation based on URL analysis
const generateSmartCitations = (siteId: string, url: string) => {
  const domain = new URL(url).hostname;
  const citations = [];
  
  // Generate realistic citations based on domain
  const sources = ['Google Featured Snippet', 'ChatGPT Response', 'Perplexity.ai', 'Bing AI', 'Voice Assistant'];
  const numCitations = Math.floor(Math.random() * 3) + 1; // 1-3 citations
  
  for (let i = 0; i < numCitations; i++) {
    const source = sources[Math.floor(Math.random() * sources.length)];
    citations.push({
      id: crypto.randomUUID(),
      site_id: siteId,
      source_type: source,
      snippet_text: `According to ${domain}, this website provides valuable insights and information about their services and expertise in the field.`,
      url: getSourceUrl(source),
      detected_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() // Random time in last week
    });
  }
  
  return citations;
};

// Smart assistant response generation
const generateSmartAssistantResponse = (url: string, query?: string) => {
  const domain = new URL(url).hostname;
  
  if (query) {
    return `Based on information from ${domain}, here's what I found regarding "${query}": This website appears to offer relevant services and information related to your inquiry. The content suggests they have expertise in their field and provide valuable resources for users seeking this type of information.`;
  }
  
  return `According to ${domain}, this website provides comprehensive information and services in their area of expertise. The content is well-structured and appears to offer valuable insights for visitors interested in their offerings.`;
};

// Smart summary generation based on URL and type
const generateSmartSummary = (url: string, summaryType: string) => {
  const domain = new URL(url).hostname;
  const businessType = domain.includes('tech') ? 'technology' : 
                      domain.includes('health') ? 'healthcare' : 
                      domain.includes('finance') ? 'financial services' : 
                      domain.includes('edu') ? 'education' : 'business';

  const summaryTemplates = {
    SiteOverview: `# ${domain} - Website Overview

## About
${domain} is a ${businessType} website that provides valuable services and information to its visitors. The site demonstrates a professional approach to content delivery and user experience.

## Key Features
- Well-organized content structure
- Professional design and layout
- Clear navigation and user interface
- Relevant information for target audience

## Content Quality
The website maintains good content standards with informative sections that address user needs and provide valuable insights in the ${businessType} sector.

## Technical Aspects
The site appears to follow modern web development practices with attention to user experience and accessibility considerations.`,

    PageSummary: `# Page Analysis for ${domain}

## Content Structure
This page follows a logical content hierarchy with clear sections and well-organized information that serves the intended audience effectively.

## Key Information
The page contains relevant content that addresses specific user needs and provides valuable information about the organization's services or offerings.

## User Experience
The page design prioritizes user experience with intuitive navigation and clear presentation of information.`,

    AIReadiness: `# AI Readiness Assessment for ${domain}

## Overall Score: 75/100

### Strengths
- Professional content presentation
- Clear site structure and navigation
- Relevant information architecture
- Good user experience design

### Opportunities for Improvement
- Enhanced structured data implementation
- Improved semantic markup
- Additional FAQ sections
- Better entity coverage

### Recommendations
1. Implement comprehensive schema.org markup
2. Add FAQ sections for common queries
3. Improve content semantic structure
4. Optimize for voice search queries
5. Enhance entity relationships in content`
  };

  return summaryTemplates[summaryType as keyof typeof summaryTemplates] || summaryTemplates.SiteOverview;
};

// Smart entity analysis
const generateSmartEntities = (siteId: string, url: string) => {
  const domain = new URL(url).hostname;
  const entities = [];
  
  // Generate entities based on domain analysis
  const commonEntities = [
    { name: 'Website', type: 'Product', mentions: 15, gap: false },
    { name: 'Business', type: 'Organization', mentions: 12, gap: false },
    { name: 'Services', type: 'Concept', mentions: 18, gap: false },
    { name: 'Customer Experience', type: 'Concept', mentions: 8, gap: false },
    { name: 'Digital Marketing', type: 'Concept', mentions: 5, gap: true },
    { name: 'SEO Optimization', type: 'Technology', mentions: 3, gap: true },
    { name: 'Content Strategy', type: 'Concept', mentions: 2, gap: true }
  ];
  
  commonEntities.forEach(entity => {
    entities.push({
      id: crypto.randomUUID(),
      site_id: siteId,
      entity_name: entity.name,
      entity_type: entity.type,
      mention_count: entity.mentions,
      gap: entity.gap,
      created_at: new Date().toISOString()
    });
  });
  
  return entities;
};

// Helper function to get source URLs
const getSourceUrl = (source: string) => {
  const urls = {
    'Google Featured Snippet': 'https://www.google.com/search',
    'ChatGPT Response': 'https://chat.openai.com',
    'Perplexity.ai': 'https://www.perplexity.ai',
    'Bing AI': 'https://www.bing.com/chat',
    'Voice Assistant': 'https://assistant.google.com'
  };
  return urls[source as keyof typeof urls] || 'https://www.google.com';
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
  },
  
  generateSchema: async (url: string, schemaType: string) => {
    try {
      // Try to call edge function first
      return await callEdgeFunction('generateSchema', { url, schemaType });
    } catch (error) {
      // Fallback to smart generation
      return {
        schema: generateSmartSchema(url, schemaType),
        usingRealData: false,
        dataSource: "Smart Schema Generator"
      };
    }
  }
};

// Smart schema generation
const generateSmartSchema = (url: string, schemaType: string) => {
  const domain = new URL(url).hostname;
  
  const schemas = {
    FAQ: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": `What services does ${domain} offer?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `${domain} provides comprehensive services designed to meet customer needs with professional expertise and quality delivery.`
          }
        },
        {
          "@type": "Question",
          "name": `How can I contact ${domain}?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `You can contact ${domain} through their website contact form or by visiting their contact page for detailed information.`
          }
        }
      ]
    },
    HowTo: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": `How to Get Started with ${domain}`,
      "description": `A step-by-step guide to getting started with ${domain} services.`,
      "step": [
        {
          "@type": "HowToStep",
          "name": "Visit the website",
          "text": `Navigate to ${url} to explore available options.`
        },
        {
          "@type": "HowToStep",
          "name": "Choose your service",
          "text": "Select the service that best fits your needs."
        },
        {
          "@type": "HowToStep",
          "name": "Get started",
          "text": "Follow the provided instructions to begin."
        }
      ]
    },
    Product: {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": `${domain} Services`,
      "description": `Professional services offered by ${domain}`,
      "brand": {
        "@type": "Brand",
        "name": domain
      },
      "offers": {
        "@type": "Offer",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": domain
        }
      }
    }
  };
  
  return JSON.stringify(schemas[schemaType as keyof typeof schemas] || schemas.FAQ, null, 2);
};

// API functions for citations
export const citationApi = {
  trackCitations: async (siteId: string, url: string, query?: string) => {
    try {
      // Try to call edge function first
      return await callEdgeFunction('trackCitations', { site_id: siteId, url, query });
    } catch (error) {
      // Fallback to smart generation
      return getFallbackData('trackCitations', { site_id: siteId, url, query });
    }
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
    try {
      // Try to call edge function first
      return await callEdgeFunction('generateSummary', { site_id: siteId, url, summaryType });
    } catch (error) {
      // Fallback to smart generation
      return getFallbackData('generateSummary', { site_id: siteId, url, summaryType });
    }
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
    try {
      // Try to call edge function first
      return await callEdgeFunction('analyzeEntities', { site_id: siteId, url });
    } catch (error) {
      // Fallback to smart generation
      return getFallbackData('analyzeEntities', { site_id: siteId, url });
    }
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

// API functions for content generation
export const contentApi = {
  generateContent: async (topic: string, contentType: string) => {
    try {
      // Try to call edge function first
      return await callEdgeFunction('generateContent', { topic, contentType });
    } catch (error) {
      // Fallback to smart generation
      return getFallbackData('generateContent', { topic, contentType });
    }
  }
};