import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link2, RefreshCw, ExternalLink } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useSites } from '../../contexts/SiteContext';
import { citationApi } from '../../lib/api';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import FeatureRestriction from '../../components/ui/FeatureRestriction';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Citation {
  id: string;
  site_id: string;
  source_type: string;
  snippet_text: string;
  url: string;
  detected_at: string;
}

const CitationTracker = () => {
  const { isFeatureEnabled, canTrackMoreCitations } = useSubscription();
  const { sites } = useSites();
  const [isChecking, setIsChecking] = useState(false);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [assistantResponse, setAssistantResponse] = useState('');
  const [searchSummary, setSearchSummary] = useState<any>(null);
  const [lastSearchTime, setLastSearchTime] = useState<string | null>(null);

  // If the feature isn't enabled, show the restriction component
  if (!isFeatureEnabled('citationTracking')) {
    return (
      <AppLayout>
        <FeatureRestriction
          title="Citation Tracker"
          description="Monitor when and where AI systems cite your content in their responses."
          requiredPlan="Pro"
        />
      </AppLayout>
    );
  }

  // Load existing citations on component mount
  useEffect(() => {
    const loadExistingCitations = async () => {
      if (sites.length === 0) return;

      try {
        // Load citations for all sites
        const allCitations: Citation[] = [];
        for (const site of sites) {
          const siteCitations = await citationApi.getCitations(site.id);
          allCitations.push(...siteCitations);
        }
        setCitations(allCitations);
      } catch (error) {
        console.error('Error loading existing citations:', error);
      }
    };

    loadExistingCitations();
  }, [sites]);

  const handleCheckCitations = async () => {
    if (!canTrackMoreCitations()) {
      toast.error(`You've reached your monthly citation tracking limit. Upgrade to track more citations.`);
      return;
    }

    if (sites.length === 0) {
      toast.error('Please add a site first');
      return;
    }
    
    setIsChecking(true);
    setSearchSummary(null);
    
    try {
      console.log('🚀 Starting citation check for all sites...');
      
      const allResults = [];
      
      // Check citations for each site
      for (const site of sites) {
        console.log(`🔍 Checking citations for ${site.name}...`);
        
        try {
          const result = await citationApi.trackCitations(site.id, site.url);
          allResults.push(result);
          
          // Update assistant response with the first one that has content
          if (result.assistant_response && !assistantResponse) {
            setAssistantResponse(result.assistant_response);
          }
          
          // Update search summary
          if (result.search_summary) {
            setSearchSummary(result.search_summary);
          }
          
          console.log(`✅ Found ${result.new_citations_found} new citations for ${site.name}`);
        } catch (siteError) {
          console.error(`❌ Error checking citations for ${site.name}:`, siteError);
          toast.error(`Failed to check citations for ${site.name}`);
        }
      }
      
      // Reload all citations to get the updated list
      const allCitations: Citation[] = [];
      for (const site of sites) {
        try {
          const siteCitations = await citationApi.getCitations(site.id);
          allCitations.push(...siteCitations);
        } catch (error) {
          console.error(`Error loading citations for ${site.name}:`, error);
        }
      }
      
      setCitations(allCitations);
      setLastSearchTime(new Date().toISOString());
      
      const totalNewCitations = allResults.reduce((sum, result) => sum + (result.new_citations_found || 0), 0);
      
      if (totalNewCitations > 0) {
        toast.success(`Found ${totalNewCitations} new citations!`);
      } else {
        toast.success('Citation check completed - no new citations found');
      }
      
    } catch (error) {
      console.error('❌ Citation check failed:', error);
      toast.error('Failed to check citations');
    } finally {
      setIsChecking(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const groupCitationsBySite = () => {
    const grouped: { [siteId: string]: Citation[] } = {};
    
    citations.forEach(citation => {
      if (!grouped[citation.site_id]) {
        grouped[citation.site_id] = [];
      }
      grouped[citation.site_id].push(citation);
    });
    
    return grouped;
  };

  const groupedCitations = groupCitationsBySite();

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Citation Tracker</h1>
          <p className="mt-2 text-gray-600">
            Monitor when and where AI systems cite your content in their responses.
          </p>
        </div>

        {sites.length === 0 ? (
          <EmptyState
            title="No sites to track"
            description="Add a site to start tracking AI citations."
            icon={<Link2 size={24} />}
            actionLabel="Add Your First Site"
            onAction={() => window.location.href = '/add-site'}
          />
        ) : (
          <>
            {/* Search Controls */}
            <Card className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-4 sm:mb-0">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Citation Search</h3>
                  <p className="text-sm text-gray-500">
                    Search across Google, News, and Reddit for citations of your content.
                    {lastSearchTime && (
                      <span className="block mt-1">
                        Last search: {formatDate(lastSearchTime)}
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleCheckCitations}
                  isLoading={isChecking}
                  icon={<RefreshCw size={16} className={isChecking ? 'animate-spin' : ''} />}
                >
                  {isChecking ? 'Searching...' : 'Check for Citations'}
                </Button>
              </div>
              
              {searchSummary && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h4 className="font-medium text-blue-800 mb-2">Search Results Summary</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600 font-medium">Google:</span>
                      <span className="ml-1 text-blue-800">{searchSummary.google_results || 0}</span>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">News:</span>
                      <span className="ml-1 text-blue-800">{searchSummary.news_results || 0}</span>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">Reddit:</span>
                      <span className="ml-1 text-blue-800">{searchSummary.reddit_results || 0}</span>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">High Authority:</span>
                      <span className="ml-1 text-blue-800">{searchSummary.high_authority_citations || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Assistant Response */}
            {assistantResponse && (
              <Card className="mb-6 bg-green-50 border border-green-100">
                <h3 className="text-lg font-medium text-green-800 mb-2">AI Assistant Response</h3>
                <p className="text-green-700">{assistantResponse}</p>
              </Card>
            )}

            {/* Citations Results */}
            {citations.length > 0 ? (
              <div className="space-y-6">
                {sites.map((site) => {
                  const siteCitations = groupedCitations[site.id] || [];
                  
                  return (
                    <Card key={site.id} title={site.name}>
                      <div className="mb-4">
                        <a 
                          href={site.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-500 hover:text-indigo-600 transition-colors flex items-center"
                        >
                          {site.url}
                          <ExternalLink size={14} className="ml-1" />
                        </a>
                      </div>
                      
                      {siteCitations.length > 0 ? (
                        <div className="space-y-4">
                          {siteCitations.map((citation) => (
                            <div key={citation.id} className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                              <div className="flex justify-between items-start mb-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                  {citation.source_type}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {formatDate(citation.detected_at)}
                                </span>
                              </div>
                              <blockquote className="mt-2 text-gray-700 italic border-l-4 border-indigo-300 pl-4 py-1">
                                {citation.snippet_text}
                              </blockquote>
                              <div className="mt-2">
                                <a 
                                  href={citation.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors flex items-center"
                                >
                                  View Source
                                  <ExternalLink size={14} className="ml-1" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No citations found for this site yet.</p>
                      )}
                      
                      <div className="mt-4">
                        <Link to={`/sites/${site.id}`}>
                          <Button variant="outline" size="sm">
                            View Site Details
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <div className="text-center py-8">
                  <Link2 className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Citations Found Yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">
                    We'll search across Google, News, and Reddit to find where your content is being cited by AI systems and other sources.
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleCheckCitations}
                    isLoading={isChecking}
                    icon={<RefreshCw size={16} className={isChecking ? 'animate-spin' : ''} />}
                  >
                    Start Citation Search
                  </Button>
                </div>
              </Card>
            )}
            
            <Card className="mt-8 bg-blue-50 border border-blue-100">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-blue-800">About Citation Tracking</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      We search multiple platforms to find where your content is being cited:
                    </p>
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      <li><strong>Google Search:</strong> Web mentions and featured snippets</li>
                      <li><strong>News Articles:</strong> Press coverage and industry publications</li>
                      <li><strong>Reddit:</strong> Community discussions and recommendations</li>
                    </ul>
                    <p className="mt-2">
                      Improve your citation chances by implementing schema markup, creating authoritative content, and structuring information to directly answer common questions.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </motion.div>
    </AppLayout>
  );
};

export default CitationTracker;