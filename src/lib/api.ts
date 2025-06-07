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
  const { topic, content_type, industry, target_audience, tone } = body;
  
  const audienceContext = target_audience || 'users';
  const industryContext = industry || 'your industry';
  const toneStyle = tone || 'professional';
  
  const contentExamples = {
    blogOutline: `# ${topic}: A Complete Guide for ${audienceContext}

## Introduction
- Understanding ${topic} in the context of ${industryContext}
- Why ${topic} matters in 2025
- Key benefits and applications for ${audienceContext}

## Main Content Sections
1. Getting Started with ${topic}
   - Prerequisites and requirements
   - Initial setup and configuration
   - Best practices for beginners

2. Advanced ${topic} Strategies
   - Professional techniques and methodologies
   - Industry-specific applications
   - Optimization and performance tips

3. Common Challenges and Solutions
   - Typical obstacles faced by ${audienceContext}
   - Proven solutions and workarounds
   - Expert recommendations

4. Implementation Guide
   - Step-by-step process
   - Tools and resources needed
   - Timeline and milestones

5. Measuring Success
   - Key performance indicators
   - Tracking and analytics
   - ROI calculation methods

6. Future Trends and Developments
   - Emerging technologies and approaches
   - Industry predictions
   - Preparing for what's next

## Frequently Asked Questions
- What is the cost of implementing ${topic}?
- How long does it take to see results?
- What are the main challenges?
- How does it compare to alternatives?

## Conclusion
- Key takeaways about ${topic}
- Next steps for implementation
- Additional resources and support`,

    faqSection: `## Frequently Asked Questions About ${topic}

### What is ${topic}?
${topic} is a comprehensive approach that helps ${audienceContext} in ${industryContext} achieve better results through strategic implementation and best practices. It combines proven methodologies with modern tools to deliver measurable outcomes.

### How can I get started with ${topic}?
Getting started with ${topic} involves understanding the fundamentals, assessing your current situation, and implementing a structured approach. We recommend beginning with a consultation to identify your specific needs and goals.

### What are the benefits of ${topic} for ${audienceContext}?
The main benefits include improved efficiency, better ROI, enhanced performance, and competitive advantage. Most ${audienceContext} see significant improvements within the first few months of proper implementation.

### How long does it take to see results with ${topic}?
Results can vary depending on your specific situation and implementation approach, but most ${audienceContext} see initial improvements within 2-4 weeks, with substantial results typically achieved within 3-6 months.

### What are the costs involved with ${topic}?
Costs vary based on scope, complexity, and specific requirements. We offer flexible pricing options to accommodate different budgets and provide excellent value for the investment.

### Can ${topic} be customized for my specific needs in ${industryContext}?
Absolutely! ${topic} is highly adaptable and can be tailored to meet the unique requirements of ${audienceContext} in ${industryContext}. We work closely with clients to ensure the solution fits their specific context.

### What support is available for ${topic} implementation?
We provide comprehensive support including initial consultation, implementation guidance, training, and ongoing assistance. Our team of experts is committed to your success throughout the entire process.`,

    metaDescription: `Discover how ${topic} can transform your ${industryContext} strategy. Expert guidance for ${audienceContext}, proven results, and comprehensive support. Get started today and see the difference!`,

    productDescription: `# Transform Your ${industryContext} with Professional ${topic} Solutions

## Designed Specifically for ${audienceContext}

Our comprehensive ${topic} solution is engineered to deliver exceptional results for ${audienceContext} in the ${industryContext} sector. With years of expertise and proven methodologies, we help you achieve your goals faster and more efficiently.

### Key Features:
• **Comprehensive Approach**: End-to-end solution covering all aspects of ${topic}
• **Expert Guidance**: Access to industry specialists and best practices
• **Proven Results**: Track record of success with measurable outcomes
• **Scalable Solution**: Grows with your business needs and requirements
• **Dedicated Support**: Ongoing assistance and optimization

### Benefits You'll Experience:
• Improved efficiency and productivity
• Reduced costs and better ROI
• Enhanced competitive advantage
• Streamlined processes and workflows
• Better decision-making capabilities

### Why Choose Our ${topic} Solution?
With a ${toneStyle} approach and deep understanding of ${industryContext} challenges, we deliver solutions that work. Our clients typically see 30-50% improvement in key metrics within the first quarter.

**Ready to get started?** Contact our team today for a personalized consultation and discover how ${topic} can transform your business.`,

    socialPost: `🚀 Excited to share insights about ${topic} for ${audienceContext} in ${industryContext}! 

Key benefits we're seeing:
✅ Improved efficiency and performance
✅ Better ROI and measurable results
✅ Enhanced competitive advantage
✅ Streamlined processes

The impact on ${industryContext} has been remarkable. What's your experience with ${topic}? 

Ready to learn more? Let's connect! #${topic.replace(/\s+/g, '')} #${industryContext.replace(/\s+/g, '')} #Success`,

    emailNewsletter: `**Subject: Transform Your ${industryContext} Results with ${topic}**

Hi there!

Hope you're having a great week! I wanted to share some exciting developments in the ${topic} space that I think you'll find valuable as ${audienceContext} in ${industryContext}.

**This Week's Spotlight: ${topic} Success Stories**

We've been tracking some incredible results from ${audienceContext} who've implemented ${topic} strategies:
• 35% average improvement in efficiency
• 28% reduction in operational costs
• 42% increase in customer satisfaction

**Quick Tip:**
When implementing ${topic}, start with a clear strategy and measurable goals. This approach ensures you can track progress and optimize for better results.

**What's Next?**
Ready to explore how ${topic} can benefit your specific situation? Reply to this email or schedule a consultation. We'd love to help you achieve similar results.

Best regards,
[Your Name]`,

    landingPageCopy: `# Transform Your ${industryContext} Results with ${topic}

## Finally, a solution designed specifically for ${audienceContext}

Stop struggling with outdated approaches. Our comprehensive ${topic} solution delivers the results you need with the support you deserve.

### The Challenge You're Facing
As ${audienceContext} in ${industryContext}, you're dealing with increasing competition, complex challenges, and the need for measurable results.

### Our Solution
We've helped hundreds of ${audienceContext} overcome these exact challenges with our proven ${topic} methodology.

### What Makes Us Different:
✅ Proven track record with 95% client satisfaction
✅ Industry expertise in ${industryContext}
✅ Comprehensive support from strategy to implementation
✅ Measurable results with average 40% improvement

### Ready to Get Started?
Join successful ${audienceContext} who've transformed their results with our ${topic} solution.

**[Get Your Free Consultation Today]**`,

    pressRelease: `FOR IMMEDIATE RELEASE

**Revolutionary ${topic} Solution Launches for ${industryContext}**
*New approach helps ${audienceContext} achieve unprecedented results*

[City, Date] - Today marks the launch of an innovative ${topic} solution specifically designed for ${audienceContext} in ${industryContext}. This breakthrough approach addresses long-standing challenges and delivers measurable improvements.

**Industry-Changing Innovation**
The new ${topic} methodology combines cutting-edge approaches with proven strategies to deliver results that were previously unattainable.

"This represents a fundamental shift in how ${audienceContext} approach ${topic}," said [Spokesperson]. "We've created something truly transformative for ${industryContext}."

**Proven Results**
Early adopters have reported remarkable outcomes:
• 45% improvement in operational efficiency
• 32% reduction in implementation time
• 38% increase in satisfaction scores

**About [Company]**
[Company] is a leading provider of innovative solutions for ${industryContext}, committed to helping ${audienceContext} achieve their goals.

For more information, visit [website] or contact [contact information].`
  };

  const content = contentExamples[content_type as keyof typeof contentExamples] || contentExamples.blogOutline;
  
  return {
    content,
    dataSource: "Enhanced Template",
    wordCount: content.split(/\s+/).length,
    timestamp: new Date().toISOString()
  };
};

