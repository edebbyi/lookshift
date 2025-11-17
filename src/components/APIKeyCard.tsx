import { Key, Save } from "lucide-react";
import { useState } from "react";

export function APIKeyCard() {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (apiKey) {
      localStorage.setItem("nano_bonana_api_key", apiKey);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div 
      className="relative rounded-3xl p-6 backdrop-blur-xl"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid transparent',
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.03)), linear-gradient(135deg, rgba(56, 189, 248, 0.5), rgba(217, 70, 239, 0.5))',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
      }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-sky-400/20 to-fuchsia-500/20">
          <Key className="w-4 h-4 text-sky-400" />
        </div>
        <div className="flex-1">
          <div className="text-sm text-white/90 mb-1">Connect Nano Bonana</div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste API Key…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-sky-400/50 transition-colors"
          />
        </div>
      </div>
      <button
        onClick={handleSave}
        className="w-full py-2 rounded-xl bg-gradient-to-r from-sky-500/20 to-fuchsia-500/20 hover:from-sky-500/30 hover:to-fuchsia-500/30 transition-all duration-300 flex items-center justify-center gap-2 border border-white/10"
      >
        <Save className="w-4 h-4 text-sky-400" />
        <span className="text-sm text-white/90">{saved ? "Saved!" : "Save Key"}</span>
      </button>
      <p className="text-xs text-white/40 mt-2 text-center">
        Key is stored locally in your browser.
      </p>
    </div>
  );
}
