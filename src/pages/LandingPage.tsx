import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Bot, 
  BarChart3, 
  Code2, 
  CheckCircle2, 
  SearchCode, 
  MessagesSquare, 
  ArrowRight,
  Globe,
  Check,
  Zap,
  Shield,
  Star
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-b from-primary-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <Globe className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-2xl font-bold gradient-text">SEOgenix</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="button-primary"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <motion.h1 
              className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="block">Optimize your content for</span>
              <span className="block gradient-text mt-2">the AI era</span>
            </motion.h1>
            <motion.p 
              className="mt-6 max-w-md mx-auto text-base text-gray-600 sm:text-lg md:mt-8 md:text-xl md:max-w-3xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Get found by ChatGPT, Perplexity, Siri, and other AI tools. Improve your visibility in the age of AI with comprehensive audits and optimization tools.
            </motion.p>
            <motion.div 
              className="mt-8 max-w-md mx-auto sm:flex sm:justify-center md:mt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="rounded-md shadow">
                <Link
                  to="/register"
                  className="w-full flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-white bg-gradient-to-r from-primary-600 to-secondary-600 hover:opacity-90 transition-opacity md:py-4 md:text-lg md:px-10"
                >
                  Get started
                </Link>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors md:py-4 md:text-lg md:px-10"
                >
                  Log in
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-primary-600 tracking-wide uppercase">How It Works</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Boost your AI visibility in three steps
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <motion.div 
                className="card card-hover p-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="h-12 w-12 rounded-md bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                  <SearchCode size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">1. Analyze</h3>
                <p className="text-gray-500">
                  Add your website and get a comprehensive AI visibility audit, including schema analysis and entity coverage.
                </p>
              </motion.div>

              <motion.div 
                className="card card-hover p-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="h-12 w-12 rounded-md bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                  <Code2 size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">2. Optimize</h3>
                <p className="text-gray-500">
                  Implement our AI-friendly recommendations, from schema markup to content structure improvements.
                </p>
              </motion.div>

              <motion.div 
                className="card card-hover p-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <div className="h-12 w-12 rounded-md bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                  <BarChart3 size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">3. Monitor</h3>
                <p className="text-gray-500">
                  Track your progress with real-time citation monitoring and AI visibility scores.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-primary-600 tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Everything you need for AI visibility
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Comprehensive tools to analyze, optimize, and track your content's performance with AI systems.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: <BarChart3 size={24} />,
                  title: "AI Visibility Audit",
                  description: "Comprehensive analysis of how well your content performs with AI systems, with actionable recommendations."
                },
                {
                  icon: <Code2 size={24} />,
                  title: "Schema Generator",
                  description: "Create structured data markup that helps AI systems understand your content more effectively."
                },
                {
                  icon: <CheckCircle2 size={24} />,
                  title: "Citation Tracking",
                  description: "Monitor when and where AI systems cite your content, with alerts for new mentions."
                },
                {
                  icon: <Bot size={24} />,
                  title: "Voice Assistant Tester",
                  description: "Test how voice assistants like Siri and Alexa respond to queries about your content."
                },
                {
                  icon: <SearchCode size={24} />,
                  title: "Entity Coverage Analysis",
                  description: "Identify key entities in your content and ensure comprehensive coverage for AI understanding."
                },
                {
                  icon: <MessagesSquare size={24} />,
                  title: "AI Content Generator",
                  description: "Create AI-optimized content snippets, FAQs, and meta descriptions tailored for AI visibility."
                }
              ].map((feature, index) => (
                <motion.div 
                  key={index}
                  className="card card-hover p-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="h-12 w-12 rounded-md bg-primary-100 text-primary-600 flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-base text-gray-500">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-primary-600 tracking-wide uppercase">Pricing</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Choose the right plan for your needs
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Basic Plan */}
            <motion.div 
              className="card p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-medium text-gray-900">Basic</h3>
              <p className="mt-4 text-sm text-gray-500">Perfect for small websites and blogs</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900">$29</span>
                <span className="text-base font-medium text-gray-500">/month</span>
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "1 website",
                  "Monthly AI visibility audit",
                  "Basic schema generation",
                  "Citation alerts",
                  "Email support"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-primary-600 mr-2" />
                    <span className="text-gray-500">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link to="/register" className="button-primary w-full text-center">
                  Get started
                </Link>
              </div>
            </motion.div>

            {/* Pro Plan */}
            <motion.div 
              className="card p-8 relative border-2 border-primary-600"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="absolute top-0 right-0 -translate-y-1/2 px-4 py-1 bg-primary-600 text-white rounded-full text-sm font-medium">
                Most Popular
              </div>
              <h3 className="text-lg font-medium text-gray-900">Pro</h3>
              <p className="mt-4 text-sm text-gray-500">For growing businesses and content teams</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900">$79</span>
                <span className="text-base font-medium text-gray-500">/month</span>
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "3 websites",
                  "Weekly AI visibility audits",
                  "Advanced schema generation",
                  "Real-time citation tracking",
                  "AI content suggestions",
                  "Voice assistant testing",
                  "Priority support"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-primary-600 mr-2" />
                    <span className="text-gray-500">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link to="/register" className="button-primary w-full text-center">
                  Get started
                </Link>
              </div>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div 
              className="card p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-medium text-gray-900">Enterprise</h3>
              <p className="mt-4 text-sm text-gray-500">For large organizations and agencies</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900">$199</span>
                <span className="text-base font-medium text-gray-500">/month</span>
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Unlimited websites",
                  "Daily AI visibility audits",
                  "Custom schema templates",
                  "Advanced entity analysis",
                  "API access",
                  "White-label reports",
                  "Dedicated success manager"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-primary-600 mr-2" />
                    <span className="text-gray-500">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link to="/register" className="button-primary w-full text-center">
                  Contact sales
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-primary-600 tracking-wide uppercase">FAQ</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Frequently asked questions
            </p>
          </div>

          <div className="mt-16 max-w-3xl mx-auto">
            {[
              {
                question: "What is AI visibility?",
                answer: "AI visibility refers to how well AI systems like ChatGPT, Perplexity, and voice assistants can understand, process, and cite your content. Good AI visibility means your content is more likely to be referenced in AI-generated responses."
              },
              {
                question: "How is this different from traditional SEO?",
                answer: "While traditional SEO focuses on search engine rankings, AI visibility optimization ensures your content is properly understood and cited by AI systems. This includes structured data implementation, entity coverage, and semantic clarity that goes beyond traditional SEO practices."
              },
              {
                question: "How often should I run an AI visibility audit?",
                answer: "We recommend running a full audit at least monthly, with more frequent checks for high-traffic sites or after significant content updates. Our Pro and Enterprise plans include automated weekly and daily audits respectively."
              },
              {
                question: "Can I track when AI systems cite my content?",
                answer: "Yes! Our citation tracking feature monitors when your content is referenced by AI systems, including featured snippets, AI chat responses, and voice assistant answers. You'll receive alerts when new citations are detected."
              },
              {
                question: "Do you offer custom solutions for agencies?",
                answer: "Yes, our Enterprise plan includes white-label reporting, API access, and custom schema templates perfect for agencies. Contact our sales team to discuss your specific needs."
              }
            ].map((faq, index) => (
              <motion.div 
                key={index}
                className="card card-hover p-6 mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <h3 className="text-lg font-medium text-gray-900">{faq.question}</h3>
                <p className="mt-2 text-gray-500">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-secondary-600 opacity-90"></div>
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 relative z-10">
          <div className="lg:flex lg:items-center lg:justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              <span className="block">Ready to boost your AI visibility?</span>
              <span className="block text-primary-200">Get started with SEOgenix today.</span>
            </h2>
            <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
              <div className="inline-flex rounded-md shadow">
                <Link
                  to="/register"
                  className="button-secondary"
                >
                  Get started
                  <ArrowRight className="ml-2 -mr-1 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:justify-start">
              <div className="flex items-center">
                <Globe className="h-6 w-6 text-primary-600" />
                <span className="ml-2 text-xl font-bold gradient-text">SEOgenix</span>
              </div>
            </div>
            <div className="mt-8 md:mt-0">
              <p className="text-center text-base text-gray-500">
                &copy; 2025 SEOgenix. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;