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
  
  // Limit to first 8000 characters to stay within API limits
  return text.substring(0, 8000);
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

// Helper function to call Gemini API
async function callGeminiAPI(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
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
    const { siteId, url, summaryType } = await req.json()

    // Validate required parameters
    if (!siteId || !url || !summaryType) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: siteId, url, or summaryType' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🚀 Starting real website analysis for ${url} (${summaryType})`);

    // Fetch the website content
    let websiteContent = '';
    let metadata = { title: '', description: '', keywords: '' };
    let dataSource = 'AI Analysis of Website Content';
    
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
      console.warn(`⚠️ Failed to fetch website content: ${fetchError.message}`);
      console.log(`🔄 Falling back to URL-based analysis`);
      
      // Fallback: analyze based on URL and domain
      const domain = new URL(url).hostname;
      websiteContent = `Website: ${url}\nDomain: ${domain}\nNote: Content could not be fetched directly.`;
      dataSource = 'AI Analysis (URL-based, content fetch failed)';
    }

    // Prepare the prompt for Gemini based on summary type
    let prompt = '';
    const domain = new URL(url).hostname;
    const siteName = domain.replace('www.', '').split('.')[0];
    const capitalizedSiteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);

    switch (summaryType) {
      case 'SiteOverview':
        prompt = `Analyze the following website content and create a comprehensive site overview. 

Website URL: ${url}
Website Title: ${metadata.title || 'Not available'}
Meta Description: ${metadata.description || 'Not available'}
Website Content: ${websiteContent}

Please create a detailed site overview that includes:
1. Company/Organization Overview
2. Core Services or Products
3. Key Features and Benefits
4. Target Audience
5. Competitive Advantages
6. Contact Information

Format the response in markdown with clear headings. Make it comprehensive and professional, suitable for AI systems to understand and cite. Focus on factual information extracted from the content.`;
        break;

      case 'CompanyProfile':
        prompt = `Create a professional company profile based on the following website content:

Website URL: ${url}
Website Title: ${metadata.title || 'Not available'}
Meta Description: ${metadata.description || 'Not available'}
Website Content: ${websiteContent}

Please create a company profile that includes:
1. About the Company
2. Mission and Values
3. Service Portfolio
4. Industry Expertise
5. Why Choose This Company
6. Contact Information

Format in markdown with professional tone. Focus on the company's background, expertise, and value proposition based on the actual website content.`;
        break;

      case 'ServiceOfferings':
        prompt = `Analyze the website content and create a comprehensive breakdown of all services offered:

Website URL: ${url}
Website Title: ${metadata.title || 'Not available'}
Meta Description: ${metadata.description || 'Not available'}
Website Content: ${websiteContent}

Please create a detailed service offerings document that includes:
1. Complete Service Portfolio
2. Service Categories and Descriptions
3. Service Delivery Approach
4. Benefits of Each Service
5. Getting Started Information

Format in markdown. Focus specifically on identifying and describing all services mentioned on the website.`;
        break;

      case 'ProductCatalog':
        prompt = `Create a structured product and service catalog based on the website content:

Website URL: ${url}
Website Title: ${metadata.title || 'Not available'}
Meta Description: ${metadata.description || 'Not available'}
Website Content: ${websiteContent}

Please create a product catalog that includes:
1. Product/Service Categories
2. Detailed Descriptions
3. Features and Specifications
4. Service Levels or Packages
5. Implementation Process

Format in markdown with clear categorization. Focus on organizing all offerings into a structured catalog format.`;
        break;

      case 'AIReadiness':
        prompt = `Conduct an AI readiness assessment of this website for optimization with AI systems:

Website URL: ${url}
Website Title: ${metadata.title || 'Not available'}
Meta Description: ${metadata.description || 'Not available'}
Website Content: ${websiteContent}

Please create an AI readiness report that includes:
1. AI Visibility Score (rate 1-100)
2. Content Structure Analysis
3. Technical AI Optimization Status
4. Key Findings (Strengths and Opportunities)
5. Specific Recommendations for AI Optimization
6. AI Platform Compatibility Assessment

Format in markdown. Focus on how well the content is structured for AI understanding and citation.`;
        break;

      case 'PageSummary':
        prompt = `Create a detailed page summary analyzing the main content and purpose:

Website URL: ${url}
Website Title: ${metadata.title || 'Not available'}
Meta Description: ${metadata.description || 'Not available'}
Website Content: ${websiteContent}

Please create a page summary that includes:
1. Page Overview and Primary Purpose
2. Key Content Areas
3. Target Audience
4. Content Quality Assessment
5. User Experience Analysis
6. Recommendations for Improvement

Format in markdown. Focus on analyzing what the page contains and how effectively it serves its purpose.`;
        break;

      case 'TechnicalSpecs':
        prompt = `Analyze the website and infer technical specifications and capabilities:

Website URL: ${url}
Website Title: ${metadata.title || 'Not available'}
Meta Description: ${metadata.description || 'Not available'}
Website Content: ${websiteContent}

Please create a technical specifications document that includes:
1. Platform Overview
2. Technical Infrastructure (inferred)
3. System Capabilities
4. Technical Standards
5. Service Delivery Technology
6. Compatibility and Requirements

Format in markdown. Base the technical analysis on what can be inferred from the content and services described.`;
        break;

      default:
        prompt = `Analyze the following website content and create a comprehensive summary:

Website URL: ${url}
Website Title: ${metadata.title || 'Not available'}
Meta Description: ${metadata.description || 'Not available'}
Website Content: ${websiteContent}

Please create a detailed summary that covers the main purpose, services, and key information about this website. Format in markdown with clear headings.`;
    }

    console.log(`🤖 Calling Gemini API for ${summaryType} analysis`);
    
    // Call Gemini API to generate the summary
    const aiGeneratedContent = await callGeminiAPI(prompt);
    
    console.log(`✅ Gemini API returned ${aiGeneratedContent.length} characters`);

    // Calculate word count
    const wordCount = aiGeneratedContent.split(/\s+/).filter(word => word.length > 0).length;

    // Create summary object
    const summary = {
      site_id: siteId,
      summary_type: summaryType,
      content: aiGeneratedContent,
      created_at: new Date().toISOString()
    };

    console.log(`📊 Generated summary: ${wordCount} words, type: ${summaryType}`);

    // Return successful response
    return new Response(
      JSON.stringify({
        summary,
        dataSource,
        wordCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Error in generateSummary function:', error);
    
    // Return detailed error information
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate summary',
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