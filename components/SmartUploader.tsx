'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SmartUploaderProps {
  onUpload: (file: File, preview: string) => void;
  onClear: () => void;
}

export default function SmartUploader({ onUpload, onClear }: SmartUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setPreview(result);
        onUpload(file, result);
      };
      reader.readAsDataURL(file);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  });

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onClear();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="uploader"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full"
          >
            <div
              {...getRootProps()}
              className={`
                relative cursor-pointer group
                border-2 border-dashed rounded-3xl p-12
                flex flex-col items-center justify-center gap-4
                transition-all duration-300
                ${isDragActive ? 'border-black bg-black/5' : 'border-black/10 hover:border-black/30 bg-white'}
              `}
            >
              <input {...getInputProps()} />
              <div className="w-16 h-16 rounded-2xl bg-black/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="text-black/40 group-hover:text-black transition-colors" />
              </div>
              <div className="text-center">
                <p className="font-medium text-lg">Drop your photo here</p>
                <p className="text-sm text-black/40">JPG, PNG, WEBP supported</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-3xl overflow-hidden bg-black/5 aspect-square sm:aspect-video flex items-center justify-center group"
          >
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-contain"
            />
            <button
              onClick={handleClear}
              className="absolute top-4 right-4 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all opacity-0 group-hover:opacity-100"
            >
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
