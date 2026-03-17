'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import SmartUploader from '@/components/SmartUploader';
import HijabControls, { HijabType } from '@/components/HijabControls';
import PreviewCanvas from '@/components/PreviewCanvas';
import HistoryGallery from '@/components/HistoryGallery';
import { GoogleGenAI } from "@google/genai";
import { auth, db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, AlertCircle, Key } from 'lucide-react';

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [modifiedImage, setModifiedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hijabType, setHijabType] = useState<HijabType>('pashmina');
  const [hijabColor, setHijabColor] = useState('#000000');
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
      if (typeof window !== 'undefined' && window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkApiKey();
  }, []);

  const handleOpenKeyDialog = async () => {
    if (typeof window !== 'undefined' && window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleUpload = (file: File, preview: string) => {
    setOriginalImage(preview);
    setModifiedImage(null);
    setError(null);
  };

  const handleClear = () => {
    setOriginalImage(null);
    setModifiedImage(null);
    setError(null);
  };

  const processImage = async () => {
    if (!originalImage) return;
    if (!hasApiKey) {
      setError("Please select a Gemini API key first.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      // Extract base64 from data URL
      const base64Data = originalImage.split(',')[1];
      const mimeType = originalImage.split(';')[0].split(':')[1];

      const prompt = `Analyze this image and determine its artistic style (realistic, 2d, or 3d). 
      Then, modify the image by adding a ${hijabType} style hijab in ${hijabColor} color. 
      Ensure the hijab looks organic and matches the lighting, texture, and artistic style you detected. 
      The person's face and identity must remain exactly the same. Replace the hair and neck area with the hijab.
      Return the detected style in your response text, and the modified image in the image part.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      });

      let newImageUrl = null;
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            newImageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (newImageUrl) {
        setModifiedImage(newImageUrl);

        const textResponse = response.text?.toLowerCase() || '';

        // Save to history if user is logged in
        if (auth.currentUser) {
          await addDoc(collection(db, 'history'), {
            uid: auth.currentUser.uid,
            originalImageUrl: originalImage,
            modifiedImageUrl: newImageUrl,
            hijabType,
            hijabColor,
            style: textResponse.includes('2d') || textResponse.includes('cartoon') ? '2d' : (textResponse.includes('3d') || textResponse.includes('render') ? '3d' : 'realistic'),
            createdAt: serverTimestamp(),
          });
        }
      } else {
        throw new Error("No image returned from AI. The model might have filtered the request.");
      }
    } catch (err: any) {
      console.error("Processing error:", err);
      setError(err.message || "Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-black font-sans selection:bg-black selection:text-white pb-24">
      <Navbar />

      <div className="pt-32 px-6 max-w-6xl mx-auto space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black/5 rounded-full"
          >
            <Sparkles size={14} className="text-black/60" />
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">Powered by Gemini 3.1 Flash Image</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-7xl font-bold tracking-tighter leading-[0.9]"
          >
            Style with <br /> <span className="italic font-serif">Elegance.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-black/40 max-w-xl mx-auto"
          >
            Transform any character or photo with organic AI-generated hijab styles. 
            Maintaining identity, style, and grace.
          </motion.p>
        </section>

        {/* API Key Warning */}
        {!hasApiKey && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto p-6 bg-amber-50 border border-amber-200 rounded-3xl flex flex-col sm:flex-row items-center gap-6 text-amber-900"
          >
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Key size={24} />
            </div>
            <div className="flex-1 space-y-1 text-center sm:text-left">
              <p className="font-bold">API Key Required</p>
              <p className="text-sm opacity-80">To use the high-quality image generation model, you need to select your own Google Cloud API key.</p>
            </div>
            <button
              onClick={handleOpenKeyDialog}
              className="bg-amber-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-amber-800 transition-colors shrink-0"
            >
              Select Key
            </button>
          </motion.div>
        )}

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-2xl mx-auto"
            >
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                <AlertCircle size={18} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Interface */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-8">
            <SmartUploader onUpload={handleUpload} onClear={handleClear} />
            
            {originalImage && !modifiedImage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <HijabControls 
                  onTypeChange={setHijabType}
                  onColorChange={setHijabColor}
                  onProcess={processImage}
                  isProcessing={isProcessing}
                />
              </motion.div>
            )}
          </div>

          <div className="space-y-8">
            <PreviewCanvas original={originalImage || ''} modified={modifiedImage} />
            
            {modifiedImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <button 
                  onClick={() => {
                    setModifiedImage(null);
                    setError(null);
                  }}
                  className="text-sm font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                >
                  Start New Style
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* History Section */}
        <HistoryGallery />
      </div>

      {/* Footer */}
      <footer className="mt-24 pt-12 border-t border-black/5 text-center px-6">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs italic">H</span>
          </div>
          <span className="font-bold tracking-tight">hajaba</span>
        </div>
        <p className="text-xs text-black/30 uppercase tracking-[0.2em]">© 2026 AI Styling Studio. All rights reserved.</p>
      </footer>
    </main>
  );
}
