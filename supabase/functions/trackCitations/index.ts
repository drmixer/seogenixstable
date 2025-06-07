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

// Citation tracking API keys
const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
const googleSearchEngineId = Deno.env.get("GOOGLE_SEARCH_ENGINE_ID");
const newsApiKey = Deno.env.get("NEWSAPI_KEY");
const redditClientId = Deno.env.get("REDDIT_CLIENT_ID");
const redditClientSecret = Deno.env.get("REDDIT_CLIENT_SECRET");

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

interface Citation {
  source_type: string;
  snippet_text: string;
  url: string;
  detected_at: string;
  confidence: number;
  authority_score?: number;
}

// Function to validate Gemini API key
function validateGeminiApiKey(): boolean {
  console.log("🔑 === GEMINI API KEY VALIDATION ===");
  console.log(`📋 Key Present: ${!!geminiApiKey}`);
  
  if (geminiApiKey) {
    console.log(`📏 Key Length: ${geminiApiKey.length} characters`);
    console.log(`🔤 Key First 20 chars: "${geminiApiKey.substring(0, 20)}"`);
    console.log(`🔤 Key Last 10 chars: "...${geminiApiKey.substring(geminiApiKey.length - 10)}"`);
    console.log(`🔍 Key contains spaces: ${geminiApiKey.includes(' ')}`);
    console.log(`🔍 Key contains newlines: ${geminiApiKey.includes('\n')}`);
    console.log(`🔍 Key is trimmed: ${geminiApiKey === geminiApiKey.trim()}`);
    console.log(`🔍 Key contains 'your-': ${geminiApiKey.includes('your-')}`);
    console.log(`🔍 Key contains 'example': ${geminiApiKey.includes('example')}`);
    console.log(`🔍 Key contains 'placeholder': ${geminiApiKey.includes('placeholder')}`);
    console.log(`🔍 Key contains 'test': ${geminiApiKey.includes('test')}`);
    console.log(`🔍 Key contains 'demo': ${geminiApiKey.includes('demo')}`);
    console.log(`🔍 Key starts with 'AIza': ${geminiApiKey.startsWith('AIza')}`);
  } else {
    console.log("❌ No API key found in GEMINI_API_KEY environment variable");
  }
  
  // UPDATED VALIDATION - For Gemini API keys
  const hasValidApiKey = geminiApiKey && 
                        geminiApiKey.trim().length >= 35 && // Gemini keys are typically 39 chars
                        geminiApiKey.startsWith('AIza') &&
                        !geminiApiKey.includes('your-') &&
                        !geminiApiKey.includes('example') &&
                        !geminiApiKey.includes('placeholder') &&
                        !geminiApiKey.includes('test-key') &&
                        !geminiApiKey.includes('demo-key') &&
                        geminiApiKey === geminiApiKey.trim(); // No extra whitespace
  
  console.log(`✅ Final Validation Result: ${hasValidApiKey}`);
  
  if (!hasValidApiKey) {
    console.log("❌ === API KEY VALIDATION FAILED ===");
    if (!geminiApiKey) {
      console.log("   ❌ Key is missing entirely");
    } else if (geminiApiKey.trim().length < 35) {
      console.log(`   ❌ Key too short (${geminiApiKey.trim().length} chars, need 35+)`);
    } else if (!geminiApiKey.startsWith('AIza')) {
      console.log("   ❌ Key doesn't start with 'AIza' (Gemini API key format)");
    } else if (geminiApiKey.includes('your-')) {
      console.log("   ❌ Key contains 'your-' (placeholder pattern)");
    } else if (geminiApiKey.includes('example')) {
      console.log("   ❌ Key contains 'example' (placeholder pattern)");
    } else if (geminiApiKey.includes('placeholder')) {
      console.log("   ❌ Key contains 'placeholder'");
    } else if (geminiApiKey.includes('test-key')) {
      console.log("   ❌ Key contains 'test-key'");
    } else if (geminiApiKey.includes('demo-key')) {
      console.log("   ❌ Key contains 'demo-key'");
    } else if (geminiApiKey !== geminiApiKey.trim()) {
      console.log("   ❌ Key has extra whitespace");
    } else {
      console.log("   ❌ Key failed validation for unknown reason");
    }
  }
  console.log("🔑 === END VALIDATION ===");
  
  return hasValidApiKey;
}

// Check daily API usage limits
async function checkApiUsage(provider: string, limit: number): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const { data, error } = await supabase
      .from('api_usage')
      .select('queries_used')
      .eq('date', today)
      .eq('provider', provider)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error(`Error checking ${provider} usage:`, error);
      return false;
    }

    const currentUsage = data?.queries_used || 0;
    console.log(`📊 ${provider} usage today: ${currentUsage}/${limit}`);
    
    return currentUsage < limit;
  } catch (error) {
    console.error(`Error checking ${provider} usage:`, error);
    return false;
  }
}

