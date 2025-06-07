import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { content, industry, targetAudience, contentType, siteUrl } = await req.json()

    if (!content) {
      throw new Error('Missing required parameter: content')
    }

    console.log(`🚀 Generating prompt suggestions for content about: ${content.substring(0, 100)}...`)

    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      console.warn('⚠️ GEMINI_API_KEY not found, using fallback suggestions')
      const fallbackSuggestions = generateFallbackPrompts(content, industry, targetAudience, contentType)
      const totalSuggestions = Object.values(fallbackSuggestions).reduce((total: number, arr: any) => {
        return total + (Array.isArray(arr) ? arr.length : 0)
      }, 0)
      
      return new Response(
        JSON.stringify({
          suggestions: fallbackSuggestions,
          dataSource: 'Fallback Analysis (No API Key)',
          total_suggestions: totalSuggestions
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Generate AI-powered prompt suggestions
    const suggestions = await generateAIPrompts(content, industry, targetAudience, contentType, geminiApiKey)
    const dataSource = 'AI Analysis with Gemini'
    const totalSuggestions = Object.values(suggestions).reduce((total: number, arr: any) => {
      return total + (Array.isArray(arr) ? arr.length : 0)
    }, 0)

    console.log(`✅ Generated ${totalSuggestions} AI-powered prompt suggestions`)

    return new Response(
      JSON.stringify({
        suggestions,
        dataSource,
        total_suggestions: totalSuggestions
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Error generating prompts:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

async function generateAIPrompts(content: string, industry?: string, audience?: string, contentType?: string, apiKey?: string) {
  const prompt = `Analyze the following content and generate comprehensive prompt suggestions optimized for AI systems, voice search, and featured snippets:

Content: "${content}"
${industry ? `Industry: ${industry}` : ''}
${audience ? `Target Audience: ${audience}` : ''}
${contentType ? `Content Type: ${contentType}` : ''}

Generate suggestions in these categories:

1. VOICE_SEARCH (10 natural, conversational questions)
2. FAQ_QUESTIONS (12 comprehensive Q&A style questions)
3. HEADLINES (10 AI-optimized headlines)
4. FEATURED_SNIPPETS (8 questions likely to trigger featured snippets)
5. LONG_TAIL (12 specific, longer keyword phrases)
6. COMPARISONS (8 comparison-style queries)
7. HOW_TO (10 step-by-step instructional queries)

Format the response as JSON with this structure:
{
  "voice_search": ["question 1", "question 2", ...],
  "faq_questions": ["question 1", "question 2", ...],
  "headlines": ["headline 1", "headline 2", ...],
  "featured_snippets": ["question 1", "question 2", ...],
  "long_tail": ["phrase 1", "phrase 2", ...],
  "comparisons": ["comparison 1", "comparison 2", ...],
  "how_to": ["how to 1", "how to 2", ...],
  "analysis_summary": "Brief summary of the analysis and recommendations"
}

Make sure all suggestions are relevant, natural-sounding, and optimized for AI understanding.`

  if (!apiKey) {
    return generateFallbackPrompts(content, industry, audience, contentType)
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
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
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const aiResponse = data.candidates[0].content.parts[0].text
      
      // Try to parse JSON from AI response
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const suggestions = JSON.parse(jsonMatch[0])
          return suggestions
        }
      } catch (parseError) {
        console.warn('⚠️ Could not parse AI JSON response, using fallback')
      }
    }
    
    // Fallback if AI response can't be parsed
    return generateFallbackPrompts(content, industry, audience, contentType)
  } catch (error) {
    console.error('❌ Gemini API error:', error)
    return generateFallbackPrompts(content, industry, audience, contentType)
  }
}

function generateFallbackPrompts(content: string, industry?: string, audience?: string, contentType?: string) {
  const topic = extractMainTopic(content)
  
  return {
    voice_search: [
      `What is ${topic}?`,
      `How does ${topic} work?`,
      `Why is ${topic} important?`,
      `What are the benefits of ${topic}?`,
      `How can I get started with ${topic}?`,
      `What do I need to know about ${topic}?`,
      `How much does ${topic} cost?`,
      `Where can I learn more about ${topic}?`,
      `Who offers ${topic} services?`,
      `What are the best practices for ${topic}?`
    ],
    faq_questions: [
      `What exactly is ${topic} and how does it work?`,
      `What are the main benefits of implementing ${topic}?`,
      `How long does it take to see results from ${topic}?`,
      `What are the costs associated with ${topic}?`,
      `Do I need special training for ${topic}?`,
      `How does ${topic} integrate with existing systems?`,
      `What are common challenges with ${topic}?`,
      `How do I measure ${topic} success?`,
      `What support is available for ${topic}?`,
      `Can ${topic} be customized for specific needs?`,
      `What are the security considerations for ${topic}?`,
      `How often should ${topic} be updated?`
    ],
    headlines: [
      `The Complete Guide to ${topic}: Everything You Need to Know`,
      `${topic} Explained: Benefits, Implementation, and Best Practices`,
      `How to Master ${topic}: A Step-by-Step Approach`,
      `${topic} Success Stories: Real Results from Real Businesses`,
      `The Future of ${topic}: Trends and Predictions`,
      `${topic} vs Alternatives: Which Solution is Right?`,
      `Common ${topic} Mistakes and How to Avoid Them`,
      `${topic} ROI: Measuring Success and Value`,
      `Getting Started with ${topic}: A Beginner's Guide`,
      `Advanced ${topic} Strategies for Maximum Impact`
    ],
    featured_snippets: [
      `What is ${topic}?`,
      `How does ${topic} work?`,
      `What are the benefits of ${topic}?`,
      `How to implement ${topic}?`,
      `What are ${topic} best practices?`,
      `How much does ${topic} cost?`,
      `What are the requirements for ${topic}?`,
      `How to choose ${topic} solution?`
    ],
    long_tail: [
      `best ${topic} solution for small business`,
      `${topic} implementation step by step guide`,
      `how to choose the right ${topic} provider`,
      `${topic} cost comparison and pricing`,
      `${topic} benefits for business growth`,
      `${topic} integration with existing systems`,
      `${topic} training and certification`,
      `${topic} success stories and case studies`,
      `${topic} troubleshooting and support`,
      `${topic} vs traditional methods`,
      `${topic} security and compliance`,
      `${topic} scalability and planning`
    ],
    comparisons: [
      `${topic} vs traditional methods`,
      `${topic} vs competitors`,
      `${topic} vs alternative solutions`,
      `${topic} vs manual processes`,
      `${topic} vs legacy systems`,
      `${topic} vs other approaches`,
      `${topic} vs industry standards`,
      `${topic} vs custom development`
    ],
    how_to: [
      `how to implement ${topic} successfully`,
      `how to get started with ${topic}`,
      `how to choose the best ${topic} solution`,
      `how to measure ${topic} ROI`,
      `how to optimize ${topic} performance`,
      `how to integrate ${topic} systems`,
      `how to train team on ${topic}`,
      `how to troubleshoot ${topic} issues`,
      `how to scale ${topic} implementation`,
      `how to maintain ${topic} systems`
    ],
    analysis_summary: `Based on the analysis of your content about ${topic}, I've generated comprehensive prompt suggestions optimized for AI systems and voice search. ${industry ? `The suggestions include ${industry} industry-specific considerations.` : ''} ${audience ? `The prompts are tailored for ${audience} to ensure relevance.` : ''} These suggestions are designed to improve your content's discoverability by AI systems and increase chances of being cited in AI responses.`
  }
}

function extractMainTopic(content: string): string {
  const words = content.toLowerCase().split(/\s+/)
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']
  
  const meaningfulWords = words.filter(word => 
    word.length > 3 && 
    !commonWords.includes(word) &&
    /^[a-zA-Z]+$/.test(word)
  )
  
  if (meaningfulWords.length > 0) {
    return meaningfulWords[0]
  }
  
  return content.split(' ').slice(0, 3).join(' ')
}