/* Environment-based configuration */

// Use environment variables if available, otherwise use default values
export const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "hgxbahbjliwleeiiqfye";
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhneGJhaGJqbGl3bGVlaWlxZnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMDI5ODEsImV4cCI6MjA3ODg3ODk4MX0.xRcQyR4z5CUBAmgqNc2l78QHrRcn9afzi_Y-ZAdw3Ok";