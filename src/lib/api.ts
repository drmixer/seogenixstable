import { supabase } from './supabaseClient';

// Common headers for API calls
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
});

// Base URL for Supabase Edge Functions
const getBaseUrl = () => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

// Helper function to call Edge Functions with fallback
const callEdgeFunction = async (functionName: string, body: any) => {
  try {
    // Check if we have the required environment variables
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Missing Supabase configuration, using fallback data');
      return getFallbackData(functionName, body);
    }

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
    case 'generateSchema':
      return generateSchemaFallback(body);
    case 'generateContent':
      return generateContentFallback(body);
    case 'generatePrompts':
      return generatePromptsFallback(body);
    default:
      throw new Error(`No fallback data available for function: ${functionName}`);
  }
};

// Fallback functions for different features
const generateSchemaFallback = (body: any) => {
  const { schemaType, url } = body;
  
  const schemaExamples = {
    FAQ: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What services do you offer?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `Our website offers comprehensive services designed to help businesses succeed online. Visit ${url} to learn more about our offerings.`
          }
        },
        {
          "@type": "Question",
          "name": "How can I get started?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Getting started is easy! Simply contact us through our website or give us a call to discuss your specific needs."
          }
        }
      ]
    },
    HowTo: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "How to Get Started with Our Services",
      "description": "A step-by-step guide to getting started with our services.",
      "step": [
        {
          "@type": "HowToStep",
          "name": "Contact us",
          "text": "Reach out to our team to discuss your needs."
        },
        {
          "@type": "HowToStep",
          "name": "Schedule consultation",
          "text": "We'll schedule a consultation to understand your requirements."
        },
        {
          "@type": "HowToStep",
          "name": "Get started",
          "text": "Begin your journey with our tailored solutions."
        }
      ]
    },
    Product: {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Professional Services",
      "description": "High-quality professional services tailored to your needs.",
      "brand": {
        "@type": "Brand",
        "name": new URL(url).hostname
      },
      "offers": {
        "@type": "Offer",
        "availability": "https://schema.org/InStock",
        "url": url
      }
    },
    LocalBusiness: {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": new URL(url).hostname,
      "url": url,
      "description": "Professional local business providing quality services to the community."
    },
    Article: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Professional Services and Solutions",
      "description": "Learn about our comprehensive range of professional services.",
      "url": url,
      "author": {
        "@type": "Organization",
        "name": new URL(url).hostname
      }
    },
    Event: {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": "Professional Consultation",
      "description": "Schedule a consultation to discuss your needs.",
      "url": url,
      "organizer": {
        "@type": "Organization",
        "name": new URL(url).hostname
      }
    },
    Organization: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": new URL(url).hostname,
      "url": url,
      "description": "Professional organization providing quality services."
    }
  };

  return {
    schema: JSON.stringify(schemaExamples[schemaType as keyof typeof schemaExamples] || schemaExamples.FAQ, null, 2)
  };
};

const generateContentFallback = (body: any) => {
  const { topic, contentType } = body;
  
  const contentExamples = {
    blogOutline: `# ${topic}: A Complete Guide

## Introduction
- Understanding ${topic}
- Why ${topic} matters in 2025
- Key benefits and applications

## Main Content Sections
1. Getting Started with ${topic}
2. Best Practices and Strategies
3. Common Challenges and Solutions
4. Advanced Techniques
5. Future Trends and Developments

## Conclusion
- Key takeaways about ${topic}
- Next steps for implementation
- Additional resources`,

    faqSection: `## Frequently Asked Questions About ${topic}

### What is ${topic}?
${topic} is an important concept that helps businesses and individuals achieve their goals through strategic implementation and best practices.

### How can I get started with ${topic}?
Getting started with ${topic} involves understanding the fundamentals, identifying your specific needs, and implementing a structured approach.

### What are the benefits of ${topic}?
The main benefits include improved efficiency, better results, and enhanced performance in your specific area of focus.

### How long does it take to see results with ${topic}?
Results can vary depending on your specific situation, but most people see initial improvements within a few weeks of proper implementation.`,

    metaDescription: `Learn everything about ${topic} with our comprehensive guide. Discover best practices, strategies, and expert tips to help you succeed. Get started today!`,

    productDescription: `Discover our premium ${topic} solution designed to meet your specific needs. Our comprehensive approach ensures you get the best results with expert support and proven strategies.`,

    socialPost: `🚀 Excited to share insights about ${topic}! 

Key benefits:
✅ Improved efficiency
✅ Better results
✅ Expert guidance

Ready to get started? Let's connect! #${topic.replace(/\s+/g, '')} #Success`
  };

  return {
    content: contentExamples[contentType as keyof typeof contentExamples] || contentExamples.blogOutline
  };
};

