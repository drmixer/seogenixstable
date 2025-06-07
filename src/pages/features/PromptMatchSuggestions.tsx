import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Copy, Check } from 'lucide-react';
import { useSites } from '../../contexts/SiteContext';
import { promptApi } from '../../lib/api';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

const PromptMatchSuggestions = () => {
  const { selectedSite, sites } = useSites();
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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
      toast.error('Please enter some content');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const result = await promptApi.generatePrompts(content);
      setSuggestions(result.suggestions);
      toast.success('Suggestions generated successfully');
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast.error('Failed to generate suggestions');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (index: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard');
    
    setTimeout(() => {
      setCopiedIndex(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Prompt Match Suggestions</h1>
          <p className="mt-2 text-gray-600">
            Get suggestions for headlines and questions that match how users ask AI tools about your content.
          </p>
          {selectedSite && (
            <div className="mt-2 text-sm text-gray-500">
              Generating suggestions for: <span className="font-medium text-gray-700">{selectedSite.name}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Generate Suggestions</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Content
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    rows={8}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Paste a snippet of your content or describe your topic here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  ></textarea>
                </div>
                
                <div>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleGenerateSuggestions}
                    isLoading={isGenerating}
                    icon={<MessageSquare size={16} />}
                  >
                    Generate Suggestions
                  </Button>
                </div>
              </div>
            </Card>
            
            <Card className="mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Why Use Prompt Matching?</h2>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2">✓</span>
                  <span>Match how users naturally ask AI systems questions</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2">✓</span>
                  <span>Improve chances of being cited in AI responses</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2">✓</span>
                  <span>Craft better headlines and content structure</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2">✓</span>
                  <span>Align content with voice search patterns</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2">✓</span>
                  <span>Optimize for featured snippets and "People Also Ask" sections</span>
                </li>
              </ul>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Suggested Prompts & Headlines</h2>
              
              {suggestions.length > 0 ? (
                <div className="space-y-4">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-md">
                      <p className="text-gray-700">{suggestion}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(index, suggestion)}
                        icon={copiedIndex === index ? <Check size={16} /> : <Copy size={16} />}
                      >
                        {copiedIndex === index ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-8 rounded-md text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Enter your content to generate prompt and headline suggestions for {selectedSite?.name || 'your site'}.
                  </p>
                </div>
              )}
              
              {suggestions.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-2">How to Use These Suggestions:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Use as headlines or H2/H3 subheadings in your content</li>
                    <li>Create FAQ sections using these questions</li>
                    <li>Optimize meta descriptions to match these query patterns</li>
                    <li>Use in social media posts to drive AI-friendly traffic</li>
                    <li>Structure content to directly answer these questions</li>
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

export default PromptMatchSuggestions;