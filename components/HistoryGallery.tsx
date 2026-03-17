'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Clock, Trash2, ExternalLink } from 'lucide-react';

export default function HistoryGallery() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const q = query(
          collection(db, 'history'),
          where('uid', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        const unsubscribeHistory = onSnapshot(q, (snapshot) => {
          const historyData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setItems(historyData);
          setLoading(false);
        }, (error) => {
          console.error('History fetch error:', error);
          setLoading(false);
        });

        return () => unsubscribeHistory();
      } else {
        setItems([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  if (loading) return null;
  if (items.length === 0) return null;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 py-12 border-t border-black/5">
      <div className="flex items-center gap-2 px-6">
        <Clock size={20} className="opacity-40" />
        <h2 className="text-lg font-bold">Recent Creations</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-6">
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative aspect-square rounded-2xl overflow-hidden bg-black/5 border border-black/5"
          >
            <img 
              src={item.modifiedImageUrl} 
              alt="History" 
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4 text-center">
              <span className="text-white text-[10px] uppercase tracking-widest font-bold">{item.hijabType}</span>
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={() => window.open(item.modifiedImageUrl, '_blank')}
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
