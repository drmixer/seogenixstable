import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Copy, Check, Lightbulb, Target, TrendingUp, Users, Building, Zap } from 'lucide-react';
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
  const [industry, setIndustry] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('');
  const [length, setLength] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [dataSource, setDataSource] = useState('');
  const [wordCount, setWordCount] = useState(0);

  // Content type options
  const contentTypes = [
    { value: 'blogOutline', label: 'Blog Post Outline', icon: <FileText size={16} /> },
    { value: 'faqSection', label: 'FAQ Section', icon: <Users size={16} /> },
    { value: 'metaDescription', label: 'Meta Description', icon: <Target size={16} /> },
    { value: 'productDescription', label: 'Product/Service Description', icon: <Building size={16} /> },
    { value: 'socialPost', label: 'Social Media Posts', icon: <TrendingUp size={16} /> },
    { value: 'emailNewsletter', label: 'Email Newsletter', icon: <Lightbulb size={16} /> },
    { value: 'landingPageCopy', label: 'Landing Page Copy', icon: <Zap size={16} /> },
    { value: 'pressRelease', label: 'Press Release', icon: <FileText size={16} /> }
  ];

  // Industry options
  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 
    'Real Estate', 'Marketing', 'Consulting', 'Manufacturing', 'Retail',
    'Travel', 'Food & Beverage', 'Automotive', 'Legal', 'Non-profit'
  ];

  // Target audience options
  const audiences = [
    'Small Business Owners', 'Enterprise Clients', 'Consumers', 'Professionals',
    'Students', 'Entrepreneurs', 'Developers', 'Marketers', 'Executives',
    'Freelancers', 'Startups', 'Agencies', 'Investors', 'Researchers'
  ];

  // Tone options
  const tones = [
    'Professional', 'Conversational', 'Authoritative', 'Friendly', 'Technical',
    'Persuasive', 'Educational', 'Inspirational', 'Casual', 'Formal'
  ];

  // Length options
  const lengths = [
    'Short (100-300 words)', 'Medium (300-600 words)', 'Long (600-1000 words)', 'Extended (1000+ words)'
  ];

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
  if (!sites || sites.length === 0) {
    return (
      <AppLayout>
        <EmptyState
          title="No sites added yet"
          description="Add your first site to start generating AI-optimized content."
          icon={<FileText size={24} />}
          actionLabel="Add Your First Site"
          onAction={() => window.location.href = '/add-site'}
        />
      </AppLayout>
    );
  }

  const handleGenerateContent = async () => {
    if (!topic || !contentType) {
      toast.error('Please enter a topic and select a content type');
      return;
    }

    if (!canGenerateContent()) {
      toast.error('You have reached your content generation limit for this month');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const result = await contentApi.generateContent(
        topic,
        contentType,
        industry || undefined,
        targetAudience || undefined,
        tone || undefined,
        length || undefined,
        selectedSite?.url
      );
      
      setGeneratedContent(result.content);
      setDataSource(result.dataSource || 'Generated');
      setWordCount(result.wordCount || 0);
      toast.success(`Content generated successfully! (${result.wordCount || 0} words)`);
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
          {selectedSite && (
            <div className="mt-2 text-sm text-gray-500">
              Generating content for: <span className="font-medium text-gray-700">{selectedSite.name}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Content Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <Input
                    id="topic"
                    label="Topic or Subject *"
                    type="text"
                    placeholder="e.g., AI visibility for e-commerce websites"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="contentType" className="block text-sm font-medium text-gray-700 mb-1">
                    Content Type *
                  </label>
                  <select
                    id="contentType"
                    name="contentType"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                  >
                    <option value="">Select content type</option>
                    {contentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                    Industry (Optional)
                  </label>
                  <select
                    id="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">Select industry</option>
                    {industries.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="audience" className="block text-sm font-medium text-gray-700 mb-1">
                    Target Audience (Optional)
                  </label>
                  <select
                    id="audience"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">Select target audience</option>
                    {audiences.map((aud) => (
                      <option key={aud} value={aud}>{aud}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-1">
                    Tone (Optional)
                  </label>
                  <select
                    id="tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">Select tone</option>
                    {tones.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="length" className="block text-sm font-medium text-gray-700 mb-1">
                    Length (Optional)
                  </label>
                  <select
                    id="length"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">Select length</option>
                    {lengths.map((l) => (
                      <option key={l} value={l}>{l}</option>
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
                    {isGenerating ? 'Generating Content...' : 'Generate Content'}
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
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <Target className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Use clear, direct language that answers specific questions</span>
                </li>
                <li className="flex items-start">
                  <TrendingUp className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Include factual information with authoritative sources</span>
                </li>
                <li className="flex items-start">
                  <Building className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Structure content with semantic HTML headings</span>
                </li>
                <li className="flex items-start">
                  <Users className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Cover related entities comprehensively</span>
                </li>
                <li className="flex items-start">
                  <Lightbulb className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Create FAQ sections that match common queries</span>
                </li>
              </ul>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <Card>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Generated Content</h2>
                  {generatedContent && (
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <span>📊 Source: {dataSource}</span>
                      <span>📝 Words: {wordCount}</span>
                      <span>⏰ Generated: {new Date().toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
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
                    } else if (line.startsWith('**') && line.endsWith('**')) {
                      return <h4 key={index} className="text-md font-bold mt-3 mb-2">{line.substring(2, line.length - 2)}</h4>;
                    } else if (line.startsWith('- ') || line.startsWith('• ')) {
                      return <li key={index} className="ml-4">{line.substring(2)}</li>;
                    } else if (line.match(/^\d+\./)) {
                      return <li key={index} className="ml-4 list-decimal">{line.substring(line.indexOf('.') + 1)}</li>;
                    } else if (line.trim() === '') {
                      return <br key={index} />;
                    } else if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
                      return <p key={index} className="italic">{line.substring(1, line.length - 1)}</p>;
                    } else {
                      return <p key={index}>{line}</p>;
                    }
                  })}
                </div>
              ) : (
                <div className="bg-gray-50 p-8 rounded-md text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Generate Content</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">
                    Enter a topic and select a content type to generate AI-optimized content for {selectedSite?.name || 'your site'}.
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto">
                    <p className="text-sm text-blue-700">
                      <strong>Pro Tip:</strong> Be specific about your topic and include context for better results.
                    </p>
                  </div>
                </div>
              )}
              
              {generatedContent && (
                <div className="mt-6 bg-green-50 p-4 rounded-lg border border-green-100">
                  <h3 className="text-md font-medium text-green-800 mb-2">Next Steps:</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-green-700">
                    <li>Review and edit the generated content to match your brand voice</li>
                    <li>Add specific details relevant to your business or products</li>
                    <li>Include links to authoritative sources where appropriate</li>
                    <li>Enhance with relevant statistics and examples</li>
                    <li>Add schema markup to further improve AI understanding</li>
                    <li>Test the content with voice assistants and AI tools</li>
                  </ul>
                </div>
              )}
            </Card>

            {/* Content Type Examples */}
            <Card className="mt-6 bg-blue-50 border border-blue-100">
              <h3 className="text-lg font-medium text-blue-800 mb-4">Content Type Guide</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                <div>
                  <h4 className="font-medium mb-2">Blog & Articles:</h4>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Blog Post Outline - Comprehensive structure</li>
                    <li>FAQ Section - Q&A format content</li>
                    <li>Press Release - News announcement format</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Marketing & Sales:</h4>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Product Description - Sales-focused copy</li>
                    <li>Landing Page Copy - Conversion-optimized</li>
                    <li>Meta Description - SEO snippets</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Social & Email:</h4>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Social Media Posts - Platform-specific</li>
                    <li>Email Newsletter - Engagement-focused</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">AI Optimization:</h4>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Voice search friendly</li>
                    <li>Featured snippet optimized</li>
                    <li>Citation-worthy content</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default AiContentGenerator;