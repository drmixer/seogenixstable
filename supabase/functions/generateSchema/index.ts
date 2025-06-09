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
  
  // Limit to first 3000 characters to stay within API limits
  return text.substring(0, 3000);
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
    throw new Error('GEMINI_API_KEY environment variable is not set. Please configure this in your Supabase project settings.');
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
        // Alternative structure: candidate has direct text property
        responseText = candidate.text;
        console.log(`✅ Successfully extracted text from candidates[0].text`);
      } else if (candidate.output) {
        // Another alternative: candidate has output property
        responseText = candidate.output;
        console.log(`✅ Successfully extracted text from candidates[0].output`);
      } else {
        console.error(`❌ Invalid candidate structure:`, JSON.stringify(candidate, null, 2));
        throw new Error('Invalid candidate structure in Gemini API response');
      }
    } 
    // Method 2: Direct text property
    else if (data.text) {
      responseText = data.text;
      console.log(`✅ Successfully extracted text from data.text`);
    } 
    // Method 3: Content property
    else if (data.content) {
      responseText = data.content;
      console.log(`✅ Successfully extracted text from data.content`);
    }
    // Method 4: Output property
    else if (data.output) {
      responseText = data.output;
      console.log(`✅ Successfully extracted text from data.output`);
    }
    // Method 5: Response property
    else if (data.response) {
      responseText = data.response;
      console.log(`✅ Successfully extracted text from data.response`);
    }
    // Method 6: Check if data itself is a string
    else if (typeof data === 'string') {
      responseText = data;
      console.log(`✅ Successfully extracted text from data (string)`);
    }
    // Method 7: Look for any text-like property
    else {
      // Try to find any property that contains text
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

// Helper function to generate fallback schema
function generateFallbackSchema(url: string, schemaType: string, metadata: any): string {
  const domain = new URL(url).hostname;
  const siteName = domain.replace('www.', '').split('.')[0];
  const capitalizedSiteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
  
  switch (schemaType) {
    case 'Organization':
      return `{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "${metadata.title || capitalizedSiteName}",
  "url": "${url}",
  "description": "${metadata.description || 'Professional services and solutions provider'}",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "url": "${url}"
  }
}`;

    case 'LocalBusiness':
      return `{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "${metadata.title || capitalizedSiteName}",
  "url": "${url}",
  "description": "${metadata.description || 'Local business providing professional services'}",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "City",
    "addressRegion": "State",
    "addressCountry": "US"
  }
}`;

    case 'Product':
      return `{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "${metadata.title || capitalizedSiteName + ' Product'}",
  "description": "${metadata.description || 'Professional product or service offering'}",
  "url": "${url}",
  "brand": {
    "@type": "Brand",
    "name": "${capitalizedSiteName}"
  }
}`;

    case 'FAQ':
      return `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What services does ${capitalizedSiteName} offer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We provide professional services and solutions. Visit our website for detailed information."
      }
    },
    {
      "@type": "Question", 
      "name": "How can I contact ${capitalizedSiteName}?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can contact us through our website at ${url}."
      }
    }
  ]
}`;

    case 'HowTo':
      return `{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to get started with ${capitalizedSiteName}",
  "description": "Step-by-step guide to getting started",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Visit our website",
      "text": "Go to ${url} to learn more about our services"
    },
    {
      "@type": "HowToStep", 
      "name": "Contact us",
      "text": "Reach out through our contact form or phone"
    }
  ]
}`;

    case 'Article':
      return `{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "${metadata.title || capitalizedSiteName}",
  "description": "${metadata.description || 'Professional article content'}",
  "url": "${url}",
  "author": {
    "@type": "Organization",
    "name": "${capitalizedSiteName}"
  }
}`;

    case 'Event':
      return `{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "${metadata.title || capitalizedSiteName + ' Event'}",
  "description": "${metadata.description || 'Professional event or service'}",
  "url": "${url}",
  "organizer": {
    "@type": "Organization",
    "name": "${capitalizedSiteName}"
  }
}`;

    default:
      return `{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "${metadata.title || capitalizedSiteName}",
  "url": "${url}",
  "description": "${metadata.description || 'Professional website providing valuable services and information'}"
}`;
  }
}

// Helper function to safely extract error information
function extractErrorInfo(error: any): { message: string; type: string; details?: string } {
  let message = 'Unknown error occurred';
  let type = 'UnknownError';
  let details = undefined;

  try {
    if (error) {
      // Handle different error types
      if (typeof error === 'string') {
        message = error;
        type = 'StringError';
      } else if (error instanceof Error) {
        message = error.message || 'Error instance without message';
        type = error.name || 'Error';
        details = error.stack;
      } else if (typeof error === 'object') {
        // Handle object-like errors
        message = error.message || error.msg || error.error || JSON.stringify(error);
        type = error.name || error.type || error.code || 'ObjectError';
        details = error.stack || error.details;
      } else {
        message = String(error);
        type = typeof error;
      }
    }
  } catch (extractError) {
    console.error('Error while extracting error info:', extractError);
    message = 'Error occurred while processing error information';
    type = 'ErrorExtractionError';
  }

  return { message, type, details };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 generateSchema function called');
    
    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      const errorInfo = extractErrorInfo(parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body - must be valid JSON',
          details: errorInfo.message,
          type: errorInfo.type
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { url, schemaType } = requestData;

    // Validate required parameters
    if (!url || !schemaType) {
      console.error('❌ Missing required parameters:', { url: !!url, schemaType: !!schemaType });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: url or schemaType',
          type: 'ValidationError'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🚀 Starting schema generation for ${url} (${schemaType})`);

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
      console.warn(`⚠️ Failed to fetch website content:`, fetchError);
      const errorInfo = extractErrorInfo(fetchError);
      console.log(`🔄 Falling back to URL-based analysis due to: ${errorInfo.message}`);
      
      // Fallback: analyze based on URL and domain
      const domain = new URL(url).hostname;
      websiteContent = `Website: ${url}\nDomain: ${domain}\nNote: Content could not be fetched directly.`;
    }

    let generatedSchema;
    let analysisMethod = 'AI-powered';

    // Check if Gemini API key is available
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    console.log(`🔑 Environment check - GEMINI_API_KEY: ${apiKey ? 'PRESENT' : 'MISSING'}`);
    
    if (apiKey) {
      try {
        console.log(`🤖 Attempting AI schema generation with Gemini API`);
        
        // Prepare the prompt for AI schema generation
        const schemaPrompt = `You are a Schema.org expert. Generate valid JSON-LD schema markup for this website.

Website URL: ${url}
Title: ${metadata.title || 'Not available'}
Meta Description: ${metadata.description || 'Not available'}
Content: ${websiteContent}
Schema Type: ${schemaType}

Generate a complete, valid JSON-LD schema markup for the "${schemaType}" schema type based on the website content.

Requirements:
1. Use proper Schema.org vocabulary
2. Include all relevant properties for the schema type
3. Base the content on the actual website information
4. Return ONLY the JSON-LD markup, no other text
5. Ensure the JSON is valid and properly formatted

IMPORTANT: Return ONLY the JSON-LD schema markup, starting with { and ending with }`;

        console.log(`🤖 Calling Gemini API for schema generation`);
        
        // Call Gemini API to generate the schema
        const aiResponse = await callGeminiAPI(schemaPrompt);
        
        console.log(`✅ Gemini API returned schema: ${aiResponse.substring(0, 200)}...`);

        // Try to extract and validate JSON from the response
        try {
          // Clean up the response to extract JSON
          let cleanResponse = aiResponse.trim();
          
          // Remove any markdown code blocks
          cleanResponse = cleanResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
          
          // Find JSON content
          const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const jsonString = jsonMatch[0];
            
            // Validate JSON
            const parsedSchema = JSON.parse(jsonString);
            
            // Format the JSON nicely
            generatedSchema = JSON.stringify(parsedSchema, null, 2);
            
            console.log(`✅ Successfully generated AI schema`);
            analysisMethod = 'AI-powered (Gemini 2.5 Flash Preview)';
          } else {
            throw new Error('No valid JSON found in AI response');
          }
        } catch (parseError) {
          console.error('❌ Failed to parse AI schema response:', parseError);
          console.log('Raw AI response:', aiResponse);
          throw parseError; // This will trigger the fallback below
        }
      } catch (aiError) {
        console.error(`❌ AI schema generation failed with error:`, aiError);
        const errorInfo = extractErrorInfo(aiError);
        console.log(`🔄 Falling back to template-based schema generation due to: ${errorInfo.message}`);
        
        generatedSchema = generateFallbackSchema(url, schemaType, metadata);
        analysisMethod = `Template-based (AI failed: ${errorInfo.message})`;
      }
    } else {
      console.log(`⚠️ GEMINI_API_KEY not configured, using template-based schema generation`);
      generatedSchema = generateFallbackSchema(url, schemaType, metadata);
      analysisMethod = 'Template-based (API key not configured)';
    }

    console.log(`📊 Generated schema using ${analysisMethod}`);

    // Return successful response
    const responseData = {
      schema: generatedSchema,
      analysis_method: analysisMethod,
      schema_type: schemaType,
      success: true
    };

    console.log('✅ Returning successful schema generation response');

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in generateSchema function:', error);
    
    // Extract error information safely
    const errorInfo = extractErrorInfo(error);
    
    // Return detailed error information
    const errorResponse = {
      error: 'Failed to generate schema',
      details: errorInfo.message,
      type: errorInfo.type,
      suggestion: errorInfo.message.includes('GEMINI_API_KEY') 
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