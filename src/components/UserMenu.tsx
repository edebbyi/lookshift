import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../utils/supabase/client";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { LogOut, Settings, User } from "lucide-react";
import { toast } from "sonner@2.0.3";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const validateApiKey = async (apiKey: string): Promise<boolean> => {
    setIsValidating(true);
    setValidationStatus('idle');

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
        setValidationStatus('valid');
        return true;
      } else {
        setValidationStatus('invalid');
        toast.error("Invalid API Key", {
          description: data.error || "Please check your API key and try again.",
        });
        return false;
      }
    } catch (error: any) {
      console.error("API key validation error:", error);
      setValidationStatus('invalid');
      toast.error("Validation Failed", {
        description: "Failed to validate API key. Please check your connection.",
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleUpdateApiKey = async () => {
    if (!user || !newApiKey.trim()) {
      toast.error("Please enter a valid API key");
      return;
    }

    // Validate API key before updating
    const isValid = await validateApiKey(newApiKey);
    if (!isValid) {
      return;
    }

    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from("user_settings")
        .update({ nano_bonana_api_key: newApiKey.trim() })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("API key updated successfully!");
      setShowSettings(false);
      setNewApiKey("");
      setValidationStatus('idle');
    } catch (error: any) {
      console.error("Error updating API key:", error);
      toast.error("Failed to update API key", {
        description: error.message,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <div
          className="px-6 py-3 rounded-2xl backdrop-blur-xl"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <p className="text-white/60 text-sm">Welcome,</p>
          <p className="text-white">{user?.fullName}</p>
        </div>

        <Button
          onClick={() => setShowSettings(true)}
          variant="ghost"
          className="text-white/60 hover:text-white hover:bg-white/5"
          size="icon"
        >
          <Settings className="w-4 h-4" />
        </Button>

        <Button
          onClick={handleSignOut}
          variant="ghost"
          className="text-white/60 hover:text-white hover:bg-white/5"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent
          className="backdrop-blur-xl border-white/10"
          style={{
            background: "rgba(17, 24, 39, 0.95)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Account Settings
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Update your account information and API key
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-white/80">Full Name</Label>
              <Input
                value={user?.fullName || ""}
                disabled
                className="bg-white/5 border-white/10 text-white/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/80">Email</Label>
              <Input
                value={user?.email || ""}
                disabled
                className="bg-white/5 border-white/10 text-white/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-white/80">
                Update Nano Bonana API Key
              </Label>
              <Input
                id="apiKey"
                type="text"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="Enter new API key"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 font-mono text-sm"
              />
              <p className="text-xs text-white/40">
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
            </div>

            <Button
              onClick={handleUpdateApiKey}
              disabled={isUpdating || !newApiKey.trim() || isValidating || validationStatus === 'invalid'}
              className="w-full h-11 rounded-xl text-white"
              style={{
                background: "linear-gradient(135deg, #0EA5E9 0%, #EC4899 50%, #F59E0B 100%)",
              }}
            >
              {isUpdating ? "Updating..." : "Update API Key"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}