import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Send, Bot } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FeatureRestriction from '../../components/ui/FeatureRestriction';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const VoiceAssistantTester = () => {
  const { isFeatureEnabled } = useSubscription();
  const [query, setQuery] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [assistantResponse, setAssistantResponse] = useState('');
  const [hasCitation, setHasCitation] = useState(false);
  
  // Demo sites data
  const demoSites = [
    { id: '1', name: 'Demo Site 1', url: 'https://example.com' },
    { id: '2', name: 'Demo Site 2', url: 'https://example.org' }
  ];

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

  const handleTestAssistant = () => {
    if (!query.trim() || !selectedSite) {
      toast.error('Please enter a query and select a site');
      return;
    }
    
    setIsTesting(true);
    setAssistantResponse('');
    setHasCitation(false);
    
    // Simulate API call
    setTimeout(() => {
      // Example response for demonstration
      const demoResponse = "Based on information from Example.com, AI visibility refers to how well your content is understood, indexed, and cited by AI systems like ChatGPT and voice assistants. To improve AI visibility, you should implement schema markup, create clear semantic structure, and ensure comprehensive entity coverage on your website.";
      
      setAssistantResponse(demoResponse);
      setHasCitation(true);
      setIsTesting(false);
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
          <h1 className="text-2xl font-bold text-gray-900">Voice Assistant Tester</h1>
          <p className="mt-2 text-gray-600">
            Test how voice assistants like Siri and Alexa respond to queries about your content.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Test Voice Assistant</h2>
              
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
                  <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Question
                  </label>
                  <textarea
                    id="query"
                    name="query"
                    rows={4}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="e.g., What is AI visibility? How do I improve my website's visibility to AI systems?"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  ></textarea>
                </div>
                
                <div>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleTestAssistant}
                    isLoading={isTesting}
                    icon={<Send size={16} />}
                  >
                    Test Assistant Response
                  </Button>
                </div>
              </div>
            </Card>
            
            <Card className="mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Common Test Questions</h2>
              <ul className="space-y-3 text-gray-600">
                <li className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => setQuery("What is AI visibility?")}>
                  What is AI visibility?
                </li>
                <li className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => setQuery("How can I improve my website's AI optimization?")}>
                  How can I improve my website's AI optimization?
                </li>
                <li className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => setQuery("What types of schema markup should I implement?")}>
                  What types of schema markup should I implement?
                </li>
                <li className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => setQuery("How does entity coverage affect AI understanding?")}>
                  How does entity coverage affect AI understanding?
                </li>
                <li className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => setQuery("What are the best practices for AI-friendly content?")}>
                  What are the best practices for AI-friendly content?
                </li>
              </ul>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Assistant Response</h2>
              
              {assistantResponse ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <Bot className="h-10 w-10 text-indigo-500" />
                      </div>
                      <div>
                        <h3 className="text-md font-medium text-gray-900">Voice Assistant</h3>
                        <div className="mt-1 text-gray-700">
                          {assistantResponse}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg ${hasCitation ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <h3 className={`text-md font-medium ${hasCitation ? 'text-green-800' : 'text-yellow-800'}`}>
                      Citation Analysis
                    </h3>
                    <p className={`mt-1 ${hasCitation ? 'text-green-700' : 'text-yellow-700'}`}>
                      {hasCitation 
                        ? 'Your site was cited in this response! The assistant referenced your content while answering the query.' 
                        : 'Your site was not cited in this response. Consider improving your content to increase chances of citation.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-8 rounded-md text-center">
                  <Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Enter a question and select a site to test how a voice assistant would respond.
                  </p>
                </div>
              )}
              
              <div className="mt-6">
                <h3 className="text-md font-medium text-gray-900 mb-2">How Voice Assistant Testing Works:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>We simulate how voice assistants like Siri or Alexa would respond to your query</li>
                  <li>Our system checks if your content is cited in the response</li>
                  <li>You can identify content gaps or optimization opportunities</li>
                  <li>Test different question formulations to see which ones trigger citations</li>
                </ul>
              </div>
              
              {demoSites.length === 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-blue-700">
                    You need to add a site before you can test voice assistant responses.
                  </p>
                  <div className="mt-2">
                    <Link to="/add-site">
                      <Button variant="primary" size="sm">
                        Add a Site
                      </Button>
                    </Link>
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

export default VoiceAssistantTester;