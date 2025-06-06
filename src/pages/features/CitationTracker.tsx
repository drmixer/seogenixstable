import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, RefreshCw, ExternalLink } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import FeatureRestriction from '../../components/ui/FeatureRestriction';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const CitationTracker = () => {
  const { isFeatureEnabled, canTrackMoreCitations, currentPlan } = useSubscription();
  const [isChecking, setIsChecking] = useState(false);
  const [hasCitations, setHasCitations] = useState(false);
  
  // Demo sites data
  const demoSites = [
    { id: '1', name: 'Demo Site 1', url: 'https://example.com' },
    { id: '2', name: 'Demo Site 2', url: 'https://example.org' }
  ];
  
  const demoCitations = [
    {
      id: '1',
      site_id: '1',
      source_type: 'Google Featured Snippet',
      snippet_text: 'According to Example.com, AI visibility is the measure of how well AI systems can understand, process, and cite your content in response to user queries.',
      url: 'https://www.google.com/search?q=what+is+ai+visibility',
      detected_at: '2025-03-15T14:30:00Z'
    },
    {
      id: '2',
      site_id: '1',
      source_type: 'ChatGPT Response',
      snippet_text: 'As mentioned on Example.com, optimizing for AI visibility requires structured data implementation, clear semantic organization, and comprehensive entity coverage.',
      url: 'https://chat.openai.com',
      detected_at: '2025-03-14T09:15:00Z'
    },
    {
      id: '3',
      site_id: '2',
      source_type: 'Perplexity.ai',
      snippet_text: 'Example.org suggests that schema markup is essential for helping AI systems understand the context and purpose of your content.',
      url: 'https://www.perplexity.ai',
      detected_at: '2025-03-10T11:45:00Z'
    }
  ];

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
  
  const handleCheckCitations = () => {
    if (!canTrackMoreCitations()) {
      toast.error(`You've reached your monthly citation tracking limit. Upgrade to track more citations.`);
      return;
    }
    
    setIsChecking(true);
    
    // Simulate API call
    setTimeout(() => {
      setHasCitations(true);
      setIsChecking(false);
      toast.success('Citations checked successfully');
    }, 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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
          <h1 className="text-2xl font-bold text-gray-900">Citation Tracker</h1>
          <p className="mt-2 text-gray-600">
            Monitor when and where AI systems cite your content in their responses.
          </p>
        </div>

        {demoSites.length === 0 ? (
          <EmptyState
            title="No sites to track"
            description="Add a site to start tracking AI citations."
            icon={<Link2 size={24} />}
            actionLabel="Add Your First Site"
            onAction={() => window.location.href = '/add-site'}
          />
        ) : !hasCitations ? (
          <Card>
            <div className="text-center py-8">
              <Link2 className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Check for AI Citations</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                We'll check if your sites are being cited by ChatGPT, Google featured snippets, Perplexity, and other AI systems.
              </p>
              <Button
                variant="primary"
                onClick={handleCheckCitations}
                isLoading={isChecking}
                icon={<RefreshCw size={16} className={isChecking ? 'animate-spin' : ''} />}
              >
                Check Citations
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Citations Found</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckCitations}
                isLoading={isChecking}
                icon={<RefreshCw size={16} className={isChecking ? 'animate-spin' : ''} />}
              >
                Refresh Citations
              </Button>
            </div>
            
            <div className="space-y-6">
              {demoSites.map((site) => {
                const siteCitations = demoCitations.filter(citation => citation.site_id === site.id);
                
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
                            <div className="flex justify-between items-start">
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
                      We scan multiple AI systems regularly to check if your content is being cited. Citations may appear in featured snippets, AI chat responses, and voice assistant answers.
                    </p>
                    <p className="mt-2">
                      Improve your citation chances by implementing schema markup, creating authoritative content, and structuring information in a way that directly answers common questions.
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