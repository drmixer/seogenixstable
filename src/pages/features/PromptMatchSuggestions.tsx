import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Copy, Check, Lightbulb, Target, Search, TrendingUp, Users, Building } from 'lucide-react';
import { useSites } from '../../contexts/SiteContext';
import { promptApi } from '../../lib/api';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

interface PromptSuggestions {
  voice_search: string[];
  faq_questions: string[];
  headlines: string[];
  featured_snippets: string[];
  long_tail: string[];
  comparisons: string[];
  how_to: string[];
  analysis_summary: string;
  data_source: string;
}

const PromptMatchSuggestions = () => {
  const { selectedSite, sites } = useSites();
  const [content, setContent] = useState('');
  const [industry, setIndustry] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [contentType, setContentType] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<PromptSuggestions | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState('');
  const [totalSuggestions, setTotalSuggestions] = useState(0);

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

  // Content type options
  const contentTypes = [
    'Blog Post', 'Landing Page', 'Product Page', 'Service Page', 'About Page',
    'FAQ Page', 'Case Study', 'White Paper', 'Guide', 'Tutorial', 'News Article'
  ];

  // Show empty state if no sites
  if (!sites || sites.length === 0) {
    return (
      <AppLayout>
        <EmptyState
          title="No sites added yet"
          description="Add your first site to start generating prompt suggestions."
          icon={<MessageSquare size={24} />}
          actionLabel="Add Your First Site"
          onAction={() => window.location.href = '/add-site'}
        />
      </AppLayout>
    );
  }

  const handleGenerateSuggestions = async () => {
    if (!content.trim()) {
      toast.error('Please enter some content to analyze');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const result = await promptApi.generatePrompts(
        content,
        industry || undefined,
        targetAudience || undefined,
        contentType || undefined,
        selectedSite?.url
      );
      
      setSuggestions(result.suggestions);
      setDataSource(result.dataSource || 'Analysis');
      setTotalSuggestions(result.total_suggestions || 0);
      toast.success(`Generated ${result.total_suggestions || 'multiple'} suggestions successfully!`);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast.error('Failed to generate suggestions');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (category: string, index: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(`${category}-${index}`);
    toast.success('Copied to clipboard');
    
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  const copyAllInCategory = (category: string, items: string[]) => {
    const allText = items.join('\n');
    navigator.clipboard.writeText(allText);
    toast.success(`Copied all ${category} suggestions`);
  };

  const renderSuggestionCategory = (
    title: string, 
    items: string[], 
    icon: React.ReactNode, 
    description: string,
    categoryKey: string
  ) => (
    <Card key={categoryKey} className="mb-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => copyAllInCategory(title, items)}
          icon={<Copy size={14} />}
        >
          Copy All
        </Button>
      </div>
      
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
            <span className="text-gray-700 flex-1">{item}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(categoryKey, index, item)}
              icon={copiedIndex === `${categoryKey}-${index}` ? <Check size={14} /> : <Copy size={14} />}
            >
              {copiedIndex === `${categoryKey}-${index}` ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">AI Prompt Match Suggestions</h1>
          <p className="mt-2 text-gray-600">
            Generate comprehensive prompt suggestions optimized for AI systems, voice search, and featured snippets.
          </p>
          {selectedSite && (
            <div className="mt-2 text-sm text-gray-500">
              Analyzing for: <span className="font-medium text-gray-700">{selectedSite.name}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Content Analysis</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Content *
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    rows={6}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Paste your content, describe your topic, or enter key information about your page/service..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
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
                  <label htmlFor="contentType" className="block text-sm font-medium text-gray-700 mb-1">
                    Content Type (Optional)
                  </label>
                  <select
                    id="contentType"
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">Select content type</option>
                    {contentTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleGenerateSuggestions}
                    isLoading={isGenerating}
                    icon={<MessageSquare size={16} />}
                  >
                    {isGenerating ? 'Analyzing Content...' : 'Generate AI Prompts'}
                  </Button>
                </div>
              </div>
            </Card>
            
            <Card className="mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Why Use AI Prompt Matching?</h2>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <Target className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Match natural language patterns used in voice search and AI queries</span>
                </li>
                <li className="flex items-start">
                  <TrendingUp className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Increase chances of being cited in AI responses and featured snippets</span>
                </li>
                <li className="flex items-start">
                  <Search className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Optimize content structure for better AI understanding</span>
                </li>
                <li className="flex items-start">
                  <Lightbulb className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Generate content ideas that align with user search intent</span>
                </li>
                <li className="flex items-start">
                  <Users className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Create FAQ sections that directly answer common questions</span>
                </li>
              </ul>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            {suggestions ? (
              <div className="space-y-6">
                {/* Analysis Summary */}
                <Card className="bg-blue-50 border border-blue-100">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Lightbulb className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-blue-800 mb-2">Analysis Summary</h3>
                      <p className="text-sm text-blue-700 mb-3">{suggestions.analysis_summary}</p>
                      <div className="flex items-center space-x-4 text-xs text-blue-600">
                        <span>📊 Data Source: {dataSource}</span>
                        <span>📈 Total Suggestions: {totalSuggestions}</span>
                        <span>⏰ Generated: {new Date().toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Voice Search Queries */}
                {renderSuggestionCategory(
                  'Voice Search Queries',
                  suggestions.voice_search,
                  <MessageSquare className="h-4 w-4 text-indigo-600" />,
                  'Natural, conversational questions for voice assistants',
                  'voice-search'
                )}

                {/* FAQ Questions */}
                {renderSuggestionCategory(
                  'FAQ Questions',
                  suggestions.faq_questions,
                  <Users className="h-4 w-4 text-indigo-600" />,
                  'Perfect for creating comprehensive FAQ sections',
                  'faq'
                )}

                {/* Headlines */}
                {renderSuggestionCategory(
                  'AI-Optimized Headlines',
                  suggestions.headlines,
                  <TrendingUp className="h-4 w-4 text-indigo-600" />,
                  'Headlines optimized for AI understanding and engagement',
                  'headlines'
                )}

                {/* Featured Snippet Targets */}
                {renderSuggestionCategory(
                  'Featured Snippet Targets',
                  suggestions.featured_snippets,
                  <Target className="h-4 w-4 text-indigo-600" />,
                  'Questions likely to trigger featured snippets in search results',
                  'snippets'
                )}

                {/* Long-tail Keywords */}
                {renderSuggestionCategory(
                  'Long-tail Keywords',
                  suggestions.long_tail,
                  <Search className="h-4 w-4 text-indigo-600" />,
                  'Specific, longer phrases with high conversion potential',
                  'long-tail'
                )}

                {/* Comparison Queries */}
                {renderSuggestionCategory(
                  'Comparison Queries',
                  suggestions.comparisons,
                  <Building className="h-4 w-4 text-indigo-600" />,
                  'Comparison-style questions for competitive content',
                  'comparisons'
                )}

                {/* How-to Queries */}
                {renderSuggestionCategory(
                  'How-to Queries',
                  suggestions.how_to,
                  <Lightbulb className="h-4 w-4 text-indigo-600" />,
                  'Step-by-step instructional queries for tutorial content',
                  'how-to'
                )}

                {/* Implementation Guide */}
                <Card className="bg-green-50 border border-green-100">
                  <h3 className="text-lg font-medium text-green-800 mb-4">How to Use These Suggestions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
                    <div>
                      <h4 className="font-medium mb-2">Content Structure:</h4>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Use headlines as H1/H2 tags</li>
                        <li>Create FAQ sections with suggested questions</li>
                        <li>Structure content to answer voice search queries</li>
                        <li>Include long-tail keywords naturally in content</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">SEO Implementation:</h4>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Use featured snippet targets for meta descriptions</li>
                        <li>Create comparison pages for competitive queries</li>
                        <li>Develop how-to guides and tutorials</li>
                        <li>Optimize for conversational search patterns</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <Card>
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">AI Prompt Analysis Ready</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">
                    Enter your content and optional context information to generate comprehensive AI-optimized prompt suggestions for {selectedSite?.name || 'your site'}.
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto">
                    <p className="text-sm text-blue-700">
                      <strong>Pro Tip:</strong> Include specific details about your service, product, or topic for more targeted suggestions.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default PromptMatchSuggestions;