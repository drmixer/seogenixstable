import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tag, RefreshCw, AlertCircle, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useSites } from '../../contexts/SiteContext';
import { entityApi } from '../../lib/api';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import FeatureRestriction from '../../components/ui/FeatureRestriction';
import toast from 'react-hot-toast';

interface Entity {
  id: string;
  site_id: string;
  entity_name: string;
  entity_type: string;
  mention_count: number;
  gap: boolean;
  created_at: string;
}

const EntityCoverageAnalyzer = () => {
  const { isFeatureEnabled } = useSubscription();
  const { selectedSite, sites } = useSites();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [analysisSummary, setAnalysisSummary] = useState('');
  const [totalEntities, setTotalEntities] = useState(0);
  const [coverageScore, setCoverageScore] = useState(0);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<string | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);

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

  // Load existing entities for the selected site
  useEffect(() => {
    const loadExistingEntities = async () => {
      if (!selectedSite) {
        setEntities([]);
        setIsLoadingExisting(false);
        return;
      }

      try {
        console.log(`🔍 Loading entities for selected site: ${selectedSite.name}`);
        const siteEntities = await entityApi.getEntities(selectedSite.id);
        setEntities(siteEntities);
        
        if (siteEntities.length > 0) {
          // Calculate coverage score from existing entities
          const entitiesWithGoodCoverage = siteEntities.filter(e => !e.gap);
          const score = Math.round((entitiesWithGoodCoverage.length / siteEntities.length) * 100);
          setCoverageScore(score);
          setTotalEntities(siteEntities.length);
          
          // Set last analysis time to the most recent entity creation time
          const mostRecent = siteEntities.reduce((latest, entity) => 
            new Date(entity.created_at) > new Date(latest.created_at) ? entity : latest
          );
          setLastAnalysisTime(mostRecent.created_at);
        }
        
        console.log(`✅ Loaded ${siteEntities.length} entities for ${selectedSite.name}`);
      } catch (error) {
        console.error('Error loading existing entities:', error);
        setEntities([]);
      } finally {
        setIsLoadingExisting(false);
      }
    };

    loadExistingEntities();
  }, [selectedSite]);

  const handleAnalyzeEntities = async () => {
    if (!selectedSite) {
      toast.error('Please select a site first');
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      console.log(`🚀 Starting entity analysis for ${selectedSite.name}`);
      
      const result = await entityApi.analyzeEntityCoverage(selectedSite.id, selectedSite.url);
      
      setEntities(result.entities);
      setAnalysisSummary(result.analysis_summary);
      setTotalEntities(result.total_entities);
      setCoverageScore(result.coverage_score);
      setLastAnalysisTime(new Date().toISOString());
      
      const entitiesWithGaps = result.entities.filter(e => e.gap);
      
      if (entitiesWithGaps.length > 0) {
        toast.success(`Entity analysis completed! Found ${entitiesWithGaps.length} coverage gaps to address.`);
      } else {
        toast.success(`Entity analysis completed! Your content has excellent entity coverage.`);
      }
    } catch (error) {
      console.error('❌ Entity analysis failed:', error);
      toast.error(`Failed to analyze entities for ${selectedSite.name}`);
    } finally {
      setIsAnalyzing(false);
    }
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

  // Group entities by whether they have a gap
  const entitiesWithGaps = entities.filter(entity => entity.gap);
  const entitiesWithCoverage = entities.filter(entity => !entity.gap);

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
          {selectedSite && (
            <div className="mt-2 text-sm text-gray-500">
              Analyzing entities for: <span className="font-medium text-gray-700">{selectedSite.name}</span>
              {lastAnalysisTime && (
                <span className="block mt-1">
                  Last analysis: {formatDate(lastAnalysisTime)}
                </span>
              )}
            </div>
          )}
        </div>

        {!selectedSite ? (
          <EmptyState
            title="No site selected"
            description="Please select a site from the site selector to start analyzing entity coverage."
            icon={<Tag size={24} />}
            actionLabel="Add Your First Site"
            onAction={() => window.location.href = '/add-site'}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Analyze Entity Coverage</h2>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Selected Site</h3>
                    <p className="text-blue-700 font-medium">{selectedSite.name}</p>
                    <p className="text-xs text-blue-600 mt-1">{selectedSite.url}</p>
                  </div>
                  
                  <div>
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={handleAnalyzeEntities}
                      isLoading={isAnalyzing}
                      icon={<RefreshCw size={16} className={isAnalyzing ? 'animate-spin' : ''} />}
                    >
                      {isAnalyzing ? 'Analyzing Entities...' : entities.length > 0 ? 'Re-analyze Entities' : 'Analyze Entities'}
                    </Button>
                  </div>

                  {coverageScore > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <h3 className="text-sm font-medium text-green-800 mb-2">Coverage Score</h3>
                      <div className="flex items-center">
                        <div className="text-2xl font-bold text-green-600">{coverageScore}%</div>
                        <div className="ml-2 text-xs text-green-600">
                          {coverageScore >= 80 ? 'Excellent' : coverageScore >= 60 ? 'Good' : 'Needs Improvement'}
                        </div>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        {entitiesWithCoverage.length} of {totalEntities} entities well-covered
                      </p>
                    </div>
                  )}
                </div>
              </Card>
              
              <Card className="mt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">About Entity Coverage</h2>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>
                    Entity coverage measures how comprehensively your content covers key concepts, people, organizations, technologies, and other entities relevant to your topic.
                  </p>
                  <p>
                    AI systems build understanding by connecting entities and their relationships. Comprehensive entity coverage improves AI understanding of your content.
                  </p>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <h4 className="font-medium text-blue-800 mb-2">What We Analyze:</h4>
                    <ul className="space-y-1 text-xs text-blue-700 list-disc list-inside">
                      <li>Business and organization entities</li>
                      <li>Service and product entities</li>
                      <li>Technology and concept entities</li>
                      <li>Industry-specific terminology</li>
                      <li>Geographic and location entities</li>
                      <li>Key people and roles</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
            
            <div className="lg:col-span-2">
              {isLoadingExisting ? (
                <Card>
                  <div className="flex justify-center py-12">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </Card>
              ) : entities.length > 0 ? (
                <div className="space-y-6">
                  {/* Summary Card */}
                  <Card className="bg-indigo-50 border border-indigo-100">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <TrendingUp className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-indigo-800 mb-2">Analysis Summary</h3>
                        <p className="text-sm text-indigo-700 mb-3">
                          {analysisSummary || `Found ${totalEntities} entities with ${entitiesWithCoverage.length} well-covered and ${entitiesWithGaps.length} needing improvement.`}
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-xs text-indigo-600">
                          <div>
                            <span className="font-medium">Total Entities:</span> {totalEntities}
                          </div>
                          <div>
                            <span className="font-medium">Coverage Score:</span> {coverageScore}%
                          </div>
                          <div>
                            <span className="font-medium">Well Covered:</span> {entitiesWithCoverage.length}
                          </div>
                          <div>
                            <span className="font-medium">Need Improvement:</span> {entitiesWithGaps.length}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Coverage Overview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="bg-green-50 border border-green-100">
                      <div className="flex items-center">
                        <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                        <div>
                          <h3 className="font-medium text-green-800 mb-1">Strong Coverage</h3>
                          <p className="text-green-700 text-sm">
                            {entitiesWithCoverage.length} entities with good coverage
                          </p>
                        </div>
                      </div>
                    </Card>
                    <Card className="bg-red-50 border border-red-100">
                      <div className="flex items-center">
                        <XCircle className="h-8 w-8 text-red-600 mr-3" />
                        <div>
                          <h3 className="font-medium text-red-800 mb-1">Coverage Gaps</h3>
                          <p className="text-red-700 text-sm">
                            {entitiesWithGaps.length} entities with insufficient coverage
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                  
                  {/* All Entities Table */}
                  <Card title="Entity Coverage Analysis">
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
                          {entities.map((entity, index) => (
                            <tr key={entity.id || index} className={entity.gap ? 'bg-red-50' : 'bg-green-50'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {entity.entity_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entity.entity_type}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entity.mention_count}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {entity.gap ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <XCircle size={12} className="mr-1" />
                                    Gap Detected
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle size={12} className="mr-1" />
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
                  
                  {/* Coverage Gap Recommendations */}
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
                          <div key={entity.id || index} className="bg-white p-4 rounded-md shadow-sm">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-1">{entity.entity_name}</h4>
                                <p className="text-sm text-gray-600 mb-2">
                                  <span className="font-medium">Type:</span> {entity.entity_type} • 
                                  <span className="font-medium"> Mentions:</span> {entity.mention_count === 0 ? 'None' : `${entity.mention_count} (insufficient)`}
                                </p>
                                <div className="bg-blue-50 p-3 rounded-md">
                                  <h5 className="text-sm font-medium text-blue-800 mb-1">💡 Recommendation:</h5>
                                  <p className="text-sm text-blue-700">
                                    {entity.mention_count === 0 
                                      ? `Add content explaining ${entity.entity_name} and its relationship to your main topic. Include a dedicated section or FAQ entry about it.`
                                      : `Expand your coverage of ${entity.entity_name} with more detailed explanations and examples. Consider creating a dedicated page or section about it.`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Implementation Guide */}
                  <Card className="bg-green-50 border border-green-100">
                    <h3 className="text-lg font-medium text-green-800 mb-4">How to Improve Entity Coverage</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
                      <div>
                        <h4 className="font-medium mb-2">Content Strategy:</h4>
                        <ul className="space-y-1 list-disc list-inside">
                          <li>Create dedicated pages for important entities</li>
                          <li>Add FAQ sections covering key concepts</li>
                          <li>Include entity definitions and explanations</li>
                          <li>Use entities naturally throughout your content</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">AI Optimization:</h4>
                        <ul className="space-y-1 list-disc list-inside">
                          <li>Use consistent terminology for entities</li>
                          <li>Link related entities together</li>
                          <li>Include entity relationships and context</li>
                          <li>Add structured data for key entities</li>
                        </ul>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : (
                <Card>
                  <div className="text-center py-12">
                    <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Entity Coverage Analysis</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      Analyze {selectedSite.name} to identify key entities and coverage opportunities for improving AI understanding.
                    </p>
                    <Button
                      variant="primary"
                      onClick={handleAnalyzeEntities}
                      isLoading={isAnalyzing}
                      icon={<Tag size={16} />}
                    >
                      Start Entity Analysis
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
};

export default EntityCoverageAnalyzer;