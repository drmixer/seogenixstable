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
  topic: string;
  content_type: string;
  industry?: string;
  target_audience?: string;
  tone?: string;
  length?: string;
  site_url?: string;
  user_id: string;
}

// Function to call Gemini API for content generation
async function generateContentWithGemini(
  topic: string,
  contentType: string,
  industry?: string,
  targetAudience?: string,
  tone?: string,
  length?: string,
  siteUrl?: string
): Promise<any> {
  if (!geminiApiKey || geminiApiKey.includes('your-') || geminiApiKey.length < 35) {
    console.log("⚠️ Gemini API key not configured, using enhanced fallback");
    return null;
  }

  try {
    console.log("🤖 Generating content with Gemini AI...");
    
    const contextInfo = [
      industry && `Industry: ${industry}`,
      targetAudience && `Target Audience: ${targetAudience}`,
      tone && `Tone: ${tone}`,
      length && `Length: ${length}`,
      siteUrl && `Website Context: ${siteUrl}`
    ].filter(Boolean).join('\n');

    const prompts = {
      blogOutline: `Create a comprehensive blog post outline about "${topic}". The outline should be detailed, SEO-friendly, and optimized for AI understanding.

${contextInfo ? `Context:\n${contextInfo}\n` : ''}

Requirements:
- Include a compelling headline
- Create 6-8 main sections with descriptive subheadings
- Add bullet points under each section
- Include an introduction and conclusion
- Make it actionable and valuable
- Optimize for voice search and AI citations
- Include FAQ section suggestions

Format as a detailed outline with clear hierarchy.`,

      faqSection: `Create a comprehensive FAQ section about "${topic}" that would be perfect for AI systems to understand and cite.

${contextInfo ? `Context:\n${contextInfo}\n` : ''}

Requirements:
- Generate 8-12 frequently asked questions
- Provide detailed, authoritative answers
- Use natural language that matches how people actually ask questions
- Include both basic and advanced questions
- Make answers citation-worthy for AI systems
- Optimize for voice search patterns
- Include specific details and actionable information

Format as Q&A pairs with clear structure.`,

      metaDescription: `Create 3-5 compelling meta descriptions for a page about "${topic}".

${contextInfo ? `Context:\n${contextInfo}\n` : ''}

Requirements:
- Keep each under 160 characters
- Include primary keyword naturally
- Create urgency or value proposition
- Make them click-worthy
- Optimize for search engines and AI understanding
- Include call-to-action when appropriate
- Make them unique and specific

Provide multiple options to choose from.`,

      productDescription: `Create a compelling product/service description for "${topic}".

${contextInfo ? `Context:\n${contextInfo}\n` : ''}

Requirements:
- Start with a compelling headline
- Include key features and benefits
- Address pain points and solutions
- Use persuasive but authentic language
- Include social proof elements
- Make it scannable with bullet points
- Optimize for AI understanding and citations
- Include a strong call-to-action

Create a complete product description that converts.`,

      socialPost: `Create 5 different social media posts about "${topic}" for different platforms.

${contextInfo ? `Context:\n${contextInfo}\n` : ''}

Requirements:
- LinkedIn: Professional, thought leadership style
- Twitter: Concise, engaging with hashtags
- Facebook: Conversational, community-focused
- Instagram: Visual-friendly with emojis
- YouTube: Video description style

Each post should be platform-optimized and engaging.`,

      emailNewsletter: `Create an email newsletter section about "${topic}".

${contextInfo ? `Context:\n${contextInfo}\n` : ''}

Requirements:
- Compelling subject line suggestions
- Engaging opening paragraph
- Main content section with value
- Include actionable tips or insights
- Add a clear call-to-action
- Make it personal and conversational
- Optimize for mobile reading

Create a complete newsletter section.`,

      landingPageCopy: `Create compelling landing page copy for "${topic}".

${contextInfo ? `Context:\n${contextInfo}\n` : ''}

Requirements:
- Attention-grabbing headline
- Compelling subheadline
- Problem/solution narrative
- Key benefits section
- Social proof elements
- FAQ section
- Strong call-to-action
- Optimize for conversions and AI understanding

Create complete landing page copy structure.`,

      pressRelease: `Create a professional press release about "${topic}".

${contextInfo ? `Context:\n${contextInfo}\n` : ''}

Requirements:
- Newsworthy headline
- Professional press release format
- Include quotes and key details
- Make it media-friendly
- Include company boilerplate
- Optimize for news distribution
- Make it citation-worthy for AI systems

Create a complete press release.`
    };

    const prompt = prompts[contentType as keyof typeof prompts] || prompts.blogOutline;

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
            temperature: 0.7,
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
      console.log("✅ Generated content with Gemini AI");
      return {
        content: content.trim(),
        data_source: "Gemini AI",
        word_count: content.trim().split(/\s+/).length,
        generated_at: new Date().toISOString()
      };
    } else {
      throw new Error("Invalid response format from Gemini");
    }
    
  } catch (error) {
    console.error("❌ Error generating content with Gemini:", error);
    return null;
  }
}

