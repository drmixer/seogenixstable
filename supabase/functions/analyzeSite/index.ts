import { createClient } from "npm:@supabase/supabase-js@2.39.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Get environment variables with fallbacks for development
const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("VITE_SUPABASE_ANON_KEY");
const deepseekApiKey = Deno.env.get("DEEPSEEK_API_KEY");

console.log("Environment check:", {
  supabaseUrl: !!supabaseUrl,
  supabaseServiceKey: !!supabaseServiceKey,
  deepseekApiKey: !!deepseekApiKey,
  deepseekKeyLength: deepseekApiKey?.length || 0,
  deepseekKeyPrefix: deepseekApiKey?.substring(0, 10) + "..." || "none"
});

// Validate required environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables:", {
    supabaseUrl: !!supabaseUrl,
    supabaseServiceKey: !!supabaseServiceKey,
    deepseekApiKey: !!deepseekApiKey
  });
  throw new Error("Missing required Supabase environment variables");
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface RequestBody {
  site_id: string;
  url: string;
  user_id: string;
}

// Function to fetch and analyze website content
async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    console.log(`Fetching content from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEOgenix-Bot/1.0; +https://seogemix.com/bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`Fetched ${html.length} characters of HTML content`);
    
    // Extract text content and basic structure info
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'No title found';
    
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : 'No meta description found';
    
    // Check for schema markup
    const hasJsonLd = html.includes('application/ld+json');
    const jsonLdCount = (html.match(/application\/ld\+json/g) || []).length;
    const hasMicrodata = html.includes('itemscope') || html.includes('itemtype');
    const hasOpenGraph = html.includes('og:');
    const hasTwitterCard = html.includes('twitter:');
    
    // Extract headings
    const headings = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi) || [];
    const headingStructure = headings.slice(0, 10).map(h => h.replace(/<[^>]*>/g, '').trim()).filter(h => h.length > 0);
    
    // Basic content analysis
    const textContent = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                           .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                           .replace(/<[^>]*>/g, ' ')
                           .replace(/\s+/g, ' ')
                           .trim();
    
    const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
    
    // Check for common AI-friendly elements
    const hasFAQ = html.toLowerCase().includes('faq') || html.toLowerCase().includes('frequently asked');
    const hasStructuredContent = headings.length > 3;
    const hasGoodLength = wordCount > 300;
    
    return `
Website Analysis for: ${url}
Title: ${title}
Meta Description: ${metaDescription}
Word Count: ${wordCount}
Content Quality: ${hasGoodLength ? 'Good length' : 'Short content'}

Schema & Structured Data:
- JSON-LD Scripts: ${jsonLdCount}
- Has Microdata: ${hasMicrodata}
- Has Open Graph: ${hasOpenGraph}
- Has Twitter Cards: ${hasTwitterCard}

Content Structure:
- Number of Headings: ${headings.length}
- Has FAQ Section: ${hasFAQ}
- Well Structured: ${hasStructuredContent}
- Heading Examples: ${headingStructure.slice(0, 5).join(' | ')}

AI Readiness Indicators:
- Structured Data Present: ${hasJsonLd || hasMicrodata}
- Clear Content Hierarchy: ${hasStructuredContent}
- Sufficient Content Length: ${hasGoodLength}
- FAQ or Q&A Content: ${hasFAQ}
    `.trim();
  } catch (error) {
    console.error("Error fetching website:", error);
    return `Unable to fetch content from ${url}. Error: ${error.message}. This may affect the accuracy of the analysis.`;
  }
}

// Function to call DeepSeek API
async function analyzeWithDeepSeek(url: string, websiteContent: string): Promise<any> {
  if (!deepseekApiKey) {
    throw new Error("DeepSeek API key not configured");
  }

  console.log("Calling DeepSeek API for analysis...");
  
  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${deepseekApiKey}`,
        "User-Agent": "SEOgenix/1.0"
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an expert AI visibility consultant who analyzes websites for their compatibility with AI systems like ChatGPT, Claude, Perplexity, voice assistants, and other AI tools. You provide detailed, actionable analysis with specific scores and recommendations."
          },
          {
            role: "user",
            content: `Analyze this website for AI visibility optimization:

${websiteContent}

Based on the actual content and structure provided, give me precise scores (0-100) for these 5 categories:

1. AI Visibility Score: Overall readiness for AI systems to understand and cite this content
2. Schema Score: Quality and coverage of structured data markup (JSON-LD, microdata, etc.)
3. Semantic Score: Content organization, heading structure, and semantic clarity
4. Citation Score: Likelihood of being cited by AI systems based on content quality and authority signals
5. Technical SEO Score: Basic technical factors that affect AI crawling and understanding

Be specific about what you observed in the content. If schema markup is missing, score it low. If content is well-structured with clear headings, score semantic high.

Return ONLY a valid JSON response in this exact format:
{
  "ai_visibility_score": 75,
  "schema_score": 60,
  "semantic_score": 80,
  "citation_score": 65,
  "technical_seo_score": 70,
  "analysis": "Detailed analysis explaining each score based on what was actually found in the content",
  "recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2", 
    "Specific actionable recommendation 3"
  ]
}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.1,
        top_p: 0.9
      }),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    console.log(`DeepSeek API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API error response:", errorText);
      throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log("DeepSeek API response received successfully");
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response structure from DeepSeek API");
    }
    
    const content = data.choices[0].message.content;
    console.log("DeepSeek response content length:", content.length);
    
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response:", content);
      throw new Error("No valid JSON found in DeepSeek response");
    }
    
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate the parsed response has required fields
      const requiredFields = ['ai_visibility_score', 'schema_score', 'semantic_score', 'citation_score', 'technical_seo_score'];
      for (const field of requiredFields) {
        if (typeof parsed[field] !== 'number') {
          throw new Error(`Missing or invalid ${field} in response`);
        }
      }
      
      console.log("✅ Successfully parsed and validated DeepSeek analysis");
      console.log("Scores:", {
        ai_visibility: parsed.ai_visibility_score,
        schema: parsed.schema_score,
        semantic: parsed.semantic_score,
        citation: parsed.citation_score,
        technical: parsed.technical_seo_score
      });
      
      return parsed;
    } catch (parseError) {
      console.error("Failed to parse DeepSeek JSON:", parseError);
      console.error("Raw content:", content);
      throw new Error(`Invalid JSON format in DeepSeek response: ${parseError.message}`);
    }
  } catch (error) {
    console.error("DeepSeek API call failed:", error);
    throw error;
  }
}

