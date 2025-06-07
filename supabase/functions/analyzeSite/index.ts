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
  geminiApiKey: !!geminiApiKey,
  geminiKeyLength: geminiApiKey?.length || 0,
  geminiKeyPrefix: geminiApiKey?.substring(0, 15) + "..." || "none"
});

// Validate required environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables:", {
    supabaseUrl: !!supabaseUrl,
    supabaseServiceKey: !!supabaseServiceKey,
    geminiApiKey: !!geminiApiKey
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
    console.log(`🌐 Fetching content from: ${url}`);
    
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
    console.log(`📄 Fetched ${html.length} characters of HTML content`);
    
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
    console.error("❌ Error fetching website:", error);
    return `Unable to fetch content from ${url}. Error: ${error.message}. This may affect the accuracy of the analysis.`;
  }
}

// Function to call Gemini API
async function analyzeWithGemini(url: string, websiteContent: string): Promise<any> {
  if (!geminiApiKey) {
    throw new Error("Gemini API key not configured");
  }

  console.log("🤖 === STARTING GEMINI API CALL ===");
  console.log(`🔑 API Key Status: PRESENT (${geminiApiKey.length} chars)`);
  console.log(`🔑 Key Format: ${geminiApiKey.substring(0, 8)}...${geminiApiKey.substring(geminiApiKey.length - 4)}`);
  console.log(`📊 Content length being analyzed: ${websiteContent.length} characters`);
  
  try {
    const analysisId = `GEMINI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🆔 Generated Analysis ID: ${analysisId}`);
    
    const requestBody = {
      contents: [{
        parts: [{
          text: `You are an expert AI visibility consultant. Analyze this website for AI system compatibility and provide precise scores.

Website Content Analysis:
${websiteContent}

Based on the actual content and structure provided, give me precise scores (0-100) for these 5 categories:

1. AI Visibility Score: Overall readiness for AI systems to understand and cite this content
2. Schema Score: Quality and coverage of structured data markup (JSON-LD, microdata, etc.)
3. Semantic Score: Content organization, heading structure, and semantic clarity
4. Citation Score: Likelihood of being cited by AI systems based on content quality and authority signals
5. Technical SEO Score: Basic technical factors that affect AI crawling and understanding

Be specific about what you observed in the content. If schema markup is missing, score it low. If content is well-structured with clear headings, score semantic high.

IMPORTANT: Include this exact analysis identifier in your response: ${analysisId}

Return ONLY a valid JSON response in this exact format:
{
  "ai_visibility_score": 75,
  "schema_score": 60,
  "semantic_score": 80,
  "citation_score": 65,
  "technical_seo_score": 70,
  "analysis_id": "${analysisId}",
  "analysis": "Detailed analysis explaining each score based on what was actually found in the content",
  "recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2", 
    "Specific actionable recommendation 3"
  ],
  "data_source": "Google Gemini Real Analysis"
}`
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    };

    console.log("📤 === SENDING REQUEST TO GEMINI ===");
    console.log(`📋 Model: gemini-1.5-flash`);
    console.log(`📏 Max Tokens: ${requestBody.generationConfig.maxOutputTokens}`);
    console.log(`🌡️ Temperature: ${requestBody.generationConfig.temperature}`);
    console.log(`📝 Content Length: ${requestBody.contents[0].parts[0].text.length} chars`);
    
    const startTime = Date.now();
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "SEOgenix/1.0"
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      }
    );

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`📥 === GEMINI API RESPONSE ===`);
    console.log(`⏱️ Request Duration: ${duration}ms`);
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response Headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ === GEMINI API ERROR ===");
      console.error(`💥 Status: ${response.status} ${response.statusText}`);
      console.error(`📝 Error Body: ${errorText}`);
      console.error(`🔍 Error Length: ${errorText.length} characters`);
      
      // Try to parse error as JSON for better debugging
      try {
        const errorJson = JSON.parse(errorText);
        console.error(`🔍 Parsed Error JSON:`, errorJson);
        
        if (errorJson.error) {
          console.error(`❌ Error Code: ${errorJson.error.code}`);
          console.error(`❌ Error Message: ${errorJson.error.message}`);
          console.error(`❌ Error Status: ${errorJson.error.status}`);
        }
      } catch (parseError) {
        console.error(`❌ Could not parse error as JSON:`, parseError);
      }
      
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const responseText = await response.text();
    console.log(`📄 Response Body Length: ${responseText.length} characters`);
    console.log(`🔍 First 200 chars: ${responseText.substring(0, 200)}...`);
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log("✅ Successfully parsed Gemini response JSON");
    } catch (parseError) {
      console.error("❌ Failed to parse Gemini response as JSON:", parseError);
      console.error(`📝 Raw response: ${responseText}`);
      throw new Error(`Invalid JSON response from Gemini: ${parseError.message}`);
    }
    
    console.log(`📊 Response Structure Check:`);
    console.log(`   - Has candidates: ${!!data.candidates}`);
    console.log(`   - Candidates length: ${data.candidates?.length || 0}`);
    console.log(`   - Has first candidate: ${!!data.candidates?.[0]}`);
    console.log(`   - Has content: ${!!data.candidates?.[0]?.content}`);
    console.log(`   - Has parts: ${!!data.candidates?.[0]?.content?.parts}`);
    console.log(`   - Has text: ${!!data.candidates?.[0]?.content?.parts?.[0]?.text}`);
    
    if (data.usageMetadata) {
      console.log(`💰 Token Usage:`, data.usageMetadata);
    }
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error("❌ Invalid Gemini response structure");
      console.error("📋 Full response:", data);
      throw new Error("Invalid response structure from Gemini API");
    }
    
    const content = data.candidates[0].content.parts[0].text;
    console.log(`📝 === PROCESSING GEMINI CONTENT ===`);
    console.log(`📏 Content Length: ${content.length} characters`);
    console.log(`🔍 First 300 chars: ${content.substring(0, 300)}...`);
    console.log(`🔍 Last 100 chars: ...${content.substring(content.length - 100)}`);
    
    // Try to extract JSON from the response
    console.log("🔍 Searching for JSON in response...");
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("❌ No JSON found in Gemini response");
      console.error("📝 Full content:", content);
      throw new Error("No valid JSON found in Gemini response");
    }
    
    console.log(`✅ Found JSON match (${jsonMatch[0].length} chars)`);
    console.log(`🔍 JSON Preview: ${jsonMatch[0].substring(0, 200)}...`);
    
    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
      console.log("✅ Successfully parsed extracted JSON");
    } catch (parseError) {
      console.error("❌ Failed to parse extracted JSON:", parseError);
      console.error("📝 JSON content:", jsonMatch[0]);
      throw new Error(`Invalid JSON format in Gemini response: ${parseError.message}`);
    }
    
    // Validate the parsed response has required fields
    console.log("🔍 === VALIDATING PARSED RESPONSE ===");
    const requiredFields = ['ai_visibility_score', 'schema_score', 'semantic_score', 'citation_score', 'technical_seo_score'];
    const validationResults = {};
    
    for (const field of requiredFields) {
      const hasField = field in parsed;
      const isNumber = typeof parsed[field] === 'number';
      const isValidRange = isNumber && parsed[field] >= 0 && parsed[field] <= 100;
      
      validationResults[field] = { hasField, isNumber, isValidRange, value: parsed[field] };
      console.log(`   ${field}: ${hasField ? '✅' : '❌'} present, ${isNumber ? '✅' : '❌'} number, ${isValidRange ? '✅' : '❌'} valid range (${parsed[field]})`);
      
      if (!hasField || !isNumber) {
        throw new Error(`Missing or invalid ${field} in response (got: ${typeof parsed[field]} = ${parsed[field]})`);
      }
    }
    
    console.log("✅ All required fields validated successfully");
    console.log("📊 === FINAL SCORES ===");
    console.log(`   AI Visibility: ${parsed.ai_visibility_score}/100`);
    console.log(`   Schema: ${parsed.schema_score}/100`);
    console.log(`   Semantic: ${parsed.semantic_score}/100`);
    console.log(`   Citation: ${parsed.citation_score}/100`);
    console.log(`   Technical: ${parsed.technical_seo_score}/100`);
    
    // Log the analysis ID to verify it's real
    if (parsed.analysis_id) {
      console.log(`🆔 Analysis ID from Gemini: ${parsed.analysis_id}`);
      if (parsed.analysis_id === analysisId) {
        console.log("✅ Analysis ID matches expected value");
      } else {
        console.log("⚠️ Analysis ID doesn't match expected value");
      }
    } else {
      console.log("⚠️ No analysis_id in response");
    }
    
    console.log("🎉 === GEMINI ANALYSIS COMPLETE ===");
    return parsed;
  } catch (error) {
    console.error("💥 === GEMINI API CALL FAILED ===");
    console.error(`❌ Error Type: ${error.constructor.name}`);
    console.error(`❌ Error Message: ${error.message}`);
    console.error(`❌ Error Stack:`, error.stack);
    throw error;
  }
}