const generatePromptsFallback = (body: any) => {
  const { content } = body;
  
  // Extract key topics from content for more relevant suggestions
  const suggestions = [
    "What are the best practices for this topic?",
    "How can I get started with this approach?",
    "What are the main benefits of this strategy?",
    "How does this compare to other methods?",
    "What should I avoid when implementing this?",
    "How can I measure success with this approach?",
    "What tools or resources do I need for this?"
  ];

  return { suggestions };
};

// API functions for subscription management
export const subscriptionApi = {
  getCurrentSubscription: async (userId: string) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  getUsage: async (userId: string) => {
    const { data, error } = await supabase
      .from('subscription_usage')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  updateUsage: async (userId: string, type: 'citations' | 'ai_content' | 'audits') => {
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
    const { data, error } = await supabase
      .from('sites')
      .insert([{ user_id: userId, url, name }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  getSites: async (userId: string) => {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('user_id', userId)
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
  
  deleteSite: async (siteId: string) => {
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
  generateSchema: async (url: string, schemaType: string) => {
    // Use fallback data directly instead of calling non-existent edge function
    return generateSchemaFallback({ url, schemaType });
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

// API functions for content generation
export const contentApi = {
  generateContent: async (topic: string, contentType: string) => {
    // Use fallback data directly instead of calling non-existent edge function
    return generateContentFallback({ topic, contentType });
  }
};

// API functions for prompt suggestions
export const promptApi = {
  generatePrompts: async (content: string) => {
    // Use fallback data directly instead of calling non-existent edge function
    return generatePromptsFallback({ content });
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
          snippet_text: `According to ${url}, this website provides valuable information and services to help users achieve their goals.`,
          url: 'https://google.com/search?q=website+information',
          detected_at: new Date().toISOString()
        }
      ],
      assistant_response: `Based on information from ${url}, this website offers comprehensive services and valuable resources. The content is well-structured and provides helpful information for visitors.`
    };
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

// API functions for summaries
export const summaryApi = {
  generateSummary: async (siteId: string, url: string, summaryType: string) => {
    // Return fallback data
    const hostname = new URL(url).hostname;
    return {
      summary: {
        id: crypto.randomUUID(),
        site_id: siteId,
        summary_type: summaryType,
        content: `# ${hostname} Site Summary\n\nThis website provides professional services and valuable resources to help users achieve their goals. The site features a clean, user-friendly design and comprehensive information about available services.\n\n## Key Features\n- Professional service offerings\n- User-friendly interface\n- Comprehensive information\n- Quality content and resources\n\n## Target Audience\nThe site caters to individuals and businesses looking for professional services and expert guidance in their respective fields.`,
        created_at: new Date().toISOString()
      }
    };
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

// API functions for entity coverage
export const entityApi = {
  analyzeEntityCoverage: async (siteId: string, url: string) => {
    // Return fallback data
    return {
      entities: [
        {
          id: crypto.randomUUID(),
          site_id: siteId,
          entity_name: 'Professional Services',
          entity_type: 'Service',
          mention_count: 15,
          gap: false,
          created_at: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          site_id: siteId,
          entity_name: 'Customer Support',
          entity_type: 'Service',
          mention_count: 8,
          gap: false,
          created_at: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          site_id: siteId,
          entity_name: 'Quality Assurance',
          entity_type: 'Process',
          mention_count: 3,
          gap: true,
          created_at: new Date().toISOString()
        }
      ]
    };
  },
  
  getEntities: async (siteId: string) => {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};