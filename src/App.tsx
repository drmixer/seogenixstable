import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import Dashboard from './pages/dashboard/Dashboard';
import AiVisibilityAudit from './pages/features/AiVisibilityAudit';
import SchemaGenerator from './pages/features/SchemaGenerator';
import PromptMatchSuggestions from './pages/features/PromptMatchSuggestions';
import AiContentGenerator from './pages/features/AiContentGenerator';
import CitationTracker from './pages/features/CitationTracker';
import VoiceAssistantTester from './pages/features/VoiceAssistantTester';
import LlmSiteSummaries from './pages/features/LlmSiteSummaries';
import EntityCoverageAnalyzer from './pages/features/EntityCoverageAnalyzer';
import AccountSettings from './pages/account/AccountSettings';
import AddSite from './pages/sites/AddSite';
import SiteDetails from './pages/sites/SiteDetails';
import NotFound from './pages/NotFound';

// Protected route wrapper
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time to ensure auth state is checked
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <SubscriptionProvider>
        <Router>
          <Toaster position="top-right" />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/add-site" element={<ProtectedRoute><AddSite /></ProtectedRoute>} />
            <Route path="/sites/:siteId" element={<ProtectedRoute><SiteDetails /></ProtectedRoute>} />
            <Route path="/ai-visibility-audit" element={<ProtectedRoute><AiVisibilityAudit /></ProtectedRoute>} />
            <Route path="/schema-generator" element={<ProtectedRoute><SchemaGenerator /></ProtectedRoute>} />
            <Route path="/prompt-match-suggestions" element={<ProtectedRoute><PromptMatchSuggestions /></ProtectedRoute>} />
            <Route path="/ai-content-generator" element={<ProtectedRoute><AiContentGenerator /></ProtectedRoute>} />
            <Route path="/citation-tracker" element={<ProtectedRoute><CitationTracker /></ProtectedRoute>} />
            <Route path="/voice-assistant-tester" element={<ProtectedRoute><VoiceAssistantTester /></ProtectedRoute>} />
            <Route path="/llm-site-summaries" element={<ProtectedRoute><LlmSiteSummaries /></ProtectedRoute>} />
            <Route path="/entity-coverage-analyzer" element={<ProtectedRoute><EntityCoverageAnalyzer /></ProtectedRoute>} />
            <Route path="/account-settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
            
            {/* Fallbacks */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Router>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;