import { Upload } from "lucide-react";
import { useState } from "react";

interface UploadCardProps {
  onFilesUpload: (files: File[]) => void;
}

export function UploadCard({ onFilesUpload }: UploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    if (files.length > 0) {
      onFilesUpload(files.slice(0, 6));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 6);
      onFilesUpload(files);
    }
  };

  return (
    <div 
      className="rounded-3xl p-6 backdrop-blur-xl"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <h3 className="text-white/90 mb-4">1. Upload Looks</h3>
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 cursor-pointer ${
          isDragging 
            ? 'border-sky-400 bg-sky-400/10' 
            : 'border-white/20 hover:border-sky-400/50 hover:bg-white/5'
        }`}
        style={{
          boxShadow: isDragging ? '0 0 30px rgba(56, 189, 248, 0.3)' : 'none'
        }}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-400/20 to-fuchsia-500/20">
            <Upload className="w-8 h-8 text-sky-400" />
          </div>
          <div>
            <p className="text-white/80 mb-1">Drop files here or click to browse</p>
            <p className="text-sm text-white/40">Select 1–6 outfit photos (PNG/JPG)</p>
          </div>
        </div>
      </div>
    </div>
  );
}