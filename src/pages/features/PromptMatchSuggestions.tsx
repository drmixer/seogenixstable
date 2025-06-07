import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Copy, Check, Lightbulb, Target, Zap } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const PromptMatchSuggestions = () => {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [analysisType, setAnalysisType] = useState('questions');

  const analysisTypes = [
    { value: 'questions', label: 'Questions', description: 'Generate questions people ask AI systems' },
    { value: 'headlines', label: 'Headlines', description: 'Create AI-friendly headlines and titles' },
    { value: 'voice-queries', label: 'Voice Queries', description: 'Voice search optimization phrases' },
    { value: 'featured-snippets', label: 'Featured Snippets', description: 'Content optimized for featured snippets' }
  ];

  const exampleContent = `AI visibility optimization is the process of making your website content more discoverable and understandable to AI systems like ChatGPT, voice assistants, and search engines. This involves implementing schema markup, creating clear content structure, and ensuring your information can be easily cited by AI tools.`;

  const handleGenerateSuggestions = () => {
    if (!content.trim()) {
      toast.error('Please enter some content');
      return;
    }
    
    setIsGenerating(true);
    
    // Simulate API call with smart generation
    setTimeout(() => {
      const generatedSuggestions = generateSmartSuggestions(content, analysisType);
      setSuggestions(generatedSuggestions);
      setIsGenerating(false);
      toast.success('Suggestions generated successfully');
    }, 1500);
  };

  const generateSmartSuggestions = (content: string, type: string) => {
    const contentLower = content.toLowerCase();
    const isAIRelated = contentLower.includes('ai') || contentLower.includes('artificial intelligence');
    const isSEORelated = contentLower.includes('seo') || contentLower.includes('search');
    const isTechRelated = contentLower.includes('tech') || contentLower.includes('software');

    const suggestionTemplates = {
      questions: [
        `What is ${extractMainTopic(content)}?`,
        `How does ${extractMainTopic(content)} work?`,
        `What are the benefits of ${extractMainTopic(content)}?`,
        `How can I implement ${extractMainTopic(content)}?`,
        `What are the best practices for ${extractMainTopic(content)}?`,
        `Why is ${extractMainTopic(content)} important?`,
        `How much does ${extractMainTopic(content)} cost?`,
        `What tools are needed for ${extractMainTopic(content)}?`
      ],
      headlines: [
        `The Complete Guide to ${extractMainTopic(content)}`,
        `${extractMainTopic(content)}: Everything You Need to Know`,
        `How to Master ${extractMainTopic(content)} in 2025`,
        `Top 10 ${extractMainTopic(content)} Strategies That Work`,
        `${extractMainTopic(content)} Best Practices for Beginners`,
        `Advanced ${extractMainTopic(content)} Techniques`,
        `${extractMainTopic(content)} vs Traditional Methods`,
        `The Future of ${extractMainTopic(content)}`
      ],
      'voice-queries': [
        `Hey Google, what is ${extractMainTopic(content)}?`,
        `Alexa, how do I start with ${extractMainTopic(content)}?`,
        `What are the benefits of ${extractMainTopic(content)}?`,
        `How much does ${extractMainTopic(content)} cost?`,
        `Where can I learn about ${extractMainTopic(content)}?`,
        `What tools do I need for ${extractMainTopic(content)}?`,
        `Is ${extractMainTopic(content)} worth it?`,
        `How long does ${extractMainTopic(content)} take?`
      ],
      'featured-snippets': [
        `${extractMainTopic(content)} definition and explanation`,
        `Step-by-step ${extractMainTopic(content)} process`,
        `${extractMainTopic(content)} benefits and advantages`,
        `${extractMainTopic(content)} cost and pricing`,
        `${extractMainTopic(content)} tools and resources`,
        `${extractMainTopic(content)} best practices`,
        `${extractMainTopic(content)} common mistakes`,
        `${extractMainTopic(content)} getting started guide`
      ]
    };

    return suggestionTemplates[type as keyof typeof suggestionTemplates] || suggestionTemplates.questions;
  };

  const extractMainTopic = (content: string) => {
    // Simple topic extraction - in a real app, this would be more sophisticated
    const words = content.toLowerCase().split(' ');
    const commonWords = ['the', 'is', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const meaningfulWords = words.filter(word => 
      word.length > 3 && 
      !commonWords.includes(word) && 
      !word.includes('.')
    );
    
    // Return the first meaningful phrase or fallback
    if (meaningfulWords.length > 0) {
      return meaningfulWords.slice(0, 2).join(' ');
    }
    return 'your topic';
  };

  const copyToClipboard = (index: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard');
    
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  const copyAllSuggestions = () => {
    const allText = suggestions.join('\n');
    navigator.clipboard.writeText(allText);
    toast.success('All suggestions copied to clipboard');
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Generate Suggestions</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="analysisType" className="block text-sm font-medium text-gray-700 mb-1">
                    Analysis Type
                  </label>
                  <select
                    id="analysisType"
                    name="analysisType"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={analysisType}
                    onChange={(e) => setAnalysisType(e.target.value)}
                  >
                    {analysisTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    {analysisTypes.find(t => t.value === analysisType)?.description}
                  </p>
                </div>

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
                  <button
                    onClick={() => setContent(exampleContent)}
                    className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Use example content
                  </button>
                </div>
                
                <div>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleGenerateSuggestions}
                    isLoading={isGenerating}
                    icon={<Target size={16} />}
                  >
                    Generate Suggestions
                  </Button>
                </div>
              </div>
            </Card>
            
            <Card className="mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
                Why Use Prompt Matching?
              </h2>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2 mt-0.5">✓</span>
                  <span>Match how users naturally ask AI systems questions</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2 mt-0.5">✓</span>
                  <span>Improve chances of being cited in AI responses</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2 mt-0.5">✓</span>
                  <span>Craft better headlines and content structure</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2 mt-0.5">✓</span>
                  <span>Align content with voice search patterns</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2 mt-0.5">✓</span>
                  <span>Optimize for featured snippets and "People Also Ask"</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2 mt-0.5">✓</span>
                  <span>Increase visibility in AI-generated content</span>
                </li>
              </ul>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Suggested {analysisTypes.find(t => t.value === analysisType)?.label}
                </h2>
                {suggestions.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyAllSuggestions}
                    icon={<Copy size={16} />}
                  >
                    Copy All
                  </Button>
                )}
              </div>
              
              {suggestions.length > 0 ? (
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <p className="text-gray-700 flex-1 mr-4">{suggestion}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(index, suggestion)}
                        icon={copiedIndex === index ? <Check size={16} /> : <Copy size={16} />}
                      >
                        {copiedIndex === index ? 'Copied!' : 'Copy'}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-8 rounded-md text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Enter your content to generate prompt and headline suggestions.
                  </p>
                </div>
              )}
              
              {suggestions.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <Zap className="h-5 w-5 text-blue-500 mr-2" />
                    How to Use These Suggestions:
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-md">
                    <ul className="list-disc list-inside space-y-2 text-blue-800 text-sm">
                      <li>Use as headlines or H2/H3 subheadings in your content</li>
                      <li>Create FAQ sections using these questions</li>
                      <li>Optimize meta descriptions to match these query patterns</li>
                      <li>Use in social media posts to drive AI-friendly traffic</li>
                      <li>Structure content to directly answer these questions</li>
                      <li>Include in your schema markup as FAQ entries</li>
                    </ul>
                  </div>
                  
                  <div className="mt-4 p-4 bg-green-50 rounded-md">
                    <h4 className="text-sm font-medium text-green-800 mb-2">AI Optimization Tips:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
                      <div>✓ Answer questions directly</div>
                      <div>✓ Use natural language</div>
                      <div>✓ Include specific details</div>
                      <div>✓ Structure with headings</div>
                      <div>✓ Add supporting evidence</div>
                      <div>✓ Keep answers concise</div>
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

export default PromptMatchSuggestions;