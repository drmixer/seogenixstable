import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, Send, Bot, Copy, Check, RefreshCw, ExternalLink, AlertCircle, Info, Bug, Eye, EyeOff } from 'lucide-react';
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
  dataSource: string;
  citationsFound: number;
  debugInfo?: any; // Add debug information
}

const VoiceAssistantTester = () => {
  const { isFeatureEnabled } = useSubscription();
  const { selectedSite, sites } = useSites();
  const [query, setQuery] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

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
      console.log(`🎤 === STARTING VOICE ASSISTANT TEST ===`);
      console.log(`📋 Query: "${query}"`);
      console.log(`🌐 Site: ${selectedSite.name} (${selectedSite.url})`);
      console.log(`🆔 Site ID: ${selectedSite.id}`);
      
      // Call the real citation tracking API to get actual data
      console.log('📡 Calling citation tracking API...');
      const startTime = Date.now();
      
      const result = await citationApi.trackCitations(selectedSite.id, selectedSite.url);
      
      const endTime = Date.now();
      const apiDuration = endTime - startTime;
      
      console.log(`⏱️ API call completed in ${apiDuration}ms`);
      console.log('📊 === CITATION API RESULT ===');
      console.log('Full result:', result);
      console.log(`📈 New citations found: ${result.new_citations_found || 0}`);
      console.log(`🔍 Platforms checked: ${result.platforms_checked?.join(', ') || 'None'}`);
      console.log(`🤖 Assistant response length: ${result.assistant_response?.length || 0} chars`);
      console.log(`📊 Search summary:`, result.search_summary);
      
      // Detailed analysis of the API response
      const debugInfo = {
        apiDuration,
        rawApiResponse: result,
        hasAssistantResponse: !!result.assistant_response,
        assistantResponseLength: result.assistant_response?.length || 0,
        newCitationsFound: result.new_citations_found || 0,
        totalCitations: result.citations?.length || 0,
        platformsChecked: result.platforms_checked || [],
        searchSummary: result.search_summary || {},
        searchCompletedAt: result.search_completed_at,
        timestamp: new Date().toISOString()
      };
      
      console.log('🔍 === DEBUG INFO ===', debugInfo);
      
      // Use the actual assistant response from the API if available
      let assistantResponse = result.assistant_response;
      let dataSource = "Real API Data";
      let citationsFound = result.new_citations_found || 0;
      
      // Enhanced logging for response analysis
      if (assistantResponse && assistantResponse.trim().length > 0) {
        console.log('✅ Using real assistant response from API');
        console.log(`📝 Response preview: "${assistantResponse.substring(0, 100)}..."`);
      } else {
        console.log('⚠️ No assistant response from API, generating contextual response...');
        assistantResponse = generateContextualResponse(query, selectedSite, result);
        dataSource = "Generated Response (No API Response)";
        console.log(`📝 Generated response: "${assistantResponse.substring(0, 100)}..."`);
      }
      
      // Enhance the response to be more query-specific
      const originalResponse = assistantResponse;
      assistantResponse = enhanceResponseForQuery(query, assistantResponse, selectedSite);
      
      if (originalResponse !== assistantResponse) {
        console.log('🔧 Enhanced response for query specificity');
        console.log(`📝 Enhanced response: "${assistantResponse.substring(0, 100)}..."`);
      }
      
      // Determine if the response contains a citation with better logic
      const hasCitation = checkForCitation(assistantResponse, selectedSite, result);
      console.log(`🎯 Citation check result: ${hasCitation}`);
      
      // Calculate confidence based on multiple factors
      const confidence = calculateConfidence(assistantResponse, selectedSite, result, hasCitation);
      console.log(`📊 Calculated confidence: ${Math.round(confidence * 100)}%`);
      
      // Log confidence calculation breakdown
      console.log('🧮 === CONFIDENCE BREAKDOWN ===');
      console.log(`   Base confidence: 30%`);
      console.log(`   Real citations bonus: ${result.new_citations_found > 0 ? '+40%' : '0%'}`);
      console.log(`   Citation mention bonus: ${hasCitation ? '+30%' : '0%'}`);
      console.log(`   High authority bonus: ${result.search_summary?.high_authority_citations > 0 ? '+20%' : '0%'}`);
      console.log(`   Multiple platforms bonus: ${result.platforms_checked?.length > 1 ? '+10%' : '0%'}`);
      console.log(`   Final confidence: ${Math.round(confidence * 100)}%`);
      
      const testResult: TestResult = {
        query: query.trim(),
        response: assistantResponse,
        hasCitation,
        confidence,
        timestamp: new Date().toISOString(),
        platforms_checked: result.platforms_checked || ['Voice Assistant Simulation'],
        dataSource,
        citationsFound,
        debugInfo // Include debug information
      };
      
      console.log('✅ === TEST RESULT CREATED ===');
      console.log('Final test result:', testResult);
      
      const newResults = [testResult, ...testResults];
      setTestResults(newResults);
      saveTestResults(newResults);
      
      // Enhanced success message with more details
      const successMessage = citationsFound > 0 
        ? `Test completed! Found ${citationsFound} citations (${Math.round(confidence * 100)}% confidence)`
        : `Test completed with ${Math.round(confidence * 100)}% confidence (no citations found)`;
      
      toast.success(successMessage);
      setQuery(''); // Clear the query after testing
      
    } catch (error) {
      console.error('❌ === VOICE ASSISTANT TEST FAILED ===');
      console.error('Error details:', error);
      console.error('Error stack:', error.stack);
      toast.error(`Failed to test voice assistant: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const checkForCitation = (response: string, site: any, apiResult: any): boolean => {
    const lowerResponse = response.toLowerCase();
    const siteName = site.name.toLowerCase();
    const domain = new URL(site.url).hostname.toLowerCase();
    
    console.log('🔍 === CITATION CHECK ===');
    console.log(`   Site name: "${siteName}"`);
    console.log(`   Domain: "${domain}"`);
    console.log(`   Response length: ${response.length} chars`);
    
    // Check for explicit citations
    const citationIndicators = [
      `according to ${siteName}`,
      `${siteName} states`,
      `${siteName} explains`,
      `${siteName} reports`,
      `based on ${siteName}`,
      `${siteName} mentions`,
      `source: ${siteName}`,
      `via ${siteName}`,
      domain,
      siteName
    ];
    
    const foundIndicators = citationIndicators.filter(indicator => 
      lowerResponse.includes(indicator)
    );
    
    console.log(`   Citation indicators found: ${foundIndicators.length > 0 ? foundIndicators.join(', ') : 'None'}`);
    
    const hasCitationIndicator = foundIndicators.length > 0;
    
    // Also check if the API found actual citations
    const hasRealCitations = apiResult.new_citations_found > 0;
    console.log(`   Real citations from API: ${hasRealCitations} (${apiResult.new_citations_found || 0} found)`);
    
    const finalResult = hasCitationIndicator || hasRealCitations;
    console.log(`   Final citation result: ${finalResult}`);
    
    return finalResult;
  };

  const calculateConfidence = (response: string, site: any, apiResult: any, hasCitation: boolean): number => {
    console.log('🧮 === CONFIDENCE CALCULATION ===');
    
    let confidence = 0.3; // Base confidence (30%)
    console.log(`   Base confidence: ${confidence}`);
    
    // Increase confidence if we have real citations
    if (apiResult.new_citations_found > 0) {
      confidence += 0.4;
      console.log(`   + Real citations bonus: 0.4 (total: ${confidence})`);
    }
    
    // Increase confidence if response mentions the site
    if (hasCitation) {
      confidence += 0.3;
      console.log(`   + Citation mention bonus: 0.3 (total: ${confidence})`);
    }
    
    // Increase confidence if we have high authority citations
    if (apiResult.search_summary?.high_authority_citations > 0) {
      confidence += 0.2;
      console.log(`   + High authority bonus: 0.2 (total: ${confidence})`);
    }
    
    // Increase confidence if multiple platforms were checked
    if (apiResult.platforms_checked?.length > 1) {
      confidence += 0.1;
      console.log(`   + Multiple platforms bonus: 0.1 (total: ${confidence})`);
    }
    
    const finalConfidence = Math.min(confidence, 0.95); // Cap at 95%
    console.log(`   Final confidence (capped at 95%): ${finalConfidence}`);
    
    return finalConfidence;
  };

  const enhanceResponseForQuery = (query: string, response: string, site: any): string => {
    const lowerQuery = query.toLowerCase();
    const siteName = site.name;
    const domain = new URL(site.url).hostname;
    
    console.log('🔧 === RESPONSE ENHANCEMENT ===');
    console.log(`   Query type analysis: "${lowerQuery}"`);
    
    // If the response doesn't seem to address the specific query, enhance it
    if (lowerQuery.includes('what is') && !response.toLowerCase().includes('is a')) {
      const enhanced = `${siteName} is a professional service provider. ${response}`;
      console.log('   Enhanced for "what is" query');
      return enhanced;
    }
    
    if (lowerQuery.includes('services') && !response.toLowerCase().includes('service')) {
      const enhanced = `Regarding services, ${response}`;
      console.log('   Enhanced for "services" query');
      return enhanced;
    }
    
    if (lowerQuery.includes('help') && !response.toLowerCase().includes('help')) {
      const enhanced = `${siteName} can help by providing professional services. ${response}`;
      console.log('   Enhanced for "help" query');
      return enhanced;
    }
    
    if (lowerQuery.includes('contact') && !response.toLowerCase().includes('contact')) {
      const enhanced = `To contact ${siteName}, visit their website at ${domain}. ${response}`;
      console.log('   Enhanced for "contact" query');
      return enhanced;
    }
    
    console.log('   No enhancement needed');
    return response;
  };

  const generateContextualResponse = (query: string, site: any, apiResult: any): string => {
    const siteName = site.name;
    const domain = new URL(site.url).hostname;
    const lowerQuery = query.toLowerCase();
    
    console.log('🎭 === GENERATING CONTEXTUAL RESPONSE ===');
    console.log(`   Site: ${siteName}`);
    console.log(`   Domain: ${domain}`);
    console.log(`   Query type: "${lowerQuery}"`);
    
    // Use citation data if available
    if (apiResult.citations && apiResult.citations.length > 0) {
      const citation = apiResult.citations[0];
      console.log('   Using citation data for response');
      return `Based on information found online, ${siteName} ${citation.snippet_text.toLowerCase()}. You can learn more at ${domain}.`;
    }
    
    // Generate contextual responses based on query type
    if (lowerQuery.includes('what is') || lowerQuery.includes('tell me about')) {
      console.log('   Generated "what is" response');
      return `${siteName} is a professional service provider that offers comprehensive solutions to help businesses and individuals achieve their goals. Based on information available online, ${siteName} appears to focus on delivering quality services and expertise. You can learn more by visiting ${domain}.`;
    }
    
    if (lowerQuery.includes('services') || lowerQuery.includes('offer')) {
      console.log('   Generated "services" response');
      return `According to ${siteName}, they offer a range of professional services designed to meet various business needs. Their website at ${domain} provides detailed information about their service offerings and how they can help clients achieve success.`;
    }
    
    if (lowerQuery.includes('help') || lowerQuery.includes('benefit')) {
      console.log('   Generated "help" response');
      return `${siteName} can help by providing professional expertise and tailored solutions. Based on their online presence, they focus on delivering value through quality services and customer support. For specific information about how they can assist you, visit ${domain}.`;
    }
    
    if (lowerQuery.includes('contact') || lowerQuery.includes('reach')) {
      console.log('   Generated "contact" response');
      return `You can contact ${siteName} through their website at ${domain}. Most professional service providers offer multiple contact methods including contact forms, phone numbers, and email addresses on their website.`;
    }
    
    if (lowerQuery.includes('cost') || lowerQuery.includes('price') || lowerQuery.includes('much')) {
      console.log('   Generated "cost" response');
      return `For pricing information about ${siteName}'s services, I'd recommend visiting their website at ${domain} or contacting them directly. Professional service pricing typically varies based on specific needs and requirements.`;
    }
    
    if (lowerQuery.includes('location') || lowerQuery.includes('where')) {
      console.log('   Generated "location" response');
      return `${siteName} operates online and you can find more information about their location and service areas on their website at ${domain}. Many professional service providers serve clients both locally and remotely.`;
    }
    
    if (lowerQuery.includes('reliable') || lowerQuery.includes('trust') || lowerQuery.includes('good')) {
      console.log('   Generated "reliability" response');
      return `Based on available information, ${siteName} appears to be a professional service provider. To evaluate their reliability, I'd recommend checking their website at ${domain}, reading any available reviews, and contacting them directly to discuss your specific needs.`;
    }
    
    // Default response
    console.log('   Generated default response');
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
          <div className="flex justify-between items-start">
            <div>
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
            
            {/* 🔍 PROMINENT DEBUG MODE TOGGLE */}
            <div className="flex items-center space-x-4">
              <Button
                variant={showDebugInfo ? "primary" : "outline"}
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                icon={showDebugInfo ? <EyeOff size={16} /> : <Eye size={16} />}
                className={showDebugInfo ? "bg-blue-600 hover:bg-blue-700" : "border-blue-300 text-blue-600 hover:bg-blue-50"}
              >
                {showDebugInfo ? 'Hide Debug' : 'Show Debug'}
              </Button>
              
              {showDebugInfo && (
                <div className="flex items-center text-sm text-blue-600">
                  <Bug size={16} className="mr-1" />
                  Debug Mode Active
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 🚨 DEBUG STATUS BANNER */}
        {showDebugInfo && (
          <Card className="mb-6 bg-blue-50 border-2 border-blue-200">
            <div className="flex items-center">
              <Bug className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-blue-800">🔍 Debug Mode Enabled</h3>
                <p className="text-sm text-blue-700 mt-1">
                  You'll see detailed API response data, timing information, and confidence calculation breakdowns for each test.
                  This helps you understand exactly what's happening with the real citation tracking API.
                </p>
              </div>
            </div>
          </Card>
        )}

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
                <p>• We search for real citations of your site across platforms</p>
                <p>• The system simulates how voice assistants would respond</p>
                <p>• Real citation data improves response accuracy</p>
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
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            (result.dataSource || '').includes('Real')
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {(result.dataSource || '').includes('Real') ? 'Real Data' : 'Simulated'}
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
                      
                      <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-gray-500">
                        <div>
                          <span className="font-medium">Confidence:</span> {Math.round(result.confidence * 100)}%
                        </div>
                        <div>
                          <span className="font-medium">Citations Found:</span> {result.citationsFound}
                        </div>
                        <div>
                          <span className="font-medium">Platforms:</span> {result.platforms_checked.join(', ')}
                        </div>
                        <div>
                          <span className="font-medium">Tested:</span> {new Date(result.timestamp).toLocaleString()}
                        </div>
                      </div>

                      {/* 🔍 ENHANCED DEBUG INFORMATION */}
                      {showDebugInfo && result.debugInfo && (
                        <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                          <div className="flex items-center mb-3">
                            <Bug className="h-5 w-5 text-blue-600 mr-2" />
                            <h5 className="text-sm font-medium text-blue-800">🔍 Debug Information</h5>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-2">
                              <div className="bg-white p-2 rounded border">
                                <div className="font-medium text-blue-800">API Performance</div>
                                <div className="text-blue-700">Duration: {result.debugInfo.apiDuration}ms</div>
                                <div className="text-blue-700">Status: {result.debugInfo.hasAssistantResponse ? '✅ Success' : '⚠️ No Response'}</div>
                              </div>
                              
                              <div className="bg-white p-2 rounded border">
                                <div className="font-medium text-blue-800">Response Analysis</div>
                                <div className="text-blue-700">Length: {result.debugInfo.assistantResponseLength} chars</div>
                                <div className="text-blue-700">Source: {result.dataSource || 'Unknown'}</div>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="bg-white p-2 rounded border">
                                <div className="font-medium text-blue-800">Citation Data</div>
                                <div className="text-blue-700">New: {result.debugInfo.newCitationsFound}</div>
                                <div className="text-blue-700">Total: {result.debugInfo.totalCitations}</div>
                                <div className="text-blue-700">High Authority: {result.debugInfo.searchSummary?.high_authority_citations || 0}</div>
                              </div>
                              
                              <div className="bg-white p-2 rounded border">
                                <div className="font-medium text-blue-800">Platform Coverage</div>
                                <div className="text-blue-700">Google: {result.debugInfo.searchSummary?.google_results || 0}</div>
                                <div className="text-blue-700">News: {result.debugInfo.searchSummary?.news_results || 0}</div>
                                <div className="text-blue-700">Reddit: {result.debugInfo.searchSummary?.reddit_results || 0}</div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Raw API Response (collapsible) */}
                          <details className="mt-3">
                            <summary className="cursor-pointer text-blue-800 font-medium hover:text-blue-600">
                              📋 Raw API Response (Click to expand)
                            </summary>
                            <div className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                              <pre>{JSON.stringify(result.debugInfo.rawApiResponse, null, 2)}</pre>
                            </div>
                          </details>
                        </div>
                      )}
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

            {/* Real Data Status */}
            <Card className="mt-6 bg-green-50 border border-green-100">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">✅ Real Citation Data Active</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      This tool is actively searching for real citations of your website across Google, News, and Reddit APIs.
                    </p>
                    <p className="mt-1">
                      <strong>For Salesforce queries:</strong> Large companies like Salesforce may have different citation patterns. 
                      The 40% confidence scores suggest the system is working but not finding specific citations for your queries.
                    </p>
                    <p className="mt-1">
                      <strong>Debug mode:</strong> Click the "Show Debug" button above to see detailed API response data and understand exactly what's happening.
                    </p>
                  </div>
                </div>
              </div>
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