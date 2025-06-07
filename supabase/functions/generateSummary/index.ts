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
    // Parse request body with error handling
    let requestData
    try {
      requestData = await req.json()
    } catch (parseError) {
      console.error('❌ Failed to parse request JSON:', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    const { siteId, url, summaryType } = requestData

    if (!siteId || !url || !summaryType) {
      console.error('❌ Missing required parameters:', { siteId: !!siteId, url: !!url, summaryType: !!summaryType })
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: siteId, url, summaryType' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    console.log(`🚀 Generating ${summaryType} summary for ${url}`)

    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    console.log(`🔑 API Key status: ${geminiApiKey ? 'Found' : 'Missing'}`)
    
    if (!geminiApiKey || geminiApiKey === 'your-gemini-api-key') {
      console.warn('⚠️ GEMINI_API_KEY not properly configured, using enhanced fallback content')
      const fallbackContent = generateEnhancedFallbackSummary(url, summaryType)
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
          dataSource: 'Enhanced Fallback Content (API Key Not Configured)',
          wordCount
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Fetch website content with proper error handling
    let siteContent = ''
    let dataSource = 'AI Generated from URL Analysis'
    
    try {
      console.log(`📡 Fetching content from ${url}`)
      
      // Validate URL format
      let validUrl
      try {
        validUrl = new URL(url)
      } catch (urlError) {
        console.error('❌ Invalid URL format:', url)
        return new Response(
          JSON.stringify({ error: 'Invalid URL format provided' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout (reduced from 10)
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEOgenix-Bot/1.0; +https://seogemix.com/bot)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const html = await response.text()
        siteContent = extractTextFromHTML(html)
        dataSource = 'AI Generated from Website Content'
        console.log(`✅ Successfully fetched ${siteContent.length} characters from website`)
      } else {
        console.warn(`⚠️ Failed to fetch website content: ${response.status} ${response.statusText}`)
        siteContent = `Website: ${url}\nDomain: ${validUrl.hostname}`
        dataSource = 'AI Generated from URL Analysis'
      }
    } catch (error) {
      console.warn(`⚠️ Error fetching website: ${error.message}`)
      const validUrl = new URL(url) // We know this is valid from earlier check
      siteContent = `Website: ${url}\nDomain: ${validUrl.hostname}`
      dataSource = 'AI Generated from URL Analysis'
    }

    // Generate AI-powered summary using Gemini - this now always returns a string
    console.log(`🤖 Calling Gemini AI for ${summaryType} summary...`)
    const content = await generateAISummary(siteContent, url, summaryType, geminiApiKey)
    
    // Determine data source based on content
    if (content.includes('*This overview provides a comprehensive understanding') || 
        content.includes('This comprehensive') || 
        content.includes('provides an overview of the key features')) {
      dataSource = 'Enhanced Fallback Content (AI Generation Failed)'
    } else {
      dataSource = dataSource.includes('Fallback') ? dataSource : `${dataSource} (Gemini AI)`
    }

    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length

    // Create summary object for database
    const summary = {
      site_id: siteId,
      summary_type: summaryType,
      content: content,
      created_at: new Date().toISOString()
    }

    console.log(`✅ Generated ${wordCount} word summary`)

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
    console.error('❌ Unexpected error in generateSummary function:', error)
    
    // Always return a proper error response
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error occurred while generating summary',
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

function extractTextFromHTML(html: string): string {
  try {
    // Remove script and style elements
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    
    // Extract title
    const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : ''
    
    // Extract meta description
    const metaDescMatch = text.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*?)["'][^>]*>/i)
    const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : ''
    
    // Extract h1-h6 headings
    const headings = []
    const headingMatches = text.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi)
    for (const match of headingMatches) {
      headings.push(match[1].replace(/<[^>]*>/g, '').trim())
    }
    
    // Remove HTML tags
    text = text.replace(/<[^>]*>/g, ' ')
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim()
    
    // Combine extracted content
    let extractedContent = ''
    if (title) extractedContent += `Title: ${title}\n`
    if (metaDesc) extractedContent += `Description: ${metaDesc}\n`
    if (headings.length > 0) extractedContent += `Headings: ${headings.join(', ')}\n`
    extractedContent += `Content: ${text.substring(0, 2000)}`
    
    return extractedContent
  } catch (error) {
    console.error('Error extracting text from HTML:', error)
    return html.substring(0, 1000)
  }
}

async function generateAISummary(siteContent: string, url: string, summaryType: string, apiKey: string): Promise<string> {
  const domain = new URL(url).hostname
  const siteName = domain.replace('www.', '').split('.')[0]
  
  const prompts = {
    SiteOverview: `You are an expert content analyst. Create a comprehensive, professional site overview for the website at ${url}. 

Based on this website content:
${siteContent}

Write a detailed summary that includes:
1. **Company Overview**: What the company/site does and its main purpose
2. **Key Services/Products**: Primary offerings and solutions
3. **Value Proposition**: What makes them unique and valuable
4. **Target Audience**: Who they serve and help
5. **Key Features**: Important capabilities and benefits
6. **Contact/Next Steps**: How to engage with them

Format this as a professional, comprehensive overview using markdown with clear headers. Make it informative and suitable for AI systems to understand and cite. Write 300-500 words.`,

    PageSummary: `Analyze this webpage content and create a detailed page summary:

URL: ${url}
Content: ${siteContent}

Provide:
1. **Page Purpose**: Main goal and function of this page
2. **Key Information**: Most important content and messages
3. **Content Structure**: How information is organized
4. **Target Audience**: Who this page is designed for
5. **Call-to-Actions**: What visitors are encouraged to do
6. **Value Delivered**: What visitors gain from this page

Write a comprehensive analysis in 250-400 words using markdown formatting.`,

    ProductCatalog: `Create a structured product/service catalog based on this website:

URL: ${url}
Content: ${siteContent}

Generate:
1. **Main Offerings**: Primary products or services
2. **Service Categories**: How offerings are organized
3. **Key Features**: Important capabilities and benefits
4. **Pricing Information**: Any available pricing details
5. **Implementation**: How customers can get started
6. **Support**: Available assistance and resources

Format as a professional catalog description in 300-500 words with clear sections.`,

    ServiceOfferings: `Analyze the services offered by this website and create a comprehensive service portfolio:

URL: ${url}
Content: ${siteContent}

Include:
1. **Core Services**: Primary service offerings
2. **Service Delivery**: How services are provided
3. **Industry Focus**: Target markets and specializations
4. **Unique Advantages**: What sets them apart
5. **Implementation Process**: How they work with clients
6. **Results and Outcomes**: What clients can expect

Write 300-500 words in professional format with clear structure.`,

    AIReadiness: `Conduct an AI readiness assessment for this website:

URL: ${url}
Content: ${siteContent}

Evaluate and report on:
1. **Current AI Optimization**: How well the site works with AI systems
2. **Content Structure**: Organization and clarity for AI understanding
3. **Technical Readiness**: Site structure and markup quality
4. **Optimization Opportunities**: Areas for improvement
5. **AI Visibility Potential**: Likelihood of AI citations
6. **Recommendations**: Specific steps to improve AI readiness

Write as a technical assessment report in 300-500 words.`,

    CompanyProfile: `Create a professional company profile based on this website:

URL: ${url}
Content: ${siteContent}

Include:
1. **Company Background**: History, mission, and vision
2. **Leadership and Team**: Key people and expertise
3. **Market Position**: Industry standing and reputation
4. **Core Competencies**: Key strengths and capabilities
5. **Achievements**: Notable successes and milestones
6. **Contact Information**: How to reach and connect

Format as a comprehensive business profile in 300-500 words.`,

    TechnicalSpecs: `Analyze the technical capabilities and create a specifications document:

URL: ${url}
Content: ${siteContent}

Document:
1. **Platform Capabilities**: Core technical features
2. **System Architecture**: How the platform is built
3. **Integration Options**: Connectivity and compatibility
4. **Performance Specifications**: Speed, scale, and reliability
5. **Security Features**: Protection and compliance measures
6. **Technical Requirements**: What users need to know

Write as a technical overview in 300-500 words with clear specifications.`
  }

  const prompt = prompts[summaryType as keyof typeof prompts] || prompts.SiteOverview

  try {
    console.log(`🔗 Making API call to Gemini...`)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout for API call
    
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
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Gemini API error: ${response.status} - ${errorText}`)
      console.log('🔄 Falling back to enhanced fallback content due to API error')
      return generateEnhancedFallbackSummary(url, summaryType)
    }

    const data = await response.json()
    console.log(`📊 Gemini API response received`)
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      const generatedContent = data.candidates[0].content.parts[0].text
      console.log(`✅ Successfully generated ${generatedContent.length} characters with Gemini AI`)
      return generatedContent
    } else {
      console.error('❌ Invalid response structure from Gemini API:', JSON.stringify(data))
      console.log('🔄 Falling back to enhanced fallback content due to invalid response structure')
      return generateEnhancedFallbackSummary(url, summaryType)
    }
  } catch (error) {
    console.error('❌ Gemini API error:', error)
    console.log('🔄 Falling back to enhanced fallback content due to exception')
    return generateEnhancedFallbackSummary(url, summaryType)
  }
}

function generateEnhancedFallbackSummary(url: string, summaryType: string): string {
  const domain = new URL(url).hostname
  const siteName = domain.replace('www.', '').split('.')[0]
  const companyName = siteName.charAt(0).toUpperCase() + siteName.slice(1)
  
  switch (summaryType) {
    case 'SiteOverview':
      return `# ${companyName} - Comprehensive Site Overview

## Company Overview
${companyName} operates as a professional online platform providing comprehensive services and solutions through their website at ${url}. The organization focuses on delivering value through innovative approaches and reliable service delivery.

## Key Services & Solutions
- **Professional Services**: Comprehensive service offerings designed to meet diverse business needs
- **Expert Consultation**: Specialized guidance and strategic recommendations
- **Implementation Support**: End-to-end assistance with project execution
- **Ongoing Optimization**: Continuous improvement and maintenance services

## Value Proposition
${companyName} distinguishes itself through:
- Proven expertise and industry knowledge
- Customer-focused approach and personalized solutions
- Reliable delivery and consistent results
- Comprehensive support throughout the engagement

## Target Audience
The platform serves businesses and professionals seeking:
- Strategic guidance and expert consultation
- Implementation support for complex projects
- Reliable partners for ongoing business needs
- Access to specialized knowledge and resources

## Key Features & Benefits
- **Comprehensive Solutions**: End-to-end service delivery
- **Expert Team**: Experienced professionals with proven track records
- **Flexible Approach**: Customizable solutions for specific needs
- **Reliable Support**: Ongoing assistance and maintenance

## Getting Started
To learn more about ${companyName} and explore how they can help achieve your objectives, visit their website at ${url} or contact their team directly for a consultation.

*This overview provides a comprehensive understanding of ${companyName}'s capabilities and value proposition for potential clients and partners.*`

    case 'CompanyProfile':
      return `# ${companyName} - Professional Company Profile

## Company Background
${companyName} is a professional organization committed to delivering exceptional value through innovative solutions and superior service delivery. Operating through their digital platform at ${url}, they have established themselves as a reliable partner for businesses seeking comprehensive solutions.

## Mission & Vision
**Mission**: To provide comprehensive, high-quality solutions that address real-world challenges and create meaningful value for clients.

**Vision**: To be recognized as a leading provider of professional services, known for excellence, innovation, and customer satisfaction.

## Core Values
- **Excellence**: Maintaining the highest standards in all service delivery
- **Integrity**: Operating with transparency and ethical business practices
- **Innovation**: Embracing new technologies and methodologies
- **Customer Focus**: Putting clients at the center of everything we do
- **Reliability**: Delivering consistent results and dependable service

## Market Position
${companyName} has positioned itself as a trusted provider in the professional services sector, focusing on:
- Quality service delivery and customer satisfaction
- Innovative approaches to traditional challenges
- Building long-term partnerships with clients
- Continuous improvement and adaptation to market needs

## Core Competencies
- Strategic planning and consultation
- Project implementation and management
- Technical expertise and knowledge transfer
- Customer relationship management
- Quality assurance and optimization

## Contact Information
**Website**: ${url}
**Services**: Professional consultation and implementation support

${companyName} welcomes opportunities to connect and discuss how they can help organizations achieve their objectives through proven methodologies and expert guidance.`

    case 'ProductCatalog':
      return `# ${companyName} - Service & Solution Catalog

## Professional Services Portfolio

### Core Service Offerings

#### **Consultation Services**
- Strategic planning and guidance
- Expert analysis and recommendations
- Industry best practices implementation
- Custom solution development

#### **Implementation Services**
- Project planning and execution
- System integration and setup
- Training and knowledge transfer
- Quality assurance and testing

#### **Support Services**
- Ongoing maintenance and optimization
- Technical support and troubleshooting
- Performance monitoring and reporting
- Continuous improvement initiatives

### Service Categories

#### **Strategic Services**
Focus on high-level planning and decision-making support
- Business strategy development
- Market analysis and positioning
- Competitive assessment
- Growth planning and execution

#### **Operational Services**
Hands-on implementation and execution support
- Process optimization
- System implementation
- Workflow automation
- Performance improvement

#### **Support Services**
Ongoing assistance and maintenance
- Technical support
- Training and education
- Monitoring and reporting
- Continuous optimization

### Getting Started

#### **Initial Consultation**
- Needs assessment and analysis
- Solution recommendation
- Project scoping and planning
- Timeline and resource estimation

#### **Implementation Process**
1. Project kickoff and planning
2. Solution development and testing
3. Deployment and integration
4. Training and knowledge transfer
5. Ongoing support and optimization

### Contact & Engagement
Visit ${url} to learn more about specific services and discuss how ${companyName} can help achieve your business objectives.`

    default:
      return `# ${summaryType}: ${companyName}

## Overview
This comprehensive ${summaryType.toLowerCase()} provides detailed information about ${companyName} and their professional services platform at ${url}.

## Key Information
${companyName} offers professional services and solutions designed to meet diverse business needs. Their platform provides comprehensive resources and support for organizations seeking expert guidance and implementation assistance.

## Services & Capabilities
- **Professional Consulting**: Expert guidance and strategic recommendations
- **Implementation Support**: End-to-end project execution assistance
- **Ongoing Optimization**: Continuous improvement and maintenance services
- **Knowledge Transfer**: Training and education for sustainable success

## Value Proposition
${companyName} focuses on delivering measurable value through:
- Proven methodologies and best practices
- Experienced team with industry expertise
- Customer-focused approach and personalized solutions
- Reliable delivery and consistent results

## Getting Started
To learn more about ${companyName} and their offerings, visit ${url} or contact their team directly to discuss specific needs and requirements.

This ${summaryType.toLowerCase()} provides an overview of the key features and benefits available through their professional services platform.`
  }
}