// Track API usage
async function trackApiUsage(provider: string, queriesUsed: number = 1): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const { error } = await supabase
      .from('api_usage')
      .upsert({
        date: today,
        provider,
        queries_used: queriesUsed,
        queries_limit: getProviderLimit(provider)
      }, {
        onConflict: 'date,provider',
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`Error tracking ${provider} usage:`, error);
    }
  } catch (error) {
    console.error(`Error tracking ${provider} usage:`, error);
  }
}

// Get daily limits for each provider
function getProviderLimit(provider: string): number {
  const limits = {
    'google': 100,
    'news': 33, // 1000/month ÷ 30 days
    'reddit': 1000
  };
  return limits[provider as keyof typeof limits] || 100;
}

// Search Google Custom Search for citations
async function searchGoogleCitations(domain: string, siteName: string): Promise<Citation[]> {
  if (!googleApiKey || !googleSearchEngineId) {
    console.log("⚠️ Google API credentials not configured");
    return [];
  }

  if (!await checkApiUsage('google', 100)) {
    console.log("⚠️ Google API daily limit reached");
    return [];
  }

  const citations: Citation[] = [];
  
  try {
    console.log(`🔍 Searching Google for citations of ${domain}...`);
    
    // Search for domain mentions (excluding the site itself)
    const queries = [
      `"${domain}" -site:${domain}`,
      `"${siteName}" -site:${domain}`,
      `"according to ${siteName}"`,
      `"${domain} explains"`,
      `"source: ${domain}"`
    ];

    let queriesUsed = 0;
    
    for (const query of queries.slice(0, 3)) { // Limit to 3 queries to conserve quota
      try {
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleSearchEngineId}&q=${encodeURIComponent(query)}&num=5`;
        
        const response = await fetch(searchUrl, {
          signal: AbortSignal.timeout(10000)
        });
        
        queriesUsed++;
        
        if (!response.ok) {
          console.error(`Google Search API error: ${response.status} ${response.statusText}`);
          continue;
        }
        
        const data = await response.json();
        
        if (data.items) {
          for (const item of data.items) {
            // Check if this looks like a citation
            const snippet = item.snippet || '';
            const title = item.title || '';
            const url = item.link || '';
            
            // Look for citation patterns in snippet
            const citationPatterns = [
              new RegExp(`according to ${siteName}`, 'i'),
              new RegExp(`${domain} (states|explains|reports|says)`, 'i'),
              new RegExp(`source:.*${domain}`, 'i'),
              new RegExp(`via ${siteName}`, 'i'),
              new RegExp(`${siteName} (notes|mentions|indicates)`, 'i')
            ];
            
            const hasCitationPattern = citationPatterns.some(pattern => 
              pattern.test(snippet) || pattern.test(title)
            );
            
            if (hasCitationPattern) {
              citations.push({
                source_type: 'Google Search Result',
                snippet_text: snippet,
                url: url,
                detected_at: new Date().toISOString(),
                confidence: 0.8,
                authority_score: calculateAuthorityScore(url)
              });
              
              console.log(`✅ Found Google citation: ${url}`);
            }
          }
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error searching Google for "${query}":`, error);
      }
    }
    
    // Track usage
    await trackApiUsage('google', queriesUsed);
    
  } catch (error) {
    console.error("Error in Google citation search:", error);
  }
  
  return citations;
}

// Search News API for citations
async function searchNewsCitations(domain: string, siteName: string): Promise<Citation[]> {
  if (!newsApiKey) {
    console.log("⚠️ News API key not configured");
    return [];
  }

  if (!await checkApiUsage('news', 33)) {
    console.log("⚠️ News API daily limit reached");
    return [];
  }

  const citations: Citation[] = [];
  
  try {
    console.log(`📰 Searching news for citations of ${domain}...`);
    
    const queries = [
      domain,
      siteName,
      `"${siteName}"`
    ];

    let queriesUsed = 0;
    
    for (const query of queries.slice(0, 2)) { // Limit to 2 queries
      try {
        const searchUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=10&apiKey=${newsApiKey}`;
        
        const response = await fetch(searchUrl, {
          signal: AbortSignal.timeout(10000)
        });
        
        queriesUsed++;
        
        if (!response.ok) {
          console.error(`News API error: ${response.status} ${response.statusText}`);
          continue;
        }
        
        const data = await response.json();
        
        if (data.articles) {
          for (const article of data.articles) {
            const content = `${article.title} ${article.description} ${article.content || ''}`;
            
            // Check if article mentions the domain/site in a citation-like way
            const citationPatterns = [
              new RegExp(`according to.*${siteName}`, 'i'),
              new RegExp(`${domain}.*reports?`, 'i'),
              new RegExp(`source.*${domain}`, 'i'),
              new RegExp(`${siteName}.*(states|explains|found|shows)`, 'i')
            ];
            
            const hasCitation = citationPatterns.some(pattern => pattern.test(content));
            
            if (hasCitation) {
              citations.push({
                source_type: 'News Article',
                snippet_text: article.description || article.title,
                url: article.url,
                detected_at: new Date().toISOString(),
                confidence: 0.9,
                authority_score: calculateAuthorityScore(article.url)
              });
              
              console.log(`✅ Found news citation: ${article.url}`);
            }
          }
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error searching news for "${query}":`, error);
      }
    }
    
    // Track usage
    await trackApiUsage('news', queriesUsed);
    
  } catch (error) {
    console.error("Error in news citation search:", error);
  }
  
  return citations;
}

