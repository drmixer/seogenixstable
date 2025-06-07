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
  content: string;
  industry?: string;
  target_audience?: string;
  content_type?: string;
  site_url?: string;
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

// Function to call Gemini API for prompt generation
async function generatePromptsWithGemini(
  content: string, 
  industry?: string, 
  targetAudience?: string, 
  contentType?: string,
  siteUrl?: string
): Promise<any> {
  if (!validateGeminiApiKey()) {
    console.log("⚠️ Gemini API key validation failed, using enhanced fallback");
    return null;
  }

  try {
    console.log("🤖 Generating prompts with Gemini AI...");
    
    const contextInfo = [
      industry && `Industry: ${industry}`,
      targetAudience && `Target Audience: ${targetAudience}`,
      contentType && `Content Type: ${contentType}`,
      siteUrl && `Website: ${siteUrl}`
    ].filter(Boolean).join('\n');

    const prompt = `You are an expert in AI visibility optimization and voice search. Analyze this content and generate comprehensive prompt suggestions that will help optimize it for AI systems like ChatGPT, Perplexity, voice assistants, and search engines.

CONTENT TO ANALYZE:
${content}

${contextInfo ? `CONTEXT:\n${contextInfo}\n` : ''}

Generate suggestions in these categories:

1. VOICE SEARCH QUERIES (5-7 natural, conversational questions people would ask voice assistants)
2. FAQ QUESTIONS (5-7 frequently asked questions that could become FAQ sections)
3. HEADLINE SUGGESTIONS (5-7 AI-optimized headlines for blog posts or pages)
4. FEATURED SNIPPET TARGETS (5-7 questions likely to trigger featured snippets)
5. LONG-TAIL KEYWORDS (5-7 longer, specific phrases people search for)
6. COMPARISON QUERIES (3-5 "vs" or comparison-style questions)
7. HOW-TO QUERIES (3-5 step-by-step instructional queries)

REQUIREMENTS:
- Make suggestions specific to the content provided
- Use natural language that people actually speak
- Include question words (what, how, why, when, where, which)
- Consider voice search patterns (longer, conversational queries)
- Think about user intent and pain points
- Include both beginner and advanced level questions
- Make suggestions actionable for content creation

Return ONLY valid JSON in this exact format:
{
  "voice_search": ["question 1", "question 2", ...],
  "faq_questions": ["question 1", "question 2", ...],
  "headlines": ["headline 1", "headline 2", ...],
  "featured_snippets": ["question 1", "question 2", ...],
  "long_tail": ["phrase 1", "phrase 2", ...],
  "comparisons": ["comparison 1", "comparison 2", ...],
  "how_to": ["how to 1", "how to 2", ...],
  "analysis_summary": "Brief explanation of the content analysis and strategy behind these suggestions"
}`;

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
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 3000,
          }
        }),
        signal: AbortSignal.timeout(30000)
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content_text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (content_text) {
      // Try to extract JSON from the response
      const jsonMatch = content_text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log("✅ Generated prompts with Gemini AI");
        return {
          ...parsed,
          data_source: "Gemini AI Analysis"
        };
      }
    }
    
    throw new Error("Invalid response format from Gemini");
  } catch (error) {
    console.error("❌ Error generating prompts with Gemini:", error);
    return null;
  }
}