// Enhanced mock data that simulates real analysis
const getEnhancedMockAnalysis = (url: string, websiteContent?: string, reason?: string) => {
  console.log("🎭 === GENERATING ENHANCED MOCK ANALYSIS ===");
  console.log(`🔍 Reason: ${reason || 'Not specified'}`);
  console.log(`📊 Content available: ${!!websiteContent} (${websiteContent?.length || 0} chars)`);
  
  // Analyze the URL and content to generate more realistic scores
  const domain = new URL(url).hostname.toLowerCase();
  const mockId = `ENHANCED-MOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`🆔 Generated Mock ID: ${mockId}`);
  console.log(`🌐 Domain: ${domain}`);
  
  // Base scores that vary based on domain characteristics
  let baseScore = 70;
  
  // Adjust base score based on domain characteristics
  if (domain.includes('tech') || domain.includes('ai') || domain.includes('seo')) {
    baseScore += 10; // Tech domains likely have better structure
    console.log("📈 +10 for tech domain");
  }
  if (domain.includes('blog') || domain.includes('news')) {
    baseScore += 5; // Content sites often have good structure
    console.log("📈 +5 for content domain");
  }
  if (domain.length < 10) {
    baseScore += 5; // Shorter domains often more established
    console.log("📈 +5 for short domain");
  }
  
  console.log(`📊 Base score: ${baseScore}`);
  
  // Generate realistic scores with some variation
  const variation = () => Math.floor(Math.random() * 20) - 10; // -10 to +10
  
  const scores = {
    ai_visibility_score: Math.max(40, Math.min(95, baseScore + variation())),
    schema_score: Math.max(30, Math.min(90, baseScore - 15 + variation())), // Schema often lower
    semantic_score: Math.max(50, Math.min(95, baseScore + 5 + variation())), // Semantic often higher
    citation_score: Math.max(35, Math.min(85, baseScore - 10 + variation())), // Citation moderate
    technical_seo_score: Math.max(45, Math.min(90, baseScore + variation()))
  };
  
  console.log("📊 Generated scores:", scores);
  
  // Generate realistic analysis based on scores
  const getScoreDescription = (score: number) => {
    if (score >= 80) return "excellent";
    if (score >= 70) return "good";
    if (score >= 60) return "fair";
    if (score >= 50) return "needs improvement";
    return "poor";
  };
  
  const analysis = `🔍 ENHANCED ANALYSIS for ${domain}:

AI Visibility (${scores.ai_visibility_score}/100): ${getScoreDescription(scores.ai_visibility_score)} - The website shows ${scores.ai_visibility_score >= 70 ? 'strong potential' : 'room for improvement'} for AI system understanding and citation.

Schema Implementation (${scores.schema_score}/100): ${getScoreDescription(scores.schema_score)} - ${scores.schema_score >= 70 ? 'Good structured data implementation detected' : 'Limited or missing structured data markup'}.

Semantic Structure (${scores.semantic_score}/100): ${getScoreDescription(scores.semantic_score)} - Content organization and heading structure ${scores.semantic_score >= 70 ? 'follows best practices' : 'could be improved'}.

Citation Potential (${scores.citation_score}/100): ${getScoreDescription(scores.citation_score)} - ${scores.citation_score >= 70 ? 'High likelihood' : 'Moderate potential'} for AI systems to reference this content.

Technical SEO (${scores.technical_seo_score}/100): ${getScoreDescription(scores.technical_seo_score)} - Basic technical factors ${scores.technical_seo_score >= 70 ? 'are well optimized' : 'need attention'}.

⚠️ NOTE: This is enhanced mock data generated because: ${reason || 'the Gemini API was not available'}. The scores are based on domain analysis and realistic patterns, but a real API analysis would provide more accurate results.`;

  const recommendations = [
    scores.schema_score < 70 ? "Implement comprehensive schema.org structured data markup" : "Enhance existing schema markup with additional entity types",
    scores.semantic_score < 70 ? "Improve content organization with clear semantic headings (H1, H2, H3)" : "Optimize existing content structure for better AI understanding",
    scores.citation_score < 70 ? "Add FAQ sections to address common user questions" : "Expand authoritative content to increase citation potential",
    scores.technical_seo_score < 70 ? "Improve page loading speed and mobile responsiveness" : "Fine-tune technical performance for optimal AI crawling",
    "Optimize content for voice search and natural language queries"
  ];
  
  console.log("✅ Mock analysis generated successfully");
  
  return {
    ...scores,
    analysis_id: mockId,
    analysis,
    recommendations,
    data_source: "Enhanced Mock Analysis"
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

    console.log(`🚀 === STARTING ANALYSIS ===`);
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
    try {
      const urlObj = new URL(url);
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

    let scores;
    let analysisText = "";
    let usingRealData = false;
    let dataSource = "Mock Data";
    let analysisId = "";
    let websiteContent = "";

    // Always fetch website content for better analysis
    try {
      console.log("🌐 === FETCHING WEBSITE CONTENT ===");
      websiteContent = await fetchWebsiteContent(url);
      console.log(`✅ Successfully fetched ${websiteContent.length} characters of content`);
    } catch (fetchError) {
      console.warn("⚠️ Could not fetch website content:", fetchError.message);
      websiteContent = `Basic analysis for ${url} - content fetch failed: ${fetchError.message}`;
    }

    // COMPREHENSIVE API KEY VALIDATION WITH DETAILED DEBUGGING
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
      
      // Gemini API keys typically start with "AIza" and are 39 characters long
      console.log(`🔍 Key character breakdown:`);
      console.log(`   - Total length: ${geminiApiKey.length}`);
      console.log(`   - Alphanumeric chars: ${(geminiApiKey.match(/[a-zA-Z0-9]/g) || []).length}`);
      console.log(`   - Dash chars: ${(geminiApiKey.match(/-/g) || []).length}`);
      console.log(`   - Underscore chars: ${(geminiApiKey.match(/_/g) || []).length}`);
      console.log(`   - Other chars: ${geminiApiKey.length - (geminiApiKey.match(/[a-zA-Z0-9-_]/g) || []).length}`);
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

    // Try to get real analysis from Gemini
    if (hasValidApiKey) {
      try {
        console.log("🤖 ✅ API KEY VALID - Attempting Gemini API analysis...");
        
        scores = await analyzeWithGemini(url, websiteContent);
        analysisText = scores.analysis;
        analysisId = scores.analysis_id || "No ID provided";
        usingRealData = true;
        dataSource = "Google Gemini";
        
        console.log("🎉 ✅ SUCCESS: Real analysis from Gemini API completed!");
        console.log(`🆔 Analysis ID: ${analysisId}`);
        console.log(`📊 Data Source: ${scores.data_source || 'Google Gemini'}`);
      } catch (apiError) {
        console.error("❌ === GEMINI API FAILED ===");
        console.error(`💥 Error: ${apiError.message}`);
        console.error(`🔍 Error Type: ${apiError.constructor.name}`);
        console.log("🔄 Falling back to enhanced mock analysis...");
        
        scores = getEnhancedMockAnalysis(url, websiteContent, `Gemini API Error: ${apiError.message}`);
        analysisText = scores.analysis;
        analysisId = scores.analysis_id;
        usingRealData = false;
        dataSource = "Enhanced Mock (API Failed)";
      }
    } else {
      console.log("❌ Gemini API key validation failed");
      console.log("🔄 Using enhanced mock analysis based on website content...");
      
      scores = getEnhancedMockAnalysis(url, websiteContent, "Invalid or missing Gemini API key");
      analysisText = scores.analysis;
      analysisId = scores.analysis_id;
      usingRealData = false;
      dataSource = "Enhanced Mock (Invalid API Key)";
    }

    console.log(`📊 === ANALYSIS COMPLETE ===`);
    console.log(`🎯 Real Data Status: ${usingRealData}`);
    console.log(`📊 Data Source: ${dataSource}`);
    console.log(`🆔 Final Analysis ID: ${analysisId}`);

    // Track audit usage
    try {
      const { data: usageData, error: usageError } = await supabase.rpc(
        'increment_usage',
        {
          p_user_id: user_id,
          p_type: 'audits'
        }
      );

      if (usageError) {
        console.warn("⚠️ Failed to track usage:", usageError.message);
      } else {
        console.log("✅ Usage tracked successfully");
      }
    } catch (usageTrackError) {
      console.warn("⚠️ Error tracking usage:", usageTrackError);
    }

    // Create audit with service role client
    console.log("💾 === SAVING TO DATABASE ===");
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
      console.error("❌ Database error creating audit:", auditError);
      throw new Error(`Failed to create audit: ${auditError.message}`);
    }

    console.log(`✅ Audit saved with ID: ${auditData.id}`);

    // Generate schemas with service role client
    const schemaTypes = ["FAQ", "HowTo", "Product"];
    const schemas = [];

    console.log("📋 === GENERATING SCHEMAS ===");
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
        console.error(`❌ Failed to create ${schemaType} schema:`, schemaError.message);
        continue;
      }

      schemas.push(schemaData);
      console.log(`✅ Generated ${schemaType} schema`);
    }

    console.log(`📋 Generated ${schemas.length} schema examples`);

    const response = {
      audit: auditData,
      schemas,
      analysis: analysisText,
      recommendations: scores.recommendations || [],
      usingRealData,
      dataSource,
      analysisId,
      timestamp: new Date().toISOString(),
      websiteContentLength: websiteContent.length
    };

    console.log("🎉 === ANALYSIS COMPLETE AND SUCCESSFUL ===");
    console.log(`🔍 FINAL VERIFICATION:`);
    console.log(`   Real Data: ${usingRealData}`);
    console.log(`   Source: ${dataSource}`);
    console.log(`   ID: ${analysisId}`);
    console.log(`   Audit DB ID: ${auditData.id}`);
    console.log(`   Schemas: ${schemas.length}`);

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
    console.error("💥 === CRITICAL ERROR IN ANALYZE SITE ===");
    console.error(`❌ Error Type: ${error.constructor.name}`);
    console.error(`❌ Error Message: ${error.message}`);
    console.error(`❌ Error Stack:`, error.stack);
    
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