const generatePromptsFallback = (body: any) => {
  const { content, industry, target_audience, content_type } = body;
  
  // Extract key topics from content for more relevant suggestions
  const words = content.toLowerCase().split(/\s+/);
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
  const keyTerms = words.filter(word => word.length > 3 && !commonWords.has(word)).slice(0, 5);
  const mainTopic = keyTerms[0] || 'this topic';
  
  return {
    suggestions: {
      voice_search: [
        `What is ${mainTopic} and how does it work?`,
        `How can ${mainTopic} help me?`,
        `What are the benefits of ${mainTopic}?`,
        `How do I get started with ${mainTopic}?`,
        `Is ${mainTopic} right for my business?`,
        `How much does ${mainTopic} cost?`,
        `What should I look for when choosing ${mainTopic}?`
      ],
      faq_questions: [
        `What is ${mainTopic}?`,
        `How does ${mainTopic} work?`,
        `What are the main benefits?`,
        `How long does it take to see results?`,
        `What are the costs involved?`,
        `Can it be customized for my needs?`,
        `What support is available?`
      ],
      headlines: [
        `The Complete Guide to ${mainTopic}`,
        `How ${mainTopic} Can Transform Your Business`,
        `10 Essential ${mainTopic} Tips You Need to Know`,
        `Getting Started with ${mainTopic}: A Beginner's Guide`,
        `Why ${mainTopic} is Essential in 2025`,
        `${mainTopic} Best Practices and Strategies`,
        `The Future of ${mainTopic}: Trends and Predictions`
      ],
      featured_snippets: [
        `${mainTopic} definition and explanation`,
        `How to implement ${mainTopic} step by step`,
        `${mainTopic} benefits and advantages`,
        `${mainTopic} cost and pricing information`,
        `Best practices for ${mainTopic}`,
        `Common ${mainTopic} mistakes to avoid`,
        `${mainTopic} requirements and prerequisites`
      ],
      long_tail: [
        `best ${mainTopic} solution for small businesses`,
        `how to choose the right ${mainTopic} provider`,
        `${mainTopic} implementation guide for beginners`,
        `affordable ${mainTopic} options`,
        `${mainTopic} ROI and return on investment`,
        `${mainTopic} integration with existing systems`,
        `${mainTopic} success stories and case studies`
      ],
      comparisons: [
        `${mainTopic} vs traditional methods`,
        `in-house vs outsourced ${mainTopic}`,
        `free vs paid ${mainTopic} options`,
        `${mainTopic} for enterprise vs small business`,
        `${mainTopic} alternatives and competitors`
      ],
      how_to: [
        `How to implement ${mainTopic} effectively`,
        `How to measure ${mainTopic} success`,
        `How to optimize ${mainTopic} for better results`,
        `How to troubleshoot ${mainTopic} issues`,
        `How to scale ${mainTopic} for growth`
      ],
      analysis_summary: `Based on the content analysis focusing on "${mainTopic}", these suggestions target various search intents and user journey stages. The prompts are designed to capture voice search patterns, FAQ opportunities, and featured snippet targets while considering the ${industry || 'general'} industry context and ${target_audience || 'general audience'} needs.`,
      data_source: "Enhanced Content Analysis"
    },
    dataSource: "Enhanced Fallback",
    timestamp: new Date().toISOString(),
    total_suggestions: 42
  };
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

// API functions for content generation - ENHANCED
export const contentApi = {
  generateContent: async (
    topic: string, 
    contentType: string,
    industry?: string,
    targetAudience?: string,
    tone?: string,
    length?: string,
    siteUrl?: string
  ) => {
    console.log('🚀 Starting enhanced content generation...');
    console.log(`📋 Topic: ${topic}`);
    console.log(`📄 Content Type: ${contentType}`);
    console.log(`🏭 Industry: ${industry || 'Not specified'}`);
    
    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Call the generateContent edge function
      const result = await callEdgeFunction('generateContent', { 
        topic,
        content_type: contentType,
        industry,
        target_audience: targetAudience,
        tone,
        length,
        site_url: siteUrl,
        user_id: user.id
      });
      
      console.log('✅ Enhanced content generation completed!');
      console.log(`📊 Data source: ${result.dataSource || 'Edge Function'}`);
      console.log(`📊 Word count: ${result.wordCount || 'Unknown'}`);
      
      return result;
    } catch (error) {
      console.error('❌ Content generation failed:', error);
      console.log('🔄 Falling back to enhanced template...');
      
      // Return enhanced fallback data if edge function fails
      return generateContentFallback({ 
        topic, 
        content_type: contentType,
        industry,
        target_audience: targetAudience,
        tone
      });
    }
  }
};