// Enhanced fallback prompt generation
function generateEnhancedPrompts(
  content: string, 
  industry?: string, 
  targetAudience?: string, 
  contentType?: string
): any {
  console.log(`🎭 Generating enhanced prompts for content analysis`);
  
  // Extract key topics from content
  const words = content.toLowerCase().split(/\s+/);
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);
  
  const keyTerms = words
    .filter(word => word.length > 3 && !commonWords.has(word))
    .slice(0, 10);
  
  const mainTopic = keyTerms[0] || 'this topic';
  const secondaryTopic = keyTerms[1] || 'related services';
  
  const industryContext = industry || 'your industry';
  const audienceContext = targetAudience || 'users';
  
  return {
    voice_search: [
      `What is ${mainTopic} and how does it work?`,
      `How can ${mainTopic} help ${audienceContext}?`,
      `What are the benefits of ${mainTopic} for ${industryContext}?`,
      `How do I get started with ${mainTopic}?`,
      `What's the difference between ${mainTopic} and ${secondaryTopic}?`,
      `How much does ${mainTopic} cost?`,
      `Is ${mainTopic} right for my business?`
    ],
    faq_questions: [
      `What is ${mainTopic}?`,
      `How does ${mainTopic} work?`,
      `What are the main benefits of ${mainTopic}?`,
      `How long does it take to see results with ${mainTopic}?`,
      `What should I look for when choosing ${mainTopic}?`,
      `How much does ${mainTopic} typically cost?`,
      `Can ${mainTopic} be customized for my specific needs?`
    ],
    headlines: [
      `The Complete Guide to ${mainTopic} in 2025`,
      `How ${mainTopic} Can Transform Your ${industryContext} Strategy`,
      `${mainTopic} vs ${secondaryTopic}: Which is Right for You?`,
      `10 Essential ${mainTopic} Tips Every ${audienceContext} Should Know`,
      `Why ${mainTopic} is Essential for Modern ${industryContext}`,
      `Getting Started with ${mainTopic}: A Step-by-Step Guide`,
      `The Future of ${mainTopic}: Trends and Predictions`
    ],
    featured_snippets: [
      `What is ${mainTopic} definition?`,
      `How to implement ${mainTopic} step by step?`,
      `${mainTopic} benefits and advantages`,
      `${mainTopic} cost and pricing guide`,
      `Best practices for ${mainTopic}`,
      `${mainTopic} requirements and prerequisites`,
      `Common ${mainTopic} mistakes to avoid`
    ],
    long_tail: [
      `best ${mainTopic} solution for small businesses`,
      `how to choose the right ${mainTopic} provider`,
      `${mainTopic} implementation guide for beginners`,
      `affordable ${mainTopic} options for ${audienceContext}`,
      `${mainTopic} ROI and return on investment`,
      `${mainTopic} integration with existing systems`,
      `${mainTopic} success stories and case studies`
    ],
    comparisons: [
      `${mainTopic} vs traditional methods`,
      `${mainTopic} vs ${secondaryTopic} comparison`,
      `in-house ${mainTopic} vs outsourced solutions`,
      `free vs paid ${mainTopic} options`,
      `${mainTopic} for enterprise vs small business`
    ],
    how_to: [
      `How to implement ${mainTopic} effectively`,
      `How to measure ${mainTopic} success`,
      `How to optimize ${mainTopic} for better results`,
      `How to troubleshoot common ${mainTopic} issues`,
      `How to scale ${mainTopic} for growing businesses`
    ],
    analysis_summary: `Based on the content analysis, the main focus appears to be on ${mainTopic} within the ${industryContext} context. The suggestions target ${audienceContext} with a mix of informational, commercial, and navigational search intents. These prompts are designed to capture voice search patterns, FAQ opportunities, and featured snippet targets.`,
    data_source: "Enhanced Content Analysis"
  };
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
    console.log("🚀 === STARTING PROMPT GENERATION ===");
    
    const body: RequestBody = await req.json();
    const { content, industry, target_audience, content_type, site_url } = body;

    console.log(`📋 Content length: ${content?.length || 0} characters`);
    console.log(`🏭 Industry: ${industry || 'Not specified'}`);
    console.log(`👥 Target Audience: ${target_audience || 'Not specified'}`);
    console.log(`📄 Content Type: ${content_type || 'Not specified'}`);

    if (!content || content.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Content is required and must be at least 10 characters long" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    let suggestions;
    let dataSource = "Enhanced Fallback";

    // Try to generate prompts with Gemini AI first
    const geminiSuggestions = await generatePromptsWithGemini(
      content, 
      industry, 
      target_audience, 
      content_type,
      site_url
    );
    
    if (geminiSuggestions) {
      suggestions = geminiSuggestions;
      dataSource = "Gemini AI";
    } else {
      // Use enhanced fallback
      suggestions = generateEnhancedPrompts(content, industry, target_audience, content_type);
      dataSource = "Enhanced Analysis";
    }

    console.log(`✅ Prompts generated using: ${dataSource}`);

    const response = {
      suggestions,
      dataSource,
      timestamp: new Date().toISOString(),
      total_suggestions: Object.values(suggestions).reduce((acc: number, arr: any) => 
        Array.isArray(arr) ? acc + arr.length : acc, 0
      ) - 2 // Subtract analysis_summary and data_source
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
    console.error("💥 === CRITICAL ERROR IN PROMPT GENERATION ===");
    console.error(`❌ Error: ${error.message}`);
    console.error(`❌ Stack:`, error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate prompts",
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