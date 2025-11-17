import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { BackgroundBlobs } from "../components/BackgroundBlobs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface SignUpProps {
  onSwitchToLogin: () => void;
}

export function SignUp({ onSwitchToLogin }: SignUpProps) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyValidationStatus, setKeyValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [validationMessage, setValidationMessage] = useState("");

  const validateApiKey = async () => {
    if (!apiKey.trim()) {
      setValidationMessage("Please enter an API key");
      setKeyValidationStatus('invalid');
      return false;
    }

    setIsValidatingKey(true);
    setKeyValidationStatus('idle');
    setValidationMessage("");

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28eb400b/validate-api-key`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ apiKey: apiKey.trim() }),
        }
      );

      const data = await response.json();

      if (data.valid) {
        setKeyValidationStatus('valid');
        setValidationMessage("API key is valid!");
        return true;
      } else {
        setKeyValidationStatus('invalid');
        setValidationMessage(data.error || "Invalid API key");
        return false;
      }
    } catch (error: any) {
      console.error("API key validation error:", error);
      setKeyValidationStatus('invalid');
      setValidationMessage("Failed to validate API key. Please check your connection.");
      return false;
    } finally {
      setIsValidatingKey(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Client-side validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!apiKey.trim()) {
      setError("Please enter your Nano Bonana API key.");
      return;
    }

    // Validate API key before creating account
    const isKeyValid = await validateApiKey();
    if (!isKeyValid) {
      setError("Please enter a valid API key to continue.");
      return;
    }

    setIsLoading(true);

    try {
      await signUp(email, password, fullName, apiKey);
    } catch (err: any) {
      console.error("Sign up error:", err);
      
      // Handle specific error types
      if (err.message.includes("already registered")) {
        setError("This email is already registered. Please sign in instead.");
      } else if (err.message.includes("Invalid email")) {
        setError("Please enter a valid email address.");
      } else if (err.message.includes("Password")) {
        setError(err.message);
      } else {
        setError(err.message || "Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative flex items-center justify-center px-4 py-12"
      style={{
        background: "linear-gradient(to bottom, #0A0E1A 0%, #111827 100%)",
      }}
    >
      <BackgroundBlobs />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1
            className="text-white mb-3"
            style={{
              fontSize: "2.5rem",
              background: "linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.7) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            LookShift × Nano Bonana
          </h1>
          <p className="text-lg" style={{ color: "#CBD5E1" }}>
            Create your account
          </p>
        </div>

        {/* Signup Card */}
        <div
          className="rounded-3xl p-8 backdrop-blur-xl"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                className="rounded-xl p-4 text-sm"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#FCA5A5",
                }}
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-white/80">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Jane Doe"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Create a password"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
              <p className="text-xs text-white/40 mt-1">
                Must be at least 6 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-white/80">
                Nano Bonana API Key
              </Label>
              <Input
                id="apiKey"
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
                placeholder="Your Gemini API key"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 font-mono text-sm"
              />
              <p className="text-xs text-white/40 mt-1">
                Get your API key from{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-white/60"
                >
                  Google AI Studio
                </a>
              </p>
              {isValidatingKey && <p className="text-xs text-white/40 mt-1">Validating API key...</p>}
              {keyValidationStatus === 'valid' && <p className="text-xs text-green-500 mt-1">{validationMessage}</p>}
              {keyValidationStatus === 'invalid' && <p className="text-xs text-red-500 mt-1">{validationMessage}</p>}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl text-white"
              style={{
                background: "linear-gradient(135deg, #0EA5E9 0%, #EC4899 50%, #F59E0B 100%)",
              }}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm">
              Already have an account?{" "}
              <button
                onClick={onSwitchToLogin}
                className="text-white hover:underline"
                style={{
                  background: "linear-gradient(135deg, #0EA5E9 0%, #EC4899 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}