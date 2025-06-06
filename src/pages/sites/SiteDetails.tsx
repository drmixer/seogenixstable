import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { siteApi, auditApi, schemaApi, citationApi, summaryApi, entityApi } from '../../lib/api';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { motion } from 'framer-motion';
import { RefreshCw, AlertCircle, Info, Copy, Check } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
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

interface Schema {
  id: string;
  audit_id: string;
  schema_type: string;
  markup: string;
  created_at: string;
}

interface Citation {
  id: string;
  site_id: string;
  source_type: string;
  snippet_text: string;
  url: string;
  detected_at: string;
}

interface Summary {
  id: string;
  site_id: string;
  summary_type: string;
  content: string;
  created_at: string;
}

interface Entity {
  id: string;
  site_id: string;
  entity_name: string;
  entity_type: string;
  mention_count: number;
  gap: boolean;
  created_at: string;
}

const SiteDetails = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { canRunAudit, getAuditFrequency } = useSubscription();
  
  const [site, setSite] = useState<Site | null>(null);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [copiedSchemaId, setCopiedSchemaId] = useState<string | null>(null);
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [isTestingAssistant, setIsTestingAssistant] = useState(false);
  
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSiteData = async () => {
      if (!siteId) {
        navigate('/dashboard');
        return;
      }
      
      try {
        // Load site info
        const siteData = await siteApi.getSite(siteId);
        setSite(siteData);
        
        // Load latest audit
        try {
          const auditData = await auditApi.getLatestAudit(siteId);
          setAudit(auditData);
          
          // If audit exists, load related data
          if (auditData?.id) {
            // Load schemas
            const schemasData = await schemaApi.getSchemas(auditData.id);
            setSchemas(schemasData);
          }
        } catch (err) {
          console.log('No audits found for this site yet');
        }
        
        // Load citations
        try {
          const citationsData = await citationApi.getCitations(siteId);
          setCitations(citationsData);
        } catch (err) {
          console.log('No citations found for this site yet');
        }
        
        // Load summaries
        try {
          const summariesData = await summaryApi.getSummaries(siteId);
          setSummaries(summariesData);
        } catch (err) {
          console.log('No summaries found for this site yet');
        }
        
        // Load entities
        try {
          const entitiesData = await entityApi.getEntities(siteId);
          setEntities(entitiesData);
        } catch (err) {
          console.log('No entities found for this site yet');
        }
      } catch (err) {
        console.error('Error loading site data:', err);
        setError('Failed to load site data');
        toast.error('Failed to load site data');
      } finally {
        setIsLoadingInitial(false);
      }
    };
    
    loadSiteData();
  }, [siteId, navigate]);

  const runFullAudit = async () => {
    if (!site) return;

    // Check if user can run an audit based on their plan
    if (!canRunAudit()) {
      const frequency = getAuditFrequency();
      toast.error(`You can only run audits ${frequency}. Please wait for your next available audit.`);
      return;
    }
    
    setIsRunningAudit(true);
    setError('');
    
    try {
      // Check if the URL is valid and public
      const urlObj = new URL(site.url);
      const hostname = urlObj.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.16.')
      ) {
        throw new Error('Cannot analyze local or private network URLs. Please update the site URL to a public website address.');
      }

      // Run the audit
      const auditResult = await auditApi.runAudit(site.id, site.url);
      setAudit(auditResult.audit);
      setSchemas(auditResult.schemas || []);
      
      // Track citations
      try {
        const citationResult = await citationApi.trackCitations(site.id, site.url);
        setCitations(citationResult.citations || []);
      } catch (err) {
        console.error('Error tracking citations:', err);
        toast.error('Failed to track citations');
      }
      
      // Generate summary
      try {
        const summaryResult = await summaryApi.generateSummary(site.id, site.url, 'SiteOverview');
        setSummaries([summaryResult.summary, ...(summaries || [])]);
      } catch (err) {
        console.error('Error generating summary:', err);
        toast.error('Failed to generate summary');
      }
      
      // Analyze entity coverage
      try {
        const entityResult = await entityApi.analyzeEntityCoverage(site.id, site.url);
        setEntities(entityResult.entities || []);
      } catch (err) {
        console.error('Error analyzing entity coverage:', err);
        toast.error('Failed to analyze entity coverage');
      }
      
      toast.success('Site audit completed successfully');
    } catch (err) {
      console.error('Error running full audit:', err);
      setError(err instanceof Error ? err.message : 'Failed to run site audit');
      toast.error('Failed to run site audit');
    } finally {
      setIsRunningAudit(false);
    }
  };

  const copySchemaToClipboard = (schemaId: string, markup: string) => {
    navigator.clipboard.writeText(markup);
    setCopiedSchemaId(schemaId);
    toast.success('Schema copied to clipboard');
    
    // Reset the "Copied" state after 2 seconds
    setTimeout(() => {
      setCopiedSchemaId(null);
    }, 2000);
  };

  const testVoiceAssistant = async () => {
    if (!site || !assistantQuery.trim()) return;
    
    setIsTestingAssistant(true);
    
    try {
      const result = await citationApi.trackCitations(site.id, site.url);
      setAssistantResponse(result.assistant_response || 'No response received');
      
      // Update citations if new ones were found
      if (result.citations) {
        setCitations(result.citations);
      }
    } catch (err) {
      console.error('Error testing voice assistant:', err);
      setAssistantResponse('Error: Failed to test voice assistant');
      toast.error('Failed to test voice assistant');
    } finally {
      setIsTestingAssistant(false);
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

  // Prepare radar chart data if audit exists
  const radarData = audit ? {
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
  } : null;

  const radarOptions = {
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 100
      }
    }
  };

  if (isLoadingInitial) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }

  if (!site) {
    return (
      <AppLayout>
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Site not found. <a href="/dashboard" className="font-medium underline text-red-700 hover:text-red-600">Return to dashboard</a>
              </p>
            </div>
          </div>
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{site.name}</h1>
            <a 
              href={site.url.startsWith('http') ? site.url : `https://${site.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-indigo-600 transition-colors flex items-center mt-1"
            >
              {site.url}
            </a>
          </div>
          <Button
            variant="primary"
            onClick={runFullAudit}
            isLoading={isRunningAudit}
            icon={<RefreshCw size={16} className={isRunningAudit ? 'animate-spin' : ''} />}
          >
            {audit ? 'Run New Audit' : 'Run First Audit'}
          </Button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!audit && !isRunningAudit && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  No audit data yet. Run your first audit to analyze AI visibility.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schema'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('schema')}
            >
              Schema
            </button>
            <button
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'citations'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('citations')}
            >
              Citations
            </button>
            <button
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'summaries'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('summaries')}
            >
              LLM Summary
            </button>
            <button
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'voice-test'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('voice-test')}
            >
              Voice Assistant Test
            </button>
            <button
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'entities'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('entities')}
            >
              Entity Coverage
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="py-4">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {audit ? (
                <>
                  <Card title="AI Visibility Scores">
                    <div className="h-80">
                      {radarData && <Radar data={radarData} options={radarOptions} />}
                    </div>
                  </Card>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
                    <Card className="bg-indigo-50 border border-indigo-100">
                      <div className="text-center">
                        <h3 className="text-lg font-medium text-indigo-800 mb-2">AI Visibility</h3>
                        <div className="text-3xl font-bold text-indigo-600">{audit.ai_visibility_score}</div>
                      </div>
                    </Card>
                    <Card className="bg-green-50 border border-green-100">
                      <div className="text-center">
                        <h3 className="text-lg font-medium text-green-800 mb-2">Schema</h3>
                        <div className="text-3xl font-bold text-green-600">{audit.schema_score}</div>
                      </div>
                    </Card>
                    <Card className="bg-blue-50 border border-blue-100">
                      <div className="text-center">
                        <h3 className="text-lg font-medium text-blue-800 mb-2">Semantic</h3>
                        <div className="text-3xl font-bold text-blue-600">{audit.semantic_score}</div>
                      </div>
                    </Card>
                    <Card className="bg-purple-50 border border-purple-100">
                      <div className="text-center">
                        <h3 className="text-lg font-medium text-purple-800 mb-2">Citation</h3>
                        <div className="text-3xl font-bold text-purple-600">{audit.citation_score}</div>
                      </div>
                    </Card>
                    <Card className="bg-orange-50 border border-orange-100">
                      <div className="text-center">
                        <h3 className="text-lg font-medium text-orange-800 mb-2">Technical SEO</h3>
                        <div className="text-3xl font-bold text-orange-600">{audit.technical_seo_score}</div>
                      </div>
                    </Card>
                  </div>
                  
                  <Card title="Last Audit">
                    <p className="text-gray-600">
                      Last audit performed on {formatDate(audit.created_at)}
                    </p>
                  </Card>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No audit data available yet.</p>
                  <Button
                    variant="primary"
                    onClick={runFullAudit}
                    isLoading={isRunningAudit}
                  >
                    Run First Audit
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Schema Tab */}
          {activeTab === 'schema' && (
            <div className="space-y-6">
              {schemas.length > 0 ? (
                schemas.map((schema) => (
                  <Card 
                    key={schema.id} 
                    title={`${schema.schema_type} Schema`}
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copySchemaToClipboard(schema.id, schema.markup)}
                        icon={copiedSchemaId === schema.id ? <Check size={16} /> : <Copy size={16} />}
                      >
                        {copiedSchemaId === schema.id ? 'Copied' : 'Copy'}
                      </Button>
                    }
                  >
                    <div className="bg-gray-50 p-4 rounded overflow-auto max-h-96">
                      <pre className="text-sm font-mono">{schema.markup}</pre>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No schema data available yet.</p>
                  {!audit && (
                    <Button
                      variant="primary"
                      onClick={runFullAudit}
                      isLoading={isRunningAudit}
                    >
                      Run Audit to Generate Schemas
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Citations Tab */}
          {activeTab === 'citations' && (
            <div className="space-y-6">
              {citations.length > 0 ? (
                <Card title="AI Citations">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col\" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Snippet</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detected</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {citations.map((citation) => (
                          <tr key={citation.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{citation.source_type}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <div className="max-w-lg truncate">{citation.snippet_text}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(citation.detected_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No citations detected yet.</p>
                  <Button
                    variant="primary"
                    onClick={() => citationApi.trackCitations(site.id, site.url).then(res => {
                      setCitations(res.citations || []);
                      toast.success('Citation check completed');
                    }).catch(err => {
                      console.error('Error checking citations:', err);
                      toast.error('Failed to check citations');
                    })}
                  >
                    Check for Citations
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* LLM Summary Tab */}
          {activeTab === 'summaries' && (
            <div className="space-y-6">
              {summaries.length > 0 ? (
                summaries.map((summary) => (
                  <Card 
                    key={summary.id} 
                    title={`${summary.summary_type} (${formatDate(summary.created_at)})`}
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(summary.content);
                          toast.success('Summary copied to clipboard');
                        }}
                        icon={<Copy size={16} />}
                      >
                        Copy
                      </Button>
                    }
                  >
                    <div className="prose max-w-none">
                      {summary.content.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No LLM summaries generated yet.</p>
                  <Button
                    variant="primary"
                    onClick={() => summaryApi.generateSummary(site.id, site.url, 'SiteOverview').then(res => {
                      setSummaries([res.summary]);
                      toast.success('Summary generated');
                    }).catch(err => {
                      console.error('Error generating summary:', err);
                      toast.error('Failed to generate summary');
                    })}
                  >
                    Generate Site Summary
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Voice Assistant Test Tab */}
          {activeTab === 'voice-test' && (
            <div className="space-y-6">
              <Card title="Test Voice Assistant Responses">
                <div className="mb-4">
                  <label htmlFor="assistantQuery" className="block text-sm font-medium text-gray-700 mb-1">
                    Ask a question about your site
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      name="assistantQuery"
                      id="assistantQuery"
                      className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300"
                      placeholder="e.g., What services does this company offer?"
                      value={assistantQuery}
                      onChange={(e) => setAssistantQuery(e.target.value)}
                    />
                    <Button
                      variant="primary"
                      className="ml-3"
                      onClick={testVoiceAssistant}
                      isLoading={isTestingAssistant}
                    >
                      Test
                    </Button>
                  </div>
                </div>
                
                {assistantResponse && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Assistant Response:</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-gray-700">{assistantResponse}</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Entity Coverage Tab */}
          {activeTab === 'entities' && (
            <div className="space-y-6">
              {entities.length > 0 ? (
                <Card title="Entity Coverage Analysis">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col\" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mentions</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {entities.map((entity) => (
                          <tr key={entity.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entity.entity_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entity.entity_type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entity.mention_count}</td>
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
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No entity coverage analysis yet.</p>
                  <Button
                    variant="primary"
                    onClick={() => entityApi.analyzeEntityCoverage(site.id, site.url).then(res => {
                      setEntities(res.entities || []);
                      toast.success('Entity analysis completed');
                    }).catch(err => {
                      console.error('Error analyzing entities:', err);
                      toast.error('Failed to analyze entities');
                    })}
                  >
                    Analyze Entity Coverage
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default SiteDetails;