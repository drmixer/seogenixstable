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

    // Generate comprehensive prompt suggestions
    const suggestions = generatePromptSuggestions(content, industry, targetAudience, contentType)
    const dataSource = 'AI Analysis'
    const totalSuggestions = Object.values(suggestions).reduce((total: number, arr: any) => {
      return total + (Array.isArray(arr) ? arr.length : 0)
    }, 0)

    console.log(`✅ Generated ${totalSuggestions} prompt suggestions`)

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

function generatePromptSuggestions(content: string, industry?: string, audience?: string, contentType?: string) {
  const topic = extractMainTopic(content)
  const keywords = extractKeywords(content)
  
  return {
    voice_search: generateVoiceSearchQueries(topic, keywords, industry),
    faq_questions: generateFAQQuestions(topic, keywords, industry, audience),
    headlines: generateHeadlines(topic, keywords, contentType),
    featured_snippets: generateFeaturedSnippetTargets(topic, keywords, industry),
    long_tail: generateLongTailKeywords(topic, keywords, industry, audience),
    comparisons: generateComparisonQueries(topic, keywords, industry),
    how_to: generateHowToQueries(topic, keywords, industry),
    analysis_summary: generateAnalysisSummary(content, topic, industry, audience)
  }
}

function extractMainTopic(content: string): string {
  // Simple topic extraction - in a real implementation, this could use NLP
  const words = content.toLowerCase().split(/\s+/)
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']
  
  const meaningfulWords = words.filter(word => 
    word.length > 3 && 
    !commonWords.includes(word) &&
    /^[a-zA-Z]+$/.test(word)
  )
  
  // Return the most frequent meaningful word or first few words
  if (meaningfulWords.length > 0) {
    return meaningfulWords[0]
  }
  
  return content.split(' ').slice(0, 3).join(' ')
}

function extractKeywords(content: string): string[] {
  const words = content.toLowerCase().split(/\s+/)
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']
  
  const keywords = words
    .filter(word => 
      word.length > 3 && 
      !commonWords.includes(word) &&
      /^[a-zA-Z]+$/.test(word)
    )
    .slice(0, 10)
  
  return [...new Set(keywords)] // Remove duplicates
}

function generateVoiceSearchQueries(topic: string, keywords: string[], industry?: string): string[] {
  const queries = [
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
  ]

  if (industry) {
    queries.push(
      `How is ${topic} used in ${industry}?`,
      `What are ${industry} ${topic} solutions?`,
      `Best ${topic} practices for ${industry}`,
      `${industry} ${topic} implementation guide`
    )
  }

  keywords.forEach(keyword => {
    queries.push(
      `How to use ${keyword} for ${topic}?`,
      `What is the relationship between ${keyword} and ${topic}?`,
      `${keyword} vs ${topic} comparison`
    )
  })

  return queries.slice(0, 15)
}

function generateFAQQuestions(topic: string, keywords: string[], industry?: string, audience?: string): string[] {
  const questions = [
    `What exactly is ${topic} and how does it work?`,
    `What are the main benefits of implementing ${topic}?`,
    `How long does it take to see results from ${topic}?`,
    `What are the costs associated with ${topic}?`,
    `Do I need special training or expertise for ${topic}?`,
    `How does ${topic} integrate with existing systems?`,
    `What are the common challenges with ${topic} implementation?`,
    `How do I measure the success of ${topic}?`,
    `What support is available for ${topic}?`,
    `Can ${topic} be customized for specific needs?`,
    `What are the security considerations for ${topic}?`,
    `How often should ${topic} be updated or maintained?`,
    `What happens if ${topic} doesn't work as expected?`,
    `Are there alternatives to ${topic}?`,
    `How do I choose the right ${topic} solution?`
  ]

  if (industry) {
    questions.push(
      `How is ${topic} specifically used in the ${industry} industry?`,
      `What are the ${industry}-specific benefits of ${topic}?`,
      `Are there ${industry} regulations that affect ${topic}?`,
      `What ${industry} companies are successfully using ${topic}?`
    )
  }

  if (audience) {
    questions.push(
      `How can ${audience} benefit from ${topic}?`,
      `What should ${audience} know before implementing ${topic}?`,
      `Are there special considerations for ${audience} using ${topic}?`
    )
  }

  return questions.slice(0, 20)
}

function generateHeadlines(topic: string, keywords: string[], contentType?: string): string[] {
  const headlines = [
    `The Complete Guide to ${topic}: Everything You Need to Know`,
    `${topic} Explained: Benefits, Implementation, and Best Practices`,
    `How to Master ${topic}: A Step-by-Step Approach`,
    `${topic} Success Stories: Real Results from Real Businesses`,
    `The Future of ${topic}: Trends and Predictions for 2024`,
    `${topic} vs Alternatives: Which Solution is Right for You?`,
    `Common ${topic} Mistakes and How to Avoid Them`,
    `${topic} ROI: Measuring Success and Maximizing Value`,
    `Getting Started with ${topic}: A Beginner's Guide`,
    `Advanced ${topic} Strategies for Maximum Impact`,
    `${topic} Implementation: Planning for Success`,
    `The Business Case for ${topic}: Why It Matters Now`,
    `${topic} Best Practices: Lessons from Industry Leaders`,
    `Troubleshooting ${topic}: Solutions to Common Problems`,
    `${topic} Integration: Working with Existing Systems`
  ]

  keywords.forEach(keyword => {
    headlines.push(
      `How ${keyword} Enhances Your ${topic} Strategy`,
      `${keyword} and ${topic}: A Powerful Combination`,
      `Optimizing ${topic} with ${keyword} Techniques`
    )
  })

  return headlines.slice(0, 18)
}

