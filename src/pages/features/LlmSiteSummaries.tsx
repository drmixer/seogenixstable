import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileBarChart, Copy, Check, RefreshCw, Download, Share2, Lightbulb, Target, TrendingUp } from 'lucide-react';
import { useSites } from '../../contexts/SiteContext';
import { summaryApi } from '../../lib/api';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

interface Summary {
  id: string;
  site_id: string;
  summary_type: string;
  content: string;
  created_at: string;
}

const LlmSiteSummaries = () => {
  const { selectedSite, sites } = useSites();
  const [summaryType, setSummaryType] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [isLoadingSummaries, setIsLoadingSummaries] = useState(true);
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState('');
  const [wordCount, setWordCount] = useState(0);

  // Summary type options with descriptions
  const summaryTypes = [
    { 
      value: 'SiteOverview', 
      label: 'Site Overview', 
      description: 'Comprehensive overview of the website and business',
      icon: <FileBarChart size={16} />
    },
    { 
      value: 'CompanyProfile', 
      label: 'Company Profile', 
      description: 'Professional company overview and background',
      icon: <Target size={16} />
    },
    { 
      value: 'ServiceOfferings', 
      label: 'Service Offerings', 
      description: 'Complete breakdown of all services provided',
      icon: <Lightbulb size={16} />
    },
    { 
      value: 'ProductCatalog', 
      label: 'Product Catalog', 
      description: 'Structured summary of products and services offered',
      icon: <TrendingUp size={16} />
    },
    { 
      value: 'AIReadiness', 
      label: 'AI Readiness Report', 
      description: 'Assessment of website optimization for AI systems',
      icon: <FileBarChart size={16} />
    },
    { 
      value: 'PageSummary', 
      label: 'Page Summary', 
      description: 'Detailed summary of main page content and purpose',
      icon: <Target size={16} />
    },
    { 
      value: 'TechnicalSpecs', 
      label: 'Technical Specifications', 
      description: 'Technical features and capabilities overview',
      icon: <TrendingUp size={16} />
    }
  ];

  // Load existing summaries when site changes
  useEffect(() => {
    const loadSummaries = async () => {
      if (!selectedSite) {
        setSummaries([]);
        setIsLoadingSummaries(false);
        return;
      }

      try {
        const data = await summaryApi.getSummaries(selectedSite.id);
        setSummaries(data);
      } catch (error) {
        console.error('Error loading summaries:', error);
        toast.error('Failed to load existing summaries');
      } finally {
        setIsLoadingSummaries(false);
      }
    };

    loadSummaries();
  }, [selectedSite]);

  // Show empty state if no sites
  if (!sites || sites.length === 0) {
    return (
      <AppLayout>
        <EmptyState
          title="No sites added yet"
          description="Add your first site to start generating LLM-optimized summaries."
          icon={<FileBarChart size={24} />}
          actionLabel="Add Your First Site"
          onAction={() => window.location.href = '/add-site'}
        />
      </AppLayout>
    );
  }

  const handleGenerateSummary = async () => {
    if (!selectedSite || !summaryType) {
      toast.error('Please select a summary type');
      return;
    }
    
    setIsGenerating(true);
    setDataSource('');
    setWordCount(0);
    
    try {
      const result = await summaryApi.generateSummary(selectedSite.id, selectedSite.url, summaryType);
      
      // Add the new summary to the list
      setSummaries(prev => [result.summary, ...prev]);
      setDataSource(result.dataSource || 'Generated');
      setWordCount(result.wordCount || 0);
      
      toast.success(`Summary generated successfully! (${result.wordCount || 0} words)`);
      
      // Reset form
      setSummaryType('');
    } catch (error) {
      console.error('Error generating summary:', error);
      // Display the actual error message instead of a generic one
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (summaryId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setIsCopied(summaryId);
    toast.success('Summary copied to clipboard');
    
    setTimeout(() => {
      setIsCopied(null);
    }, 2000);
  };

  const downloadSummary = (summary: Summary) => {
    const blob = new Blob([summary.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSite?.name || 'site'}-${summary.summary_type}-summary.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Summary downloaded');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWordCount = (content: string) => {
    return content.split(/\s+/).filter(word => word.length > 0).length;
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
            Generate comprehensive, AI-optimized summaries of your website that are perfect for LLM understanding and citations.
          </p>
          {selectedSite && (
            <div className="mt-2 text-sm text-gray-500">
              Generating summaries for: <span className="font-medium text-gray-700">{selectedSite.name}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Generate New Summary</h2>
              
              <div className="space-y-4">
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
                    <option value="">Select summary type</option>
                    {summaryTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {summaryType && (
                    <p className="mt-1 text-sm text-gray-500">
                      {summaryTypes.find(t => t.value === summaryType)?.description}
                    </p>
                  )}
                </div>
                
                <div>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleGenerateSummary}
                    isLoading={isGenerating}
                    disabled={!selectedSite || !summaryType}
                    icon={<RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />}
                  >
                    {isGenerating ? 'Generating Summary...' : 'Generate Summary'}
                  </Button>
                </div>

                {dataSource && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <div className="flex items-center space-x-2 text-xs text-green-700">
                      <span>📊 Source: {dataSource}</span>
                      <span>📝 Words: {wordCount}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
            
            <Card className="mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Why Generate LLM Summaries?</h2>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <Target className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Help AI systems quickly understand your site's purpose and content</span>
                </li>
                <li className="flex items-start">
                  <TrendingUp className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Improve chances of accurate citations in AI responses</span>
                </li>
                <li className="flex items-start">
                  <Lightbulb className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Create comprehensive descriptions optimized for AI consumption</span>
                </li>
                <li className="flex items-start">
                  <FileBarChart className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Generate content that can be added to your site for better AI understanding</span>
                </li>
                <li className="flex items-start">
                  <Share2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Use summaries for marketing materials, press releases, and business profiles</span>
                </li>
              </ul>
            </Card>

            <Card className="mt-6 bg-blue-50 border border-blue-100">
              <h3 className="text-lg font-medium text-blue-800 mb-3">Summary Types Guide</h3>
              <div className="space-y-3 text-sm text-blue-700">
                <div>
                  <h4 className="font-medium">Business Focused:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Site Overview - Complete business summary</li>
                    <li>Company Profile - Professional background</li>
                    <li>Service Offerings - Detailed service breakdown</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium">Technical Focused:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>AI Readiness - Optimization assessment</li>
                    <li>Technical Specs - Platform capabilities</li>
                    <li>Page Summary - Content analysis</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            {isLoadingSummaries ? (
              <Card>
                <div className="flex justify-center py-12">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </Card>
            ) : summaries.length > 0 ? (
              <div className="space-y-6">
                {summaries.map((summary) => (
                  <Card key={summary.id}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {summaryTypes.find(t => t.value === summary.summary_type)?.label || summary.summary_type}
                        </h3>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>📅 {formatDate(summary.created_at)}</span>
                          <span>📝 {getWordCount(summary.content)} words</span>
                          <span>📄 {summary.summary_type}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadSummary(summary)}
                          icon={<Download size={14} />}
                        >
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(summary.id, summary.content)}
                          icon={isCopied === summary.id ? <Check size={14} /> : <Copy size={14} />}
                        >
                          {isCopied === summary.id ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[400px] prose max-w-none">
                      {summary.content.split('\n').map((line, index) => {
                        if (line.startsWith('# ')) {
                          return <h1 key={index} className="text-xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
                        } else if (line.startsWith('## ')) {
                          return <h2 key={index} className="text-lg font-bold mt-3 mb-2">{line.substring(3)}</h2>;
                        } else if (line.startsWith('### ')) {
                          return <h3 key={index} className="text-md font-bold mt-3 mb-1">{line.substring(4)}</h3>;
                        } else if (line.startsWith('**') && line.endsWith('**')) {
                          return <h4 key={index} className="text-sm font-bold mt-2 mb-1">{line.substring(2, line.length - 2)}</h4>;
                        } else if (line.startsWith('- ')) {
                          return <li key={index} className="ml-4 text-sm">{line.substring(2)}</li>;
                        } else if (line.match(/^\d+\./)) {
                          return <li key={index} className="ml-4 list-decimal text-sm">{line.substring(line.indexOf('.') + 1)}</li>;
                        } else if (line.trim() === '') {
                          return <br key={index} />;
                        } else {
                          return <p key={index} className="text-sm">{line}</p>;
                        }
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <div className="text-center py-12">
                  <FileBarChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Summaries Generated Yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">
                    {selectedSite 
                      ? `Generate your first LLM-optimized summary for ${selectedSite.name}. Choose a summary type and let our AI create comprehensive, citation-worthy content.`
                      : 'Select a site and generate LLM-optimized summaries that help AI systems understand your content better.'
                    }
                  </p>
                  <div className="bg-green-50 p-4 rounded-lg max-w-md mx-auto">
                    <p className="text-sm text-green-700">
                      <strong>Pro Tip:</strong> Start with a Site Overview for a comprehensive summary, then generate specific summaries for different use cases.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Implementation Guide */}
            <Card className="mt-6 bg-green-50 border border-green-100">
              <h3 className="text-lg font-medium text-green-800 mb-4">How to Use Your Summaries</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
                <div>
                  <h4 className="font-medium mb-2">On Your Website:</h4>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Add to About page or company overview</li>
                    <li>Use in meta descriptions and OpenGraph tags</li>
                    <li>Include in site footer or header descriptions</li>
                    <li>Create dedicated "About Us" sections</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">For AI Optimization:</h4>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Add to robots.txt or structured data</li>
                    <li>Use in schema.org Organization markup</li>
                    <li>Include in FAQ sections</li>
                    <li>Reference when communicating with AI systems</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Marketing Materials:</h4>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Use in press releases and media kits</li>
                    <li>Include in business proposals</li>
                    <li>Add to social media profiles</li>
                    <li>Use for investor or partner presentations</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Business Development:</h4>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Include in RFP responses</li>
                    <li>Use for partnership discussions</li>
                    <li>Add to business directories</li>
                    <li>Include in email signatures</li>
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

export default LlmSiteSummaries;