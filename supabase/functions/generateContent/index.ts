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
    const { topic, contentType, industry, targetAudience, tone, length, siteUrl } = await req.json()

    if (!topic || !contentType) {
      throw new Error('Missing required parameters: topic, contentType')
    }

    console.log(`🚀 Generating ${contentType} content for topic: ${topic}`)

    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      console.warn('⚠️ GEMINI_API_KEY not found, using fallback content')
      const fallbackContent = generateFallbackContent(topic, contentType, industry, targetAudience, tone)
      const wordCount = fallbackContent.split(/\s+/).filter(word => word.length > 0).length
      
      return new Response(
        JSON.stringify({
          content: fallbackContent,
          dataSource: 'Fallback Content (No API Key)',
          wordCount
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Generate AI-powered content using Gemini
    const content = await generateAIContent(topic, contentType, industry, targetAudience, tone, length, geminiApiKey)
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length
    const dataSource = 'AI Generated with Gemini'

    console.log(`✅ Generated ${wordCount} word ${contentType} content`)

    return new Response(
      JSON.stringify({
        content,
        dataSource,
        wordCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Error generating content:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

async function generateAIContent(topic: string, contentType: string, industry?: string, audience?: string, tone?: string, length?: string, apiKey?: string): Promise<string> {
  const prompts = {
    blogOutline: `Create a comprehensive blog post outline about "${topic}". ${industry ? `Focus on the ${industry} industry.` : ''} ${audience ? `Target audience: ${audience}.` : ''} ${tone ? `Use a ${tone} tone.` : ''} ${length ? `Length: ${length}.` : ''}

Include:
1. Compelling headline
2. Introduction with hook
3. Main sections with subpoints
4. Conclusion with call-to-action
5. FAQ section

Make it SEO-friendly and optimized for AI understanding.`,

    faqSection: `Create a comprehensive FAQ section about "${topic}". ${industry ? `Focus on ${industry} industry applications.` : ''} ${audience ? `Target audience: ${audience}.` : ''} 

Include 10-15 questions and detailed answers that cover:
- Basic concepts and definitions
- Implementation and getting started
- Benefits and advantages
- Common challenges and solutions
- Best practices and tips

Format as Q&A with clear, informative answers.`,

    metaDescription: `Write 3 different meta descriptions for a page about "${topic}". ${industry ? `Industry: ${industry}.` : ''} Each should be:
- 150-160 characters
- Include primary keyword
- Compelling and click-worthy
- Accurately describe the content

Format as numbered list.`,

    productDescription: `Write a compelling product/service description for "${topic}". ${industry ? `Industry: ${industry}.` : ''} ${audience ? `Target audience: ${audience}.` : ''} ${tone ? `Tone: ${tone}.` : ''}

Include:
- Compelling headline
- Key features and benefits
- Value proposition
- Use cases and applications
- Call-to-action

Make it conversion-focused and AI-friendly.`,

    socialPost: `Create 5 different social media posts about "${topic}". ${tone ? `Tone: ${tone}.` : ''} Include:
- LinkedIn professional post
- Twitter/X thread starter
- Facebook engaging post
- Instagram caption
- General social media post

Each should be platform-appropriate with relevant hashtags.`,

    emailNewsletter: `Create an email newsletter section about "${topic}". ${industry ? `Industry focus: ${industry}.` : ''} ${audience ? `Audience: ${audience}.` : ''} ${tone ? `Tone: ${tone}.` : ''}

Include:
- Compelling subject line
- Engaging introduction
- Main content with value
- Call-to-action
- Sign-off

Make it engaging and informative.`,

    landingPageCopy: `Write compelling landing page copy for "${topic}". ${industry ? `Industry: ${industry}.` : ''} ${audience ? `Target audience: ${audience}.` : ''} ${tone ? `Tone: ${tone}.` : ''}

Include:
- Attention-grabbing headline
- Subheadline with value proposition
- Key benefits (3-5 bullet points)
- Social proof section
- Strong call-to-action
- FAQ section

Focus on conversion optimization.`,

    pressRelease: `Write a professional press release about "${topic}". ${industry ? `Industry: ${industry}.` : ''}

Include:
- Compelling headline
- Dateline and location
- Lead paragraph with key information
- Supporting details and quotes
- Company background
- Contact information

Follow standard press release format.`
  }

  const prompt = prompts[contentType as keyof typeof prompts] || prompts.blogOutline

  if (!apiKey) {
    return generateFallbackContent(topic, contentType, industry, audience, tone)
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
          temperature: 0.8,
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
      return data.candidates[0].content.parts[0].text
    } else {
      throw new Error('Invalid response from Gemini API')
    }
  } catch (error) {
    console.error('❌ Gemini API error:', error)
    return generateFallbackContent(topic, contentType, industry, audience, tone)
  }
}

function generateFallbackContent(topic: string, contentType: string, industry?: string, audience?: string, tone?: string): string {
  switch (contentType) {
    case 'blogOutline':
      return `# ${topic}: A Comprehensive Guide

## Introduction
- What is ${topic} and why it matters
- Current trends and market overview
- Who this guide is for

## Understanding ${topic}
- Key concepts and definitions
- Benefits and advantages
- Common use cases

## Implementation Guide
- Getting started steps
- Best practices
- Common challenges and solutions

## Advanced Strategies
- Optimization techniques
- Expert tips and tricks
- Future considerations

## Conclusion
- Key takeaways
- Next steps
- Additional resources

## FAQ Section
- Common questions and answers
- Troubleshooting tips
- Expert recommendations`

    case 'faqSection':
      return `# Frequently Asked Questions: ${topic}

**Q: What is ${topic}?**
A: ${topic} is a comprehensive approach that helps organizations achieve their goals through proven strategies and best practices.

**Q: Who can benefit from ${topic}?**
A: ${topic} is valuable for businesses of all sizes and professionals seeking to improve their capabilities.

**Q: How long does implementation take?**
A: Implementation timelines vary, but most see results within 30-90 days depending on scope and complexity.

**Q: What are the main benefits?**
A: Key benefits include improved efficiency, cost savings, better results, and competitive advantages.

**Q: What support is available?**
A: Comprehensive support includes training, documentation, consultation, and ongoing assistance.`

    case 'metaDescription':
      return `1. Discover comprehensive ${topic} solutions designed to deliver results. Expert guidance and proven strategies for your success.

2. Professional ${topic} services and consulting. Get expert implementation support and proven methodologies for optimal outcomes.

3. Transform your approach to ${topic} with our comprehensive solutions. Expert guidance, proven strategies, and measurable results.`

    default:
      return `# ${topic}

This comprehensive guide covers everything you need to know about ${topic}, including implementation strategies, best practices, and proven approaches for success.

## Key Benefits
- Improved efficiency and results
- Cost-effective implementation
- Expert guidance and support
- Proven methodologies

## Getting Started
Contact our team to learn more about how ${topic} can benefit your organization and help you achieve your objectives.`
  }
}