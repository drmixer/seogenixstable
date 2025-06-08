import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to call Gemini API
async function callGeminiAPI(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
        maxOutputTokens: 2048,
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid response from Gemini API');
  }

  return data.candidates[0].content.parts[0].text;
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
    const prompt = `Analyze the following content and generate comprehensive AI-optimized prompt suggestions:

${contextInfo}

Please generate suggestions in the following categories and return them as a JSON object:

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

Make all suggestions specific to the content provided and optimized for AI understanding and citation.`;

    console.log(`🤖 Calling Gemini API for prompt analysis`);
    
    // Call Gemini API to generate the suggestions
    const aiResponse = await callGeminiAPI(prompt);
    
    console.log(`✅ Gemini API returned response`);

    // Try to parse the JSON response
    let suggestions;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.warn('Failed to parse JSON response, creating fallback suggestions');
      
      // Fallback suggestions if JSON parsing fails
      suggestions = {
        voice_search: [
          `What is ${content.split(' ').slice(0, 3).join(' ')}?`,
          `How does ${content.split(' ').slice(0, 3).join(' ')} work?`,
          `Tell me about ${content.split(' ').slice(0, 3).join(' ')}`,
          `What are the benefits of ${content.split(' ').slice(0, 3).join(' ')}?`,
          `How can I get started with ${content.split(' ').slice(0, 3).join(' ')}?`
        ],
        faq_questions: [
          `What is ${content.split(' ').slice(0, 3).join(' ')}?`,
          `How does it work?`,
          `What are the main benefits?`,
          `How much does it cost?`,
          `How do I get started?`,
          `Is it suitable for my needs?`,
          `What makes it different?`,
          `How long does it take?`
        ],
        headlines: [
          `Complete Guide to ${content.split(' ').slice(0, 3).join(' ')}`,
          `Everything You Need to Know About ${content.split(' ').slice(0, 3).join(' ')}`,
          `${content.split(' ').slice(0, 3).join(' ')}: Benefits and Best Practices`,
          `How to Choose the Right ${content.split(' ').slice(0, 3).join(' ')}`,
          `${content.split(' ').slice(0, 3).join(' ')} Explained: A Comprehensive Overview`
        ],
        featured_snippets: [
          `What is ${content.split(' ').slice(0, 3).join(' ')}?`,
          `How to use ${content.split(' ').slice(0, 3).join(' ')}?`,
          `Benefits of ${content.split(' ').slice(0, 3).join(' ')}`,
          `${content.split(' ').slice(0, 3).join(' ')} vs alternatives`,
          `Best practices for ${content.split(' ').slice(0, 3).join(' ')}`
        ],
        long_tail: [
          `best ${content.split(' ').slice(0, 3).join(' ')} for small business`,
          `how to implement ${content.split(' ').slice(0, 3).join(' ')} effectively`,
          `${content.split(' ').slice(0, 3).join(' ')} pricing and packages`,
          `${content.split(' ').slice(0, 3).join(' ')} reviews and testimonials`,
          `step by step ${content.split(' ').slice(0, 3).join(' ')} guide`
        ],
        comparisons: [
          `${content.split(' ').slice(0, 3).join(' ')} vs competitors`,
          `Which ${content.split(' ').slice(0, 3).join(' ')} is best?`,
          `${content.split(' ').slice(0, 3).join(' ')} comparison guide`,
          `Pros and cons of ${content.split(' ').slice(0, 3).join(' ')}`
        ],
        how_to: [
          `How to get started with ${content.split(' ').slice(0, 3).join(' ')}`,
          `How to choose ${content.split(' ').slice(0, 3).join(' ')}`,
          `How to implement ${content.split(' ').slice(0, 3).join(' ')}`,
          `How to optimize ${content.split(' ').slice(0, 3).join(' ')}`
        ],
        analysis_summary: `Generated fallback suggestions based on content analysis. The content appears to focus on ${content.split(' ').slice(0, 5).join(' ')}. Consider creating comprehensive content that answers these common questions and queries.`
      };
    }

    // Count total suggestions
    const totalSuggestions = Object.values(suggestions).reduce((total, arr) => {
      return total + (Array.isArray(arr) ? arr.length : 0);
    }, 0);

    console.log(`📊 Generated ${totalSuggestions} prompt suggestions across all categories`);

    // Return successful response
    return new Response(
      JSON.stringify({
        suggestions,
        dataSource: 'AI Analysis',
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