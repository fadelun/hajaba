'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import SmartUploader from '@/components/SmartUploader';
import HijabControls, { HijabType } from '@/components/HijabControls';
import PreviewCanvas from '@/components/PreviewCanvas';
import HistoryGallery from '@/components/HistoryGallery';
import { GoogleGenAI } from "@google/genai";
import { auth, db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, AlertCircle } from 'lucide-react';

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [modifiedImage, setModifiedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hijabType, setHijabType] = useState<HijabType>('pashmina');
  const [hijabColor, setHijabColor] = useState('#000000');
  const [error, setError] = useState<string | null>(null);


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

  const buildHijabPrompt = (type: HijabType, color: string): string => {
    const colorName = color === '#000000' ? 'black'
      : color === '#FFFFFF' ? 'white'
        : color === '#8B4513' ? 'brown'
          : color === '#D2B48C' ? 'light tan/beige'
            : color === '#708090' ? 'slate gray'
              : color === '#4B0082' ? 'dark purple/indigo'
                : color === '#DC143C' ? 'deep crimson red'
                  : color === '#2F4F4F' ? 'dark teal/forest green'
                    : `the color ${color}`;

    const styleDescriptions: Record<HijabType, string> = {
      pashmina: 'a pashmina-style hijab draped loosely and elegantly over the head and shoulders, with soft flowing folds',
      segiempat: 'a square hijab (segiempat) neatly folded and pinned under the chin, covering the hair and neck cleanly',
      syari: 'a syar\'i hijab that covers the chest fully with a longer, modest drape that extends below the shoulders',
      turban: 'a turban-style hijab twisted and wrapped around the head in a stylish modern fashion',
    };

    return `You are an image editor. Your task is to modify the provided image by adding a hijab to the person.

INSTRUCTIONS:
1. Add ${styleDescriptions[type]} in ${colorName} color.
2. The hijab must completely cover all hair and the neck area of the person.
3. The person's face, skin tone, facial features, expression, and identity MUST remain exactly unchanged.
4. The hijab must seamlessly match the image's lighting, shadows, and artistic style (whether photorealistic, 2D cartoon, 3D render, or anime).
5. Preserve the original composition, background, clothing, and body posture exactly.
6. The result must look natural and organic — not like a cutout or sticker pasted on top.
7. Output ONLY the edited image with no text commentary.

Apply the hijab now and return the modified image.`;
  };

  const processImage = async () => {
    if (!originalImage) return;
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      setError("Gemini API key belum dikonfigurasi. Tambahkan NEXT_PUBLIC_GEMINI_API_KEY di file .env.local");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

      // Extract base64 from data URL
      const base64Data = originalImage.split(',')[1];
      const mimeType = originalImage.split(';')[0].split(':')[1] as 'image/jpeg' | 'image/png' | 'image/webp';

      const prompt = buildHijabPrompt(hijabType, hijabColor);

      // Use chat mode for image editing (most reliable approach)
      const chat = ai.chats.create({ model: 'gemini-2.5-flash-image' });

      const response = await chat.sendMessage({
        message: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt },
        ],
      });

      let newImageUrl: string | null = null;
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            const outputMime = part.inlineData.mimeType || 'image/png';
            newImageUrl = `data:${outputMime};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (newImageUrl) {
        setModifiedImage(newImageUrl);

        // Save to history if user is logged in
        if (auth.currentUser) {
          await addDoc(collection(db, 'history'), {
            uid: auth.currentUser.uid,
            originalImageUrl: originalImage,
            modifiedImageUrl: newImageUrl,
            hijabType,
            hijabColor,
            createdAt: serverTimestamp(),
          });
        }
      } else {
        // Try to see if there's a text block explaining why
        const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);
        if (textPart?.text) {
          throw new Error(`AI tidak dapat memproses gambar: ${textPart.text}`);
        }
        throw new Error("AI tidak mengembalikan gambar. Coba dengan foto yang berbeda atau model mungkin memfilter konten.");
      }
    } catch (err: any) {
      console.error("Processing error:", err);
      // Translate common API errors to Indonesian
      const msg: string = err.message || '';
      if (msg.includes('API key') || msg.includes('API_KEY')) {
        setError("API key tidak valid. Pastikan NEXT_PUBLIC_GEMINI_API_KEY sudah benar di .env.local");
      } else if (msg.includes('quota') || msg.includes('QUOTA')) {
        setError("Kuota API habis. Coba lagi nanti atau gunakan API key lain.");
      } else if (msg.includes('SAFETY') || msg.includes('safety')) {
        setError("Gambar diblokir oleh filter keamanan AI. Coba dengan foto yang berbeda.");
      } else if (msg.includes('model') || msg.includes('MODEL')) {
        setError("Model AI tidak tersedia. Pastikan API key kamu memiliki akses ke Gemini image model.");
      } else {
        setError(msg || "Gagal memproses gambar. Silakan coba lagi.");
      }
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
