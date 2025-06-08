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

// Helper function to call Gemini API with the EXACT structure handling from the error
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
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_NONE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH", 
        threshold: "BLOCK_NONE"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_NONE"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_NONE"
      }
    ]
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
    console.log(`📋 Response structure keys:`, Object.keys(data));
    
    // Handle the EXACT structure from the error: {content, finishReason, index}
    let responseText = '';
    
    if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
      console.log(`📝 Found candidates array with ${data.candidates.length} items`);
      const candidate = data.candidates[0];
      console.log(`📋 Candidate available keys:`, Object.keys(candidate));
      
      // The error message shows: "Available keys: content, finishReason, index"
      // So we need to handle this exact structure
      if (candidate.content) {
        console.log(`📋 Content type:`, typeof candidate.content);
        console.log(`📋 Content structure:`, candidate.content);
        
        // Handle different content structures
        if (typeof candidate.content === 'string') {
          // Content is directly a string
          responseText = candidate.content;
          console.log(`✅ Successfully extracted text from candidates[0].content (direct string)`);
        } else if (candidate.content && typeof candidate.content === 'object') {
          // Content is an object, check for parts array
          if (candidate.content.parts && Array.isArray(candidate.content.parts) && candidate.content.parts.length > 0) {
            if (candidate.content.parts[0].text) {
              responseText = candidate.content.parts[0].text;
              console.log(`✅ Successfully extracted text from candidates[0].content.parts[0].text`);
            } else {
              console.log(`📋 Parts[0] structure:`, Object.keys(candidate.content.parts[0]));
              // Try other possible text properties in parts[0]
              const part = candidate.content.parts[0];
              if (part.content) responseText = part.content;
              else if (part.message) responseText = part.message;
              else if (part.response) responseText = part.response;
              else {
                throw new Error(`No text found in parts[0]. Available keys: ${Object.keys(part).join(', ')}`);
              }
              console.log(`✅ Successfully extracted text from alternative parts[0] property`);
            }
          } else if (candidate.content.text) {
            // Content object has direct text property
            responseText = candidate.content.text;
            console.log(`✅ Successfully extracted text from candidates[0].content.text`);
          } else {
            // Log the content structure and try to find any text-like property
            console.log(`📋 Content object keys:`, Object.keys(candidate.content));
            const textProps = ['message', 'response', 'output', 'result', 'generated_text'];
            let found = false;
            for (const prop of textProps) {
              if (candidate.content[prop] && typeof candidate.content[prop] === 'string') {
                responseText = candidate.content[prop];
                console.log(`✅ Successfully extracted text from candidates[0].content.${prop}`);
                found = true;
                break;
              }
            }
            if (!found) {
              throw new Error(`No text found in content object. Available keys: ${Object.keys(candidate.content).join(', ')}`);
            }
          }
        } else {
          throw new Error(`Unexpected content type: ${typeof candidate.content}`);
        }
      } else {
        // No content property, check for other text properties on candidate
        console.log(`❌ No content property found. Candidate keys: ${Object.keys(candidate).join(', ')}`);
        const textProps = ['text', 'message', 'response', 'output', 'result'];
        let found = false;
        for (const prop of textProps) {
          if (candidate[prop] && typeof candidate[prop] === 'string') {
            responseText = candidate[prop];
            console.log(`✅ Successfully extracted text from candidates[0].${prop}`);
            found = true;
            break;
          }
        }
        if (!found) {
          throw new Error(`Invalid candidate structure in Gemini API response. Available keys: ${Object.keys(candidate).join(', ')}`);
        }
      }
    } else {
      // No candidates array, try other top-level properties
      console.log(`❌ No candidates array found. Data keys: ${Object.keys(data).join(', ')}`);
      const textProps = ['text', 'content', 'message', 'response', 'output', 'result'];
      let found = false;
      for (const prop of textProps) {
        if (data[prop] && typeof data[prop] === 'string') {
          responseText = data[prop];
          console.log(`✅ Successfully extracted text from data.${prop}`);
          found = true;
          break;
        }
      }
      if (!found) {
        throw new Error(`Unrecognized response structure from Gemini API. Available keys: ${Object.keys(data).join(', ')}`);
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

// Helper function to extract and parse JSON from AI response with enhanced error handling
function extractAndParseJSON(aiResponse: string): any {
  console.log(`🔍 Attempting to extract JSON from AI response: ${aiResponse.substring(0, 300)}...`);
  
  // Clean the response first
  let cleanResponse = aiResponse.trim();
  
  // Remove common prefixes that might interfere
  const prefixPatterns = [
    /^Here's the JSON.*?:/i,
    /^Here is the JSON.*?:/i,
    /^The JSON.*?:/i,
    /^JSON.*?:/i,
    /^Based on.*?:/i,
    /^Analysis.*?:/i,
    /^Entity.*?:/i
  ];
  
  prefixPatterns.forEach(pattern => {
    cleanResponse = cleanResponse.replace(pattern, '');
  });
  
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
    },
    
    // Method 5: Look for entities array and build JSON structure
    () => {
      const entitiesMatch = cleanResponse.match(/"entities"\s*:\s*\[([\s\S]*?)\]/i);
      if (entitiesMatch) {
        try {
          const entitiesArray = JSON.parse(`[${entitiesMatch[1]}]`);
          const summaryMatch = cleanResponse.match(/"analysis_summary"\s*:\s*"([^"]*?)"/i);
          const totalMatch = cleanResponse.match(/"total_entities"\s*:\s*(\d+)/i);
          const scoreMatch = cleanResponse.match(/"coverage_score"\s*:\s*(\d+)/i);
          
          return JSON.stringify({
            entities: entitiesArray,
            analysis_summary: summaryMatch ? summaryMatch[1] : "Entity analysis completed",
            total_entities: totalMatch ? parseInt(totalMatch[1]) : entitiesArray.length,
            coverage_score: scoreMatch ? parseInt(scoreMatch[1]) : 75
          });
        } catch (e) {
          return null;
        }
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
          // Check if we have entities array
          if (parsed.entities && Array.isArray(parsed.entities)) {
            console.log(`✅ Successfully parsed JSON with method ${i + 1}: ${parsed.entities.length} entities found`);
            return parsed;
          } else if (Object.keys(parsed).length > 0) {
            console.log(`✅ Successfully parsed JSON with method ${i + 1}:`, Object.keys(parsed));
            return parsed;
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Method ${i + 1} failed:`, error.message);
    }
  }
  
  throw new Error('Could not extract valid JSON from AI response');
}

// Helper function to generate fallback entity analysis
function generateFallbackEntityAnalysis(url: string, content: string, siteId: string): any {
  const domain = new URL(url).hostname;
  const siteName = domain.replace('www.', '').split('.')[0];
  const capitalizedSiteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
  
  // Analyze content for common business entities
  const contentLower = content.toLowerCase();
  const entities = [];
  
  // Business-related entities with smarter detection
  const businessEntities = [
    { name: capitalizedSiteName, type: 'Organization', importance: 'high', keywords: [siteName.toLowerCase(), capitalizedSiteName.toLowerCase()] },
    { name: 'Professional Services', type: 'Service Category', importance: 'high', keywords: ['service', 'professional', 'solution'] },
    { name: 'Business Solutions', type: 'Service Category', importance: 'medium', keywords: ['business', 'solution', 'enterprise'] },
    { name: 'Customer Support', type: 'Service Feature', importance: 'medium', keywords: ['support', 'customer', 'help'] },
    { name: 'Quality Assurance', type: 'Process', importance: 'medium', keywords: ['quality', 'assurance', 'testing'] },
    { name: 'Project Management', type: 'Service Feature', importance: 'medium', keywords: ['project', 'management', 'planning'] },
    { name: 'Consultation', type: 'Service Type', importance: 'high', keywords: ['consult', 'advice', 'expert'] },
    { name: 'Implementation', type: 'Process', importance: 'medium', keywords: ['implement', 'deploy', 'setup'] },
    { name: 'Training', type: 'Service Feature', importance: 'low', keywords: ['training', 'education', 'learning'] },
    { name: 'Maintenance', type: 'Service Feature', importance: 'low', keywords: ['maintenance', 'support', 'upkeep'] },
    { name: 'Technology', type: 'Concept', importance: 'medium', keywords: ['technology', 'tech', 'digital'] },
    { name: 'Innovation', type: 'Concept', importance: 'low', keywords: ['innovation', 'innovative', 'cutting-edge'] }
  ];
  
  // Check which entities are mentioned in the content
  businessEntities.forEach(entity => {
    let mentions = 0;
    
    // Count mentions based on keywords
    entity.keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = content.match(regex) || [];
      mentions += matches.length;
    });
    
    // Determine if there's a gap based on importance and mention count
    const expectedMentions = entity.importance === 'high' ? 3 : entity.importance === 'medium' ? 2 : 1;
    const gap = mentions < expectedMentions;
    
    entities.push({
      site_id: siteId,
      entity_name: entity.name,
      entity_type: entity.type,
      mention_count: mentions,
      gap: gap,
      created_at: new Date().toISOString()
    });
  });
  
  const entitiesWithGoodCoverage = entities.filter(e => !e.gap);
  const coverageScore = Math.round((entitiesWithGoodCoverage.length / entities.length) * 100);
  
  return {
    entities: entities,
    analysis_summary: `Entity coverage analysis completed for ${capitalizedSiteName}. Found ${entitiesWithGoodCoverage.length} well-covered entities and ${entities.filter(e => e.gap).length} entities with coverage gaps. Focus on improving coverage for high-importance entities to enhance AI understanding.`,
    total_entities: entities.length,
    coverage_score: coverageScore
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
        
        // Prepare the prompt for AI entity analysis with very specific instructions
        const analysisPrompt = `You are an entity coverage expert. Analyze this website content and identify key entities with their coverage levels.

Website URL: ${url}
Title: ${metadata.title || 'Not available'}
Meta Description: ${metadata.description || 'Not available'}
Content: ${websiteContent}

Analyze the content and identify 8-12 important entities (people, organizations, concepts, technologies, services, products, locations, etc.) that are relevant to this business/website.

For each entity, determine:
1. Entity name
2. Entity type (Organization, Person, Concept, Technology, Service, Product, Location, etc.)
3. Mention count (how many times it appears in the content)
4. Whether there's a coverage gap (true if mentioned less than expected for its importance)

CRITICAL: Return ONLY this JSON object with NO additional text:

{
  "entities": [
    {
      "entity_name": "Entity Name",
      "entity_type": "Entity Type", 
      "mention_count": 5,
      "gap": false
    }
  ],
  "analysis_summary": "Brief summary of the entity coverage analysis",
  "total_entities": 10,
  "coverage_score": 75
}

Focus on business/organization entities, service/product entities, technology/concept entities, and industry-specific entities.

IMPORTANT: Return ONLY the JSON object above, no explanatory text, no markdown formatting.`;

        console.log(`🤖 Calling Gemini API for entity analysis`);
        
        // Call Gemini API to analyze entities
        const aiAnalysis = await callGeminiAPI(analysisPrompt);
        
        console.log(`✅ Gemini API returned analysis: ${aiAnalysis.substring(0, 200)}...`);

        // Parse the AI response to extract entity data
        try {
          const parsedResult = extractAndParseJSON(aiAnalysis);
          console.log(`✅ Successfully parsed AI entity analysis`);
          
          // Add siteId to each entity and ensure proper structure
          if (parsedResult.entities && Array.isArray(parsedResult.entities)) {
            parsedResult.entities = parsedResult.entities.map(entity => ({
              site_id: siteId,
              entity_name: entity.entity_name || 'Unknown Entity',
              entity_type: entity.entity_type || 'Unknown',
              mention_count: entity.mention_count || 0,
              gap: entity.gap !== undefined ? entity.gap : false,
              created_at: new Date().toISOString()
            }));
          } else {
            throw new Error('No entities array found in AI response');
          }
          
          // Ensure we have all required fields
          analysisResult = {
            entities: parsedResult.entities,
            analysis_summary: parsedResult.analysis_summary || 'Entity analysis completed successfully',
            total_entities: parsedResult.total_entities || parsedResult.entities.length,
            coverage_score: parsedResult.coverage_score || 75
          };
          
          analysisMethod = 'AI-powered (Gemini 2.5 Flash Preview)';
        } catch (parseError) {
          console.error('❌ Failed to parse AI entity analysis:', parseError);
          console.log('Raw AI response:', aiAnalysis);
          throw parseError; // This will trigger the fallback below
        }
      } catch (aiError) {
        console.error(`❌ AI entity analysis failed with error:`, aiError);
        console.log(`🔄 Falling back to rule-based entity analysis`);
        
        analysisResult = generateFallbackEntityAnalysis(url, websiteContent, siteId);
        analysisMethod = `Rule-based (AI failed: ${aiError.message})`;
      }
    } else {
      console.log(`⚠️ GEMINI_API_KEY not configured, using rule-based entity analysis`);
      analysisResult = generateFallbackEntityAnalysis(url, websiteContent, siteId);
      analysisMethod = 'Rule-based (API key not configured)';
    }

    console.log(`📊 Generated entity analysis using ${analysisMethod}: ${analysisResult.entities.length} entities found`);

    // Return successful response
    const responseData = {
      entities: analysisResult.entities,
      analysis_summary: analysisResult.analysis_summary,
      total_entities: analysisResult.total_entities,
      coverage_score: analysisResult.coverage_score,
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