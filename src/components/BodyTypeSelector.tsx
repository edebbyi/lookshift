interface BodyTypeSelectorProps {
  selected: string;
  onSelect: (type: string) => void;
}

export function BodyTypeSelector({ selected, onSelect }: BodyTypeSelectorProps) {
  const bodyTypes = [
    { id: 'xs', label: 'Extra Small (XS)' },
    { id: 'm', label: 'Medium (M)' },
    { id: 'xl', label: 'Extra Large (XL)' },
  ];

  return (
    <div 
      className="rounded-3xl p-6 backdrop-blur-xl"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <h3 className="text-white/90 mb-4">2. Choose Size</h3>
      
      <div className="flex flex-col gap-3">
        {bodyTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onSelect(type.id)}
            className={`relative px-6 py-4 rounded-2xl transition-all duration-300 ${
              selected === type.id
                ? 'text-white'
                : 'text-white/60 hover:text-white/80'
            }`}
            style={{
              background: selected === type.id 
                ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%)'
                : 'rgba(255, 255, 255, 0.05)',
              border: selected === type.id
                ? '1px solid rgba(56, 189, 248, 0.5)'
                : '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: selected === type.id 
                ? '0 0 30px rgba(56, 189, 248, 0.3), inset 0 0 20px rgba(168, 85, 247, 0.2)'
                : 'none'
            }}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
}