// Search Reddit for citations
async function searchRedditCitations(domain: string, siteName: string): Promise<Citation[]> {
  if (!redditClientId || !redditClientSecret) {
    console.log("⚠️ Reddit API credentials not configured");
    return [];
  }

  if (!await checkApiUsage('reddit', 1000)) {
    console.log("⚠️ Reddit API daily limit reached");
    return [];
  }

  const citations: Citation[] = [];
  
  try {
    console.log(`🔍 Searching Reddit for citations of ${domain}...`);
    
    // Get Reddit access token
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${redditClientId}:${redditClientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'SEOgenix/1.0'
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(10000)
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Reddit auth failed: ${tokenResponse.status}`);
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    // Search for domain mentions
    const queries = [domain, siteName];
    let queriesUsed = 0;
    
    for (const query of queries) {
      try {
        const searchUrl = `https://oauth.reddit.com/search?q=${encodeURIComponent(query)}&type=link&sort=new&limit=25`;
        
        const response = await fetch(searchUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'SEOgenix/1.0'
          },
          signal: AbortSignal.timeout(10000)
        });
        
        queriesUsed++;
        
        if (!response.ok) {
          console.error(`Reddit search error: ${response.status} ${response.statusText}`);
          continue;
        }
        
        const data = await response.json();
        
        if (data.data && data.data.children) {
          for (const post of data.data.children) {
            const postData = post.data;
            const title = postData.title || '';
            const selftext = postData.selftext || '';
            const url = postData.url || '';
            
            // Check if post mentions domain in a citation-like way
            const content = `${title} ${selftext}`;
            const citationPatterns = [
              new RegExp(`according to.*${siteName}`, 'i'),
              new RegExp(`source.*${domain}`, 'i'),
              new RegExp(`${siteName}.*(says|reports|found)`, 'i'),
              new RegExp(`check out.*${domain}`, 'i')
            ];
            
            const hasCitation = citationPatterns.some(pattern => pattern.test(content)) ||
                              url.includes(domain);
            
            if (hasCitation) {
              citations.push({
                source_type: 'Reddit Post',
                snippet_text: title,
                url: `https://reddit.com${postData.permalink}`,
                detected_at: new Date().toISOString(),
                confidence: 0.7,
                authority_score: Math.min(postData.score || 0, 100) // Use Reddit score as authority
              });
              
              console.log(`✅ Found Reddit citation: ${postData.permalink}`);
            }
          }
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error searching Reddit for "${query}":`, error);
      }
    }
    
    // Track usage
    await trackApiUsage('reddit', queriesUsed);
    
  } catch (error) {
    console.error("Error in Reddit citation search:", error);
  }
  
  return citations;
}

// Calculate authority score based on domain
function calculateAuthorityScore(url: string): number {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    
    // High authority domains
    const highAuthority = [
      'wikipedia.org', 'github.com', 'stackoverflow.com',
      'medium.com', 'techcrunch.com', 'wired.com', 'arstechnica.com',
      'reuters.com', 'bbc.com', 'cnn.com', 'nytimes.com',
      'harvard.edu', 'mit.edu', 'stanford.edu'
    ];
    
    // Medium authority domains
    const mediumAuthority = [
      'reddit.com', 'quora.com', 'linkedin.com',
      'forbes.com', 'businessinsider.com', 'venturebeat.com'
    ];
    
    if (highAuthority.some(d => domain.includes(d))) return 90;
    if (mediumAuthority.some(d => domain.includes(d))) return 70;
    if (domain.endsWith('.edu')) return 85;
    if (domain.endsWith('.gov')) return 95;
    if (domain.endsWith('.org')) return 75;
    
    return 50; // Default score
  } catch {
    return 50;
  }
}

// Generate AI assistant response using real citations
async function generateAssistantResponse(url: string, siteName: string, citations: Citation[]): Promise<string> {
  if (!validateGeminiApiKey()) {
    console.log("🤖 Using fallback assistant response (no valid Gemini API key)");
    return generateFallbackAssistantResponse(url, siteName, citations);
  }
  
  try {
    console.log("🤖 Generating AI assistant response with Gemini...");
    
    const citationContext = citations.length > 0 
      ? `The following citations were found: ${citations.map(c => `${c.source_type}: "${c.snippet_text}"`).join('; ')}`
      : 'No specific citations were found in this search.';
    
    const prompt = `You are a helpful AI assistant. A user is asking about the website ${siteName} (${url}). 

${citationContext}

Please provide a natural, helpful response about this website as if you were ChatGPT, Claude, or another AI assistant. The response should:
1. Be 2-3 sentences long
2. Sound natural and conversational  
3. Mention the website by name
4. ${citations.length > 0 ? 'Reference that the site has been mentioned in other sources' : 'Provide general information about what the site offers'}
5. Be positive but realistic

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
    return generateFallbackAssistantResponse(url, siteName, citations);
  }
}

