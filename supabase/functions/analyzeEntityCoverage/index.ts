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
  
  // Limit to first 8000 characters to stay within API limits
  return text.substring(0, 8000);
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

// Helper function to call Gemini API with improved response handling
async function callGeminiAPI(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  
  console.log(`🔑 API Key check: ${apiKey ? `Present (${apiKey.substring(0, 10)}...)` : 'NOT FOUND'}`);
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
  console.log(`🌐 Making request to: ${apiUrl.replace(apiKey, 'HIDDEN_KEY')}`);

  const requestBody = {
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
  };

  console.log(`📤 Request body prepared, prompt length: ${prompt.length} characters`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`📥 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Gemini API error response: ${errorText}`);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Gemini API response received`);
    console.log(`📋 Full response structure:`, JSON.stringify(data, null, 2));
    
    // Handle different possible response structures with improved logic
    let responseText = '';
    
    // Method 1: Standard candidates structure
    if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
      console.log(`📝 Found candidates array with ${data.candidates.length} items`);
      const candidate = data.candidates[0];
      
      if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts) && candidate.content.parts.length > 0) {
        responseText = candidate.content.parts[0].text;
        console.log(`✅ Successfully extracted text from candidates[0].content.parts[0].text`);
      } else if (candidate.text) {
        responseText = candidate.text;
        console.log(`✅ Successfully extracted text from candidates[0].text`);
      } else if (candidate.output) {
        responseText = candidate.output;
        console.log(`✅ Successfully extracted text from candidates[0].output`);
      } else {
        console.error(`❌ Invalid candidate structure:`, JSON.stringify(candidate, null, 2));
        throw new Error('Invalid candidate structure in Gemini API response');
      }
    } 
    else if (data.text) {
      responseText = data.text;
      console.log(`✅ Successfully extracted text from data.text`);
    } 
    else if (data.content) {
      responseText = data.content;
      console.log(`✅ Successfully extracted text from data.content`);
    }
    else if (data.output) {
      responseText = data.output;
      console.log(`✅ Successfully extracted text from data.output`);
    }
    else if (data.response) {
      responseText = data.response;
      console.log(`✅ Successfully extracted text from data.response`);
    }
    else if (typeof data === 'string') {
      responseText = data;
      console.log(`✅ Successfully extracted text from data (string)`);
    }
    else {
      const textProperties = ['message', 'result', 'generated_text', 'completion'];
      let found = false;
      
      for (const prop of textProperties) {
        if (data[prop] && typeof data[prop] === 'string') {
          responseText = data[prop];
          console.log(`✅ Successfully extracted text from data.${prop}`);
          found = true;
          break;
        }
      }
      
      if (!found) {
        console.error(`❌ Unrecognized Gemini API response structure:`, JSON.stringify(data, null, 2));
        throw new Error('Unrecognized response structure from Gemini API');
      }
    }

    if (!responseText || responseText.trim().length === 0) {
      throw new Error('Empty response text from Gemini API');
    }

    console.log(`📝 Gemini response length: ${responseText.length} characters`);
    console.log(`📝 Response preview: ${responseText.substring(0, 200)}...`);
    
    return responseText;
  } catch (fetchError) {
    console.error(`❌ Fetch error calling Gemini API:`, fetchError);
    throw fetchError;
  }
}

// Helper function to extract and parse JSON from AI response
function extractAndParseJSON(aiResponse: string): any {
  console.log(`🔍 Attempting to extract JSON from AI response: ${aiResponse.substring(0, 300)}...`);
  
  // Clean the response first
  let cleanResponse = aiResponse.trim();
  
  // Remove common prefixes that might interfere
  cleanResponse = cleanResponse.replace(/^Here's the JSON.*?:/i, '');
  cleanResponse = cleanResponse.replace(/^Here is the JSON.*?:/i, '');
  cleanResponse = cleanResponse.replace(/^The JSON.*?:/i, '');
  cleanResponse = cleanResponse.replace(/^JSON.*?:/i, '');
  cleanResponse = cleanResponse.replace(/^Based on.*?:/i, '');
  
  // Try multiple approaches to extract JSON
  const jsonExtractionMethods = [
    // Method 1: Look for JSON block with ```json
    () => {
      const jsonBlockMatch = cleanResponse.match(/```json\s*([\s\S]*?)\s*```/i);
      return jsonBlockMatch ? jsonBlockMatch[1].trim() : null;
    },
    
    // Method 2: Look for JSON block with ```
    () => {
      const codeBlockMatch = cleanResponse.match(/```\s*([\s\S]*?)\s*```/);
      return codeBlockMatch ? codeBlockMatch[1].trim() : null;
    },
    
    // Method 3: Look for the largest JSON-like structure
    () => {
      const jsonMatches = cleanResponse.match(/\{[\s\S]*?\}/g);
      if (jsonMatches && jsonMatches.length > 0) {
        return jsonMatches.reduce((longest, current) => 
          current.length > longest.length ? current : longest
        );
      }
      return null;
    },
    
    // Method 4: Try to find JSON starting from first { to last }
    () => {
      const firstBrace = cleanResponse.indexOf('{');
      const lastBrace = cleanResponse.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return cleanResponse.substring(firstBrace, lastBrace + 1);
      }
      return null;
    }
  ];
  
  for (let i = 0; i < jsonExtractionMethods.length; i++) {
    try {
      const extractedJson = jsonExtractionMethods[i]();
      if (extractedJson) {
        console.log(`🎯 Method ${i + 1} extracted: ${extractedJson.substring(0, 300)}...`);
        
        // Clean up the JSON string
        let cleanJson = extractedJson
          .replace(/^\s*```json\s*/i, '')
          .replace(/^\s*```\s*/, '')
          .replace(/\s*```\s*$/, '')
          .trim();
        
        // Fix common JSON issues
        cleanJson = cleanJson
          .replace(/,\s*}/g, '}')  // Remove trailing commas
          .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // Quote unquoted keys
          .replace(/:\s*'([^']*)'/g, ': "$1"');  // Replace single quotes with double quotes
        
        // Try to parse the JSON
        const parsed = JSON.parse(cleanJson);
        
        // Validate that we have a reasonable structure
        if (typeof parsed === 'object' && parsed !== null) {
          console.log(`✅ Successfully parsed JSON with method ${i + 1}:`, Object.keys(parsed));
          return parsed;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Method ${i + 1} failed:`, error.message);
    }
  }
  
  throw new Error('Could not extract valid JSON from AI response');
}

