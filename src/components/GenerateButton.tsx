import { Sparkles, RotateCcw } from "lucide-react";

interface GenerateButtonProps {
  onClick: () => void;
  onRegenerateAll?: () => void;
  disabled?: boolean;
  hasCompletedLooks?: boolean;
  hasPendingLooks?: boolean;
}

export function GenerateButton({ 
  onClick, 
  onRegenerateAll,
  disabled, 
  hasCompletedLooks = false,
  hasPendingLooks = true,
}: GenerateButtonProps) {
  return (
    <div 
      className="rounded-3xl p-6 backdrop-blur-xl"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {hasPendingLooks && (
        <button
          onClick={onClick}
          disabled={disabled}
          className="w-full relative px-8 py-6 rounded-2xl overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mb-3"
          style={{
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.4) 0%, rgba(217, 70, 239, 0.4) 50%, rgba(251, 191, 36, 0.4) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 0 40px rgba(56, 189, 248, 0.3), 0 0 60px rgba(217, 70, 239, 0.2)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-sky-400/20 via-fuchsia-500/20 to-amber-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative flex items-center justify-center gap-3">
            <Sparkles className="w-6 h-6 text-white" />
            <span className="text-white">Generate Looks</span>
          </div>
        </button>
      )}
      
      {hasCompletedLooks && onRegenerateAll && (
        <button
          onClick={onRegenerateAll}
          disabled={disabled}
          className="w-full relative px-8 py-6 rounded-2xl overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-sky-400/10 via-fuchsia-500/10 to-amber-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative flex items-center justify-center gap-3">
            <RotateCcw className="w-5 h-5 text-white/70" />
            <span className="text-white/70">Start Over</span>
          </div>
        </button>
      )}
      
      <p className="text-sm text-white/50 mt-4 text-center">
        Nano Bonana will render each outfit on the selected size.
      </p>
    </div>
  );
}
