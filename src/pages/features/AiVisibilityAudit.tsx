import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, RefreshCw, ExternalLink, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useSites } from '../../contexts/SiteContext';
import { auditApi } from '../../lib/api';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { Link } from 'react-router-dom';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import toast from 'react-hot-toast';

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface Site {
  id: string;
  name: string;
  url: string;
  created_at: string;
}

interface Audit {
  id: string;
  site_id: string;
  ai_visibility_score: number;
  schema_score: number;
  semantic_score: number;
  citation_score: number;
  technical_seo_score: number;
  created_at: string;
}

const AiVisibilityAudit = () => {
  const { canRunAudit, getAuditFrequency } = useSubscription();
  const { sites, selectedSite } = useSites();
  const [audits, setAudits] = useState<{ [siteId: string]: Audit }>({});
  const [isRunningAudit, setIsRunningAudit] = useState<{ [siteId: string]: boolean }>({});
  const [isRunningAllAudits, setIsRunningAllAudits] = useState(false);
  const [isLoadingAudits, setIsLoadingAudits] = useState(true);

  // Load latest audits for all sites
  useEffect(() => {
    const loadAudits = async () => {
      if (sites.length === 0) {
        setIsLoadingAudits(false);
        return;
      }

      try {
        const auditPromises = sites.map(async (site) => {
          try {
            const audit = await auditApi.getLatestAudit(site.id);
            return { siteId: site.id, audit };
          } catch (error) {
            console.log(`No audit found for site ${site.id}`);
            return { siteId: site.id, audit: null };
          }
        });

        const results = await Promise.all(auditPromises);
        const auditMap: { [siteId: string]: Audit } = {};
        
        results.forEach(({ siteId, audit }) => {
          if (audit) {
            auditMap[siteId] = audit;
          }
        });

        setAudits(auditMap);
      } catch (error) {
        console.error('Error loading audits:', error);
        toast.error('Failed to load audit data');
      } finally {
        setIsLoadingAudits(false);
      }
    };

    loadAudits();
  }, [sites]);

  const runAuditForSite = async (site: Site) => {
    if (!canRunAudit()) {
      const frequency = getAuditFrequency();
      toast.error(`You can only run audits ${frequency}. Please wait for your next available audit.`);
      return;
    }

    setIsRunningAudit(prev => ({ ...prev, [site.id]: true }));

    try {
      console.log(`🚀 Running audit for ${site.name}...`);
      const result = await auditApi.runAudit(site.id, site.url);
      
      setAudits(prev => ({
        ...prev,
        [site.id]: result.audit
      }));

      toast.success(`Audit completed for ${site.name}`);
    } catch (error) {
      console.error(`Error running audit for ${site.name}:`, error);
      toast.error(`Failed to run audit for ${site.name}`);
    } finally {
      setIsRunningAudit(prev => ({ ...prev, [site.id]: false }));
    }
  };

  const runSelectedSiteAudit = async () => {
    if (!selectedSite) {
      toast.error('Please select a site first');
      return;
    }

    await runAuditForSite(selectedSite);
  };

  const runAllAudits = async () => {
    if (!canRunAudit()) {
      const frequency = getAuditFrequency();
      toast.error(`You can only run audits ${frequency}. Please wait for your next available audit.`);
      return;
    }

    if (sites.length === 0) {
      toast.error('Please add a site first');
      return;
    }

    setIsRunningAllAudits(true);
    let successCount = 0;
    let errorCount = 0;

    // Run audits for all sites sequentially to avoid overwhelming the API
    for (const site of sites) {
      try {
        console.log(`🚀 Running audit for ${site.name}...`);
        const result = await auditApi.runAudit(site.id, site.url);
        
        setAudits(prev => ({
          ...prev,
          [site.id]: result.audit
        }));

        successCount++;
        console.log(`✅ Audit completed for ${site.name}`);
        
        // Small delay between audits
        if (site !== sites[sites.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`❌ Error running audit for ${site.name}:`, error);
        errorCount++;
      }
    }

    setIsRunningAllAudits(false);

    if (successCount > 0) {
      toast.success(`Completed ${successCount} audit${successCount > 1 ? 's' : ''}${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
    } else {
      toast.error('All audits failed');
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getOverallScore = (audit: Audit) => {
    return Math.round((
      audit.ai_visibility_score +
      audit.schema_score +
      audit.semantic_score +
      audit.citation_score +
      audit.technical_seo_score
    ) / 5);
  };

  // Prepare radar chart data
  const getRadarData = (audit: Audit) => ({
    labels: ['AI Visibility', 'Schema', 'Semantic', 'Citation', 'Technical SEO'],
    datasets: [
      {
        label: 'Score',
        data: [
          audit.ai_visibility_score,
          audit.schema_score,
          audit.semantic_score,
          audit.citation_score,
          audit.technical_seo_score
        ],
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(79, 70, 229, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(79, 70, 229, 1)'
      }
    ]
  });

  const radarOptions = {
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 100
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  if (isLoadingAudits) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">AI Visibility Audits</h1>
          <p className="mt-2 text-gray-600">
            Analyze how well your content performs with AI systems and get actionable recommendations.
          </p>
          {selectedSite && (
            <div className="mt-2 text-sm text-gray-500">
              Selected site: <span className="font-medium text-gray-700">{selectedSite.name}</span>
            </div>
          )}
        </div>

        {sites.length === 0 ? (
          <EmptyState
            title="No sites added yet"
            description="Add your first site to start analyzing AI visibility."
            icon={<BarChart3 size={24} />}
            actionLabel="Add Your First Site"
            onAction={() => window.location.href = '/add-site'}
          />
        ) : (
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="primary"
                onClick={runSelectedSiteAudit}
                isLoading={selectedSite ? isRunningAudit[selectedSite.id] : false}
                disabled={!selectedSite || isRunningAllAudits}
                icon={<RefreshCw size={16} className={selectedSite && isRunningAudit[selectedSite.id] ? 'animate-spin' : ''} />}
              >
                {selectedSite 
                  ? (isRunningAudit[selectedSite.id] ? 'Running Audit...' : `Audit ${selectedSite.name}`)
                  : 'Select a Site to Audit'
                }
              </Button>
              
              {sites.length > 1 && (
                <Button
                  variant="outline"
                  onClick={runAllAudits}
                  isLoading={isRunningAllAudits}
                  disabled={Object.values(isRunningAudit).some(Boolean)}
                  icon={<RefreshCw size={16} className={isRunningAllAudits ? 'animate-spin' : ''} />}
                >
                  {isRunningAllAudits ? 'Running All Audits...' : 'Run All Sites'}
                </Button>
              )}
            </div>

            {/* Overview Stats */}
            {Object.keys(audits).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-indigo-50 border border-indigo-100">
                  <div className="text-center">
                    <h3 className="text-sm font-medium text-indigo-800 mb-1">Sites Audited</h3>
                    <div className="text-2xl font-bold text-indigo-600">{Object.keys(audits).length}</div>
                    <div className="text-xs text-indigo-600">of {sites.length} total</div>
                  </div>
                </Card>
                <Card className="bg-green-50 border border-green-100">
                  <div className="text-center">
                    <h3 className="text-sm font-medium text-green-800 mb-1">Avg AI Visibility</h3>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(Object.values(audits).reduce((sum, audit) => sum + audit.ai_visibility_score, 0) / Object.values(audits).length)}
                    </div>
                    <div className="text-xs text-green-600">out of 100</div>
                  </div>
                </Card>
                <Card className="bg-blue-50 border border-blue-100">
                  <div className="text-center">
                    <h3 className="text-sm font-medium text-blue-800 mb-1">Avg Schema Score</h3>
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(Object.values(audits).reduce((sum, audit) => sum + audit.schema_score, 0) / Object.values(audits).length)}
                    </div>
                    <div className="text-xs text-blue-600">out of 100</div>
                  </div>
                </Card>
                <Card className="bg-purple-50 border border-purple-100">
                  <div className="text-center">
                    <h3 className="text-sm font-medium text-purple-800 mb-1">Avg Citation Score</h3>
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(Object.values(audits).reduce((sum, audit) => sum + audit.citation_score, 0) / Object.values(audits).length)}
                    </div>
                    <div className="text-xs text-purple-600">out of 100</div>
                  </div>
                </Card>
              </div>
            )}

            {/* Selected Site Detailed View */}
            {selectedSite && (
              <div className="space-y-6">
                <Card>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">{selectedSite.name}</h2>
                      <a 
                        href={selectedSite.url.startsWith('http') ? selectedSite.url : `https://${selectedSite.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-500 hover:text-indigo-600 transition-colors flex items-center"
                      >
                        {selectedSite.url}
                        <ExternalLink size={14} className="ml-1" />
                      </a>
                    </div>
                    <Link to={`/sites/${selectedSite.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>

                  {audits[selectedSite.id] ? (
                    <div className="space-y-6">
                      {/* Overall Score */}
                      <div className={`p-4 rounded-lg border ${getScoreBgColor(getOverallScore(audits[selectedSite.id]))}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">Overall AI Visibility</h4>
                            <p className="text-sm text-gray-600">Last audit: {formatDate(audits[selectedSite.id].created_at)}</p>
                          </div>
                          <div className={`text-3xl font-bold ${getScoreColor(getOverallScore(audits[selectedSite.id]))}`}>
                            {getOverallScore(audits[selectedSite.id])}
                          </div>
                        </div>
                      </div>

                      {/* Radar Chart */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-64">
                          <Radar data={getRadarData(audits[selectedSite.id])} options={radarOptions} />
                        </div>

                        {/* Individual Scores */}
                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <span className="text-sm font-medium text-gray-700">AI Visibility</span>
                            <span className={`text-lg font-bold ${getScoreColor(audits[selectedSite.id].ai_visibility_score)}`}>
                              {audits[selectedSite.id].ai_visibility_score}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <span className="text-sm font-medium text-gray-700">Schema</span>
                            <span className={`text-lg font-bold ${getScoreColor(audits[selectedSite.id].schema_score)}`}>
                              {audits[selectedSite.id].schema_score}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <span className="text-sm font-medium text-gray-700">Semantic</span>
                            <span className={`text-lg font-bold ${getScoreColor(audits[selectedSite.id].semantic_score)}`}>
                              {audits[selectedSite.id].semantic_score}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <span className="text-sm font-medium text-gray-700">Citation</span>
                            <span className={`text-lg font-bold ${getScoreColor(audits[selectedSite.id].citation_score)}`}>
                              {audits[selectedSite.id].citation_score}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <span className="text-sm font-medium text-gray-700">Technical SEO</span>
                            <span className={`text-lg font-bold ${getScoreColor(audits[selectedSite.id].technical_seo_score)}`}>
                              {audits[selectedSite.id].technical_seo_score}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Audit Yet</h4>
                      <p className="text-sm text-gray-500 mb-4">
                        Run your first AI visibility audit to see how well this site performs with AI systems.
                      </p>
                      <Button
                        variant="primary"
                        onClick={() => runAuditForSite(selectedSite)}
                        isLoading={isRunningAudit[selectedSite.id]}
                        disabled={isRunningAllAudits}
                        icon={<BarChart3 size={16} />}
                      >
                        {isRunningAudit[selectedSite.id] ? 'Running Audit...' : 'Run First Audit'}
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* All Sites Overview */}
            {sites.length > 1 && (
              <Card title="All Sites Overview">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {sites.map((site) => {
                    const audit = audits[site.id];
                    const isRunning = isRunningAudit[site.id];

                    return (
                      <div key={site.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{site.name}</h4>
                            <a 
                              href={site.url.startsWith('http') ? site.url : `https://${site.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-gray-500 hover:text-indigo-600 transition-colors flex items-center"
                            >
                              {site.url}
                              <ExternalLink size={12} className="ml-1" />
                            </a>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => runAuditForSite(site)}
                            isLoading={isRunning}
                            disabled={isRunningAllAudits}
                          >
                            {isRunning ? 'Running...' : audit ? 'Re-audit' : 'Audit'}
                          </Button>
                        </div>

                        {audit ? (
                          <div className="space-y-2">
                            <div className={`text-center p-2 rounded ${getScoreBgColor(getOverallScore(audit))}`}>
                              <div className={`text-xl font-bold ${getScoreColor(getOverallScore(audit))}`}>
                                {getOverallScore(audit)}
                              </div>
                              <div className="text-xs text-gray-600">Overall Score</div>
                            </div>
                            <div className="text-xs text-gray-500 text-center">
                              Last audit: {formatDate(audit.created_at)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <div className="text-gray-400 text-sm">No audit yet</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* What We Analyze Section */}
            <Card className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">What We Analyze</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <BarChart3 size={16} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">AI Visibility Score</h3>
                    <p className="text-sm text-gray-600">Overall assessment of how visible and understandable your content is to AI systems.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <BarChart3 size={16} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Schema Markup</h3>
                    <p className="text-sm text-gray-600">Evaluates your structured data implementation and suggests improvements.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Semantic Relevance</h3>
                    <p className="text-sm text-gray-600">Measures how well your content matches common queries in your industry.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 size={16} className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Citation Score</h3>
                    <p className="text-sm text-gray-600">Tracks how often AI systems reference your content in responses.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <BarChart3 size={16} className="text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Technical SEO</h3>
                    <p className="text-sm text-gray-600">Analyzes technical factors that affect AI crawling and understanding.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <BarChart3 size={16} className="text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Entity Coverage</h3>
                    <p className="text-sm text-gray-600">Identifies key entities in your content and gaps in coverage.</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
};

export default AiVisibilityAudit;