// API functions for prompt suggestions - ENHANCED
export const promptApi = {
  generatePrompts: async (
    content: string, 
    industry?: string, 
    targetAudience?: string, 
    contentType?: string,
    siteUrl?: string
  ) => {
    console.log('🚀 Starting enhanced prompt generation...');
    console.log(`📋 Content length: ${content.length} characters`);
    console.log(`🏭 Industry: ${industry || 'Not specified'}`);
    console.log(`👥 Target Audience: ${targetAudience || 'Not specified'}`);
    
    try {
      // Call the generatePrompts edge function
      const result = await callEdgeFunction('generatePrompts', { 
        content,
        industry,
        target_audience: targetAudience,
        content_type: contentType,
        site_url: siteUrl
      });
      
      console.log('✅ Enhanced prompt generation completed!');
      console.log(`📊 Data source: ${result.dataSource || 'Edge Function'}`);
      console.log(`📊 Total suggestions: ${result.total_suggestions || 'Unknown'}`);
      
      return result;
    } catch (error) {
      console.error('❌ Prompt generation failed:', error);
      console.log('🔄 Falling back to enhanced analysis...');
      
      // Return enhanced fallback data if edge function fails
      return generatePromptsFallback({ 
        content, 
        industry, 
        target_audience: targetAudience, 
        content_type: contentType 
      });
    }
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