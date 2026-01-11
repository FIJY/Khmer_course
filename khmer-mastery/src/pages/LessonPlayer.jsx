import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { supabase } from '../supabaseClient';
import { Volume2, ArrowRight, CheckCircle, Home, BookOpen, HelpCircle } from 'lucide-react';

export default function LessonPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [step, setStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase
        .from('lesson_items')
        .select('*')
        .eq('lesson_id', id)
        .order('order_index', { ascending: true });
      if (data) setItems(data);
      setLoading(false);
    };
    fetchContent();
  }, [id]);

  const handleNext = async () => {
    if (step < items.length - 1) {
      setStep(step + 1);
    } else {
      setShowConfetti(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_progress').upsert({
          user_id: user.id, lesson_id: id, is_completed: true, updated_at: new Date()
        }, { onConflict: 'user_id, lesson_id' });
      }
      setTimeout(() => navigate('/map'), 5000);
    }
  };

  const playAudio = (file) => {
    if (!file) return;
    const audio = new Audio(`/sounds/${file}`);
    audio.play().catch(e => console.log("Audio not found, using TTS"));
  };

  if (loading) return <div className="h-screen bg-gray-900 flex items-center justify-center text-emerald-400">Loading Content...</div>;

  const current = items[step]?.data;
  const type = items[step]?.type;

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      {showConfetti && <Confetti />}

      {/* Progress Bar */}
      <div className="w-full h-1 bg-gray-800">
        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${((step + 1) / items.length) * 100}%` }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {type === 'theory' && (
          <div className="max-w-sm w-full bg-gray-800 p-8 rounded-3xl border border-emerald-500/20 shadow-2xl">
            <BookOpen className="text-emerald-400 mb-4" size={40} />
            <h2 className="text-2xl font-bold mb-4">{current.title}</h2>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{current.text}</p>
          </div>
        )}

        {type === 'vocab_card' && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <h2 className="text-6xl font-bold mb-4 text-white">{current.back}</h2>
            <p className="text-2xl text-emerald-400 mb-8 font-mono tracking-tighter">{current.pronunciation}</p>
            <p className="text-xl text-gray-500 mb-12 uppercase tracking-widest">{current.front}</p>
            <button onClick={() => playAudio(current.audio)} className="p-8 bg-gray-800 rounded-full border border-gray-700 hover:border-emerald-500 transition-all">
              <Volume2 size={40} className="text-emerald-400" />
            </button>
          </div>
        )}

        {type === 'quiz' && (
          <div className="max-w-sm w-full space-y-4">
            <div className="flex items-center gap-2 text-yellow-500 mb-4"><HelpCircle /> <span className="text-xs font-bold uppercase">Quick Quiz</span></div>
            <h2 className="text-xl font-bold mb-6">{current.question}</h2>
            {current.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => {
                  if (opt === current.correct_answer) handleNext();
                  else alert("Try again!");
                }}
                className="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl text-left hover:bg-gray-700 transition-all"
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-8">
        <button onClick={handleNext} className="w-full py-5 bg-emerald-600 rounded-2xl font-black text-xl flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition-transform">
          {step === items.length - 1 ? 'FINISH' : 'CONTINUE'} <ArrowRight />
        </button>
      </div>
    </div>
  );
}