import { createClient } from "npm:@supabase/supabase-js@2.39.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Get environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

// Debug environment variables
console.log("🔧 Environment check:", {
  supabaseUrl: !!supabaseUrl,
  supabaseServiceKey: !!supabaseServiceKey,
  geminiApiKey: !!geminiApiKey
});

// Validate required environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required Supabase environment variables");
  throw new Error("Missing required Supabase environment variables");
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface RequestBody {
  url: string;
  schema_type: string;
}

// Function to fetch and analyze website content
async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    console.log(`🌐 Fetching content from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEOgenix-Bot/1.0; +https://seogemix.com/bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`📄 Fetched ${html.length} characters of HTML content`);
    
    // Extract basic info for schema generation
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Professional Services';
    
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : 'Quality services and solutions';
    
    return `Title: ${title}\nDescription: ${metaDescription}`;
  } catch (error) {
    console.error("❌ Error fetching website:", error);
    return `Unable to fetch content from ${url}`;
  }
}

// Function to call Gemini API for enhanced schema generation
async function generateSchemaWithGemini(url: string, schemaType: string, websiteContent: string): Promise<any> {
  if (!geminiApiKey || geminiApiKey.includes('your-') || geminiApiKey.length < 35) {
    console.log("⚠️ Gemini API key not configured, using enhanced fallback");
    return null;
  }

  try {
    console.log("🤖 Generating schema with Gemini AI...");
    
    const prompt = `You are an expert in schema.org structured data. Generate a comprehensive ${schemaType} schema for this website:

URL: ${url}
Website Content: ${websiteContent}

Requirements:
1. Generate valid schema.org JSON-LD markup for type: ${schemaType}
2. Use real information from the website content when available
3. Make the schema comprehensive and detailed
4. Include all relevant properties for the schema type
5. Use the actual domain name and extracted content

Return ONLY valid JSON that can be parsed directly. Do not include any explanatory text.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        }),
        signal: AbortSignal.timeout(30000)
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (content) {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log("✅ Generated schema with Gemini AI");
        return parsed;
      }
    }
    
    throw new Error("Invalid response format from Gemini");
  } catch (error) {
    console.error("❌ Error generating schema with Gemini:", error);
    return null;
  }
}

// Enhanced fallback schema generation
function generateEnhancedSchema(url: string, schemaType: string, websiteContent: string): any {
  console.log(`🎭 Generating enhanced ${schemaType} schema for ${url}`);
  
  const urlObj = new URL(url);
  const domain = urlObj.hostname;
  const siteName = domain.replace('www.', '').split('.')[0];
  const capitalizedSiteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
  
  // Extract title from website content if available
  const titleMatch = websiteContent.match(/Title: ([^\n]+)/);
  const siteTitle = titleMatch ? titleMatch[1] : `${capitalizedSiteName} Professional Services`;
  
  const descMatch = websiteContent.match(/Description: ([^\n]+)/);
  const siteDescription = descMatch ? descMatch[1] : "Quality professional services tailored to your needs";
  
  const schemas = {
    FAQ: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": `What services does ${capitalizedSiteName} offer?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `${capitalizedSiteName} offers ${siteDescription.toLowerCase()}. Visit ${url} to learn more about our comprehensive offerings.`
          }
        },
        {
          "@type": "Question",
          "name": "How can I get started?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Getting started is easy! Contact us through our website or call us to discuss your specific needs and requirements."
          }
        },
        {
          "@type": "Question",
          "name": "What makes your services unique?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Our services are tailored to each client's specific needs, ensuring personalized solutions that deliver real results."
          }
        }
      ]
    },
    HowTo: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": `How to Get Started with ${capitalizedSiteName}`,
      "description": `A comprehensive guide to getting started with ${capitalizedSiteName} services.`,
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
          "name": "Initial Contact",
          "text": "Reach out to our team through our website contact form or phone.",
          "image": `${url}/images/step1.jpg`
        },
        {
          "@type": "HowToStep",
          "name": "Consultation",
          "text": "Schedule a consultation to discuss your specific requirements and goals.",
          "image": `${url}/images/step2.jpg`
        },
        {
          "@type": "HowToStep",
          "name": "Implementation",
          "text": "Begin working with our team to implement tailored solutions.",
          "image": `${url}/images/step3.jpg`
        }
      ]
    },
    Product: {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": siteTitle,
      "description": siteDescription,
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
        "reviewCount": "127",
        "bestRating": "5",
        "worstRating": "1"
      }
    },
    LocalBusiness: {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": capitalizedSiteName,
      "url": url,
      "description": siteDescription,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "123 Business Street",
        "addressLocality": "Business City",
        "addressRegion": "State",
        "postalCode": "12345",
        "addressCountry": "US"
      },
      "telephone": "+1-555-123-4567",
      "openingHours": ["Mo-Fr 09:00-17:00"],
      "priceRange": "$$"
    },
    Article: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": siteTitle,
      "description": siteDescription,
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
      "description": siteDescription,
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

  return schemas[schemaType as keyof typeof schemas] || schemas.FAQ;
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    console.log("🚀 === STARTING SCHEMA GENERATION ===");
    
    const body: RequestBody = await req.json();
    const { url, schema_type } = body;

    console.log(`📋 URL: ${url}`);
    console.log(`📋 Schema Type: ${schema_type}`);

    if (!url || !schema_type) {
      return new Response(
        JSON.stringify({ error: "URL and schema_type are required" }),
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
      new URL(url);
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

    // Fetch website content for better schema generation
    let websiteContent = "";
    try {
      websiteContent = await fetchWebsiteContent(url);
    } catch (error) {
      console.warn("⚠️ Could not fetch website content:", error);
      websiteContent = `Basic analysis for ${url}`;
    }

    let schema;
    let dataSource = "Enhanced Fallback";

    // Try to generate schema with Gemini AI first
    const geminiSchema = await generateSchemaWithGemini(url, schema_type, websiteContent);
    if (geminiSchema) {
      schema = geminiSchema;
      dataSource = "Gemini AI";
    } else {
      // Use enhanced fallback
      schema = generateEnhancedSchema(url, schema_type, websiteContent);
      dataSource = "Enhanced Fallback";
    }

    console.log(`✅ Schema generated using: ${dataSource}`);

    const response = {
      schema: JSON.stringify(schema, null, 2),
      dataSource,
      timestamp: new Date().toISOString()
    };

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
    console.error("💥 === CRITICAL ERROR IN SCHEMA GENERATION ===");
    console.error(`❌ Error: ${error.message}`);
    console.error(`❌ Stack:`, error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate schema",
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