// Enhanced fallback content generation
function generateEnhancedContent(
  topic: string,
  contentType: string,
  industry?: string,
  targetAudience?: string,
  tone?: string
): any {
  console.log(`🎭 Generating enhanced content for ${contentType} about ${topic}`);
  
  const audienceContext = targetAudience || 'users';
  const industryContext = industry || 'your industry';
  const toneStyle = tone || 'professional';
  
  const contentTemplates = {
    blogOutline: `# ${topic}: The Complete Guide for ${audienceContext}

## Introduction
- What is ${topic} and why it matters in ${industryContext}
- Current trends and statistics
- What you'll learn in this guide

## Understanding ${topic}
- Definition and key concepts
- How ${topic} works in practice
- Common misconceptions and myths

## Benefits of ${topic}
- Primary advantages for ${audienceContext}
- ROI and measurable outcomes
- Success stories and case studies

## Getting Started with ${topic}
- Prerequisites and requirements
- Step-by-step implementation guide
- Tools and resources needed

## Best Practices and Strategies
- Proven methodologies
- Expert tips and recommendations
- Common pitfalls to avoid

## Advanced Techniques
- Next-level strategies
- Integration with other systems
- Scaling and optimization

## Measuring Success
- Key performance indicators
- Tracking and analytics
- Continuous improvement strategies

## Future of ${topic}
- Emerging trends and predictions
- Preparing for what's next
- Long-term strategic considerations

## Frequently Asked Questions
- What is the cost of implementing ${topic}?
- How long does it take to see results?
- What are the main challenges?
- How does it compare to alternatives?

## Conclusion
- Key takeaways and action items
- Next steps for implementation
- Additional resources and support`,

    faqSection: `## Frequently Asked Questions About ${topic}

### What is ${topic}?
${topic} is a comprehensive approach that helps ${audienceContext} achieve better results in ${industryContext}. It involves strategic planning, implementation, and ongoing optimization to deliver measurable outcomes.

### How does ${topic} work?
${topic} works by combining proven methodologies with modern tools and techniques. The process typically involves assessment, planning, implementation, and continuous monitoring to ensure optimal results.

### What are the main benefits of ${topic}?
The primary benefits include improved efficiency, better ROI, enhanced performance, and competitive advantage. Most ${audienceContext} see significant improvements within the first few months of implementation.

### How much does ${topic} cost?
Costs vary depending on scope, complexity, and specific requirements. We offer flexible pricing options to accommodate different budgets and needs. Contact us for a personalized quote.

### How long does it take to implement ${topic}?
Implementation timelines depend on the scope and complexity of your project. Typically, basic implementations take 2-4 weeks, while comprehensive solutions may take 2-3 months.

### What support is available?
We provide comprehensive support including initial consultation, implementation guidance, training, and ongoing support. Our team of experts is available to help you succeed.

### Can ${topic} be customized for my specific needs?
Absolutely! ${topic} is highly customizable and can be tailored to meet your specific requirements, industry standards, and business objectives.

### What results can I expect?
Results vary based on implementation and usage, but most clients see measurable improvements in efficiency, performance, and ROI within the first quarter of implementation.`,

    metaDescription: `Option 1: Discover how ${topic} can transform your ${industryContext} strategy. Expert guidance, proven results, and comprehensive support. Get started today!

Option 2: Complete guide to ${topic} for ${audienceContext}. Learn best practices, avoid common mistakes, and achieve better results faster.

Option 3: ${topic} solutions designed for ${industryContext}. Improve efficiency, reduce costs, and drive growth with our expert approach.

Option 4: Professional ${topic} services for ${audienceContext}. Proven strategies, measurable results, and dedicated support. Learn more now!`,

    productDescription: `# Transform Your ${industryContext} with Professional ${topic} Solutions

## Designed Specifically for ${audienceContext}

Our comprehensive ${topic} solution is engineered to deliver exceptional results for ${audienceContext} in the ${industryContext} sector. With years of expertise and proven methodologies, we help you achieve your goals faster and more efficiently.

### Key Features:
• **Comprehensive Approach**: End-to-end solution covering all aspects of ${topic}
• **Expert Guidance**: Access to industry specialists and best practices
• **Proven Results**: Track record of success with measurable outcomes
• **Scalable Solution**: Grows with your business needs and requirements
• **Dedicated Support**: Ongoing assistance and optimization

### Benefits You'll Experience:
• Improved efficiency and productivity
• Reduced costs and better ROI
• Enhanced competitive advantage
• Streamlined processes and workflows
• Better decision-making capabilities

### Why Choose Our ${topic} Solution?
With a ${toneStyle} approach and deep understanding of ${industryContext} challenges, we deliver solutions that work. Our clients typically see 30-50% improvement in key metrics within the first quarter.

**Ready to get started?** Contact our team today for a personalized consultation and discover how ${topic} can transform your business.`,

    socialPost: `**LinkedIn Post:**
The future of ${industryContext} is here, and ${topic} is leading the way. As ${audienceContext}, staying ahead means embracing innovative solutions that drive real results. Here's what we're seeing in the market and why it matters for your strategy. #${topic.replace(/\s+/g, '')} #${industryContext.replace(/\s+/g, '')} #Innovation

**Twitter Post:**
🚀 ${topic} is transforming how ${audienceContext} approach ${industryContext}. Key benefits: ✅ Better efficiency ✅ Improved ROI ✅ Competitive advantage. Ready to level up? #${topic.replace(/\s+/g, '')} #Growth

**Facebook Post:**
Exciting developments in ${topic}! 🎉 We're seeing incredible results for ${audienceContext} who are implementing these strategies. The impact on ${industryContext} has been remarkable. What's your experience been? Share your thoughts below! 👇

**Instagram Post:**
✨ Game-changer alert! ✨ ${topic} is revolutionizing ${industryContext} for ${audienceContext} everywhere. Swipe to see the amazing results our clients are achieving! 📈💪 #${topic.replace(/\s+/g, '')} #Success #Growth #Innovation

**YouTube Description:**
In this video, we dive deep into ${topic} and how it's changing the game for ${audienceContext} in ${industryContext}. You'll learn practical strategies, see real results, and discover how to implement these techniques in your own business. Don't forget to subscribe for more insights!`,

    emailNewsletter: `**Subject Line Options:**
• "The ${topic} breakthrough that's changing ${industryContext}"
• "How ${audienceContext} are achieving 40% better results with ${topic}"
• "Your weekly ${topic} insights and success stories"

**Newsletter Content:**

Hi there!

Hope you're having a great week! I wanted to share some exciting developments in the ${topic} space that I think you'll find valuable.

**This Week's Spotlight: ${topic} Success Stories**

We've been tracking some incredible results from ${audienceContext} who've implemented ${topic} strategies. The numbers are impressive:
• 35% average improvement in efficiency
• 28% reduction in operational costs  
• 42% increase in customer satisfaction

**Quick Tip of the Week:**
When implementing ${topic}, start small and scale gradually. Focus on one key area first, measure results, then expand. This approach reduces risk and maximizes learning.

**Trending in ${industryContext}:**
The latest research shows that ${topic} adoption is accelerating, with 67% of ${audienceContext} planning to invest more in this area over the next 12 months.

**What's Next?**
Ready to explore how ${topic} can benefit your specific situation? Reply to this email or schedule a quick consultation. We'd love to help you achieve similar results.

Best regards,
[Your Name]

P.S. Don't forget to follow us on social media for daily tips and insights!`,

    landingPageCopy: `# Transform Your ${industryContext} Results with Proven ${topic} Solutions

## Finally, a ${topic} approach designed specifically for ${audienceContext}

Stop struggling with outdated methods. Our comprehensive ${topic} solution delivers the results you need with the support you deserve.

### The Challenge You're Facing
As ${audienceContext} in ${industryContext}, you're dealing with:
• Increasing competition and market pressure
• Complex challenges that require expert solutions
• Limited time and resources to implement changes
• Need for measurable, sustainable results

### Our Solution: Professional ${topic} Services
We've helped hundreds of ${audienceContext} overcome these exact challenges with our proven ${topic} methodology.

### What Makes Us Different:
✅ **Proven Track Record**: 95% client satisfaction rate
✅ **Industry Expertise**: Specialized knowledge in ${industryContext}
✅ **Comprehensive Support**: From strategy to implementation
✅ **Measurable Results**: Average 40% improvement in key metrics

### Success Stories:
*"Working with this team transformed our approach to ${topic}. We saw a 45% improvement in efficiency within just 8 weeks."* - Sarah J., ${industryContext} Leader

### Frequently Asked Questions:

**Q: How quickly will I see results?**
A: Most clients see initial improvements within 2-4 weeks, with significant results by month 3.

**Q: What if it doesn't work for my specific situation?**
A: We offer a satisfaction guarantee and will work with you until you achieve your goals.

**Q: How much does it cost?**
A: Investment varies based on scope. We offer flexible options starting at $X/month.

### Ready to Get Started?
Join hundreds of successful ${audienceContext} who've transformed their ${industryContext} results with our ${topic} solution.

**[Get Your Free Consultation Today]**

*No obligation. No pressure. Just expert guidance to help you succeed.*`,

    pressRelease: `FOR IMMEDIATE RELEASE

**Revolutionary ${topic} Solution Launches for ${industryContext} Sector**
*New approach helps ${audienceContext} achieve unprecedented results*

[City, Date] - Today marks the launch of an innovative ${topic} solution specifically designed for ${audienceContext} in the ${industryContext} industry. This breakthrough approach addresses long-standing challenges and delivers measurable improvements in efficiency, performance, and ROI.

**Industry-Changing Innovation**
The new ${topic} methodology combines cutting-edge technology with proven strategies to deliver results that were previously unattainable. Early adopters have reported average improvements of 40% in key performance metrics.

"This represents a fundamental shift in how ${audienceContext} approach ${topic}," said [Spokesperson Name], [Title]. "We've taken years of research and real-world testing to create something truly transformative for the ${industryContext} sector."

**Proven Results**
Beta testing with select ${audienceContext} showed remarkable outcomes:
• 45% improvement in operational efficiency
• 32% reduction in implementation time
• 38% increase in customer satisfaction scores
• 28% better ROI compared to traditional methods

**Market Impact**
Industry experts predict this innovation will set new standards for ${topic} in ${industryContext}. The solution addresses critical pain points that have limited growth and efficiency for years.

"The potential impact on our industry is enormous," commented [Industry Expert Name], [Title] at [Organization]. "This could be the breakthrough that ${audienceContext} have been waiting for."

**Availability**
The ${topic} solution is now available to ${audienceContext} worldwide, with comprehensive support and training programs included.

**About [Company Name]**
[Company Name] is a leading provider of innovative solutions for the ${industryContext} industry. With over [X] years of experience and a track record of success, we're committed to helping ${audienceContext} achieve their goals through cutting-edge ${topic} strategies.

For more information, visit [website] or contact [contact information].

###

Media Contact:
[Name]
[Title]
[Phone]
[Email]`
  };

  const content = contentTemplates[contentType as keyof typeof contentTemplates] || contentTemplates.blogOutline;
  
  return {
    content,
    data_source: "Enhanced Template",
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
    console.log("🚀 === STARTING CONTENT GENERATION ===");
    
    const body: RequestBody = await req.json();
    const { topic, content_type, industry, target_audience, tone, length, site_url, user_id } = body;

    console.log(`📋 Topic: ${topic}`);
    console.log(`📄 Content Type: ${content_type}`);
    console.log(`🏭 Industry: ${industry || 'Not specified'}`);
    console.log(`👥 Target Audience: ${target_audience || 'Not specified'}`);

    if (!topic || !content_type || !user_id) {
      return new Response(
        JSON.stringify({ error: "Topic, content_type, and user_id are required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Track usage
    try {
      await supabase.rpc('increment_usage', {
        p_user_id: user_id,
        p_type: 'ai_content'
      });
      console.log("✅ Usage tracked successfully");
    } catch (usageError) {
      console.warn("⚠️ Failed to track usage:", usageError);
    }

    let result;
    let dataSource = "Enhanced Template";

    // Try to generate content with Gemini AI first
    const geminiResult = await generateContentWithGemini(
      topic,
      content_type,
      industry,
      target_audience,
      tone,
      length,
      site_url
    );
    
    if (geminiResult) {
      result = geminiResult;
      dataSource = "Gemini AI";
    } else {
      // Use enhanced fallback
      result = generateEnhancedContent(topic, content_type, industry, target_audience, tone);
      dataSource = "Enhanced Template";
    }

    console.log(`✅ Content generated using: ${dataSource}`);
    console.log(`📊 Word count: ${result.word_count}`);

    const response = {
      content: result.content,
      dataSource,
      wordCount: result.word_count,
      timestamp: new Date().toISOString(),
      contentType: content_type,
      topic
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
    console.error("💥 === CRITICAL ERROR IN CONTENT GENERATION ===");
    console.error(`❌ Error: ${error.message}`);
    console.error(`❌ Stack:`, error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate content",
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