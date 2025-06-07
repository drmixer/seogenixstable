import React, { useState, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart2, 
  Code, 
  MessageSquare, 
  FileText, 
  Link2, 
  Mic, 
  FileBarChart, 
  Tag, 
  Settings, 
  Menu, 
  X, 
  LogOut, 
  Plus,
  Home
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSites } from '../../contexts/SiteContext';
import SiteSelector from './SiteSelector';
import toast from 'react-hot-toast';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const { sites } = useSites();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', icon: <Home size={20} />, path: '/dashboard' },
    { label: 'AI Visibility Audit', icon: <BarChart2 size={20} />, path: '/ai-visibility-audit' },
    { label: 'Schema Generator', icon: <Code size={20} />, path: '/schema-generator' },
    { label: 'Prompt Match Suggestions', icon: <MessageSquare size={20} />, path: '/prompt-match-suggestions' },
    { label: 'AI Content Generator', icon: <FileText size={20} />, path: '/ai-content-generator' },
    { label: 'Citation Tracker', icon: <Link2 size={20} />, path: '/citation-tracker' },
    { label: 'Voice Assistant Tester', icon: <Mic size={20} />, path: '/voice-assistant-tester' },
    { label: 'LLM Site Summaries', icon: <FileBarChart size={20} />, path: '/llm-site-summaries' },
    { label: 'Entity Coverage Analyzer', icon: <Tag size={20} />, path: '/entity-coverage-analyzer' }
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Successfully signed out');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to sign out');
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r">
            <div className="flex items-center flex-shrink-0 px-4 mb-8">
              <span className="text-2xl font-bold text-indigo-600">SEOgenix</span>
            </div>
            <div className="flex flex-col flex-grow">
              <nav className="flex-1 px-2 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`${
                      location.pathname === item.path
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                  >
                    <div className={`${
                      location.pathname === item.path
                        ? 'text-indigo-600'
                        : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3 flex-shrink-0`}>
                      {item.icon}
                    </div>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="p-4 mt-auto border-t">
                <Link
                  to="/account-settings"
                  className={`${
                    location.pathname === '/account-settings'
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                >
                  <Settings className={`${
                    location.pathname === '/account-settings'
                      ? 'text-indigo-600'
                      : 'text-gray-400 group-hover:text-gray-500'
                  } mr-3 flex-shrink-0`} size={20} />
                  Account Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-2 py-2 mt-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 group transition-colors"
                >
                  <LogOut className="mr-3 text-gray-400 group-hover:text-gray-500" size={20} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <motion.div
        className={`fixed inset-0 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: sidebarOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <motion.div
          className="fixed inset-y-0 left-0 flex flex-col z-40 w-full max-w-xs bg-white"
          initial={{ x: "-100%" }}
          animate={{ x: sidebarOpen ? 0 : "-100%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <span className="text-2xl font-bold text-indigo-600">SEOgenix</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 -mr-2 text-gray-400 rounded-md hover:text-gray-500 hover:bg-gray-100"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pt-5 pb-4">
            <nav className="px-2 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`${
                    location.pathname === item.path
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className={`${
                    location.pathname === item.path
                      ? 'text-indigo-600'
                      : 'text-gray-400 group-hover:text-gray-500'
                  } mr-4 flex-shrink-0`}>
                    {item.icon}
                  </div>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="p-4 border-t">
            <Link
              to="/account-settings"
              className={`${
                location.pathname === '/account-settings'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors`}
              onClick={() => setSidebarOpen(false)}
            >
              <Settings className={`${
                location.pathname === '/account-settings'
                  ? 'text-indigo-600'
                  : 'text-gray-400 group-hover:text-gray-500'
              } mr-4 flex-shrink-0`} size={20} />
              Account Settings
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-2 py-2 mt-2 text-base font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 group transition-colors"
            >
              <LogOut className="mr-4 text-gray-400 group-hover:text-gray-500" size={20} />
              Sign Out
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Main content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Top header */}
        <div className="relative z-10 flex h-16 flex-shrink-0 bg-white shadow md:border-b md:shadow-none">
          <button
            type="button"
            className="px-4 text-gray-500 border-r md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="flex justify-between flex-1 px-4 md:px-8">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 hidden md:block">
                {navItems.find(item => item.path === location.pathname)?.label || 'SEOgenix'}
              </h1>
              {/* Site Selector - only show on tool pages */}
              {location.pathname !== '/dashboard' && location.pathname !== '/add-site' && !location.pathname.startsWith('/sites/') && (
                <div className="hidden md:block">
                  <SiteSelector />
                </div>
              )}
            </div>
            <div className="flex items-center ml-auto space-x-4">
              {/* Mobile site selector */}
              {location.pathname !== '/dashboard' && location.pathname !== '/add-site' && !location.pathname.startsWith('/sites/') && (
                <div className="md:hidden">
                  <SiteSelector />
                </div>
              )}
              
              {sites.length > 0 && (
                <Link
                  to="/add-site"
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="-ml-1 mr-2" size={16} />
                  Add Site
                </Link>
              )}
              
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <div className="bg-indigo-100 text-indigo-800 flex items-center justify-center h-8 w-8 rounded-full">
                    <span className="text-sm font-medium">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="relative flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;