// Mock data fallback (only used when DeepSeek fails)
const getMockAnalysis = (url: string) => {
  const baseScore = Math.floor(Math.random() * 20) + 60; // 60-80 base
  return {
    ai_visibility_score: Math.min(100, baseScore + Math.floor(Math.random() * 15)),
    schema_score: Math.min(100, baseScore - 10 + Math.floor(Math.random() * 20)),
    semantic_score: Math.min(100, baseScore + 5 + Math.floor(Math.random() * 15)),
    citation_score: Math.min(100, baseScore - 5 + Math.floor(Math.random() * 20)),
    technical_seo_score: Math.min(100, baseScore + Math.floor(Math.random() * 15)),
    analysis: `Mock analysis for ${url}: This website shows potential for AI visibility optimization. The analysis indicates areas for improvement in schema markup implementation and content structure optimization. Note: This is fallback data because the DeepSeek API was not available or failed to respond.`,
    recommendations: [
      "Implement comprehensive schema.org structured data markup",
      "Improve content organization with clear semantic headings (H1, H2, H3)",
      "Add FAQ sections to address common user questions",
      "Optimize content for voice search and natural language queries",
      "Ensure fast loading times and mobile responsiveness"
    ]
  };
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Parse the request body
    const body: RequestBody = await req.json();
    const { site_id, url, user_id } = body;

    console.log(`🚀 Starting analysis for site ${site_id}, URL: ${url}, User: ${user_id}`);

    if (!site_id || !url || !user_id) {
      return new Response(
        JSON.stringify({ error: "Site ID, URL, and User ID are required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Validate URL
    try {
      const urlObj = new URL(url);
      console.log(`Analyzing URL: ${urlObj.href}`);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL format" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    let scores;
    let analysisText = "";
    let usingRealData = false;
    let dataSource = "Mock Data";

    // Try to get real analysis from DeepSeek
    if (deepseekApiKey && deepseekApiKey.length > 10) {
      try {
        console.log("🌐 Fetching website content...");
        const websiteContent = await fetchWebsiteContent(url);
        
        console.log("🤖 Analyzing with DeepSeek API...");
        scores = await analyzeWithDeepSeek(url, websiteContent);
        analysisText = scores.analysis;
        usingRealData = true;
        dataSource = "DeepSeek API";
        
        console.log("✅ Successfully got real analysis from DeepSeek API");
      } catch (apiError) {
        console.error("❌ DeepSeek API failed:", apiError.message);
        scores = getMockAnalysis(url);
        analysisText = scores.analysis + ` (DeepSeek API Error: ${apiError.message})`;
        usingRealData = false;
        dataSource = "Mock Data (API Failed)";
      }
    } else {
      console.log("❌ No valid DeepSeek API key configured, using mock data");
      scores = getMockAnalysis(url);
      analysisText = scores.analysis;
      usingRealData = false;
      dataSource = "Mock Data (No API Key)";
    }

    console.log(`📊 Analysis complete. Using: ${dataSource}`);

    // Create audit with service role client
    const { data: auditData, error: auditError } = await supabase
      .from("audits")
      .insert({
        site_id,
        ai_visibility_score: scores.ai_visibility_score,
        schema_score: scores.schema_score,
        semantic_score: scores.semantic_score,
        citation_score: scores.citation_score,
        technical_seo_score: scores.technical_seo_score,
      })
      .select()
      .single();

    if (auditError) {
      console.error("Database error creating audit:", auditError);
      throw new Error(`Failed to create audit: ${auditError.message}`);
    }

    console.log(`💾 Audit saved with ID: ${auditData.id}`);

    // Generate schemas with service role client
    const schemaTypes = ["FAQ", "HowTo", "Product"];
    const schemas = [];

    for (const schemaType of schemaTypes) {
      const { data: schemaData, error: schemaError } = await supabase
        .from("schemas")
        .insert({
          audit_id: auditData.id,
          schema_type: schemaType,
          markup: generateDummySchema(schemaType, url),
        })
        .select()
        .single();

      if (schemaError) {
        console.error(`Failed to create ${schemaType} schema:`, schemaError.message);
        continue;
      }

      schemas.push(schemaData);
    }

    console.log(`📋 Generated ${schemas.length} schema examples`);

    const response = {
      audit: auditData,
      schemas,
      analysis: analysisText,
      recommendations: scores.recommendations || [],
      usingRealData,
      dataSource,
      timestamp: new Date().toISOString()
    };

    console.log("🎉 Analysis complete and successful");

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("💥 Error in analyzeSite function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to analyze site",
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});

// Helper function to generate dummy schema markup
function generateDummySchema(schemaType: string, url: string): string {
  const domain = new URL(url).hostname;
  
  switch (schemaType) {
    case "FAQ":
      return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is AI visibility optimization?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "AI visibility optimization is the process of making your content more discoverable and understandable to AI systems like ChatGPT, voice assistants, and search engines."
            }
          },
          {
            "@type": "Question",
            "name": "How can I improve my website's AI visibility?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "You can improve AI visibility by implementing schema markup, creating clear content structure, optimizing for voice search, and ensuring your content directly answers common questions."
            }
          },
          {
            "@type": "Question",
            "name": "Why is structured data important for AI systems?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Structured data helps AI systems understand the context, relationships, and meaning of your content, making it more likely to be cited and referenced accurately."
            }
          }
        ]
      }, null, 2);
      
    case "HowTo":
      return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Optimize Your Website for AI Visibility",
        "description": "A comprehensive guide to improving your content's visibility and understanding by AI systems.",
        "image": `${url}/ai-optimization-guide.jpg`,
        "totalTime": "PT30M",
        "estimatedCost": {
          "@type": "MonetaryAmount",
          "currency": "USD",
          "value": "0"
        },
        "step": [
          {
            "@type": "HowToStep",
            "name": "Implement Schema Markup",
            "text": "Add structured data using schema.org vocabulary to help AI systems understand your content structure and meaning.",
            "image": `${url}/schema-markup.jpg`
          },
          {
            "@type": "HowToStep",
            "name": "Optimize Content Structure",
            "text": "Use clear headings (H1, H2, H3) and organize content logically to improve semantic understanding.",
            "image": `${url}/content-structure.jpg`
          },
          {
            "@type": "HowToStep",
            "name": "Create FAQ Sections",
            "text": "Add frequently asked questions that directly answer common queries in your industry or niche.",
            "image": `${url}/faq-section.jpg`
          },
          {
            "@type": "HowToStep",
            "name": "Optimize for Voice Search",
            "text": "Include natural language patterns and conversational keywords that match how people speak to AI assistants.",
            "image": `${url}/voice-search.jpg`
          }
        ]
      }, null, 2);
      
    case "Product":
      return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "AI Visibility Optimization Service",
        "description": "Professional service to enhance your website's visibility and understanding by AI systems including ChatGPT, voice assistants, and search engines.",
        "brand": {
          "@type": "Brand",
          "name": domain
        },
        "category": "SEO Services",
        "offers": {
          "@type": "Offer",
          "price": "299.00",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "priceValidUntil": "2025-12-31",
          "seller": {
            "@type": "Organization",
            "name": domain
          }
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "reviewCount": "127",
          "bestRating": "5",
          "worstRating": "1"
        },
        "review": [
          {
            "@type": "Review",
            "reviewRating": {
              "@type": "Rating",
              "ratingValue": "5"
            },
            "author": {
              "@type": "Person",
              "name": "Sarah Johnson"
            },
            "reviewBody": "Excellent service that significantly improved our content's AI visibility. Highly recommended!"
          }
        ]
      }, null, 2);
      
    default:
      return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "url": url,
        "name": "AI Visibility Optimized Page",
        "description": "A webpage optimized for AI system understanding and visibility."
      }, null, 2);
  }
}