function generateFeaturedSnippetTargets(topic: string, keywords: string[], industry?: string): string[] {
  const snippets = [
    `What is ${topic}?`,
    `How does ${topic} work?`,
    `What are the benefits of ${topic}?`,
    `How to implement ${topic}?`,
    `What are ${topic} best practices?`,
    `How much does ${topic} cost?`,
    `What are the requirements for ${topic}?`,
    `How to choose ${topic} solution?`,
    `What are ${topic} alternatives?`,
    `How to measure ${topic} success?`,
    `What are common ${topic} problems?`,
    `How to get started with ${topic}?`,
    `What is the ROI of ${topic}?`,
    `How long does ${topic} take to implement?`,
    `What support is needed for ${topic}?`
  ]

  if (industry) {
    snippets.push(
      `How is ${topic} used in ${industry}?`,
      `What are ${industry} ${topic} benefits?`,
      `Best ${topic} practices for ${industry}`,
      `${industry} ${topic} implementation guide`
    )
  }

  return snippets.slice(0, 16)
}

function generateLongTailKeywords(topic: string, keywords: string[], industry?: string, audience?: string): string[] {
  const longTail = [
    `best ${topic} solution for small business`,
    `${topic} implementation step by step guide`,
    `how to choose the right ${topic} provider`,
    `${topic} cost comparison and pricing guide`,
    `${topic} benefits for business growth`,
    `${topic} integration with existing systems`,
    `${topic} training and certification programs`,
    `${topic} success stories and case studies`,
    `${topic} troubleshooting and support resources`,
    `${topic} vs traditional methods comparison`,
    `${topic} security and compliance considerations`,
    `${topic} scalability and future planning`,
    `${topic} customization and configuration options`,
    `${topic} performance metrics and KPIs`,
    `${topic} vendor selection criteria and checklist`
  ]

  if (industry) {
    longTail.push(
      `${topic} solutions for ${industry} companies`,
      `${industry} specific ${topic} implementation`,
      `${topic} compliance requirements for ${industry}`,
      `${industry} ${topic} market trends and analysis`
    )
  }

  if (audience) {
    longTail.push(
      `${topic} guide for ${audience}`,
      `how ${audience} can benefit from ${topic}`,
      `${topic} training for ${audience}`,
      `${audience} ${topic} success strategies`
    )
  }

  return longTail.slice(0, 20)
}

function generateComparisonQueries(topic: string, keywords: string[], industry?: string): string[] {
  const comparisons = [
    `${topic} vs traditional methods`,
    `${topic} vs competitors comparison`,
    `${topic} vs alternative solutions`,
    `${topic} vs manual processes`,
    `${topic} vs legacy systems`,
    `${topic} vs other approaches`,
    `${topic} vs industry standards`,
    `${topic} vs custom development`,
    `${topic} vs outsourcing`,
    `${topic} vs in-house solutions`,
    `${topic} vs cloud solutions`,
    `${topic} vs on-premise solutions`,
    `${topic} vs hybrid approaches`,
    `${topic} vs enterprise solutions`,
    `${topic} vs small business solutions`
  ]

  keywords.forEach(keyword => {
    comparisons.push(
      `${topic} vs ${keyword} comparison`,
      `${keyword} vs ${topic} which is better`,
      `${topic} and ${keyword} differences`
    )
  })

  return comparisons.slice(0, 15)
}

function generateHowToQueries(topic: string, keywords: string[], industry?: string): string[] {
  const howTo = [
    `how to implement ${topic} successfully`,
    `how to get started with ${topic}`,
    `how to choose the best ${topic} solution`,
    `how to measure ${topic} ROI`,
    `how to optimize ${topic} performance`,
    `how to integrate ${topic} with existing systems`,
    `how to train team on ${topic}`,
    `how to troubleshoot ${topic} issues`,
    `how to scale ${topic} implementation`,
    `how to maintain ${topic} systems`,
    `how to upgrade ${topic} solutions`,
    `how to secure ${topic} implementation`,
    `how to customize ${topic} for specific needs`,
    `how to evaluate ${topic} vendors`,
    `how to plan ${topic} deployment`
  ]

  if (industry) {
    howTo.push(
      `how to implement ${topic} in ${industry}`,
      `how to adapt ${topic} for ${industry} needs`,
      `how to comply with ${industry} regulations using ${topic}`,
      `how to maximize ${topic} benefits in ${industry}`
    )
  }

  keywords.forEach(keyword => {
    howTo.push(
      `how to use ${keyword} with ${topic}`,
      `how to optimize ${keyword} for ${topic}`,
      `how to integrate ${keyword} into ${topic} strategy`
    )
  })

  return howTo.slice(0, 18)
}

function generateAnalysisSummary(content: string, topic: string, industry?: string, audience?: string): string {
  let summary = `Based on the analysis of your content about ${topic}, I've generated comprehensive prompt suggestions optimized for AI systems and voice search. `
  
  summary += `The content appears to focus on ${topic} with strong potential for AI visibility optimization. `
  
  if (industry) {
    summary += `Given the ${industry} industry context, the suggestions include sector-specific queries and considerations. `
  }
  
  if (audience) {
    summary += `The prompts are tailored for ${audience}, ensuring relevance and engagement for your target market. `
  }
  
  summary += `The generated suggestions cover voice search queries, FAQ questions, headlines, featured snippet targets, long-tail keywords, comparison queries, and how-to content. `
  
  summary += `These prompts are designed to improve your content's discoverability by AI systems, increase chances of being cited in AI responses, and optimize for conversational search patterns used by voice assistants and chatbots.`
  
  return summary
}