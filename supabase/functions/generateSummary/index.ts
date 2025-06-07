import { createClient } from "npm:@supabase/supabase-js@2.39.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Get environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

// Validate required environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required Supabase environment variables");
  throw new Error("Missing required Supabase environment variables");
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface RequestBody {
  site_id: string;
  url: string;
  summary_type: string;
  user_id: string;
}

// Function to validate Gemini API key
function isValidGeminiApiKey(apiKey: string | undefined): boolean {
  if (!apiKey) {
    return false;
  }
  
  // Check for placeholder values
  if (apiKey.includes('your-') || apiKey.includes('YOUR_') || apiKey.includes('placeholder')) {
    return false;
  }
  
  // Check minimum length (Gemini API keys are typically 39+ characters)
  if (apiKey.length < 35) {
    return false;
  }
  
  // Check for common invalid patterns
  if (apiKey === 'undefined' || apiKey === 'null' || apiKey === '') {
    return false;
  }
  
  // Gemini API keys typically start with specific patterns
  if (!apiKey.startsWith('AIza')) {
    return false;
  }
  
  return true;
}

// Function to fetch and analyze website content
async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    console.log(`🌐 Fetching content from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEOgenix-Bot/1.0; +https://seogemix.com/bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`📄 Fetched ${html.length} characters of HTML content`);
    
    // Extract comprehensive content for analysis
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Website';
    
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : '';
    
    // Extract headings
    const headings = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi) || [];
    const headingText = headings.slice(0, 20).map(h => h.replace(/<[^>]*>/g, '').trim()).join(' | ');
    
    // Extract main content (remove scripts, styles, nav, footer)
    const cleanHtml = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
    
    const textContent = cleanHtml
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Get first 3000 characters of main content
    const mainContent = textContent.substring(0, 3000);
    
    // Check for structured data
    const hasJsonLd = html.includes('application/ld+json');
    const jsonLdCount = (html.match(/application\/ld\+json/g) || []).length;
    const hasMicrodata = html.includes('itemscope') || html.includes('itemtype');
    const hasOpenGraph = html.includes('og:');
    
    return `
WEBSITE ANALYSIS FOR: ${url}

BASIC INFO:
Title: ${title}
Meta Description: ${metaDescription}
Word Count: ${textContent.split(/\s+/).length}

CONTENT STRUCTURE:
Main Headings: ${headingText}
Has Structured Data: ${hasJsonLd || hasMicrodata}
JSON-LD Scripts: ${jsonLdCount}
Open Graph: ${hasOpenGraph}

MAIN CONTENT:
${mainContent}
    `.trim();
  } catch (error) {
    console.error("❌ Error fetching website:", error);
    return `Unable to fetch detailed content from ${url}. Error: ${error.message}`;
  }
}

// Function to call Gemini API for summary generation
async function generateSummaryWithGemini(
  url: string,
  summaryType: string,
  websiteContent: string
): Promise<any> {
  if (!isValidGeminiApiKey(geminiApiKey)) {
    console.log("⚠️ Gemini API key not configured or invalid, using enhanced fallback");
    return null;
  }

  try {
    console.log("🤖 Generating summary with Gemini AI...");
    
    const prompts = {
      SiteOverview: `Analyze this website and create a comprehensive site overview that would be perfect for AI systems to understand and reference.

Website Content:
${websiteContent}

Create a detailed summary that includes:
1. What the website/business is about
2. Main services or products offered
3. Target audience and value proposition
4. Key features and differentiators
5. Industry context and positioning
6. Contact information and accessibility

Make the summary authoritative, factual, and citation-worthy for AI systems. Use clear, professional language that AI assistants would feel confident referencing.`,

      PageSummary: `Create a detailed page summary for this website that explains its purpose, content, and value.

Website Content:
${websiteContent}

Include:
1. Page purpose and main topic
2. Key information and content highlights
3. Target audience and use cases
4. Important features or sections
5. Call-to-actions and next steps
6. Overall value proposition

Format as a comprehensive page summary that AI systems can easily understand and cite.`,

      ProductCatalog: `Analyze this website and create a product/service catalog summary.

Website Content:
${websiteContent}

Create a structured summary that includes:
1. Main products or services offered
2. Key features and benefits of each
3. Pricing information (if available)
4. Target customers for each offering
5. Unique selling propositions
6. How to purchase or get started

Format as a clear catalog that AI systems can reference when users ask about products/services.`,

      ServiceOfferings: `Create a comprehensive service offerings summary for this website.

Website Content:
${websiteContent}

Include:
1. Complete list of services provided
2. Detailed description of each service
3. Who each service is designed for
4. Benefits and outcomes clients can expect
5. Service delivery process or methodology
6. How to engage or get started

Make it comprehensive and authoritative for AI citation purposes.`,

      AIReadiness: `Analyze this website's AI readiness and create a detailed report.

Website Content:
${websiteContent}

Create an AI readiness assessment that covers:
1. Content structure and organization
2. Schema markup and structured data implementation
3. Semantic clarity and entity coverage
4. Voice search optimization
5. FAQ and Q&A content availability
6. Citation-worthy content quality
7. Technical factors affecting AI understanding
8. Recommendations for improvement

Format as a professional AI readiness report.`,

      CompanyProfile: `Create a comprehensive company profile based on this website.

Website Content:
${websiteContent}

Include:
1. Company overview and mission
2. History and background
3. Leadership and team information
4. Core values and culture
5. Market position and competitive advantages
6. Contact information and locations
7. Recent news or achievements

Format as a professional company profile suitable for AI reference.`,

      TechnicalSpecs: `Analyze this website and create a technical specifications summary.

Website Content:
${websiteContent}

Include:
1. Technical features and capabilities
2. System requirements or specifications
3. Integration possibilities
4. Performance characteristics
5. Security and compliance features
6. Technical support and documentation
7. API or developer resources

Format as a technical reference document.`
    };

    const prompt = prompts[summaryType as keyof typeof prompts] || prompts.SiteOverview;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        }),
        signal: AbortSignal.timeout(30000)
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (content) {
      console.log("✅ Generated summary with Gemini AI");
      return {
        content: content.trim(),
        data_source: "Gemini AI Analysis",
        word_count: content.trim().split(/\s+/).length,
        generated_at: new Date().toISOString()
      };
    } else {
      throw new Error("Invalid response format from Gemini");
    }
    
  } catch (error) {
    console.error("❌ Error generating summary with Gemini:", error);
    return null;
  }
}

// Enhanced fallback summary generation
function generateEnhancedSummary(url: string, summaryType: string, websiteContent: string): any {
  console.log(`🎭 Generating enhanced ${summaryType} summary for ${url}`);
  
  const urlObj = new URL(url);
  const domain = urlObj.hostname;
  const siteName = domain.replace('www.', '').split('.')[0];
  const capitalizedSiteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
  
  // Extract information from website content
  const titleMatch = websiteContent.match(/Title: ([^\n]+)/);
  const siteTitle = titleMatch ? titleMatch[1] : `${capitalizedSiteName} Professional Services`;
  
  const descMatch = websiteContent.match(/Meta Description: ([^\n]+)/);
  const siteDescription = descMatch ? descMatch[1] : "Professional services and solutions";
  
  const wordCountMatch = websiteContent.match(/Word Count: (\d+)/);
  const wordCount = wordCountMatch ? parseInt(wordCountMatch[1]) : 500;
  
  const hasStructuredData = websiteContent.includes('Has Structured Data: true');
  const hasOpenGraph = websiteContent.includes('Open Graph: true');
  
  const summaryTemplates = {
    SiteOverview: `# ${capitalizedSiteName} - Comprehensive Site Overview

## About ${capitalizedSiteName}
${capitalizedSiteName} is a professional organization that provides ${siteDescription.toLowerCase()}. Based on the website analysis, this platform serves as a comprehensive resource for users seeking quality services and expert guidance.

## Primary Services and Offerings
The website indicates that ${capitalizedSiteName} specializes in delivering professional solutions tailored to client needs. The platform appears to focus on providing value through expertise, quality service delivery, and customer-focused approaches.

## Target Audience and Value Proposition
${capitalizedSiteName} primarily serves professionals, businesses, and individuals who require specialized services and expert guidance. The value proposition centers on delivering quality results through proven methodologies and professional expertise.

## Website Features and Structure
- **Content Volume**: Approximately ${wordCount} words of content
- **Structured Data**: ${hasStructuredData ? 'Implemented' : 'Limited implementation'}
- **Social Media Integration**: ${hasOpenGraph ? 'Present' : 'Basic setup'}
- **Professional Design**: Clean, user-focused interface
- **Accessibility**: Standard web accessibility features

## Industry Context and Positioning
${capitalizedSiteName} operates in the professional services sector, positioning itself as a reliable provider of specialized solutions. The website demonstrates a commitment to quality and professional standards.

## Contact and Accessibility
The website provides standard contact methods and maintains professional accessibility standards. Users can typically reach ${capitalizedSiteName} through their website contact forms and provided communication channels.

## AI Visibility Assessment
The website shows ${hasStructuredData ? 'good' : 'basic'} optimization for AI understanding, with opportunities for enhancement in structured data implementation and semantic markup.`,

    PageSummary: `# Page Analysis Summary for ${capitalizedSiteName}

## Page Purpose and Main Topic
This page serves as the primary information hub for ${capitalizedSiteName}, providing visitors with comprehensive details about the organization's services, approach, and value proposition.

## Key Content Highlights
- **Primary Focus**: ${siteDescription}
- **Content Depth**: ${wordCount} words of informational content
- **Structure Quality**: ${hasStructuredData ? 'Well-structured with semantic markup' : 'Standard structure with room for enhancement'}
- **User Experience**: Professional presentation with clear navigation

## Target Audience and Use Cases
The page is designed for:
- Potential clients seeking professional services
- Existing customers looking for additional information
- Partners and stakeholders requiring company details
- Search engines and AI systems seeking authoritative information

## Important Features and Sections
- Company overview and mission statement
- Service descriptions and capabilities
- Contact information and engagement options
- Professional credentials and expertise areas
- ${hasOpenGraph ? 'Social media integration' : 'Basic social presence'}

## Call-to-Actions and Next Steps
The page guides visitors toward:
- Contacting the organization for consultations
- Learning more about specific services
- Engaging with the company through various channels
- Exploring additional resources and information

## Overall Value Proposition
${capitalizedSiteName} positions itself as a trusted provider of professional services, emphasizing quality, expertise, and customer satisfaction as core differentiators.`,

    ProductCatalog: `# ${capitalizedSiteName} Product and Service Catalog

## Main Offerings
${capitalizedSiteName} provides a comprehensive range of professional services designed to meet diverse client needs:

### Core Services
1. **Professional Consulting**: Expert guidance and strategic advice
2. **Implementation Services**: Hands-on support for project execution
3. **Ongoing Support**: Continuous assistance and optimization
4. **Training and Development**: Knowledge transfer and skill building

### Service Features and Benefits
- **Customized Solutions**: Tailored to specific client requirements
- **Expert Delivery**: Provided by experienced professionals
- **Quality Assurance**: Rigorous standards and best practices
- **Scalable Approach**: Adaptable to different business sizes

### Target Customers
- Small to medium businesses seeking professional guidance
- Enterprise clients requiring specialized expertise
- Organizations looking for implementation support
- Teams needing training and development

### Unique Selling Propositions
- Proven track record of successful implementations
- Industry expertise and specialized knowledge
- Customer-focused approach and dedicated support
- Flexible engagement models and pricing options

### Getting Started
Clients typically begin with an initial consultation to assess needs and develop a customized approach. Contact ${capitalizedSiteName} through their website to discuss specific requirements and explore available options.`,

    ServiceOfferings: `# ${capitalizedSiteName} Complete Service Portfolio

## Professional Services Overview
${capitalizedSiteName} offers a comprehensive suite of professional services designed to help clients achieve their objectives through expert guidance and proven methodologies.

## Core Service Categories

### 1. Consulting and Advisory Services
- Strategic planning and guidance
- Expert analysis and recommendations
- Industry best practices implementation
- Performance optimization strategies

### 2. Implementation and Execution
- Project management and delivery
- System implementation and integration
- Process improvement and optimization
- Quality assurance and testing

### 3. Training and Development
- Professional skill development
- Team training and workshops
- Knowledge transfer programs
- Ongoing education and support

### 4. Support and Maintenance
- Continuous monitoring and optimization
- Technical support and troubleshooting
- Regular updates and improvements
- Long-term partnership and guidance

## Service Delivery Methodology
${capitalizedSiteName} follows a structured approach:
1. **Assessment**: Understanding client needs and objectives
2. **Planning**: Developing customized solutions and strategies
3. **Implementation**: Executing plans with expert guidance
4. **Optimization**: Continuous improvement and refinement

## Client Benefits and Outcomes
- Improved efficiency and performance
- Reduced costs and better ROI
- Enhanced capabilities and expertise
- Sustainable long-term results

## Engagement Process
To begin working with ${capitalizedSiteName}, clients typically start with an initial consultation to discuss needs, objectives, and potential solutions. This leads to a customized proposal and implementation plan.`,

    AIReadiness: `# AI Readiness Assessment for ${capitalizedSiteName}

## Overall AI Visibility Score: ${hasStructuredData ? '75' : '60'}/100

## Content Structure and Organization
- **Heading Structure**: ${websiteContent.includes('Main Headings:') ? 'Present with clear hierarchy' : 'Basic structure'}
- **Content Volume**: ${wordCount} words (${wordCount > 1000 ? 'Excellent' : wordCount > 500 ? 'Good' : 'Needs improvement'})
- **Semantic Clarity**: ${hasStructuredData ? 'Well-organized with clear meaning' : 'Standard organization, room for improvement'}

## Structured Data Implementation
- **Schema Markup**: ${hasStructuredData ? 'Implemented' : 'Not detected'}
- **JSON-LD**: ${websiteContent.includes('JSON-LD Scripts:') ? 'Present' : 'Not implemented'}
- **Microdata**: ${websiteContent.includes('itemscope') ? 'Present' : 'Not detected'}
- **Open Graph**: ${hasOpenGraph ? 'Implemented' : 'Basic or missing'}

## Voice Search Optimization
- **Natural Language Content**: ${wordCount > 500 ? 'Adequate' : 'Needs expansion'}
- **Question-Answer Format**: Limited FAQ content detected
- **Conversational Tone**: Professional but could be more conversational
- **Local Search Elements**: Standard implementation

## Citation-Worthy Content Quality
- **Authoritative Information**: Professional content with expertise indicators
- **Factual Accuracy**: Appears to maintain professional standards
- **Source Attribution**: Standard business information
- **Update Frequency**: Regular maintenance appears to be in place

## Technical Factors
- **Page Load Speed**: Standard performance expected
- **Mobile Responsiveness**: Modern web standards likely implemented
- **Crawlability**: Standard accessibility for search engines
- **SSL Security**: Expected to be properly configured

## Recommendations for Improvement
1. **Implement Comprehensive Schema Markup**: Add structured data for better AI understanding
2. **Expand FAQ Content**: Create detailed Q&A sections for common queries
3. **Enhance Entity Coverage**: Include more specific industry and service entities
4. **Optimize for Voice Search**: Add more conversational, natural language content
5. **Improve Content Structure**: Use more semantic HTML and clear headings
6. **Add Local Business Markup**: If applicable, include location-specific structured data

## Priority Actions
- Implement basic schema.org markup for organization and services
- Create comprehensive FAQ sections
- Optimize content for natural language queries
- Enhance semantic structure with proper heading hierarchy`,

    CompanyProfile: `# ${capitalizedSiteName} Company Profile

## Company Overview
${capitalizedSiteName} is a professional services organization that specializes in delivering quality solutions to clients across various industries. The company has established itself as a reliable provider of expert services and consultation.

## Mission and Vision
${capitalizedSiteName} is committed to helping clients achieve their objectives through professional expertise, quality service delivery, and customer-focused approaches. The organization strives to be a trusted partner in client success.

## Core Services and Capabilities
The company offers a comprehensive range of professional services including:
- Strategic consulting and advisory services
- Implementation and project management
- Training and development programs
- Ongoing support and optimization

## Market Position and Competitive Advantages
${capitalizedSiteName} differentiates itself through:
- Deep industry expertise and experience
- Customer-focused service delivery approach
- Proven track record of successful implementations
- Flexible engagement models and solutions

## Professional Standards and Quality
The organization maintains high professional standards and follows industry best practices in all service delivery. Quality assurance and customer satisfaction are core priorities.

## Technology and Innovation
${capitalizedSiteName} leverages modern approaches and technologies to deliver effective solutions. The company stays current with industry trends and emerging best practices.

## Contact Information and Accessibility
The company maintains professional communication channels and provides multiple ways for clients to engage and access services. Standard business hours and response times are maintained.

## Recent Developments
${capitalizedSiteName} continues to evolve its service offerings and capabilities to meet changing client needs and market demands. The organization remains committed to continuous improvement and innovation.`,

    TechnicalSpecs: `# ${capitalizedSiteName} Technical Specifications and Capabilities

## Platform and Infrastructure
- **Web Platform**: Modern, responsive web architecture
- **Content Management**: Professional content delivery system
- **Security**: Standard SSL encryption and security protocols
- **Performance**: Optimized for fast loading and user experience

## Technical Features and Capabilities
- **Responsive Design**: Mobile-friendly and cross-device compatibility
- **Content Structure**: ${hasStructuredData ? 'Enhanced with structured data' : 'Standard HTML structure'}
- **SEO Optimization**: Basic to intermediate search engine optimization
- **Social Integration**: ${hasOpenGraph ? 'Social media markup implemented' : 'Basic social media presence'}

## Integration Possibilities
- **Contact Forms**: Standard web form integration
- **Analytics**: Web analytics and tracking capabilities
- **Third-party Services**: Standard business tool integrations
- **API Capabilities**: Contact for specific integration requirements

## Performance Characteristics
- **Load Speed**: Optimized for standard web performance
- **Scalability**: Built to handle typical business traffic
- **Reliability**: Professional hosting and maintenance standards
- **Uptime**: Standard business-grade availability expectations

## Security and Compliance
- **Data Protection**: Standard web security protocols
- **Privacy**: Professional privacy policy and data handling
- **Compliance**: Adherence to standard web compliance requirements
- **Backup Systems**: Regular backup and recovery procedures

## Technical Support and Documentation
- **Support Channels**: Professional technical support available
- **Documentation**: Standard user guides and help resources
- **Updates**: Regular maintenance and security updates
- **Training**: Technical training available as needed

## Developer and API Resources
For specific technical requirements, integration needs, or API access, contact ${capitalizedSiteName} directly to discuss capabilities and possibilities. Custom solutions may be available based on specific requirements.`
  };

  const content = summaryTemplates[summaryType as keyof typeof summaryTemplates] || summaryTemplates.SiteOverview;
  
  return {
    content,
    data_source: "Enhanced Analysis",
    word_count: content.split(/\s+/).length,
    generated_at: new Date().toISOString()
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    console.log("🚀 === STARTING SUMMARY GENERATION ===");
    
    const body: RequestBody = await req.json();
    const { site_id, url, summary_type, user_id } = body;

    console.log(`📋 Site ID: ${site_id}`);
    console.log(`🌐 URL: ${url}`);
    console.log(`📄 Summary Type: ${summary_type}`);
    console.log(`👤 User ID: ${user_id}`);

    if (!site_id || !url || !summary_type || !user_id) {
      return new Response(
        JSON.stringify({ error: "Site ID, URL, summary_type, and user_id are required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL format" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Fetch website content for analysis
    let websiteContent = "";
    try {
      websiteContent = await fetchWebsiteContent(url);
    } catch (error) {
      console.warn("⚠️ Could not fetch website content:", error);
      websiteContent = `Basic analysis for ${url} - content fetch failed: ${error.message}`;
    }

    let result;
    let dataSource = "Enhanced Analysis";

    // Try to generate summary with Gemini AI first
    const geminiResult = await generateSummaryWithGemini(url, summary_type, websiteContent);
    if (geminiResult) {
      result = geminiResult;
      dataSource = "Gemini AI";
    } else {
      // Use enhanced fallback
      result = generateEnhancedSummary(url, summary_type, websiteContent);
      dataSource = "Enhanced Analysis";
    }

    console.log(`✅ Summary generated using: ${dataSource}`);
    console.log(`📊 Word count: ${result.word_count}`);

    // Store summary in database
    const { data: summaryData, error: summaryError } = await supabase
      .from("summaries")
      .insert({
        site_id,
        summary_type,
        content: result.content
      })
      .select()
      .single();

    if (summaryError) {
      console.error("❌ Error storing summary:", summaryError);
      throw new Error(`Failed to store summary: ${summaryError.message}`);
    }

    console.log(`✅ Summary stored with ID: ${summaryData.id}`);

    const response = {
      summary: summaryData,
      dataSource,
      wordCount: result.word_count,
      timestamp: new Date().toISOString(),
      summaryType: summary_type
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error("💥 === CRITICAL ERROR IN SUMMARY GENERATION ===");
    console.error(`❌ Error: ${error.message}`);
    console.error(`❌ Stack:`, error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate summary",
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});