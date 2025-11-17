import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Download, X } from "lucide-react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden@1.1.1";

interface ExpandedLookDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lookNumber: number;
  bodyType: string;
  originalImage?: string;
  generatedImage?: string;
  onDownload: () => void;
}

export function ExpandedLookDialog({
  isOpen,
  onClose,
  lookNumber,
  bodyType,
  originalImage,
  generatedImage,
  onDownload,
}: ExpandedLookDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-6xl p-0 border-0 bg-transparent"
        style={{
          background: 'rgba(10, 14, 26, 0.95)',
          backdropFilter: 'blur(40px)',
        }}
      >
        <VisuallyHidden.Root>
          <DialogTitle>Look #{lookNumber} Preview</DialogTitle>
          <DialogDescription>
            View and download the original and generated images for Look #{lookNumber} with {bodyType} size
          </DialogDescription>
        </VisuallyHidden.Root>
        
        <div 
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-white text-2xl mb-1">Look #{lookNumber}</h2>
              <span 
                className="inline-block px-3 py-1 rounded-full text-xs uppercase tracking-wider"
                style={{
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.3) 0%, rgba(217, 70, 239, 0.3) 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: 'rgba(56, 189, 248, 1)'
                }}
              >
                Size: {bodyType}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {generatedImage && (
                <button
                  onClick={onDownload}
                  className="px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%)',
                    border: '1px solid rgba(56, 189, 248, 0.5)',
                  }}
                >
                  <Download className="w-4 h-4 text-sky-400" />
                  <span className="text-white text-sm">Download Generated</span>
                </button>
              )}
              
              <button
                onClick={onClose}
                className="p-2 rounded-xl transition-all duration-300"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid grid-cols-2 gap-8">
              {/* Original Image */}
              <div className="space-y-3">
                <p className="text-sm text-white/50 uppercase tracking-wider">Original</p>
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
                      <span className="text-white/30">No image</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Generated Image */}
              <div className="space-y-3">
                <p className="text-sm text-white/50 uppercase tracking-wider">Generated</p>
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
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                      <span className="text-white/30 text-center px-4">
                        Generate to see preview
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
