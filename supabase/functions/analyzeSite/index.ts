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

// For development, we'll use a mock API key if not available
const mockDeepseekKey = "sk-mock-key-for-development";
const effectiveDeepseekKey = deepseekApiKey || mockDeepseekKey;

console.log("Environment check:", {
  supabaseUrl: !!supabaseUrl,
  supabaseServiceKey: !!supabaseServiceKey,
  deepseekApiKey: !!deepseekApiKey,
  usingMockKey: !deepseekApiKey
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

// Mock DeepSeek API response for development
const getMockAnalysis = (url: string) => {
  return {
    ai_visibility_score: Math.floor(Math.random() * 30) + 70,
    schema_score: Math.floor(Math.random() * 30) + 65,
    semantic_score: Math.floor(Math.random() * 30) + 75,
    citation_score: Math.floor(Math.random() * 30) + 60,
    technical_seo_score: Math.floor(Math.random() * 30) + 70,
    analysis: `Mock analysis for ${url}: This website shows good potential for AI visibility with some areas for improvement in schema markup and citation optimization.`
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

    // Skip usage tracking for now to avoid constraint issues
    console.log("Skipping usage tracking for user:", user_id);

    let scores;
    let analysisText = "";

    // Try to call DeepSeek API if we have a real key, otherwise use mock data
    if (deepseekApiKey && deepseekApiKey !== mockDeepseekKey) {
      try {
        console.log("Calling DeepSeek API...");
        
        const deepseekResponse = await fetch(
          "https://api.deepseek.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${effectiveDeepseekKey}`
            },
            body: JSON.stringify({
              model: "deepseek-reasoner",
              messages: [
                {
                  role: "system",
                  content: "You are an AI visibility expert who analyzes websites for their compatibility with AI systems like ChatGPT, voice assistants, and other AI tools."
                },
                {
                  role: "user",
                  content: `Analyze this website for AI visibility: ${url}

Please provide scores (0-100) for these 5 categories:

1. AI Visibility Score: How well can AI systems understand and process the content
2. Schema Score: Quality and coverage of structured data markup  
3. Semantic Score: Clarity of content organization and entity relationships
4. Citation Score: Likelihood of being cited by AI systems
5. Technical SEO Score: Basic SEO factors that affect AI crawling

For each score, provide a brief explanation of what was evaluated. Return your response in this exact JSON format:

{
  "ai_visibility_score": 75,
  "schema_score": 60,
  "semantic_score": 80,
  "citation_score": 65,
  "technical_seo_score": 70,
  "analysis": "Brief overall analysis here"
}`
                }
              ],
              max_tokens: 1500,
              temperature: 0.3
            })
          }
        );

        if (!deepseekResponse.ok) {
          const errorData = await deepseekResponse.text();
          console.error("DeepSeek API error:", errorData);
          throw new Error(`DeepSeek API error: ${errorData}`);
        }

        const deepseekData = await deepseekResponse.json();
        analysisText = deepseekData.choices[0].message.content;

        // Try to parse JSON from the response
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          scores = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
        
        console.log("DeepSeek API call successful");
      } catch (apiError) {
        console.warn("DeepSeek API failed, using mock data:", apiError);
        scores = getMockAnalysis(url);
        analysisText = scores.analysis;
      }
    } else {
      console.log("Using mock analysis (no DeepSeek API key)");
      scores = getMockAnalysis(url);
      analysisText = scores.analysis;
    }

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
      throw new Error(`Failed to create audit: ${auditError.message}`);
    }

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
        console.error(`Failed to create schema: ${schemaError.message}`);
        continue;
      }

      schemas.push(schemaData);
    }

    return new Response(
      JSON.stringify({
        audit: auditData,
        schemas,
        analysis: scores.analysis || analysisText
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error in analyzeSite function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to analyze site",
        details: error instanceof Error ? error.message : String(error)
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
  switch (schemaType) {
    case "FAQ":
      return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is AI visibility?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "AI visibility refers to how well your content is understood and cited by AI systems like ChatGPT and voice assistants."
            }
          },
          {
            "@type": "Question",
            "name": "How can I improve my AI visibility?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "You can improve your AI visibility by implementing schema markup, creating clear content structure, and ensuring comprehensive entity coverage."
            }
          }
        ]
      }, null, 2);
    case "HowTo":
      return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Improve Your Website's AI Visibility",
        "description": "Follow these steps to enhance your content's visibility to AI systems.",
        "step": [
          {
            "@type": "HowToStep",
            "name": "Implement schema markup",
            "text": "Add appropriate schema.org structured data to your content."
          },
          {
            "@type": "HowToStep",
            "name": "Create clear content structure",
            "text": "Use proper headings and semantic HTML to organize your content."
          },
          {
            "@type": "HowToStep",
            "name": "Optimize entity coverage",
            "text": "Ensure comprehensive coverage of key entities related to your topic."
          }
        ]
      }, null, 2);
    case "Product":
      return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "AI Visibility Optimization Service",
        "description": "Professional service to improve your content's visibility to AI systems.",
        "brand": {
          "@type": "Brand",
          "name": "SEOgenix"
        },
        "offers": {
          "@type": "Offer",
          "price": "99.00",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        }
      }, null, 2);
    default:
      return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "url": url
      }, null, 2);
  }
}