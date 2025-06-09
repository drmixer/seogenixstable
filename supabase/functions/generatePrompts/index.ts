import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

// Helper function to extract and parse JSON from AI response with enhanced logic
function extractAndParseJSON(aiResponse: string): any {
  console.log(`🔍 Attempting to extract JSON from AI response: ${aiResponse.substring(0, 500)}...`);
  
  // Clean the response first
  let cleanResponse = aiResponse.trim();
  
  // Remove common prefixes and suffixes that might interfere
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
        // Return the longest match (most likely to be complete)
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
    
    // Method 5: Look for specific structure patterns and build JSON
    () => {
      // Try to extract arrays for each category
      const categories = ['voice_search', 'faq_questions', 'headlines', 'featured_snippets', 'long_tail', 'comparisons', 'how_to'];
      const result = {};
      let foundAny = false;
      
      for (const category of categories) {
        const pattern = new RegExp(`"${category}"\\s*:\\s*\\[(.*?)\\]`, 'is');
        const match = cleanResponse.match(pattern);
        if (match) {
          try {
            const arrayContent = `[${match[1]}]`;
            const parsed = JSON.parse(arrayContent);
            result[category] = parsed;
            foundAny = true;
          } catch (e) {
            // Try to extract strings manually
            const items = match[1].split(',').map(item => 
              item.trim().replace(/^["']|["']$/g, '')
            ).filter(item => item.length > 0);
            if (items.length > 0) {
              result[category] = items;
              foundAny = true;
            }
          }
        }
      }
      
      // Look for analysis_summary
      const summaryPattern = /"analysis_summary"\s*:\s*"([^"]*?)"/i;
      const summaryMatch = cleanResponse.match(summaryPattern);
      if (summaryMatch) {
        result['analysis_summary'] = summaryMatch[1];
        foundAny = true;
      }
      
      return foundAny ? JSON.stringify(result) : null;
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
          // Check if we have at least some expected categories
          const expectedCategories = ['voice_search', 'faq_questions', 'headlines'];
          const hasExpectedStructure = expectedCategories.some(cat => 
            parsed[cat] && Array.isArray(parsed[cat]) && parsed[cat].length > 0
          );
          
          if (hasExpectedStructure || Object.keys(parsed).length > 3) {
            console.log(`✅ Successfully parsed JSON with method ${i + 1}:`, Object.keys(parsed));
            return parsed;
          } else {
            console.warn(`⚠️ Method ${i + 1} parsed but structure seems incomplete:`, Object.keys(parsed));
          }
        } else {
          console.warn(`⚠️ Method ${i + 1} parsed but not an object`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Method ${i + 1} failed:`, error.message);
    }
  }
  
  throw new Error('Could not extract valid JSON from AI response');
}

// Helper function to generate fallback suggestions
function generateFallbackSuggestions(content: string): any {
  const contentWords = content.split(' ').slice(0, 5).join(' ');
  
  return {
    voice_search: [
      `What is ${contentWords}?`,
      `How does ${contentWords} work?`,
      `Tell me about ${contentWords}`,
      `What are the benefits of ${contentWords}?`,
      `How can I get started with ${contentWords}?`,
      `Is ${contentWords} right for me?`,
      `Where can I learn more about ${contentWords}?`
    ],
    faq_questions: [
      `What is ${contentWords}?`,
      `How does it work?`,
      `What are the main benefits?`,
      `How much does it cost?`,
      `How do I get started?`,
      `Is it suitable for my needs?`,
      `What makes it different?`,
      `How long does it take?`,
      `What support is available?`,
      `Can I try it first?`
    ],
    headlines: [
      `Complete Guide to ${contentWords}`,
      `Everything You Need to Know About ${contentWords}`,
      `${contentWords}: Benefits and Best Practices`,
      `How to Choose the Right ${contentWords}`,
      `${contentWords} Explained: A Comprehensive Overview`,
      `The Ultimate ${contentWords} Resource`
    ],
    featured_snippets: [
      `What is ${contentWords}?`,
      `How to use ${contentWords}?`,
      `Benefits of ${contentWords}`,
      `${contentWords} vs alternatives`,
      `Best practices for ${contentWords}`,
      `${contentWords} cost and pricing`,
      `How ${contentWords} works`,
      `${contentWords} getting started guide`
    ],
    long_tail: [
      `best ${contentWords} for small business`,
      `how to implement ${contentWords} effectively`,
      `${contentWords} pricing and packages`,
      `${contentWords} reviews and testimonials`,
      `step by step ${contentWords} guide`,
      `${contentWords} vs competitors comparison`,
      `affordable ${contentWords} solutions`,
      `${contentWords} for beginners tutorial`,
      `professional ${contentWords} services`,
      `${contentWords} benefits and features`
    ],
    comparisons: [
      `${contentWords} vs competitors`,
      `Which ${contentWords} is best?`,
      `${contentWords} comparison guide`,
      `Pros and cons of ${contentWords}`,
      `${contentWords} alternatives`,
      `Best ${contentWords} options`
    ],
    how_to: [
      `How to get started with ${contentWords}`,
      `How to choose ${contentWords}`,
      `How to implement ${contentWords}`,
      `How to optimize ${contentWords}`,
      `How to use ${contentWords} effectively`,
      `How to evaluate ${contentWords}`,
      `How to set up ${contentWords}`
    ],
    analysis_summary: `Generated comprehensive suggestions based on content analysis. The content appears to focus on ${contentWords}. These suggestions are optimized for AI systems, voice search, and featured snippets to improve visibility and citation potential.`
  };
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
    const { content, industry, targetAudience, contentType, siteUrl } = await req.json()

    // Validate required parameters
    if (!content) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameter: content',
          type: 'ValidationError'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🚀 Generating AI prompt suggestions for content analysis`);

    // Build context information
    let contextInfo = `Content to analyze: ${content.substring(0, 2000)}...`;
    if (industry) contextInfo += `\nIndustry: ${industry}`;
    if (targetAudience) contextInfo += `\nTarget Audience: ${targetAudience}`;
    if (contentType) contextInfo += `\nContent Type: ${contentType}`;
    if (siteUrl) contextInfo += `\nWebsite: ${siteUrl}`;

    // Create comprehensive prompt for generating AI-optimized suggestions with very specific format requirements
    const prompt = `You are an AI prompt optimization expert. Analyze the content and generate AI-optimized suggestions.

${contextInfo}

Generate suggestions in exactly this JSON format with NO additional text before or after:

{
  "voice_search": ["question 1", "question 2", "question 3", "question 4", "question 5"],
  "faq_questions": ["question 1", "question 2", "question 3", "question 4", "question 5", "question 6", "question 7", "question 8"],
  "headlines": ["headline 1", "headline 2", "headline 3", "headline 4", "headline 5"],
  "featured_snippets": ["snippet question 1", "snippet question 2", "snippet question 3", "snippet question 4", "snippet question 5"],
  "long_tail": ["long tail 1", "long tail 2", "long tail 3", "long tail 4", "long tail 5", "long tail 6", "long tail 7"],
  "comparisons": ["comparison 1", "comparison 2", "comparison 3", "comparison 4", "comparison 5"],
  "how_to": ["how to 1", "how to 2", "how to 3", "how to 4", "how to 5"],
  "analysis_summary": "Brief summary of the analysis and opportunities"
}

Requirements:
- voice_search: Natural conversational questions for voice assistants
- faq_questions: Common questions that could be answered by this content
- headlines: AI-optimized headlines for maximum visibility
- featured_snippets: Questions likely to trigger featured snippets
- long_tail: Specific longer phrases with commercial intent
- comparisons: Comparison-style questions for competitive content
- how_to: Step-by-step instructional queries
- analysis_summary: Brief analysis summary

CRITICAL: Return ONLY the JSON object above, no explanatory text, no markdown formatting, just the raw JSON.`;

    let suggestions;
    let analysisMethod = 'AI-powered';

    // Check if Gemini API key is available
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    console.log(`🔑 Environment check - GEMINI_API_KEY: ${apiKey ? 'PRESENT' : 'MISSING'}`);
    
    if (apiKey) {
      try {
        console.log(`🤖 Calling Gemini API for prompt analysis`);
        
        // Call Gemini API to generate the suggestions
        const aiResponse = await callGeminiAPI(prompt);
        
        console.log(`✅ Gemini API returned response`);

        // Try to parse the JSON response using robust extraction
        try {
          suggestions = extractAndParseJSON(aiResponse);
          console.log(`✅ Successfully parsed AI suggestions:`, Object.keys(suggestions));
          analysisMethod = 'AI-powered (Gemini 2.5 Flash Preview)';
        } catch (parseError) {
          console.error('❌ Failed to parse AI response:', parseError);
          console.log('Raw AI response:', aiResponse);
          throw parseError; // This will trigger the fallback below
        }
      } catch (aiError) {
        console.error(`❌ AI prompt generation failed with error:`, aiError);
        const errorInfo = extractErrorInfo(aiError);
        console.log(`🔄 Falling back to template-based suggestions due to: ${errorInfo.message}`);
        
        suggestions = generateFallbackSuggestions(content);
        analysisMethod = `Template-based (AI failed: ${errorInfo.message})`;
      }
    } else {
      console.log(`⚠️ GEMINI_API_KEY not configured, using template-based suggestions`);
      suggestions = generateFallbackSuggestions(content);
      analysisMethod = 'Template-based (API key not configured)';
    }

    // Count total suggestions
    const totalSuggestions = Object.values(suggestions).reduce((total, arr) => {
      return total + (Array.isArray(arr) ? arr.length : 0);
    }, 0);

    console.log(`📊 Generated ${totalSuggestions} prompt suggestions using ${analysisMethod}`);

    // Return successful response
    return new Response(
      JSON.stringify({
        suggestions,
        dataSource: analysisMethod,
        total_suggestions: totalSuggestions
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Error in generatePrompts function:', error);
    
    // Extract error information safely
    const errorInfo = extractErrorInfo(error);
    
    // Return detailed error information
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate prompts',
        details: errorInfo.message,
        type: errorInfo.type
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})