import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { BackgroundBlobs } from "../components/BackgroundBlobs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

interface LoginProps {
  onSwitchToSignup: () => void;
}

export function Login({ onSwitchToSignup }: LoginProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      console.error("Sign in error:", err);
      
      // Handle specific error types
      if (err.message.includes("Invalid login credentials") || err.message.includes("Invalid email or password")) {
        // Check if this is a "user doesn't exist" scenario vs "wrong password"
        // Supabase returns the same error for both security reasons, but we can provide a helpful hint
        setError(
          "Invalid email or password. If you don't have an account yet, please create one below."
        );
      } else if (err.message.includes("Email not confirmed")) {
        setError("Please confirm your email address before signing in.");
      } else if (err.message.includes("Too many requests")) {
        setError("Too many login attempts. Please wait a moment and try again.");
      } else {
        setError(err.message || "Failed to sign in. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative flex items-center justify-center px-4"
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
            Sign in to your account
          </p>
        </div>

        {/* Login Card */}
        <div
          className="rounded-3xl p-8 backdrop-blur-xl"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="Enter your password"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl text-white"
              style={{
                background: "linear-gradient(135deg, #0EA5E9 0%, #EC4899 50%, #F59E0B 100%)",
              }}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm">
              Don't have an account?{" "}
              <button
                onClick={onSwitchToSignup}
                className="text-white hover:underline"
                style={{
                  background: "linear-gradient(135deg, #0EA5E9 0%, #EC4899 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Create account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}