// Fallback assistant response
function generateFallbackAssistantResponse(url: string, siteName: string, citations: Citation[]): string {
  const domain = new URL(url).hostname;
  
  if (citations.length > 0) {
    const highAuthCitations = citations.filter(c => (c.authority_score || 0) > 80);
    if (highAuthCitations.length > 0) {
      return `Based on ${siteName}, this website has been referenced in several authoritative sources including ${highAuthCitations[0].source_type.toLowerCase()}. The site appears to provide valuable information that other publications find worth citing. You can explore more at ${domain}.`;
    } else {
      return `${siteName} has been mentioned across various online platforms and discussions. The website seems to offer useful content that resonates with different communities. For more details, visit ${domain}.`;
    }
  }
  
  const responses = [
    `Based on ${siteName}, this website provides valuable information and resources. The site appears to focus on delivering quality content and services to help users achieve their goals. You can explore more by visiting ${domain} directly.`,
    
    `${siteName} offers comprehensive information and services in their area of expertise. The website is designed to provide users with helpful resources and guidance. For the most current information, I'd recommend checking out ${domain}.`
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

    console.log(`🚀 === STARTING REAL CITATION TRACKING ===`);
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
    const domain = urlObj.hostname;
    console.log(`📝 Site name: ${siteName}`);
    console.log(`🌐 Domain: ${domain}`);

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

    // Search for citations across all platforms
    console.log("🔍 === SEARCHING FOR CITATIONS ACROSS PLATFORMS ===");
    
    const [googleCitations, newsCitations, redditCitations] = await Promise.all([
      searchGoogleCitations(domain, siteName),
      searchNewsCitations(domain, siteName), 
      searchRedditCitations(domain, siteName)
    ]);

    const allFoundCitations = [
      ...googleCitations,
      ...newsCitations,
      ...redditCitations
    ];

    console.log(`📊 Citation search results:`);
    console.log(`   Google: ${googleCitations.length} citations`);
    console.log(`   News: ${newsCitations.length} citations`);
    console.log(`   Reddit: ${redditCitations.length} citations`);
    console.log(`   Total: ${allFoundCitations.length} citations`);

    // Store new citations in database
    const storedCitations = [];
    for (const citation of allFoundCitations) {
      try {
        // Check if citation already exists
        const { data: existingCitation } = await supabase
          .from("citations")
          .select("id")
          .eq("site_id", site_id)
          .eq("url", citation.url)
          .maybeSingle();

        if (existingCitation) {
          console.log(`⏭️ Citation already exists: ${citation.url}`);
          continue;
        }

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
        console.log(`✅ Stored new citation from ${citation.source_type}: ${citation.url}`);
      } catch (error) {
        console.error(`❌ Error processing citation from ${citation.source_type}:`, error);
      }
    }

    // Generate AI assistant response
    console.log("🤖 === GENERATING ASSISTANT RESPONSE ===");
    const assistantResponse = await generateAssistantResponse(url, siteName, allFoundCitations);
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
      platforms_checked: ["Google Custom Search", "News API", "Reddit API"],
      search_summary: {
        google_results: googleCitations.length,
        news_results: newsCitations.length,
        reddit_results: redditCitations.length,
        total_new_citations: storedCitations.length,
        high_authority_citations: allFoundCitations.filter(c => (c.authority_score || 0) > 80).length
      }
    };

    console.log("🎉 === REAL CITATION TRACKING COMPLETE ===");
    console.log(`📊 Total citations in DB: ${(allCitations || storedCitations).length}`);
    console.log(`🆕 New citations found: ${storedCitations.length}`);
    console.log(`⭐ High authority citations: ${response.search_summary.high_authority_citations}`);

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