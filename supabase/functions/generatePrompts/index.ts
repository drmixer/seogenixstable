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

// Helper function to extract and parse JSON from AI response
function extractAndParseJSON(aiResponse: string): any {
  console.log(`🔍 Attempting to extract JSON from AI response: ${aiResponse.substring(0, 300)}...`);
  
  // Try multiple approaches to extract JSON
  const jsonExtractionMethods = [
    // Method 1: Look for JSON block with ```json
    () => {
      const jsonBlockMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/i);
      return jsonBlockMatch ? jsonBlockMatch[1].trim() : null;
    },
    
    // Method 2: Look for JSON block with ```
    () => {
      const codeBlockMatch = aiResponse.match(/```\s*([\s\S]*?)\s*```/);
      return codeBlockMatch ? codeBlockMatch[1].trim() : null;
    },
    
    // Method 3: Look for any JSON-like structure
    () => {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      return jsonMatch ? jsonMatch[0] : null;
    },
    
    // Method 4: Try to find array structures
    () => {
      const arrayMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        // If we find an array, try to wrap it in an object
        try {
          const arrayContent = JSON.parse(arrayMatch[0]);
          return JSON.stringify({ suggestions: arrayContent });
        } catch {
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
        console.log(`🎯 Method ${i + 1} extracted: ${extractedJson.substring(0, 200)}...`);
        
        // Clean up the JSON string
        let cleanJson = extractedJson
          .replace(/^\s*```json\s*/i, '')
          .replace(/^\s*```\s*/, '')
          .replace(/\s*```\s*$/, '')
          .trim();
        
        // Try to parse the JSON
        const parsed = JSON.parse(cleanJson);
        
        // Validate that we have a reasonable structure
        if (typeof parsed === 'object' && parsed !== null) {
          console.log(`✅ Successfully parsed JSON with method ${i + 1}:`, Object.keys(parsed));
          return parsed;
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
      `How can I get started with ${contentWords}?`
    ],
    faq_questions: [
      `What is ${contentWords}?`,
      `How does it work?`,
      `What are the main benefits?`,
      `How much does it cost?`,
      `How do I get started?`,
      `Is it suitable for my needs?`,
      `What makes it different?`,
      `How long does it take?`
    ],
    headlines: [
      `Complete Guide to ${contentWords}`,
      `Everything You Need to Know About ${contentWords}`,
      `${contentWords}: Benefits and Best Practices`,
      `How to Choose the Right ${contentWords}`,
      `${contentWords} Explained: A Comprehensive Overview`
    ],
    featured_snippets: [
      `What is ${contentWords}?`,
      `How to use ${contentWords}?`,
      `Benefits of ${contentWords}`,
      `${contentWords} vs alternatives`,
      `Best practices for ${contentWords}`
    ],
    long_tail: [
      `best ${contentWords} for small business`,
      `how to implement ${contentWords} effectively`,
      `${contentWords} pricing and packages`,
      `${contentWords} reviews and testimonials`,
      `step by step ${contentWords} guide`
    ],
    comparisons: [
      `${contentWords} vs competitors`,
      `Which ${contentWords} is best?`,
      `${contentWords} comparison guide`,
      `Pros and cons of ${contentWords}`
    ],
    how_to: [
      `How to get started with ${contentWords}`,
      `How to choose ${contentWords}`,
      `How to implement ${contentWords}`,
      `How to optimize ${contentWords}`
    ],
    analysis_summary: `Generated suggestions based on content analysis. The content appears to focus on ${contentWords}. Consider creating comprehensive content that answers these common questions and queries.`
  };
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
          error: 'Missing required parameter: content' 
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

    // Create comprehensive prompt for generating AI-optimized suggestions
    const prompt = `You are an AI prompt optimization expert. Analyze the following content and generate comprehensive AI-optimized prompt suggestions.

${contextInfo}

IMPORTANT: Return ONLY a JSON object with the following structure, no other text:

{
  "voice_search": [5-7 natural, conversational questions people would ask voice assistants],
  "faq_questions": [8-10 frequently asked questions that could be answered by this content],
  "headlines": [5-6 AI-optimized headlines that would attract both users and AI systems],
  "featured_snippets": [6-8 questions likely to trigger featured snippets in search results],
  "long_tail": [8-10 specific, longer phrases with high conversion potential],
  "comparisons": [5-6 comparison-style questions for competitive content],
  "how_to": [5-7 step-by-step instructional queries for tutorial content],
  "analysis_summary": "A brief summary of the content analysis and optimization opportunities"
}

Focus on:
1. Natural language patterns used in voice search and AI queries
2. Questions that would help the content get cited in AI responses
3. Conversational, question-based formats
4. Long-tail keywords with commercial intent
5. Comparison and evaluation queries
6. How-to and instructional formats

Make all suggestions specific to the content provided and optimized for AI understanding and citation.

RETURN ONLY THE JSON OBJECT:`;

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
        console.log(`🔄 Falling back to template-based suggestions`);
        
        suggestions = generateFallbackSuggestions(content);
        analysisMethod = `Template-based (AI failed: ${aiError.message})`;
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
    
    // Return detailed error information
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate prompts',
        details: error.message,
        type: error.name || 'Unknown Error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})