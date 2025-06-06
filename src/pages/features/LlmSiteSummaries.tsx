import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileBarChart, Copy, Check, RefreshCw } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const LlmSiteSummaries = () => {
  const [selectedSite, setSelectedSite] = useState('');
  const [summaryType, setSummaryType] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  
  // Demo sites data
  const demoSites = [
    { id: '1', name: 'Demo Site 1', url: 'https://example.com' },
    { id: '2', name: 'Demo Site 2', url: 'https://example.org' }
  ];
  
  const summaryTypes = [
    { value: 'SiteOverview', label: 'Site Overview' },
    { value: 'PageSummary', label: 'Page Summary' },
    { value: 'ProductCatalog', label: 'Product Catalog' },
    { value: 'ServiceOfferings', label: 'Service Offerings' },
    { value: 'AIReadiness', label: 'AI Readiness Report' }
  ];

  const handleGenerateSummary = () => {
    if (!selectedSite || !summaryType) {
      toast.error('Please select a site and summary type');
      return;
    }
    
    setIsGenerating(true);
    setGeneratedSummary('');
    
    // Simulate API call
    setTimeout(() => {
      // Example summary for demonstration
      const demoSummaries = {
        SiteOverview: `# Example.com Site Summary

## Overview
Example.com is a comprehensive platform focused on AI visibility optimization services. The site offers tools and guidance for improving content visibility to AI systems like ChatGPT, Perplexity, and voice assistants.

## Main Services
- AI Visibility Audits
- Schema Markup Generation
- Citation Tracking
- Voice Assistant Testing
- Entity Coverage Analysis

## Key Value Propositions
- Specialized in optimizing for AI understanding rather than just traditional SEO
- Provides actionable metrics and recommendations
- Offers tools to test and verify AI visibility improvements
- Focuses on structured data implementation for maximum AI comprehension

## Primary Audience
The site targets digital marketers, SEO professionals, and business owners looking to adapt their online presence for the AI era and improve their content's visibility in AI-generated responses.`,
        
        PageSummary: `# AI Visibility Audit Page Summary

## Page Purpose
This page explains the AI Visibility Audit service, which analyzes websites for AI-readiness and provides actionable recommendations.

## Key Components
- AI Visibility Score calculation methodology
- Schema markup evaluation criteria
- Semantic relevance assessment process
- Citation tracking capabilities
- Technical SEO factors that impact AI understanding

## Benefits Highlighted
- Comprehensive analysis of AI visibility factors
- Actionable recommendations for improvement
- Comparative scoring against industry benchmarks
- Regular monitoring and progress tracking

## Call to Action
The page encourages visitors to run their first audit by adding a site to their dashboard.`,
        
        AIReadiness: `# AI Readiness Report for Example.com

## Overall AI Visibility Score: 76/100

### Strengths
- Strong schema.org implementation (92/100)
- Good semantic structure with clear headings (85/100)
- Comprehensive FAQ sections addressing common queries (88/100)
- Authoritative content with factual information (90/100)

### Areas for Improvement
- Entity coverage is incomplete (65/100)
  • Missing detailed information about key industry concepts
  • Limited relationship mapping between entities
- Citation signals are weak (58/100)
  • Limited external references from authoritative sources
  • Few opportunities for featured snippet inclusion
- Technical issues affecting AI crawling (71/100)
  • Slow page load times on mobile
  • Some structured data implementation errors

### Recommended Actions
1. Expand entity coverage for key industry terms
2. Implement more comprehensive schema markup
3. Create content that directly answers top industry questions
4. Improve page speed for better AI crawling
5. Fix structured data errors identified in the audit`
      };
      
      setGeneratedSummary(demoSummaries[summaryType as keyof typeof demoSummaries] || demoSummaries.SiteOverview);
      setIsGenerating(false);
      toast.success('Summary generated successfully');
    }, 2000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedSummary);
    setIsCopied(true);
    toast.success('Summary copied to clipboard');
    
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
          <h1 className="text-2xl font-bold text-gray-900">LLM Site Summaries</h1>
          <p className="mt-2 text-gray-600">
            Generate concise summaries of your site optimized for AI understanding and citations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Generate Summary</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="site" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Site
                  </label>
                  <select
                    id="site"
                    name="site"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={selectedSite}
                    onChange={(e) => setSelectedSite(e.target.value)}
                  >
                    <option value="">Select a site</option>
                    {demoSites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="summaryType" className="block text-sm font-medium text-gray-700 mb-1">
                    Summary Type
                  </label>
                  <select
                    id="summaryType"
                    name="summaryType"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={summaryType}
                    onChange={(e) => setSummaryType(e.target.value)}
                  >
                    <option value="">Select a summary type</option>
                    {summaryTypes.map((type) => (
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
                    onClick={handleGenerateSummary}
                    isLoading={isGenerating}
                    icon={<RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />}
                  >
                    Generate Summary
                  </Button>
                </div>
              </div>
            </Card>
            
            <Card className="mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Why Generate LLM Summaries?</h2>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2">✓</span>
                  <span>Helps AI systems quickly understand your site's purpose</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2">✓</span>
                  <span>Improves chances of accurate citations in AI responses</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2">✓</span>
                  <span>Provides concise descriptions optimized for AI consumption</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2">✓</span>
                  <span>Identifies your site's key entities and relationships</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2">✓</span>
                  <span>Creates AI-friendly content that can be added to your site</span>
                </li>
              </ul>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Generated Summary</h2>
                {generatedSummary && (
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
              
              {generatedSummary ? (
                <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[600px] prose max-w-none">
                  {generatedSummary.split('\n').map((line, index) => {
                    if (line.startsWith('# ')) {
                      return <h1 key={index} className="text-2xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
                    } else if (line.startsWith('## ')) {
                      return <h2 key={index} className="text-xl font-bold mt-4 mb-2">{line.substring(3)}</h2>;
                    } else if (line.startsWith('### ')) {
                      return <h3 key={index} className="text-lg font-bold mt-3 mb-2">{line.substring(4)}</h3>;
                    } else if (line.startsWith('- ')) {
                      return <li key={index} className="ml-4">{line.substring(2)}</li>;
                    } else if (line.startsWith('  • ')) {
                      return <li key={index} className="ml-8 list-disc">{line.substring(4)}</li>;
                    } else if (line.match(/^\d+\./)) {
                      return <li key={index} className="ml-4 list-decimal">{line.substring(line.indexOf('.') + 1)}</li>;
                    } else if (line.trim() === '') {
                      return <br key={index} />;
                    } else {
                      return <p key={index}>{line}</p>;
                    }
                  })}
                </div>
              ) : (
                <div className="bg-gray-50 p-8 rounded-md text-center">
                  <FileBarChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Select a site and summary type to generate an LLM-friendly summary.
                  </p>
                </div>
              )}
              
              {generatedSummary && (
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-2">How to Use This Summary:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Add to your site's About page or main landing page</li>
                    <li>Include in your site's meta description or OpenGraph tags</li>
                    <li>Use in your robots.txt or structured data</li>
                    <li>Incorporate key points into your FAQ section</li>
                    <li>Reference when communicating with AI systems directly</li>
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

export default LlmSiteSummaries;