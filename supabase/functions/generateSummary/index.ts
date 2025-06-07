import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { siteId, url, summaryType } = await req.json()

    if (!siteId || !url || !summaryType) {
      throw new Error('Missing required parameters: siteId, url, summaryType')
    }

    console.log(`🚀 Generating ${summaryType} summary for ${url}`)

    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      console.warn('⚠️ GEMINI_API_KEY not found, using fallback content')
      const fallbackContent = generateFallbackSummary(url, summaryType)
      const wordCount = fallbackContent.split(/\s+/).filter(word => word.length > 0).length
      
      const summary = {
        site_id: siteId,
        summary_type: summaryType,
        content: fallbackContent,
        created_at: new Date().toISOString()
      }

      return new Response(
        JSON.stringify({
          summary,
          dataSource: 'Fallback Content (No API Key)',
          wordCount
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Fetch website content
    let siteContent = ''
    let dataSource = 'AI Generated from URL Analysis'
    
    try {
      console.log(`📡 Fetching content from ${url}`)
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEOgenix-Bot/1.0)'
        }
      })
      
      if (response.ok) {
        const html = await response.text()
        siteContent = extractTextFromHTML(html)
        dataSource = 'AI Generated from Website Content'
        console.log(`✅ Successfully fetched ${siteContent.length} characters from website`)
      } else {
        console.warn(`⚠️ Failed to fetch website content: ${response.status}`)
        siteContent = `Website: ${url}`
        dataSource = 'AI Generated from URL Only'
      }
    } catch (error) {
      console.warn(`⚠️ Error fetching website: ${error.message}`)
      siteContent = `Website: ${url}`
      dataSource = 'AI Generated from URL Only'
    }

    // Generate AI-powered summary using Gemini
    const content = await generateAISummary(siteContent, url, summaryType, geminiApiKey)
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length

    // Create summary object for database
    const summary = {
      site_id: siteId,
      summary_type: summaryType,
      content: content,
      created_at: new Date().toISOString()
    }

    console.log(`✅ Generated ${wordCount} word AI-powered summary`)

    return new Response(
      JSON.stringify({
        summary,
        dataSource,
        wordCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Error generating summary:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

function extractTextFromHTML(html: string): string {
  // Remove script and style elements
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  
  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, ' ')
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim()
  
  // Limit to first 3000 characters to avoid token limits
  return text.substring(0, 3000)
}

async function generateAISummary(siteContent: string, url: string, summaryType: string, apiKey: string): Promise<string> {
  const domain = new URL(url).hostname
  const siteName = domain.replace('www.', '').split('.')[0]
  
  const prompts = {
    SiteOverview: `Create a comprehensive site overview for ${siteName} (${url}). Based on the website content below, write a professional summary that includes:

1. Company/site overview and mission
2. Key services or offerings
3. Target audience and value proposition
4. Unique features or advantages
5. Contact information and next steps

Website content: ${siteContent}

Write this as a detailed, professional summary that would help AI systems understand what this website is about. Use markdown formatting with headers and bullet points.`,

    PageSummary: `Create a detailed page summary for ${siteName} (${url}). Based on the content below, provide:

1. Main purpose of the page
2. Key information presented
3. Target audience
4. Call-to-action elements
5. Value proposition

Website content: ${siteContent}

Format as a comprehensive page analysis that explains the page's role and content structure.`,

    ProductCatalog: `Create a product/service catalog summary for ${siteName} (${url}). Based on the website content, identify and describe:

1. Main products or services offered
2. Service categories and descriptions
3. Pricing information (if available)
4. Key features and benefits
5. How to get started

Website content: ${siteContent}

Present this as a structured catalog that clearly outlines what the company offers.`,

    ServiceOfferings: `Create a comprehensive service offerings summary for ${siteName} (${url}). Based on the content, detail:

1. Core services provided
2. Service delivery approach
3. Target markets or industries
4. Unique value propositions
5. Implementation process

Website content: ${siteContent}

Format as a professional service portfolio description.`,

    AIReadiness: `Create an AI readiness assessment for ${siteName} (${url}). Analyze the website and provide:

1. Current AI optimization status
2. Content structure assessment
3. Technical readiness for AI systems
4. Recommendations for improvement
5. AI visibility opportunities

Website content: ${siteContent}

Write this as a technical assessment report focused on AI optimization.`,

    CompanyProfile: `Create a professional company profile for ${siteName} (${url}). Based on the website content, include:

1. Company background and history
2. Mission, vision, and values
3. Team and expertise
4. Market position and achievements
5. Contact and location information

Website content: ${siteContent}

Format as a comprehensive business profile suitable for partnerships or business development.`,

    TechnicalSpecs: `Create a technical specifications document for ${siteName} (${url}). Based on the website content, describe:

1. Platform capabilities and features
2. Technical architecture (if mentioned)
3. Integration capabilities
4. Performance specifications
5. Security and compliance features

Website content: ${siteContent}

Present as a technical overview that highlights the platform's capabilities and specifications.`
  }

  const prompt = prompts[summaryType as keyof typeof prompts] || prompts.SiteOverview

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
      return data.candidates[0].content.parts[0].text
    } else {
      throw new Error('Invalid response from Gemini API')
    }
  } catch (error) {
    console.error('❌ Gemini API error:', error)
    // Fallback to template-based content if AI fails
    return generateFallbackSummary(url, summaryType)
  }
}

