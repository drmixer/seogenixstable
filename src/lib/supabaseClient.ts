import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Enhanced validation for environment variables
const isValidConfig = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    return false;
  }
  
  // Check for placeholder values
  if (supabaseUrl.includes('your-') || supabaseUrl.includes('YOUR_') || 
      supabaseAnonKey.includes('your-') || supabaseAnonKey.includes('YOUR_')) {
    console.error('❌ Supabase environment variables contain placeholder values');
    return false;
  }
  
  // Validate URL format
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    console.error('❌ Invalid Supabase URL format');
    return false;
  }
  
  // Validate key length (Supabase anon keys are typically 100+ characters)
  if (supabaseAnonKey.length < 50) {
    console.error('❌ Supabase anon key appears to be too short');
    return false;
  }
  
  return true;
};

// Create a mock client factory function for development
const createMockClient = () => ({
  auth: {
    signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    signOut: () => Promise.resolve({ error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    update: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    delete: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    eq: function() { return this; },
    single: function() { return this; },
    order: function() { return this; },
    limit: function() { return this; },
    maybeSingle: function() { return this; },
  }),
  functions: {
    invoke: () => Promise.resolve({ 
      data: null, 
      error: { message: 'Supabase Edge Functions not available - please check your configuration' } 
    })
  },
  rpc: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
} as any);

// Create Supabase client with enhanced error handling
const createSupabaseClient = () => {
  if (!isValidConfig()) {
    console.warn('🔄 Using mock Supabase client due to invalid configuration');
    console.warn('Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set correctly');
    return createMockClient();
  }
  
  try {
    console.log('✅ Creating Supabase client with valid configuration');
    console.log(`🌐 Supabase URL: ${supabaseUrl}`);
    console.log(`🔑 Anon Key length: ${supabaseAnonKey.length} characters`);
    
    const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    
    // Test the connection
    client.from('sites').select('id').limit(1).then(({ error }) => {
      if (error) {
        console.warn('⚠️ Supabase connection test failed:', error.message);
      } else {
        console.log('✅ Supabase connection test successful');
      }
    }).catch((err) => {
      console.warn('⚠️ Supabase connection test error:', err);
    });
    
    return client;
  } catch (error) {
    console.error('❌ Error creating Supabase client:', error);
    console.warn('🔄 Falling back to mock Supabase client');
    return createMockClient();
  }
};

// Ensure supabase is always defined with a fallback
const supabase = createSupabaseClient() || createMockClient();

export default supabase;
export { supabase };