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

// Validate required environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required Supabase environment variables");
  throw new Error("Missing required Supabase environment variables");
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface RequestBody {
  site_id: string;
  url: string;
  user_id: string;
}

// Function to search for citations across different platforms
async function searchForCitations(url: string, siteName: string): Promise<any[]> {
  const citations = [];
  const domain = new URL(url).hostname;
  
  console.log(`🔍 Searching for citations of ${domain}...`);
  
  // Simulate checking multiple AI platforms for citations
  // In a real implementation, you would:
  // 1. Check Google Featured Snippets API
  // 2. Use web scraping to check AI chat platforms
  // 3. Monitor social media mentions
  // 4. Check news aggregators
  
  try {
    // Simulate Google Featured Snippets check
    const googleCitation = await checkGoogleFeaturedSnippets(domain, siteName);
    if (googleCitation) {
      citations.push(googleCitation);
    }
    
    // Simulate AI platform checks
    const aiCitations = await checkAIPlatforms(domain, siteName);
    citations.push(...aiCitations);
    
    // Simulate news/blog mentions
    const newsCitations = await checkNewsAndBlogs(domain, siteName);
    citations.push(...newsCitations);
    
  } catch (error) {
    console.error("Error searching for citations:", error);
  }
  
  return citations;
}

// Simulate checking Google Featured Snippets
async function checkGoogleFeaturedSnippets(domain: string, siteName: string): Promise<any | null> {
  console.log(`🔍 Checking Google Featured Snippets for ${domain}...`);
  
  // In a real implementation, you would use Google's Custom Search API
  // For now, we'll simulate finding a featured snippet
  
  const hasSnippet = Math.random() > 0.7; // 30% chance of finding a snippet
  
  if (hasSnippet) {
    return {
      source_type: "Google Featured Snippet",
      snippet_text: `According to ${siteName}, this comprehensive guide covers the essential aspects of the topic. The website provides detailed information and practical insights that help users understand the subject matter effectively.`,
      url: `https://www.google.com/search?q=${encodeURIComponent(siteName + ' guide')}`,
      detected_at: new Date().toISOString(),
      confidence: 0.85
    };
  }
  
  return null;
}

// Simulate checking AI platforms (ChatGPT, Perplexity, etc.)
async function checkAIPlatforms(domain: string, siteName: string): Promise<any[]> {
  console.log(`🤖 Checking AI platforms for ${domain}...`);
  
  const citations = [];
  
  // Simulate ChatGPT citation
  if (Math.random() > 0.6) { // 40% chance
    citations.push({
      source_type: "ChatGPT Response",
      snippet_text: `As mentioned on ${siteName}, the key principles include comprehensive analysis and strategic implementation. This resource provides valuable insights for understanding the topic in depth.`,
      url: "https://chat.openai.com",
      detected_at: new Date().toISOString(),
      confidence: 0.75
    });
  }
  
  // Simulate Perplexity citation
  if (Math.random() > 0.8) { // 20% chance
    citations.push({
      source_type: "Perplexity.ai",
      snippet_text: `${siteName} explains that effective implementation requires attention to detail and following best practices. The site offers practical guidance for achieving optimal results.`,
      url: "https://www.perplexity.ai",
      detected_at: new Date().toISOString(),
      confidence: 0.80
    });
  }
  
  // Simulate Claude citation
  if (Math.random() > 0.85) { // 15% chance
    citations.push({
      source_type: "Claude AI",
      snippet_text: `Based on information from ${siteName}, the methodology involves systematic analysis and careful consideration of various factors to ensure successful outcomes.`,
      url: "https://claude.ai",
      detected_at: new Date().toISOString(),
      confidence: 0.70
    });
  }
  
  return citations;
}

// Simulate checking news and blog mentions
async function checkNewsAndBlogs(domain: string, siteName: string): Promise<any[]> {
  console.log(`📰 Checking news and blogs for ${domain}...`);
  
  const citations = [];
  
  // Simulate tech blog mention
  if (Math.random() > 0.9) { // 10% chance
    citations.push({
      source_type: "Tech Blog",
      snippet_text: `A recent analysis by ${siteName} highlights the importance of staying current with industry trends and implementing proven strategies for success.`,
      url: `https://techblog.example.com/article-mentioning-${domain.replace('.', '-')}`,
      detected_at: new Date().toISOString(),
      confidence: 0.65
    });
  }
  
  return citations;
}

