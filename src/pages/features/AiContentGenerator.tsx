import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Copy, Check, Download, Wand2, Lightbulb, AlertCircle } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useSites } from '../../contexts/SiteContext';
import { contentApi } from '../../lib/api';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import FeatureRestriction from '../../components/ui/FeatureRestriction';
import toast from 'react-hot-toast';

const AiContentGenerator = () => {
  const { isFeatureEnabled, canGenerateContent } = useSubscription();
  const { selectedSite, sites } = useSites();
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [dataSource, setDataSource] = useState('');

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

  // Show empty state if no sites
  if (sites.length === 0) {
    return (
      <AppLayout>
        <EmptyState
          title="No sites added yet"
          description="Add your first site to start generating AI-optimized content tailored to your website."
          icon={<FileText size={24} />}
          actionLabel="Add Your First Site"
          onAction={() => window.location.href = '/add-site'}
        />
      </AppLayout>
    );
  }

  const contentTypes = [
    { value: 'blogOutline', label: 'Blog Post Outline', description: 'Structured outline for comprehensive blog posts' },
    { value: 'faqSection', label: 'FAQ Section', description: 'Frequently asked questions and answers' },
    { value: 'metaDescription', label: 'Meta Description', description: 'SEO-optimized meta descriptions' },
    { value: 'productDescription', label: 'Product Description', description: 'Compelling product descriptions' },
    { value: 'socialPost', label: 'Social Media Post', description: 'Engaging social media content' }
  ];

  const topicSuggestions = [
    'AI visibility optimization',
    'Voice search SEO',
    'Schema markup implementation',
    'Content marketing strategy',
    'Digital transformation',
    'E-commerce optimization',
    'Local business SEO',
    'Technical SEO audit'
  ];

  const handleGenerateContent = async () => {
    if (!selectedSite) {
      toast.error('Please select a site first');
      return;
    }

    if (!topic || !contentType) {
      toast.error('Please enter a topic and select a content type');
      return;
    }

    if (!canGenerateContent()) {
      toast.error('You have reached your content generation limit for this month');
      return;
    }
    
    setIsGenerating(true);
    setGeneratedContent('');
    setDataSource('');
    
    try {
      // Include site context in the topic for better content generation
      const contextualTopic = `${topic} for ${selectedSite.name} (${selectedSite.url})`;
      const result = await contentApi.generateContent(contextualTopic, contentType);
      setGeneratedContent(result.content || result);
      setDataSource(result.dataSource || 'Generated');
      toast.success('Content generated successfully');
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    setIsCopied(true);
    toast.success('Content copied to clipboard');
    
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const downloadContent = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.replace(/\s+/g, '-').toLowerCase()}-${contentType}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Content downloaded');
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold mt-6 mb-3 text-gray-900">{line.substring(2)}</h1>;
      } else if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-bold mt-5 mb-2 text-gray-800">{line.substring(3)}</h2>;
      } else if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-bold mt-4 mb-2 text-gray-700">{line.substring(4)}</h3>;
      } else if (line.startsWith('- ')) {
        return <li key={index} className="ml-4 mb-1 text-gray-600">{line.substring(2)}</li>;
      } else if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={index} className="font-bold text-gray-800 mt-3 mb-1">{line.slice(2, -2)}</p>;
      } else if (line.trim() === '') {
        return <br key={index} />;
      } else {
        return <p key={index} className="mb-2 text-gray-600 leading-relaxed">{line}</p>;
      }
    });
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
            Create AI-optimized content for <span className="font-medium">{selectedSite?.name}</span> tailored for maximum AI visibility.
          </p>
        </div>

        {!selectedSite && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Please select a site from the dropdown above to generate content tailored to your website.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Generate Content</h2>
              
              <div className="space-y-4">
                {selectedSite && (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium text-gray-700">Selected Site:</p>
                    <p className="text-sm text-gray-600">{selectedSite.name}</p>
                    <p className="text-xs text-gray-500">{selectedSite.url}</p>
                  </div>
                )}

                <div>
                  <Input
                    id="topic"
                    label="Topic or Keyword"
                    type="text"
                    placeholder="e.g., AI visibility for e-commerce"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-2">Quick suggestions:</p>
                    <div className="flex flex-wrap gap-1">
                      {topicSuggestions.slice(0, 4).map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setTopic(suggestion)}
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
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
                  {contentType && (
                    <p className="mt-1 text-sm text-gray-500">
                      {contentTypes.find(t => t.value === contentType)?.description}
                    </p>
                  )}
                </div>
                
                <div>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleGenerateContent}
                    isLoading={isGenerating}
                    disabled={!canGenerateContent() || !selectedSite}
                    icon={<Wand2 size={16} />}
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
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
                AI-Optimized Content Tips
              </h2>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2 mt-0.5">✓</span>
                  <span>Use clear, direct language that answers specific questions</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2 mt-0.5">✓</span>
                  <span>Include factual information with authoritative sources</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2 mt-0.5">✓</span>
                  <span>Structure content with semantic HTML headings</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2 mt-0.5">✓</span>
                  <span>Cover related entities comprehensively</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2 mt-0.5">✓</span>
                  <span>Create FAQ sections that match common queries</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2 mt-0.5">✓</span>
                  <span>Optimize for voice search and natural language</span>
                </li>
              </ul>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <Card>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Generated Content</h2>
                  {dataSource && (
                    <p className="text-sm text-gray-500 mt-1">Source: {dataSource}</p>
                  )}
                </div>
                {generatedContent && (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadContent}
                      icon={<Download size={16} />}
                    >
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      icon={isCopied ? <Check size={16} /> : <Copy size={16} />}
                    >
                      {isCopied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                )}
              </div>
              
              {generatedContent ? (
                <div className="bg-gray-50 p-6 rounded-md overflow-auto max-h-[600px] prose max-w-none">
                  {formatContent(generatedContent)}
                </div>
              ) : (
                <div className="bg-gray-50 p-8 rounded-md text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {selectedSite ? 'Enter a topic and select a content type to generate AI-optimized content.' : 'Select a site, enter a topic, and choose a content type to get started.'}
                  </p>
                </div>
              )}
              
              {generatedContent && (
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Next Steps:</h3>
                  <div className="bg-blue-50 p-4 rounded-md">
                    <ul className="list-disc list-inside space-y-2 text-blue-800 text-sm">
                      <li>Review and edit the generated content to match your brand voice</li>
                      <li>Add specific details relevant to your business or products</li>
                      <li>Include links to authoritative sources where appropriate</li>
                      <li>Enhance with relevant statistics and examples</li>
                      <li>Add schema markup to further improve AI understanding</li>
                      <li>Test the content with voice search queries</li>
                    </ul>
                  </div>
                  
                  <div className="mt-4 p-4 bg-green-50 rounded-md">
                    <h4 className="text-sm font-medium text-green-800 mb-2">AI Optimization Checklist:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
                      <div>✓ Clear headings structure</div>
                      <div>✓ Question-answer format</div>
                      <div>✓ Natural language patterns</div>
                      <div>✓ Entity-rich content</div>
                      <div>✓ Factual information</div>
                      <div>✓ Voice search friendly</div>
                    </div>
                  </div>
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