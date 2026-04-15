import React, { useState } from 'react';
import { Camera, X, Check } from 'lucide-react';

interface PhotoCaptureProps {
  onCapture: (url: string) => void;
  label?: string;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onCapture, label }) => {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        onCapture(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="flex items-center gap-4">
        {preview ? (
          <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <button
              onClick={() => {
                setPreview(null);
                onCapture('');
              }}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <Camera className="text-gray-400" size={24} />
            <span className="text-[10px] text-gray-400 mt-1">Foto</span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
          </label>
        )}
        {preview && (
          <div className="flex items-center text-green-600 text-sm">
            <Check size={16} className="mr-1" />
            Capturada
          </div>
        )}
      </div>
    </div>
  );
};
