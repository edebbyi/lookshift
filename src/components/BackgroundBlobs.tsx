export function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Blob 1 - Sky Blue */}
      <div 
        className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, transparent 70%)',
          filter: 'blur(80px)'
        }}
      />
      
      {/* Blob 2 - Fuchsia */}
      <div 
        className="absolute top-[30%] right-[-10%] w-[700px] h-[700px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(217, 70, 239, 0.4) 0%, transparent 70%)',
          filter: 'blur(90px)'
        }}
      />
      
      {/* Blob 3 - Amber */}
      <div 
        className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%)',
          filter: 'blur(70px)'
        }}
      />
    </div>
  );
}
