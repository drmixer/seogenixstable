import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Copy, Check } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import FeatureRestriction from '../../components/ui/FeatureRestriction';
import toast from 'react-hot-toast';

const AiContentGenerator = () => {
  const { isFeatureEnabled, canGenerateContent } = useSubscription();
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // If the feature isn't enabled, show the restriction component
  if (!isFeatureEnabled('aiContent')) {
    return (
      <AppLayout>
        <FeatureRestriction
          title="AI Content Generator"
          description="Generate AI-optimized content snippets, FAQs, and meta descriptions tailored for maximum AI visibility."
          requiredPlan="Pro"
        />
      </AppLayout>
    );
  }

  const contentTypes = [
    { value: 'blogOutline', label: 'Blog Post Outline' },
    { value: 'faqSection', label: 'FAQ Section' },
    { value: 'metaDescription', label: 'Meta Description' },
    { value: 'productDescription', label: 'Product Description' },
    { value: 'socialPost', label: 'Social Media Post' }
  ];

  const handleGenerateContent = () => {
    if (!topic || !contentType) {
      toast.error('Please enter a topic and select a content type');
      return;
    }

    if (!canGenerateContent()) {
      toast.error('You have reached your content generation limit for this month');
      return;
    }
    
    setIsGenerating(true);
    
    // Rest of the existing generation logic...
    setTimeout(() => {
      // Example content for demonstration
      const contentExamples = {
        blogOutline: `# Improving Your Website's AI Visibility: A Complete Guide

## Introduction
- Why AI visibility matters in 2025
- The difference between traditional SEO and AI optimization
- Overview of key AI platforms (ChatGPT, Perplexity, voice assistants)

## 1. Understanding AI Content Consumption
- How AI systems read and process web content
- The importance of clear, structured information
- Entity recognition and semantic understanding

## 2. Key Elements of AI-Friendly Content
- Schema.org markup implementation
- Clear headings and semantic structure
- Comprehensive entity coverage
- Direct question-answer formats

## 3. Optimizing for Voice Assistants
- Natural language patterns
- Featured snippet optimization
- Voice search keyword research
- Local business considerations

## 4. Measuring AI Visibility Success
- Citation tracking across AI platforms
- Visibility scoring metrics
- Testing voice assistant responses
- Monitoring featured snippet inclusion

## Conclusion
- Action steps for improving AI visibility
- Future trends in AI-focused SEO
- Resources for further learning`,
        
        faqSection: `## Frequently Asked Questions About AI Visibility

### What is AI visibility?
AI visibility refers to how well your content is understood, indexed, and cited by AI systems like ChatGPT, Bing AI, and voice assistants. It determines whether your content appears in AI-generated responses.

### How is AI visibility different from traditional SEO?
While traditional SEO focuses on ranking in search engine results pages, AI visibility is about being understood and cited by AI systems in direct responses to users. It requires structured data, semantic clarity, and comprehensive entity coverage.

### What are the most important factors for AI visibility?
The key factors include implementing proper schema.org markup, creating clear semantic structure, providing comprehensive information about relevant entities, and formatting content to directly answer common questions.

### How can I improve my site's chances of being cited by AI tools?
Focus on creating authoritative, factual content with clear structure. Implement appropriate schema markup, use clear headings, create comprehensive FAQ sections, and ensure your content directly answers common questions in your niche.

### Can I track when AI systems cite my content?
Yes, with specialized tools like SEOgenix, you can monitor when your content is cited by various AI systems, including featured snippets in search engines and direct references in AI chat responses.

### Does AI visibility impact traditional search rankings?
Yes, there's growing overlap between AI visibility factors and traditional SEO signals. Implementing schema markup and creating structured content helps with both AI understanding and search engine optimization.`,
        
        metaDescription: `Improve your content's visibility to AI systems like ChatGPT and voice assistants. Our guide explains schema markup, entity optimization, and citation tracking strategies to ensure your website gets cited by AI tools. Learn how to measure and improve your AI visibility score today.`
      };
      
      setGeneratedContent(contentExamples[contentType as keyof typeof contentExamples] || contentExamples.blogOutline);
      setIsGenerating(false);
      toast.success('Content generated successfully');
    }, 2000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    setIsCopied(true);
    toast.success('Content copied to clipboard');
    
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">AI Content Generator</h1>
          <p className="mt-2 text-gray-600">
            Create AI-optimized content snippets, FAQs, and meta descriptions tailored for maximum AI visibility.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Generate Content</h2>
              
              <div className="space-y-4">
                <div>
                  <Input
                    id="topic"
                    label="Topic or Keyword"
                    type="text"
                    placeholder="e.g., AI visibility for e-commerce"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="contentType" className="block text-sm font-medium text-gray-700 mb-1">
                    Content Type
                  </label>
                  <select
                    id="contentType"
                    name="contentType"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                  >
                    <option value="">Select a content type</option>
                    {contentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleGenerateContent}
                    isLoading={isGenerating}
                    disabled={!canGenerateContent()}
                    icon={<FileText size={16} />}
                  >
                    Generate Content
                  </Button>
                  {!canGenerateContent() && (
                    <p className="mt-2 text-sm text-red-600">
                      You have reached your content generation limit for this month
                    </p>
                  )}
                </div>
              </div>
            </Card>
            
            <Card className="mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">AI-Optimized Content Tips</h2>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2">✓</span>
                  <span>Use clear, direct language that answers specific questions</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2">✓</span>
                  <span>Include factual information with authoritative sources</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2">✓</span>
                  <span>Structure content with semantic HTML headings</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2">✓</span>
                  <span>Cover related entities comprehensively</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2">✓</span>
                  <span>Create FAQ sections that match common queries</span>
                </li>
              </ul>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Generated Content</h2>
                {generatedContent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    icon={isCopied ? <Check size={16} /> : <Copy size={16} />}
                  >
                    {isCopied ? 'Copied!' : 'Copy'}
                  </Button>
                )}
              </div>
              
              {generatedContent ? (
                <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[600px] prose max-w-none">
                  {generatedContent.split('\n').map((line, index) => {
                    if (line.startsWith('# ')) {
                      return <h1 key={index} className="text-2xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
                    } else if (line.startsWith('## ')) {
                      return <h2 key={index} className="text-xl font-bold mt-4 mb-2">{line.substring(3)}</h2>;
                    } else if (line.startsWith('### ')) {
                      return <h3 key={index} className="text-lg font-bold mt-3 mb-2">{line.substring(4)}</h3>;
                    } else if (line.startsWith('- ')) {
                      return <li key={index} className="ml-4">{line.substring(2)}</li>;
                    } else if (line.trim() === '') {
                      return <br key={index} />;
                    } else {
                      return <p key={index}>{line}</p>;
                    }
                  })}
                </div>
              ) : (
                <div className="bg-gray-50 p-8 rounded-md text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Enter a topic and select a content type to generate AI-optimized content.
                  </p>
                </div>
              )}
              
              {generatedContent && (
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Next Steps:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Review and edit the generated content to match your brand voice</li>
                    <li>Add specific details relevant to your business or products</li>
                    <li>Include links to authoritative sources where appropriate</li>
                    <li>Enhance with relevant statistics and examples</li>
                    <li>Add schema markup to further improve AI understanding</li>
                  </ul>
                </div>
              )}
            </Card>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default AiContentGenerator;