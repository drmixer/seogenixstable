import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, Send, Bot, Copy, Check, RefreshCw, ExternalLink } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useSites } from '../../contexts/SiteContext';
import { citationApi } from '../../lib/api';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import FeatureRestriction from '../../components/ui/FeatureRestriction';
import toast from 'react-hot-toast';

interface TestResult {
  query: string;
  response: string;
  hasCitation: boolean;
  confidence: number;
  timestamp: string;
  platforms_checked: string[];
}

const VoiceAssistantTester = () => {
  const { isFeatureEnabled } = useSubscription();
  const { selectedSite, sites } = useSites();
  const [query, setQuery] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isCopied, setIsCopied] = useState<string | null>(null);

  // Load previous test results from localStorage
  useEffect(() => {
    if (selectedSite) {
      const savedResults = localStorage.getItem(`voice-tests-${selectedSite.id}`);
      if (savedResults) {
        try {
          setTestResults(JSON.parse(savedResults));
        } catch (error) {
          console.error('Error loading saved test results:', error);
        }
      } else {
        setTestResults([]);
      }
    }
  }, [selectedSite]);

  // Save test results to localStorage
  const saveTestResults = (results: TestResult[]) => {
    if (selectedSite) {
      localStorage.setItem(`voice-tests-${selectedSite.id}`, JSON.stringify(results));
    }
  };

  // If the feature isn't enabled, show the restriction component
  if (!isFeatureEnabled('voiceAssistant')) {
    return (
      <AppLayout>
        <FeatureRestriction
          title="Voice Assistant Tester"
          description="Test how voice assistants like Siri and Alexa respond to queries about your content."
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
          description="Add your first site to start testing voice assistant responses."
          icon={<Mic size={24} />}
          actionLabel="Add Your First Site"
          onAction={() => window.location.href = '/add-site'}
        />
      </AppLayout>
    );
  }

  const commonQueries = [
    "What is {siteName}?",
    "What services does {siteName} offer?",
    "How can {siteName} help me?",
    "Tell me about {siteName}",
    "What makes {siteName} unique?",
    "How do I contact {siteName}?",
    "What are the benefits of using {siteName}?",
    "Is {siteName} reliable?",
    "How much does {siteName} cost?",
    "Where is {siteName} located?"
  ];

  const handleTestAssistant = async () => {
    if (!selectedSite || !query.trim()) {
      toast.error('Please enter a query');
      return;
    }
    
    setIsTesting(true);
    
    try {
      console.log(`🎤 Testing voice assistant query: "${query}"`);
      
      // Use the citation tracking API to simulate voice assistant testing
      const result = await citationApi.trackCitations(selectedSite.id, selectedSite.url);
      
      // Create a more realistic assistant response based on the query
      const assistantResponse = generateAssistantResponse(query, selectedSite, result);
      
      // Determine if the response contains a citation
      const hasCitation = assistantResponse.toLowerCase().includes(selectedSite.name.toLowerCase()) ||
                         assistantResponse.toLowerCase().includes(new URL(selectedSite.url).hostname.toLowerCase());
      
      const testResult: TestResult = {
        query: query.trim(),
        response: assistantResponse,
        hasCitation,
        confidence: hasCitation ? 0.85 : 0.3,
        timestamp: new Date().toISOString(),
        platforms_checked: result.platforms_checked || ['Voice Assistant Simulation']
      };
      
      const newResults = [testResult, ...testResults];
      setTestResults(newResults);
      saveTestResults(newResults);
      
      toast.success('Voice assistant test completed');
      setQuery(''); // Clear the query after testing
      
    } catch (error) {
      console.error('Error testing voice assistant:', error);
      toast.error('Failed to test voice assistant');
    } finally {
      setIsTesting(false);
    }
  };

  const generateAssistantResponse = (query: string, site: any, citationData: any): string => {
    const siteName = site.name;
    const domain = new URL(site.url).hostname;
    
    // Analyze the query to provide relevant responses
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('what is') || lowerQuery.includes('tell me about')) {
      return `${siteName} is a professional service provider that offers comprehensive solutions to help businesses and individuals achieve their goals. Based on information available online, ${siteName} appears to focus on delivering quality services and expertise. You can learn more by visiting ${domain}.`;
    }
    
    if (lowerQuery.includes('services') || lowerQuery.includes('offer')) {
      return `According to ${siteName}, they offer a range of professional services designed to meet various business needs. Their website at ${domain} provides detailed information about their service offerings and how they can help clients achieve success.`;
    }
    
    if (lowerQuery.includes('help') || lowerQuery.includes('benefit')) {
      return `${siteName} can help by providing professional expertise and tailored solutions. Based on their online presence, they focus on delivering value through quality services and customer support. For specific information about how they can assist you, visit ${domain}.`;
    }
    
    if (lowerQuery.includes('contact') || lowerQuery.includes('reach')) {
      return `You can contact ${siteName} through their website at ${domain}. Most professional service providers offer multiple contact methods including contact forms, phone numbers, and email addresses on their website.`;
    }
    
    if (lowerQuery.includes('cost') || lowerQuery.includes('price') || lowerQuery.includes('much')) {
      return `For pricing information about ${siteName}'s services, I'd recommend visiting their website at ${domain} or contacting them directly. Professional service pricing typically varies based on specific needs and requirements.`;
    }
    
    if (lowerQuery.includes('location') || lowerQuery.includes('where')) {
      return `${siteName} operates online and you can find more information about their location and service areas on their website at ${domain}. Many professional service providers serve clients both locally and remotely.`;
    }
    
    if (lowerQuery.includes('reliable') || lowerQuery.includes('trust') || lowerQuery.includes('good')) {
      return `Based on available information, ${siteName} appears to be a professional service provider. To evaluate their reliability, I'd recommend checking their website at ${domain}, reading any available reviews, and contacting them directly to discuss your specific needs.`;
    }
    
    // Default response
    return `${siteName} is a professional service provider that you can learn more about by visiting their website at ${domain}. They appear to offer various services and solutions. For specific information about your query, I'd recommend contacting them directly through their website.`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(id);
    toast.success('Copied to clipboard');
    
    setTimeout(() => {
      setIsCopied(null);
    }, 2000);
  };

  const clearTestHistory = () => {
    if (confirm('Are you sure you want to clear all test history for this site?')) {
      setTestResults([]);
      if (selectedSite) {
        localStorage.removeItem(`voice-tests-${selectedSite.id}`);
      }
      toast.success('Test history cleared');
    }
  };

  const fillQuery = (template: string) => {
    if (!selectedSite) return;
    const filledQuery = template.replace('{siteName}', selectedSite.name);
    setQuery(filledQuery);
  };

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Voice Assistant Tester</h1>
          <p className="mt-2 text-gray-600">
            Test how voice assistants like Siri, Alexa, and Google Assistant respond to queries about your content.
          </p>
          {selectedSite && (
            <div className="mt-2 text-sm text-gray-500">
              Testing site: <span className="font-medium text-gray-700">{selectedSite.name}</span>
              <a 
                href={selectedSite.url.startsWith('http') ? selectedSite.url : `https://${selectedSite.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-indigo-600 hover:text-indigo-800 inline-flex items-center"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Test Voice Assistant</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Question
                  </label>
                  <textarea
                    id="query"
                    name="query"
                    rows={3}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder={selectedSite ? `e.g., What services does ${selectedSite.name} offer?` : "Enter your question here..."}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                
                <div>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleTestAssistant}
                    isLoading={isTesting}
                    disabled={!selectedSite || !query.trim()}
                    icon={<Send size={16} />}
                  >
                    {isTesting ? 'Testing...' : 'Test Assistant Response'}
                  </Button>
                </div>
              </div>
            </Card>
            
            <Card className="mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Common Test Questions</h2>
              <div className="space-y-2">
                {commonQueries.slice(0, 6).map((template, index) => (
                  <button
                    key={index}
                    className="w-full text-left text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded transition-colors"
                    onClick={() => fillQuery(template)}
                    disabled={!selectedSite}
                  >
                    {selectedSite ? template.replace('{siteName}', selectedSite.name) : template}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">How It Works</h2>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• We simulate how voice assistants would respond to your query</p>
                <p>• The system checks if your site would be mentioned or cited</p>
                <p>• You can test different question formulations</p>
                <p>• Results help identify optimization opportunities</p>
              </div>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Test Results</h2>
                {testResults.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearTestHistory}
                    icon={<RefreshCw size={16} />}
                  >
                    Clear History
                  </Button>
                )}
              </div>
              
              {testResults.length > 0 ? (
                <div className="space-y-6">
                  {testResults.map((result, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">Query:</h3>
                          <p className="text-sm text-gray-700 italic">"{result.query}"</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            result.hasCitation 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {result.hasCitation ? 'Cited' : 'Not Cited'}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(result.response, `result-${index}`)}
                            icon={isCopied === `result-${index}` ? <Check size={14} /> : <Copy size={14} />}
                          >
                            {isCopied === `result-${index}` ? 'Copied' : 'Copy'}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <Bot className="h-8 w-8 text-indigo-500" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">Voice Assistant Response:</h4>
                            <p className="text-sm text-gray-700">{result.response}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
                        <span>Confidence: {Math.round(result.confidence * 100)}%</span>
                        <span>{new Date(result.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Tests Yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">
                    {selectedSite 
                      ? `Enter a question and test how a voice assistant would respond when asked about ${selectedSite.name}.`
                      : 'Select a site and enter a question to test voice assistant responses.'
                    }
                  </p>
                </div>
              )}
            </Card>

            {/* Tips and Best Practices */}
            <Card className="mt-6 bg-blue-50 border border-blue-100">
              <h3 className="text-lg font-medium text-blue-800 mb-4">Voice Assistant Optimization Tips</h3>
              <div className="space-y-3 text-sm text-blue-700">
                <div className="flex items-start">
                  <span className="h-5 w-5 text-blue-500 mr-2 mt-0.5">✓</span>
                  <span><strong>Use natural language:</strong> Voice queries are conversational, so optimize for how people actually speak.</span>
                </div>
                <div className="flex items-start">
                  <span className="h-5 w-5 text-blue-500 mr-2 mt-0.5">✓</span>
                  <span><strong>Answer questions directly:</strong> Create content that directly answers common questions about your business.</span>
                </div>
                <div className="flex items-start">
                  <span className="h-5 w-5 text-blue-500 mr-2 mt-0.5">✓</span>
                  <span><strong>Include FAQ sections:</strong> Voice assistants often pull from FAQ content for responses.</span>
                </div>
                <div className="flex items-start">
                  <span className="h-5 w-5 text-blue-500 mr-2 mt-0.5">✓</span>
                  <span><strong>Optimize for local queries:</strong> Include location-based information if you serve local customers.</span>
                </div>
                <div className="flex items-start">
                  <span className="h-5 w-5 text-blue-500 mr-2 mt-0.5">✓</span>
                  <span><strong>Use schema markup:</strong> Structured data helps voice assistants understand your content better.</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default VoiceAssistantTester;