// Helper function to generate fallback entity analysis
function generateFallbackEntityAnalysis(url: string, content: string): any {
  const domain = new URL(url).hostname;
  const siteName = domain.replace('www.', '').split('.')[0];
  const capitalizedSiteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
  
  // Analyze content for common business entities
  const contentLower = content.toLowerCase();
  const entities = [];
  
  // Business-related entities
  const businessEntities = [
    { name: capitalizedSiteName, type: 'Organization', importance: 'high' },
    { name: 'Professional Services', type: 'Service Category', importance: 'high' },
    { name: 'Business Solutions', type: 'Service Category', importance: 'medium' },
    { name: 'Customer Support', type: 'Service Feature', importance: 'medium' },
    { name: 'Quality Assurance', type: 'Process', importance: 'medium' },
    { name: 'Project Management', type: 'Service Feature', importance: 'medium' },
    { name: 'Consultation', type: 'Service Type', importance: 'high' },
    { name: 'Implementation', type: 'Process', importance: 'medium' },
    { name: 'Training', type: 'Service Feature', importance: 'low' },
    { name: 'Maintenance', type: 'Service Feature', importance: 'low' }
  ];
  
  // Check which entities are mentioned in the content
  businessEntities.forEach(entity => {
    const mentions = (content.match(new RegExp(entity.name, 'gi')) || []).length;
    const gap = mentions < (entity.importance === 'high' ? 3 : entity.importance === 'medium' ? 2 : 1);
    
    entities.push({
      site_id: '', // Will be filled by the caller
      entity_name: entity.name,
      entity_type: entity.type,
      mention_count: mentions,
      gap: gap,
      created_at: new Date().toISOString()
    });
  });
  
  return {
    entities: entities,
    analysis_summary: `Entity coverage analysis completed for ${capitalizedSiteName}. Found ${entities.filter(e => !e.gap).length} well-covered entities and ${entities.filter(e => e.gap).length} entities with coverage gaps. Focus on improving coverage for high-importance entities to enhance AI understanding.`,
    total_entities: entities.length,
    coverage_score: Math.round((entities.filter(e => !e.gap).length / entities.length) * 100)
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 analyzeEntityCoverage function called');
    
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
    if (!siteId || !url) {
      console.error('❌ Missing required parameters:', { siteId: !!siteId, url: !!url });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: siteId or url' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🚀 Starting entity coverage analysis for ${url}`);

    // Fetch the website content
    let websiteContent = '';
    let metadata = { title: '', description: '', keywords: '' };
    
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
      
      console.log(`📝 Extracted ${websiteContent.length} characters of text content`);
      console.log(`📋 Metadata - Title: "${metadata.title}", Description: "${metadata.description}"`);
      
    } catch (fetchError) {
      console.warn(`⚠️ Failed to fetch website content: ${fetchError.message}`);
      console.log(`🔄 Falling back to URL-based analysis`);
      
      // Fallback: analyze based on URL and domain
      const domain = new URL(url).hostname;
      websiteContent = `Website: ${url}\nDomain: ${domain}\nNote: Content could not be fetched directly.`;
    }

    let analysisResult;
    let analysisMethod = 'AI-powered';

    // Check if Gemini API key is available
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    console.log(`🔑 Environment check - GEMINI_API_KEY: ${apiKey ? 'PRESENT' : 'MISSING'}`);
    
    if (apiKey) {
      try {
        console.log(`🤖 Attempting AI entity analysis with Gemini API`);
        
        // Prepare the prompt for AI entity analysis
        const analysisPrompt = `You are an entity coverage expert. Analyze this website content and identify key entities with their coverage levels.

Website URL: ${url}
Title: ${metadata.title || 'Not available'}
Meta Description: ${metadata.description || 'Not available'}
Content: ${websiteContent}

Analyze the content and identify important entities (people, organizations, concepts, technologies, services, products, locations, etc.) that are relevant to this business/website.

For each entity, determine:
1. Entity name
2. Entity type (Organization, Person, Concept, Technology, Service, Product, Location, etc.)
3. Mention count (how many times it appears in the content)
4. Whether there's a coverage gap (true if mentioned less than expected for its importance)

Return ONLY a JSON object with this exact structure:

{
  "entities": [
    {
      "entity_name": "Entity Name",
      "entity_type": "Entity Type",
      "mention_count": number,
      "gap": boolean
    }
  ],
  "analysis_summary": "Brief summary of the entity coverage analysis",
  "total_entities": number,
  "coverage_score": number (1-100)
}

Focus on:
- Business/organization entities
- Service/product entities
- Technology/concept entities
- Industry-specific entities
- Geographic entities if relevant
- Key people/roles if mentioned

IMPORTANT: Return ONLY the JSON object, no other text.`;

        console.log(`🤖 Calling Gemini API for entity analysis`);
        
        // Call Gemini API to analyze entities
        const aiAnalysis = await callGeminiAPI(analysisPrompt);
        
        console.log(`✅ Gemini API returned analysis: ${aiAnalysis.substring(0, 200)}...`);

        // Parse the AI response to extract entity data
        try {
          const parsedResult = extractAndParseJSON(aiAnalysis);
          console.log(`✅ Successfully parsed AI entity analysis:`, parsedResult);
          
          // Add siteId to each entity and ensure proper structure
          if (parsedResult.entities && Array.isArray(parsedResult.entities)) {
            parsedResult.entities = parsedResult.entities.map(entity => ({
              site_id: siteId,
              entity_name: entity.entity_name || 'Unknown Entity',
              entity_type: entity.entity_type || 'Unknown',
              mention_count: entity.mention_count || 0,
              gap: entity.gap || false,
              created_at: new Date().toISOString()
            }));
          }
          
          analysisResult = parsedResult;
          analysisMethod = 'AI-powered (Gemini 2.5 Flash Preview)';
        } catch (parseError) {
          console.error('❌ Failed to parse AI entity analysis:', parseError);
          console.log('Raw AI response:', aiAnalysis);
          throw parseError; // This will trigger the fallback below
        }
      } catch (aiError) {
        console.error(`❌ AI entity analysis failed with error:`, aiError);
        console.log(`🔄 Falling back to rule-based entity analysis`);
        
        analysisResult = generateFallbackEntityAnalysis(url, websiteContent);
        // Add siteId to entities
        analysisResult.entities = analysisResult.entities.map(entity => ({
          ...entity,
          site_id: siteId
        }));
        analysisMethod = `Rule-based (AI failed: ${aiError.message})`;
      }
    } else {
      console.log(`⚠️ GEMINI_API_KEY not configured, using rule-based entity analysis`);
      analysisResult = generateFallbackEntityAnalysis(url, websiteContent);
      // Add siteId to entities
      analysisResult.entities = analysisResult.entities.map(entity => ({
        ...entity,
        site_id: siteId
      }));
      analysisMethod = 'Rule-based (API key not configured)';
    }

    console.log(`📊 Generated entity analysis using ${analysisMethod}: ${analysisResult.entities.length} entities found`);

    // Return successful response
    const responseData = {
      entities: analysisResult.entities,
      analysis_summary: analysisResult.analysis_summary,
      total_entities: analysisResult.total_entities || analysisResult.entities.length,
      coverage_score: analysisResult.coverage_score || 75,
      analysis_method: analysisMethod,
      success: true
    };

    console.log('✅ Returning successful entity analysis response');

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in analyzeEntityCoverage function:', error);
    
    // Return detailed error information
    const errorResponse = {
      error: 'Failed to analyze entity coverage',
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