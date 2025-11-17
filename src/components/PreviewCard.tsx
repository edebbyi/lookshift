import { ImageWithFallback } from "./figma/ImageWithFallback";
import { X, Maximize2, Download, RotateCcw } from "lucide-react";

interface PreviewCardProps {
  lookNumber: number;
  bodyType: string;
  originalImage?: string;
  generatedImage?: string;
  isGenerating?: boolean;
  status?: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  onDelete?: () => void;
  onExpand?: () => void;
  onDownload?: () => void;
  onRegenerate?: () => void;
}

export function PreviewCard({ 
  lookNumber, 
  bodyType, 
  originalImage, 
  generatedImage,
  isGenerating,
  status,
  errorMessage,
  onDelete,
  onExpand,
  onDownload,
  onRegenerate
}: PreviewCardProps) {
  return (
    <div 
      className="rounded-3xl p-6 backdrop-blur-xl relative group"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Action Buttons */}
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
        {onExpand && (
          <button
            onClick={onExpand}
            className="p-2 rounded-xl transition-all duration-300 hover:scale-110"
            style={{
              background: 'rgba(56, 189, 248, 0.6)',
              border: '1px solid rgba(56, 189, 248, 0.8)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)',
            }}
            aria-label="Expand look"
          >
            <Maximize2 className="w-4 h-4 text-white" />
          </button>
        )}
        
        {onDownload && generatedImage && (
          <button
            onClick={onDownload}
            className="p-2 rounded-xl transition-all duration-300 hover:scale-110"
            style={{
              background: 'rgba(168, 85, 247, 0.6)',
              border: '1px solid rgba(168, 85, 247, 0.8)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
            }}
            aria-label="Download generated image"
          >
            <Download className="w-4 h-4 text-white" />
          </button>
        )}

        {onRegenerate && (status === 'completed' || status === 'error') && !isGenerating && (
          <button
            onClick={onRegenerate}
            className="p-2 rounded-xl transition-all duration-300 hover:scale-110"
            style={{
              background: 'rgba(251, 191, 36, 0.6)',
              border: '1px solid rgba(251, 191, 36, 0.8)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)',
            }}
            aria-label="Regenerate this look"
          >
            <RotateCcw className="w-4 h-4 text-white" />
          </button>
        )}
        
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-2 rounded-xl transition-all duration-300 hover:scale-110"
            style={{
              background: 'rgba(239, 68, 68, 0.6)',
              border: '1px solid rgba(239, 68, 68, 0.8)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
            }}
            aria-label="Delete look"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white/90">Look #{lookNumber}</h4>
        <span 
          className="px-3 py-1 rounded-full text-xs uppercase tracking-wider"
          style={{
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.3) 0%, rgba(217, 70, 239, 0.3) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: 'rgba(56, 189, 248, 1)'
          }}
        >
          Size: {bodyType}
        </span>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Original Image */}
        <div className="space-y-2">
          <p className="text-xs text-white/50 uppercase tracking-wider">Original</p>
          <div 
            className="relative aspect-[4/5] rounded-2xl overflow-hidden"
            style={{
              border: '1px solid rgba(56, 189, 248, 0.3)',
              boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.5)',
            }}
          >
            {originalImage ? (
              <ImageWithFallback
                src={originalImage}
                alt={`Look ${lookNumber} original`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/5">
                <span className="text-white/30 text-sm">No image</span>
              </div>
            )}
          </div>
        </div>

        {/* Generated Image */}
        <div className="space-y-2">
          <p className="text-xs text-white/50 uppercase tracking-wider">Generated</p>
          <div 
            className="relative aspect-[4/5] rounded-2xl overflow-hidden"
            style={{
              border: generatedImage ? '1px solid rgba(217, 70, 239, 0.3)' : '1px dashed rgba(255, 255, 255, 0.2)',
              boxShadow: generatedImage ? 'inset 0 0 20px rgba(0, 0, 0, 0.5)' : 'none',
            }}
          >
            {generatedImage ? (
              <ImageWithFallback
                src={generatedImage}
                alt={`Look ${lookNumber} generated`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 p-3">
                {status === 'processing' ? (
                  <>
                    <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mb-2" />
                    <span className="text-white/40 text-xs text-center">
                      {errorMessage || 'Generating...'}
                    </span>
                  </>
                ) : status === 'error' ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center mb-2">
                      <X className="w-4 h-4 text-red-400" />
                    </div>
                    <span className="text-red-400 text-xs text-center leading-tight">
                      {errorMessage || 'Generation failed'}
                    </span>
                  </>
                ) : (
                  <span className="text-white/30 text-sm text-center px-4">
                    Waiting for generation…
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
