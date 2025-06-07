import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate environment variables
const isValidConfig = () => {
  return supabaseUrl && 
         supabaseAnonKey && 
         supabaseUrl !== 'your-supabase-url' && 
         supabaseAnonKey !== 'your-supabase-anon-key' &&
         supabaseUrl.startsWith('https://') &&
         supabaseAnonKey.length > 50; // JWT tokens are much longer than 20 characters
};

if (!isValidConfig()) {
  console.warn('⚠️ Supabase environment variables are not properly configured.');
  console.warn('Current VITE_SUPABASE_URL:', supabaseUrl);
  console.warn('Current VITE_SUPABASE_ANON_KEY length:', supabaseAnonKey.length);
  console.warn('Please ensure your .env file contains valid Supabase credentials.');
}

// Create the Supabase client
const createSupabaseClient = () => {
  if (!isValidConfig()) {
    console.warn('🔄 Using mock Supabase client due to invalid configuration');
    // Return a mock client that throws meaningful errors
    return {
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
        invoke: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured - please check your environment variables' } })
      },
      rpc: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    } as any;
  }
  
  try {
    console.log('✅ Creating real Supabase client with valid configuration');
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  } catch (error) {
    console.error('❌ Error creating Supabase client:', error);
    console.warn('🔄 Falling back to mock Supabase client');
    return {
      auth: {
        signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase client creation failed' } }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase client creation failed' } }),
        signOut: () => Promise.resolve({ error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Supabase client creation failed' } }),
        update: () => Promise.resolve({ data: null, error: { message: 'Supabase client creation failed' } }),
        delete: () => Promise.resolve({ data: null, error: { message: 'Supabase client creation failed' } }),
        eq: function() { return this; },
        single: function() { return this; },
        order: function() { return this; },
        limit: function() { return this; },
        maybeSingle: function() { return this; },
      }),
      functions: {
        invoke: () => Promise.resolve({ data: null, error: { message: 'Supabase client creation failed' } })
      },
      rpc: () => Promise.resolve({ data: null, error: { message: 'Supabase client creation failed' } }),
    } as any;
  }
};

// Create the client
const supabase = createSupabaseClient();

export default supabase;
export { supabase };