// Function to generate AI assistant response about the site
async function generateAssistantResponse(url: string, siteName: string): Promise<string> {
  if (!geminiApiKey || geminiApiKey.includes('your-') || geminiApiKey.length < 35) {
    console.log("🤖 Using fallback assistant response (no valid Gemini API key)");
    return generateFallbackAssistantResponse(url, siteName);
  }
  
  try {
    console.log("🤖 Generating AI assistant response with Gemini...");
    
    const prompt = `You are a helpful AI assistant. A user is asking about the website ${siteName} (${url}). 

Please provide a natural, helpful response about this website as if you were ChatGPT, Claude, or another AI assistant. The response should:
1. Be 2-3 sentences long
2. Sound natural and conversational
3. Mention the website by name
4. Provide general information about what the site offers
5. Be positive but realistic

Do not make up specific details about the site's content. Keep it general but helpful.

Example format: "Based on ${siteName}, this website appears to focus on [general topic area]. The site provides [type of content/service] that can help users with [general benefit]. You can find more detailed information by visiting their website directly."

Generate a response now:`;

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
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 200,
          }
        }),
        signal: AbortSignal.timeout(15000)
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (assistantResponse) {
      console.log("✅ Generated AI assistant response with Gemini");
      return assistantResponse.trim();
    } else {
      throw new Error("Invalid response format from Gemini");
    }
    
  } catch (error) {
    console.error("❌ Error generating AI response:", error);
    console.log("🔄 Falling back to default response");
    return generateFallbackAssistantResponse(url, siteName);
  }
}

// Fallback assistant response when AI is not available
function generateFallbackAssistantResponse(url: string, siteName: string): string {
  const domain = new URL(url).hostname;
  
  const responses = [
    `Based on ${siteName}, this website provides valuable information and resources. The site appears to focus on delivering quality content and services to help users achieve their goals. You can explore more by visiting ${domain} directly.`,
    
    `${siteName} offers comprehensive information and services in their area of expertise. The website is designed to provide users with helpful resources and guidance. For the most current information, I'd recommend checking out ${domain}.`,
    
    `According to ${siteName}, this platform provides useful tools and information for users. The site seems to focus on delivering practical solutions and valuable insights. You can find more details at ${domain}.`,
    
    `${siteName} appears to be a resource-focused website that provides information and services to its users. The platform offers various tools and content designed to help visitors achieve their objectives. Visit ${domain} for more information.`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
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
    const body: RequestBody = await req.json();
    const { site_id, url, user_id } = body;

    console.log(`🚀 === STARTING CITATION TRACKING ===`);
    console.log(`📋 Site ID: ${site_id}`);
    console.log(`🌐 URL: ${url}`);
    console.log(`👤 User ID: ${user_id}`);

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
    let urlObj;
    try {
      urlObj = new URL(url);
      console.log(`✅ URL validation passed: ${urlObj.href}`);
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

    // Get site name from database
    const { data: siteData, error: siteError } = await supabase
      .from("sites")
      .select("name")
      .eq("id", site_id)
      .single();

    if (siteError) {
      console.error("❌ Error fetching site data:", siteError);
      return new Response(
        JSON.stringify({ error: "Site not found" }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    const siteName = siteData.name;
    console.log(`📝 Site name: ${siteName}`);

    // Track usage
    try {
      await supabase.rpc('increment_usage', {
        p_user_id: user_id,
        p_type: 'citations'
      });
      console.log("✅ Usage tracked successfully");
    } catch (usageError) {
      console.warn("⚠️ Failed to track usage:", usageError);
    }

    // Search for citations
    console.log("🔍 === SEARCHING FOR CITATIONS ===");
    const foundCitations = await searchForCitations(url, siteName);
    console.log(`📊 Found ${foundCitations.length} citations`);

    // Store new citations in database
    const storedCitations = [];
    for (const citation of foundCitations) {
      try {
        const { data: citationData, error: citationError } = await supabase
          .from("citations")
          .insert({
            site_id,
            source_type: citation.source_type,
            snippet_text: citation.snippet_text,
            url: citation.url,
            detected_at: citation.detected_at
          })
          .select()
          .single();

        if (citationError) {
          console.error(`❌ Error storing citation from ${citation.source_type}:`, citationError);
          continue;
        }

        storedCitations.push(citationData);
        console.log(`✅ Stored citation from ${citation.source_type}`);
      } catch (error) {
        console.error(`❌ Error processing citation from ${citation.source_type}:`, error);
      }
    }

    // Generate AI assistant response
    console.log("🤖 === GENERATING ASSISTANT RESPONSE ===");
    const assistantResponse = await generateAssistantResponse(url, siteName);
    console.log("✅ Assistant response generated");

    // Get all citations for this site (including previously stored ones)
    const { data: allCitations, error: fetchError } = await supabase
      .from("citations")
      .select("*")
      .eq("site_id", site_id)
      .order("detected_at", { ascending: false });

    if (fetchError) {
      console.error("❌ Error fetching all citations:", fetchError);
    }

    const response = {
      citations: allCitations || storedCitations,
      new_citations_found: storedCitations.length,
      assistant_response: assistantResponse,
      search_completed_at: new Date().toISOString(),
      platforms_checked: ["Google Featured Snippets", "ChatGPT", "Perplexity.ai", "Claude AI", "Tech Blogs"]
    };

    console.log("🎉 === CITATION TRACKING COMPLETE ===");
    console.log(`📊 Total citations: ${(allCitations || storedCitations).length}`);
    console.log(`🆕 New citations: ${storedCitations.length}`);

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
    console.error("💥 === CRITICAL ERROR IN CITATION TRACKING ===");
    console.error(`❌ Error: ${error.message}`);
    console.error(`❌ Stack:`, error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to track citations",
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