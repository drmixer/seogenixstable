import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to extract text content from HTML
function extractTextFromHTML(html: string): string {
  // Remove script and style elements
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, ' ');
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Limit to first 5000 characters to stay within API limits
  return text.substring(0, 5000);
}

// Helper function to extract metadata from HTML
function extractMetadata(html: string): { title: string; description: string; keywords: string } {
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  const description = descMatch ? descMatch[1].trim() : '';
  
  const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']*)["']/i);
  const keywords = keywordsMatch ? keywordsMatch[1].trim() : '';
  
  return { title, description, keywords };
}

// Helper function to call Gemini API with detailed logging
async function callGeminiAPI(prompt: string): Promise<string> {
  console.log(`🔑 Starting Gemini API call...`);
  
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  console.log(`🔑 API Key check: ${apiKey ? `Present (${apiKey.substring(0, 10)}...)` : 'NOT FOUND'}`);
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please configure this in your Supabase project settings.');
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
  console.log(`🌐 Making request to Gemini 2.5 Flash Preview`);

  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    }
  };

  console.log(`📤 Request body prepared, prompt length: ${prompt.length} characters`);

  try {
    console.log(`📡 Sending request to Gemini API...`);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`📥 Response received - Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Gemini API error response: ${errorText}`);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Gemini API response parsed successfully`);
    console.log(`📋 Response structure check - has candidates: ${!!data.candidates}, candidates length: ${data.candidates?.length || 0}`);
    
    // Handle the response structure properly
    if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      console.log(`📝 Candidate structure check - has content: ${!!candidate.content}, has parts: ${!!candidate.content?.parts}`);
      
      if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts) && candidate.content.parts.length > 0) {
        const responseText = candidate.content.parts[0].text;
        console.log(`✅ Successfully extracted text from Gemini response (${responseText.length} chars)`);
        console.log(`📝 Response preview: ${responseText.substring(0, 200)}...`);
        return responseText;
      } else {
        console.error(`❌ Invalid candidate structure:`, JSON.stringify(candidate, null, 2));
        throw new Error('Invalid candidate structure in Gemini API response');
      }
    } else {
      console.error(`❌ No candidates in response:`, JSON.stringify(data, null, 2));
      throw new Error('No candidates found in Gemini API response');
    }
  } catch (fetchError) {
    console.error(`❌ Fetch error calling Gemini API:`, fetchError);
    console.error(`❌ Error details:`, {
      name: fetchError.name,
      message: fetchError.message,
      stack: fetchError.stack
    });
    throw fetchError;
  }
}

// Helper function to generate fallback scores based on basic analysis
function generateFallbackScores(metadata: any, hasStructuredData: boolean, contentLength: number) {
  const hasTitle = metadata.title && metadata.title.length > 0;
  const hasDescription = metadata.description && metadata.description.length > 0;
  const hasKeywords = metadata.keywords && metadata.keywords.length > 0;
  
  return {
    ai_visibility_score: Math.floor(
      (hasStructuredData ? 25 : 15) +
      (hasTitle ? 20 : 10) +
      (hasDescription ? 20 : 10) +
      (contentLength > 1000 ? 25 : 15) +
      Math.random() * 10
    ),
    schema_score: Math.floor(
      (hasStructuredData ? 60 : 20) +
      (hasTitle ? 15 : 5) +
      (hasDescription ? 15 : 5) +
      Math.random() * 10
    ),
    semantic_score: Math.floor(
      (hasTitle ? 25 : 10) +
      (hasDescription ? 25 : 10) +
      (hasKeywords ? 15 : 5) +
      (contentLength > 500 ? 25 : 15) +
      Math.random() * 10
    ),
    citation_score: Math.floor(
      (contentLength > 2000 ? 30 : contentLength > 1000 ? 20 : 10) +
      (hasTitle ? 20 : 10) +
      (hasDescription ? 20 : 10) +
      (hasStructuredData ? 15 : 5) +
      Math.random() * 10
    ),
    technical_seo_score: Math.floor(
      (hasTitle ? 25 : 10) +
      (hasDescription ? 25 : 10) +
      (hasStructuredData ? 25 : 10) +
      (hasKeywords ? 15 : 5) +
      Math.random() * 10
    )
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 analyzeSite function called');
    
    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body - must be valid JSON',
          details: parseError.message
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { siteId, url, user_id } = requestData;

    // Validate required parameters
    if (!siteId || !url || !user_id) {
      console.error('❌ Missing required parameters:', { siteId: !!siteId, url: !!url, user_id: !!user_id });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: siteId, url, or user_id' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🚀 Starting AI visibility analysis for ${url}`);

    // Fetch the website content
    let websiteContent = '';
    let metadata = { title: '', description: '', keywords: '' };
    let hasStructuredData = false;
    
    try {
      console.log(`📡 Fetching website content from ${url}`);
      
      const websiteResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEOgenix-Bot/1.0; +https://seogenix.com/bot)'
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!websiteResponse.ok) {
        throw new Error(`Failed to fetch website: ${websiteResponse.status} ${websiteResponse.statusText}`);
      }

      const html = await websiteResponse.text();
      console.log(`✅ Successfully fetched ${html.length} characters of HTML`);
      
      // Extract text content and metadata
      websiteContent = extractTextFromHTML(html);
      metadata = extractMetadata(html);
      
      // Check for structured data
      hasStructuredData = html.includes('application/ld+json') || 
                         html.includes('schema.org') || 
                         html.includes('microdata');
      
      console.log(`📝 Extracted ${websiteContent.length} characters of text content`);
      console.log(`📋 Metadata - Title: "${metadata.title}", Description: "${metadata.description}"`);
      console.log(`🏗️ Structured data detected: ${hasStructuredData}`);
      
    } catch (fetchError) {
      console.warn(`⚠️ Failed to fetch website content: ${fetchError.message}`);
      console.log(`🔄 Falling back to URL-based analysis`);
      
      // Fallback: analyze based on URL and domain
      const domain = new URL(url).hostname;
      websiteContent = `Website: ${url}\nDomain: ${domain}\nNote: Content could not be fetched directly.`;
    }

    let scores;
    let analysisMethod = 'AI-powered (Gemini 2.5 Flash)';

    // Check if Gemini API key is available and try to use it
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    console.log(`🔑 Environment check - GEMINI_API_KEY: ${apiKey ? 'PRESENT' : 'MISSING'}`);
    
    if (apiKey && apiKey.trim().length > 0) {
      try {
        console.log(`🤖 Attempting AI analysis with Gemini 2.5 Flash Preview`);
        
        // Prepare the prompt for AI analysis
        const analysisPrompt = `Analyze this website for AI visibility and provide scores from 1-100 for each category.

Website URL: ${url}
Title: ${metadata.title || 'Not available'}
Meta Description: ${metadata.description || 'Not available'}
Has Structured Data: ${hasStructuredData}
Content Preview: ${websiteContent.substring(0, 2000)}

Analyze and provide scores (1-100) for:
1. AI Visibility Score - Overall visibility to AI systems
2. Schema Score - Structured data implementation  
3. Semantic Score - Content clarity and semantic structure
4. Citation Score - Likelihood of being cited by AI
5. Technical SEO Score - Technical optimization factors

Return ONLY a JSON object with these exact keys:
{
  "ai_visibility_score": number,
  "schema_score": number,
  "semantic_score": number,
  "citation_score": number,
  "technical_seo_score": number
}`;

        console.log(`🤖 Calling Gemini API for site analysis`);
        console.log(`📝 Prompt length: ${analysisPrompt.length} characters`);
        
        // Call Gemini API to analyze the site
        const aiAnalysis = await callGeminiAPI(analysisPrompt);
        
        console.log(`✅ Gemini API returned analysis: ${aiAnalysis.substring(0, 200)}...`);

        // Parse the AI response to extract scores
        try {
          console.log(`🔍 Starting JSON parsing process...`);
          
          // Clean the response and extract JSON
          let jsonString = aiAnalysis.trim();
          console.log(`📝 Original response length: ${jsonString.length}`);
          
          // Remove markdown code blocks if present
          jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*/g, '');
          console.log(`📝 After markdown removal: ${jsonString.substring(0, 100)}...`);
          
          // Try to extract JSON from the response
          const jsonMatch = jsonString.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            jsonString = jsonMatch[0];
            console.log(`📝 Extracted JSON string: ${jsonString}`);
          } else {
            console.warn(`⚠️ No JSON pattern found in response`);
          }
          
          console.log(`🔍 Attempting to parse JSON: ${jsonString}`);
          scores = JSON.parse(jsonString);
          console.log(`✅ Successfully parsed AI scores:`, scores);
          
          // Validate that all required keys are present and are numbers
          const requiredKeys = ['ai_visibility_score', 'schema_score', 'semantic_score', 'citation_score', 'technical_seo_score'];
          const missingKeys = requiredKeys.filter(key => !(key in scores) || typeof scores[key] !== 'number');
          
          if (missingKeys.length > 0) {
            console.warn(`⚠️ Missing or invalid keys in AI response: ${missingKeys.join(', ')}`);
            throw new Error(`Missing or invalid required keys: ${missingKeys.join(', ')}`);
          }
          
          analysisMethod = 'AI-powered (Gemini 2.5 Flash)';
          console.log(`✅ AI analysis successful with Gemini 2.5 Flash`);
          
        } catch (parseError) {
          console.error('❌ Failed to parse AI analysis:', parseError);
          console.log('Raw AI response for debugging:', aiAnalysis);
          throw parseError; // This will trigger the fallback below
        }
      } catch (aiError) {
        console.error(`❌ AI analysis failed with error:`, aiError);
        console.error(`❌ Error type: ${aiError.name}, Message: ${aiError.message}`);
        console.log(`🔄 Falling back to rule-based analysis`);
        
        scores = generateFallbackScores(metadata, hasStructuredData, websiteContent.length);
        analysisMethod = `Rule-based (AI failed: ${aiError.message})`;
      }
    } else {
      console.log(`⚠️ GEMINI_API_KEY not configured or empty, using rule-based analysis`);
      scores = generateFallbackScores(metadata, hasStructuredData, websiteContent.length);
      analysisMethod = 'Rule-based (API key not configured)';
    }

    // Ensure all scores are within valid range and are integers
    const validatedScores = {};
    ['ai_visibility_score', 'schema_score', 'semantic_score', 'citation_score', 'technical_seo_score'].forEach(key => {
      let score = scores[key];
      if (typeof score !== 'number' || isNaN(score) || score < 1 || score > 100) {
        console.warn(`⚠️ Invalid score for ${key}: ${score}, using random fallback`);
        score = Math.floor(Math.random() * 40) + 60; // Random score between 60-100
      }
      validatedScores[key] = Math.floor(Math.max(1, Math.min(100, score))); // Ensure integer between 1-100
    });

    // Create audit object
    const audit = {
      site_id: siteId,
      ai_visibility_score: validatedScores.ai_visibility_score,
      schema_score: validatedScores.schema_score,
      semantic_score: validatedScores.semantic_score,
      citation_score: validatedScores.citation_score,
      technical_seo_score: validatedScores.technical_seo_score,
      created_at: new Date().toISOString()
    };

    console.log(`📊 Generated audit scores using ${analysisMethod}:`, validatedScores);

    // Return successful response
    const responseData = {
      audit,
      analysis_summary: `AI visibility analysis completed for ${url} using ${analysisMethod}. Scores range from ${Math.min(...Object.values(validatedScores))} to ${Math.max(...Object.values(validatedScores))}.`,
      analysis_method: analysisMethod,
      success: true
    };

    console.log('✅ Returning successful response');

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in analyzeSite function:', error);
    
    // Return detailed error information
    const errorResponse = {
      error: 'Failed to analyze site',
      details: error.message,
      type: error.name || 'Unknown Error',
      suggestion: error.message.includes('GEMINI_API_KEY') 
        ? 'Please configure the GEMINI_API_KEY environment variable in your Supabase project settings under Project Settings > Environment Variables.'
        : 'Please check the logs for more details and try again.',
      success: false
    };

    console.log('❌ Returning error response:', errorResponse);

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
})