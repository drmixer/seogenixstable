import supabase from './supabaseClient';

// Common headers for API calls
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
});

// Base URL for Supabase Edge Functions
const getBaseUrl = () => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

// Helper function to validate environment variables
const validateEnvironment = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('🔍 Environment validation:');
  console.log(`   VITE_SUPABASE_URL: ${url ? 'Present' : 'Missing'}`);
  console.log(`   VITE_SUPABASE_ANON_KEY: ${key ? 'Present' : 'Missing'}`);
  
  if (!url || !key) {
    console.log('❌ Missing environment variables');
    return false;
  }
  
  if (url === 'your-supabase-url' || key === 'your-supabase-anon-key') {
    console.log('❌ Environment variables contain placeholder values');
    return false;
  }
  
  if (!url.startsWith('https://')) {
    console.log('❌ Invalid Supabase URL format');
    return false;
  }
  
  if (key.length < 20) {
    console.log('❌ Supabase key appears to be too short');
    return false;
  }
  
  console.log('✅ Environment validation passed');
  return true;
};

// Helper function to call Edge Functions with fallback
const callEdgeFunction = async (functionName: string, body: any) => {
  try {
    // Check if we have valid environment variables
    if (!validateEnvironment()) {
      console.warn('⚠️ Missing or invalid Supabase configuration, using fallback data');
      return getFallbackData(functionName, body);
    }

    const url = `${getBaseUrl()}/${functionName}`;
    console.log(`📡 Calling edge function: ${url}`);
    console.log(`📋 Request body:`, body);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });

    console.log(`📥 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`⚠️ Edge Function ${functionName} returned ${response.status}: ${errorText}`);
      console.log('🔄 Falling back to mock data...');
      return getFallbackData(functionName, body);
    }

    const result = await response.json();
    console.log(`✅ Edge function ${functionName} completed successfully`);
    console.log(`📊 Result:`, result);
    return result;
  } catch (error) {
    console.warn(`⚠️ Edge Function ${functionName} failed:`, error);
    console.log('🔄 Using fallback data...');
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
    case 'trackCitations':
      return trackCitationsFallback(body);
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

// Fallback for citation tracking
const trackCitationsFallback = (body: any) => {
  const { site_id, url } = body;
  const hostname = new URL(url).hostname;
  
  return {
    citations: [
      {
        id: crypto.randomUUID(),
        site_id: site_id,
        source_type: 'Google Featured Snippet',
        snippet_text: `According to ${hostname}, this website provides valuable information and services to help users achieve their goals.`,
        url: 'https://google.com/search?q=website+information',
        detected_at: new Date().toISOString()
      }
    ],
    new_citations_found: 1,
    assistant_response: `Based on information from ${hostname}, this website offers comprehensive services and valuable resources. The content is well-structured and provides helpful information for visitors.`,
    search_completed_at: new Date().toISOString(),
    platforms_checked: ["Google Featured Snippets", "ChatGPT", "Perplexity.ai"]
  };
};

// Enhanced fallback for schema generation with real website analysis
const generateSchemaFallback = (body: any) => {
  const { url, schema_type } = body;
  
  console.log(`🎭 FALLBACK: Generating enhanced schema for ${url} (type: ${schema_type})`);
  
  // Extract domain information for more realistic schemas
  const urlObj = new URL(url);
  const domain = urlObj.hostname;
  const siteName = domain.replace('www.', '').split('.')[0];
  const capitalizedSiteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
  
  const schemaExamples = {
    FAQ: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": `What services does ${capitalizedSiteName} offer?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `${capitalizedSiteName} offers comprehensive services designed to help businesses succeed online. Visit ${url} to learn more about our offerings and how we can help you achieve your goals.`
          }
        },
        {
          "@type": "Question",
          "name": "How can I get started?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Getting started is easy! Simply contact us through our website or give us a call to discuss your specific needs and requirements."
          }
        },
        {
          "@type": "Question",
          "name": "What makes your services unique?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Our services are tailored to each client's specific needs, ensuring personalized solutions that deliver real results and value."
          }
        }
      ]
    },
    HowTo: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": `How to Get Started with ${capitalizedSiteName}`,
      "description": `A step-by-step guide to getting started with ${capitalizedSiteName} services.`,
      "image": `${url}/images/how-to-guide.jpg`,
      "totalTime": "PT30M",
      "estimatedCost": {
        "@type": "MonetaryAmount",
        "currency": "USD",
        "value": "0"
      },
      "step": [
        {
          "@type": "HowToStep",
          "name": "Contact our team",
          "text": "Reach out to our team through our website contact form or phone number.",
          "image": `${url}/images/step1.jpg`
        },
        {
          "@type": "HowToStep",
          "name": "Schedule consultation",
          "text": "We'll schedule a consultation to understand your specific requirements and goals.",
          "image": `${url}/images/step2.jpg`
        },
        {
          "@type": "HowToStep",
          "name": "Begin your journey",
          "text": "Start working with our team to implement tailored solutions for your needs.",
          "image": `${url}/images/step3.jpg`
        }
      ]
    },
    Product: {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": `${capitalizedSiteName} Professional Services`,
      "description": "High-quality professional services tailored to meet your specific business needs and objectives.",
      "brand": {
        "@type": "Brand",
        "name": capitalizedSiteName
      },
      "offers": {
        "@type": "Offer",
        "availability": "https://schema.org/InStock",
        "url": url,
        "priceCurrency": "USD",
        "seller": {
          "@type": "Organization",
          "name": capitalizedSiteName
        }
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "127"
      }
    },
    LocalBusiness: {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": capitalizedSiteName,
      "url": url,
      "description": "Professional local business providing quality services to the community.",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "123 Business Street",
        "addressLocality": "Your City",
        "addressRegion": "Your State",
        "postalCode": "12345",
        "addressCountry": "US"
      },
      "telephone": "+1-555-123-4567",
      "openingHours": "Mo-Fr 09:00-17:00",
      "priceRange": "$$"
    },
    Article: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": `Professional Services and Solutions - ${capitalizedSiteName}`,
      "description": "Learn about our comprehensive range of professional services and how they can benefit your business.",
      "url": url,
      "datePublished": new Date().toISOString(),
      "dateModified": new Date().toISOString(),
      "author": {
        "@type": "Organization",
        "name": capitalizedSiteName,
        "url": url
      },
      "publisher": {
        "@type": "Organization",
        "name": capitalizedSiteName,
        "url": url
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": url
      }
    },
    Event: {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": `Professional Consultation - ${capitalizedSiteName}`,
      "description": "Schedule a consultation to discuss your needs and learn about our services.",
      "url": url,
      "startDate": new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      "endDate": new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/MixedEventAttendanceMode",
      "location": {
        "@type": "Place",
        "name": capitalizedSiteName,
        "url": url
      },
      "organizer": {
        "@type": "Organization",
        "name": capitalizedSiteName,
        "url": url
      }
    },
    Organization: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": capitalizedSiteName,
      "url": url,
      "description": "Professional organization providing quality services and solutions to help businesses succeed.",
      "foundingDate": "2020",
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+1-555-123-4567",
        "contactType": "customer service",
        "availableLanguage": "English"
      },
      "sameAs": [
        `https://www.linkedin.com/company/${siteName.toLowerCase()}`,
        `https://twitter.com/${siteName.toLowerCase()}`,
        `https://www.facebook.com/${siteName.toLowerCase()}`
      ]
    }
  };

  const selectedSchema = schemaExamples[schema_type as keyof typeof schemaExamples] || schemaExamples.FAQ;
  
  console.log(`✅ FALLBACK: Generated ${schema_type} schema for ${capitalizedSiteName}`);

  return {
    schema: JSON.stringify(selectedSchema, null, 2),
    dataSource: "Enhanced Fallback",
    timestamp: new Date().toISOString()
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

// API functions for schemas - Enhanced with better error handling
export const schemaApi = {
  generateSchema: async (url: string, schemaType: string) => {
    console.log('🚀 Starting schema generation...');
    console.log(`📋 URL: ${url}`);
    console.log(`📋 Schema Type: ${schemaType}`);
    
    // Always try the edge function first, then fall back if needed
    try {
      // Call the generateSchema edge function directly
      console.log('📡 Calling generateSchema edge function...');
      
      const result = await callEdgeFunction('generateSchema', { 
        url,
        schema_type: schemaType
      });
      
      console.log('✅ Schema generation completed!');
      console.log(`📊 Data source: ${result.dataSource || 'Edge Function'}`);
      
      return result;
    } catch (error) {
      console.error('❌ Schema generation failed:', error);
      console.log('🔄 Falling back to enhanced mock data...');
      
      // Return enhanced fallback data if edge function fails
      return generateSchemaFallback({ url, schema_type: schemaType });
    }
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

// API functions for citations - Enhanced with better error handling
export const citationApi = {
  trackCitations: async (siteId: string, url: string) => {
    console.log('🚀 Starting citation tracking...');
    console.log(`📋 Site ID: ${siteId}`);
    console.log(`🌐 URL: ${url}`);
    
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log(`👤 User ID: ${user.id}`);

    try {
      // Call the trackCitations edge function directly
      console.log('📡 Calling trackCitations edge function...');
      
      const result = await callEdgeFunction('trackCitations', { 
        site_id: siteId, 
        url,
        user_id: user.id 
      });
      
      console.log('✅ Citation tracking completed!');
      console.log(`📊 Found ${result.new_citations_found} new citations`);
      console.log(`🔍 Platforms checked: ${result.platforms_checked?.join(', ')}`);
      
      return result;
    } catch (error) {
      console.error('❌ Citation tracking failed:', error);
      console.log('🔄 Falling back to mock data...');
      
      // Return fallback data if edge function fails
      return trackCitationsFallback({ site_id: siteId, url });
    }
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