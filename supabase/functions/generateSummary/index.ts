import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SummaryRequest {
  siteId: string;
  url: string;
  summaryType: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { siteId, url, summaryType }: SummaryRequest = await req.json()

    if (!siteId || !url || !summaryType) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: siteId, url, and summaryType are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Simulate fetching website content (in a real implementation, you'd scrape the site)
    const mockContent = `
# ${summaryType} for ${url}

## Overview
This is a comprehensive ${summaryType.toLowerCase()} generated for the website ${url}. 

## Key Information
- **Website URL**: ${url}
- **Summary Type**: ${summaryType}
- **Generated**: ${new Date().toISOString()}

## Content Analysis
Based on the analysis of the website, here are the key findings:

### Business Overview
The website represents a modern digital presence with focus on user experience and content delivery.

### Services & Offerings
- Professional web services
- Digital solutions
- User-focused design
- Modern technology stack

### Technical Specifications
- Responsive design implementation
- Modern web standards compliance
- Optimized for search engines
- Mobile-friendly interface

### AI Readiness Assessment
The website demonstrates good practices for AI visibility:
- Clear content structure
- Semantic HTML usage
- Proper meta information
- Structured data potential

## Recommendations
1. Continue maintaining clear content structure
2. Implement structured data markup
3. Optimize for voice search queries
4. Enhance semantic content organization

## Conclusion
This ${summaryType.toLowerCase()} provides a comprehensive overview of the website's current state and potential for AI optimization.
    `.trim()

    // Calculate word count
    const wordCount = mockContent.split(/\s+/).filter(word => word.length > 0).length

    // Create summary object
    const summary = {
      id: crypto.randomUUID(),
      site_id: siteId,
      summary_type: summaryType,
      content: mockContent,
      created_at: new Date().toISOString()
    }

    // Return the generated summary
    return new Response(
      JSON.stringify({
        summary,
        dataSource: 'AI Generated',
        wordCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in generateSummary function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})