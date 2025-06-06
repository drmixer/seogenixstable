import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tag, RefreshCw, AlertCircle } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FeatureRestriction from '../../components/ui/FeatureRestriction';
import toast from 'react-hot-toast';

const EntityCoverageAnalyzer = () => {
  const { isFeatureEnabled } = useSubscription();
  const [selectedSite, setSelectedSite] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  
  // Demo sites data
  const demoSites = [
    { id: '1', name: 'Demo Site 1', url: 'https://example.com' },
    { id: '2', name: 'Demo Site 2', url: 'https://example.org' }
  ];
  
  // Demo entity data
  const demoEntities = [
    { 
      name: 'AI Visibility', 
      type: 'Concept', 
      count: 24, 
      gap: false,
      importance: 'high'
    },
    { 
      name: 'Schema Markup', 
      type: 'Technology', 
      count: 18, 
      gap: false,
      importance: 'high'
    },
    { 
      name: 'Citation Tracking', 
      type: 'Feature', 
      count: 12, 
      gap: false,
      importance: 'medium'
    },
    { 
      name: 'Voice Assistant', 
      type: 'Technology', 
      count: 8, 
      gap: false,
      importance: 'medium'
    },
    { 
      name: 'Entity Coverage', 
      type: 'Concept', 
      count: 6, 
      gap: false,
      importance: 'high'
    },
    { 
      name: 'Semantic SEO', 
      type: 'Concept', 
      count: 3, 
      gap: true,
      importance: 'high'
    },
    { 
      name: 'Knowledge Graph', 
      type: 'Technology', 
      count: 1, 
      gap: true,
      importance: 'medium'
    },
    { 
      name: 'Contextual Understanding', 
      type: 'Concept', 
      count: 0, 
      gap: true,
      importance: 'high'
    },
    { 
      name: 'Embeddings', 
      type: 'Technology', 
      count: 0, 
      gap: true,
      importance: 'medium'
    }
  ];
  
  // Group entities by whether they have a gap
  const entitiesWithGaps = demoEntities.filter(entity => entity.gap);
  const entitiesWithCoverage = demoEntities.filter(entity => !entity.gap);

  // If the feature isn't enabled, show the restriction component
  if (!isFeatureEnabled('entityAnalysis')) {
    return (
      <AppLayout>
        <FeatureRestriction
          title="Entity Coverage Analyzer"
          description="Identify key entities in your content and ensure comprehensive coverage for AI understanding."
          requiredPlan="Pro"
        />
      </AppLayout>
    );
  }

  const handleAnalyzeEntities = () => {
    if (!selectedSite) {
      toast.error('Please select a site');
      return;
    }
    
    setIsAnalyzing(true);
    
    // Simulate API call
    setTimeout(() => {
      setHasResults(true);
      setIsAnalyzing(false);
      toast.success('Entity analysis completed');
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
          <h1 className="text-2xl font-bold text-gray-900">Entity Coverage Analyzer</h1>
          <p className="mt-2 text-gray-600">
            Identify key entities in your content and ensure comprehensive coverage for AI understanding.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Analyze Entity Coverage</h2>
              
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
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleAnalyzeEntities}
                    isLoading={isAnalyzing}
                    icon={<RefreshCw size={16} className={isAnalyzing ? 'animate-spin' : ''} />}
                  >
                    Analyze Entities
                  </Button>
                </div>
              </div>
            </Card>
            
            <Card className="mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">About Entity Coverage</h2>
              <p className="text-gray-600 mb-4">
                Entity coverage measures how comprehensively your content covers key concepts, people, organizations, technologies, and other entities relevant to your topic.
              </p>
              <p className="text-gray-600 mb-4">
                AI systems build understanding by connecting entities and their relationships. Comprehensive entity coverage improves AI understanding of your content.
              </p>
              <p className="text-gray-600">
                Our analyzer identifies important entities in your niche, measures their presence in your content, and highlights gaps where coverage could be improved.
              </p>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            {hasResults ? (
              <div className="space-y-6">
                <Card title="Entity Coverage Analysis">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <h3 className="font-medium text-green-800 mb-2">Strong Coverage</h3>
                      <p className="text-green-700">
                        {entitiesWithCoverage.length} entities with good coverage
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                      <h3 className="font-medium text-red-800 mb-2">Coverage Gaps</h3>
                      <p className="text-red-700">
                        {entitiesWithGaps.length} entities with insufficient coverage
                      </p>
                    </div>
                  </div>
                  
                  <h3 className="font-medium text-gray-900 mb-3">All Entities</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mentions</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {demoEntities.map((entity, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {entity.name}
                              {entity.importance === 'high' && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Key
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entity.type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entity.count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {entity.gap ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Gap Detected
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Good Coverage
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
                
                {entitiesWithGaps.length > 0 && (
                  <Card title="Coverage Gap Recommendations" className="bg-yellow-50 border border-yellow-100">
                    <div className="flex items-start mb-4">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Improve your AI visibility by addressing these entity coverage gaps
                        </h3>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {entitiesWithGaps.map((entity, index) => (
                        <div key={index} className="bg-white p-4 rounded-md shadow-sm">
                          <h4 className="font-medium text-gray-900 mb-1">{entity.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            This {entity.type.toLowerCase()} has {entity.count === 0 ? 'no mentions' : 'insufficient mentions'} in your content.
                          </p>
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Recommendation:</h5>
                          <p className="text-sm text-gray-600">
                            {entity.count === 0 
                              ? `Add content explaining ${entity.name} and its relationship to your main topic. Include a dedicated section or FAQ entry about it.`
                              : `Expand your coverage of ${entity.name} with more detailed explanations and examples. Consider creating a dedicated page or section about it.`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <div className="text-center py-12">
                  <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Entity Coverage Analysis</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">
                    Select a site and analyze its entity coverage to identify opportunities for improving AI understanding.
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleAnalyzeEntities}
                    isLoading={isAnalyzing}
                    disabled={!selectedSite}
                  >
                    Analyze Entities
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default EntityCoverageAnalyzer;