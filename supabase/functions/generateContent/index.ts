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
    const { topic, contentType, industry, targetAudience, tone, length, siteUrl } = await req.json()

    // Validate required parameters
    if (!topic || !contentType) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: topic or contentType' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🚀 Generating ${contentType} content for topic: ${topic}`);

    // Build context information
    let contextInfo = `Topic: ${topic}\nContent Type: ${contentType}`;
    if (industry) contextInfo += `\nIndustry: ${industry}`;
    if (targetAudience) contextInfo += `\nTarget Audience: ${targetAudience}`;
    if (tone) contextInfo += `\nTone: ${tone}`;
    if (length) contextInfo += `\nLength: ${length}`;
    if (siteUrl) contextInfo += `\nWebsite: ${siteUrl}`;

    // Create content-type specific prompts
    let prompt = '';
    
    switch (contentType) {
      case 'blogOutline':
        prompt = `Create a comprehensive blog post outline for the topic "${topic}".

${contextInfo}

Please create a detailed blog outline that includes:
1. Compelling headline
2. Introduction hook
3. Main sections with subpoints
4. Key takeaways
5. Call-to-action
6. SEO considerations

Format in markdown with clear structure. Make it AI-friendly and optimized for search visibility.`;
        break;

      case 'faqSection':
        prompt = `Create a comprehensive FAQ section for the topic "${topic}".

${contextInfo}

Please create 8-12 frequently asked questions and detailed answers that cover:
1. Basic questions about the topic
2. Common concerns or objections
3. Technical or process questions
4. Pricing or value questions
5. Getting started questions

Format as Q&A pairs in markdown. Make answers comprehensive and helpful for both users and AI systems.`;
        break;

      case 'metaDescription':
        prompt = `Create optimized meta descriptions for the topic "${topic}".

${contextInfo}

Please create 3-5 different meta description options (150-160 characters each) that:
1. Include the main keyword naturally
2. Clearly describe the content value
3. Include a compelling call-to-action
4. Are optimized for click-through rates
5. Appeal to the target audience

Format as a numbered list with character counts.`;
        break;

      case 'productDescription':
        prompt = `Create a compelling product/service description for "${topic}".

${contextInfo}

Please create a comprehensive description that includes:
1. Product/service overview
2. Key features and benefits
3. Who it's for (target audience)
4. How it works or delivery process
5. Why choose this solution
6. Getting started information

Format in markdown with clear sections. Focus on benefits and value proposition.`;
        break;

      case 'socialPost':
        prompt = `Create social media posts for the topic "${topic}".

${contextInfo}

Please create 5 different social media posts for different platforms:
1. LinkedIn (professional, 1-2 paragraphs)
2. Twitter/X (concise, with hashtags)
3. Facebook (engaging, community-focused)
4. Instagram (visual-friendly with emojis)
5. General (platform-agnostic)

Include relevant hashtags and calls-to-action for each platform.`;
        break;

      case 'emailNewsletter':
        prompt = `Create an email newsletter content for the topic "${topic}".

${contextInfo}

Please create newsletter content that includes:
1. Compelling subject line options
2. Opening hook/greeting
3. Main content sections
4. Value-driven information
5. Call-to-action
6. Closing and next steps

Format in markdown with clear sections. Focus on providing value and building relationships.`;
        break;

      case 'landingPageCopy':
        prompt = `Create landing page copy for the topic "${topic}".

${contextInfo}

Please create comprehensive landing page content that includes:
1. Compelling headline and subheadline
2. Value proposition
3. Key benefits (3-5 points)
4. Social proof elements
5. Feature descriptions
6. FAQ section
7. Strong call-to-action

Format in markdown with clear sections. Focus on conversion optimization and clarity.`;
        break;

      case 'pressRelease':
        prompt = `Create a press release for the topic "${topic}".

${contextInfo}

Please create a professional press release that includes:
1. Compelling headline
2. Dateline and location
3. Opening paragraph (who, what, when, where, why)
4. Supporting details and quotes
5. Company background
6. Contact information section

Format in standard press release structure. Make it newsworthy and professional.`;
        break;

      default:
        prompt = `Create high-quality content for the topic "${topic}" in the format of ${contentType}.

${contextInfo}

Please create comprehensive, well-structured content that is:
1. Informative and valuable
2. Optimized for AI understanding
3. Engaging for the target audience
4. Properly formatted in markdown
5. SEO-friendly

Focus on providing real value and actionable information.`;
    }

    console.log(`🤖 Calling Gemini API for content generation`);
    
    // Call Gemini API to generate the content
    const generatedContent = await callGeminiAPI(prompt);
    
    console.log(`✅ Gemini API returned ${generatedContent.length} characters`);

    // Calculate word count
    const wordCount = generatedContent.split(/\s+/).filter(word => word.length > 0).length;

    console.log(`📊 Generated content: ${wordCount} words, type: ${contentType}`);

    // Return successful response
    return new Response(
      JSON.stringify({
        content: generatedContent,
        dataSource: 'AI Generated Content',
        wordCount,
        contentType,
        topic
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Error in generateContent function:', error);
    
    // Return detailed error information
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate content',
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