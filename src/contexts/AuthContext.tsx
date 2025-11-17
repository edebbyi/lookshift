import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../utils/supabase/client";

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, apiKey: string) => Promise<void>;
  signOut: () => Promise<void>;
  getApiKey: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Session check error:", error);
        setLoading(false);
        return;
      }

      if (session) {
        // Fetch user settings from database
        const { data: settings, error: settingsError } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (settingsError) {
          console.error("Error fetching user settings:", settingsError);
        }

        setAccessToken(session.access_token);
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          fullName: settings?.full_name || session.user.user_metadata?.full_name || "",
        });
      }
    } catch (error) {
      console.error("Error checking session:", error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Supabase sign in error:", error);
        throw error;
      }

      if (data.session) {
        // Fetch user settings from database
        const { data: settings, error: settingsError } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", data.user.id)
          .single();

        if (settingsError) {
          console.error("Error fetching user settings:", settingsError);
        }

        setAccessToken(data.session.access_token);
        setUser({
          id: data.user.id,
          email: data.user.email || "",
          fullName: settings?.full_name || data.user.user_metadata?.full_name || "",
        });
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      throw new Error(error.message || "Failed to sign in");
    }
  };

  const signUp = async (email: string, password: string, fullName: string, apiKey: string) => {
    try {
      // Step 1: Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user data returned");

      // Step 2: Create user_settings row with full_name and API key
      const { error: settingsError } = await supabase
        .from("user_settings")
        .insert({
          user_id: authData.user.id,
          full_name: fullName,
          nano_bonana_api_key: apiKey,
        });

      if (settingsError) {
        console.error("Error creating user settings:", settingsError);
        throw new Error("Failed to save user settings");
      }

      // Step 3: Sign in the user automatically
      await signIn(email, password);
    } catch (error: any) {
      console.error("Sign up error:", error);
      throw new Error(error.message || "Failed to sign up");
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setAccessToken(null);
    } catch (error: any) {
      console.error("Sign out error:", error);
      throw new Error(error.message || "Failed to sign out");
    }
  };

  const getApiKey = async (): Promise<string | null> => {
    if (!user) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("nano_bonana_api_key")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching API key:", error);
        return null;
      }

      return data?.nano_bonana_api_key || null;
    } catch (error: any) {
      console.error("Error fetching API key:", error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        signIn,
        signUp,
        signOut,
        getApiKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}