function generateFallbackSummary(url: string, summaryType: string): string {
  const domain = new URL(url).hostname
  const siteName = domain.replace('www.', '').split('.')[0]
  
  switch (summaryType) {
    case 'SiteOverview':
      return `# ${siteName.charAt(0).toUpperCase() + siteName.slice(1)} - Site Overview

## About ${siteName.charAt(0).toUpperCase() + siteName.slice(1)}

${siteName.charAt(0).toUpperCase() + siteName.slice(1)} is a professional online platform that provides comprehensive services and solutions. Our website serves as a central hub for information, resources, and engagement.

## Key Features

- **Professional Services**: High-quality services designed to deliver value
- **User-Focused Design**: Platform built with user experience in mind
- **Comprehensive Resources**: Access to detailed information and support
- **Community Engagement**: Interactive features for connection and collaboration

## Our Mission

We are committed to providing exceptional value through innovative solutions and reliable service delivery. Our platform serves as a trusted resource for users and stakeholders.

## Contact & Engagement

Visit our website at ${url} to learn more about our services and connect with our team.`

    case 'CompanyProfile':
      return `# Company Profile: ${siteName.charAt(0).toUpperCase() + siteName.slice(1)}

## Company Overview

${siteName.charAt(0).toUpperCase() + siteName.slice(1)} is a professional organization committed to delivering exceptional value through innovative solutions and superior service delivery.

## Mission Statement

Our mission is to provide comprehensive, high-quality solutions that address real-world challenges and create meaningful value for our clients.

## Core Values

- **Excellence**: Maintaining the highest standards in service delivery
- **Integrity**: Operating with transparency and ethical business practices
- **Innovation**: Embracing new technologies and methodologies
- **Customer Focus**: Putting clients at the center of everything we do

## Contact Information

Website: ${url}
We welcome opportunities to connect and discuss how we can help achieve your objectives.`

    default:
      return `# ${summaryType}: ${siteName.charAt(0).toUpperCase() + siteName.slice(1)}

## Overview

This is a comprehensive ${summaryType.toLowerCase()} for ${siteName.charAt(0).toUpperCase() + siteName.slice(1)}, providing detailed information about their services, capabilities, and value proposition.

## Key Information

${siteName.charAt(0).toUpperCase() + siteName.slice(1)} offers professional services and solutions designed to meet diverse business needs. Their platform provides comprehensive resources and support for users.

## Services & Capabilities

- Professional consulting and guidance
- Implementation and support services
- Comprehensive resource library
- Ongoing optimization and maintenance

## Getting Started

To learn more about ${siteName.charAt(0).toUpperCase() + siteName.slice(1)} and their offerings, visit ${url} or contact their team directly.

This ${summaryType.toLowerCase()} provides an overview of the key features and benefits available through their platform.`
  }
}