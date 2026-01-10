import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, X, Volume2, Check, List } from 'lucide-react';
import { supabase } from '../lib/supabase';

const LessonPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showList, setShowList] = useState(false);

  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  useEffect(() => {
    async function fetchLessonContent() {
      const { data, error } = await supabase
        .from('lesson_items')
        .select('*')
        .eq('lesson_id', id)
        .order('order_index', { ascending: true });

      if (error) { console.error(error); setLoading(false); return; }

      if (!data || data.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      // Умная сортировка
      const organized = [];
      let currentBlock = [];

      data.forEach((item) => {
        if (item.type === 'theory') {
          if (currentBlock.length > 0) {
            organized.push(...sortBlock(currentBlock));
          }
          currentBlock = [item];
        } else {
          currentBlock.push(item);
        }
      });

      if (currentBlock.length > 0) {
        organized.push(...sortBlock(currentBlock));
      }

      setItems(organized);
      setLoading(false);
    }

    function sortBlock(block) {
      const theory = block.filter(i => i.type === 'theory');
      const vocab = block.filter(i => i.type === 'vocab_card');
      const quiz = block.filter(i => i.type === 'quiz');

      for (let i = vocab.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [vocab[i], vocab[j]] = [vocab[j], vocab[i]];
      }

      return [...theory, ...vocab, ...quiz];
    }

    fetchLessonContent();
  }, [id]);

  const playAudio = (filename) => {
    if (!filename) return;
    const audio = new Audio(`/sounds/${filename}`);
    audio.play().catch(e => console.error("Audio error:", e));
  };

  const handleQuizAnswer = (option, correctAnswer, audioMap) => {
    if (selectedOption) return;
    setSelectedOption(option);
    const correct = option === correctAnswer;
    setIsCorrect(correct);

    if (correct) playAudio('correct.mp3');
    else playAudio('wrong.mp3');

    if (audioMap && audioMap[option]) {
      setTimeout(() => playAudio(audioMap[option]), 700);
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    setSelectedOption(null);
    setIsCorrect(null);

    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      alert("Lesson Complete! +10 XP");
      navigate('/map');
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center text-brand animate-pulse">Loading...</div>;
  if (items.length === 0) return <div className="h-full flex items-center justify-center text-gray-500">Empty Lesson</div>;

  const currentItem = items[currentIndex];
  const progress = ((currentIndex + 1) / items.length) * 100;

  return (
    <div className="h-full flex flex-col bg-black relative">
      {/* СЛОВАРЬ */}
      {showList && (
        <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-sm p-6 overflow-y-auto animate-fade-in">
           <div className="flex justify-between items-center mb-8 sticky top-0 bg-black/95 py-4 border-b border-gray-800">
              <h2 className="text-2xl font-bold text-white">Lesson Vocabulary</h2>
              <button onClick={() => setShowList(false)} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700">
                <X size={24} className="text-white" />
              </button>
           </div>
           <div className="space-y-4 pb-20">
             {items
               .filter(i => i.type === 'vocab_card')
               .sort((a, b) => a.order_index - b.order_index)
               .map((card, idx) => (
               <div key={idx} className="flex justify-between items-center p-4 bg-gray-900 rounded-xl border border-gray-800">
                 <div>
                   <div className="text-white font-bold text-lg">{card.data.front}</div>
                   <div className="text-gray-500 text-sm">{card.data.pronunciation}</div>
                 </div>
                 <div className="text-right">
                   <div className="text-brand font-bold text-xl">{card.data.back}</div>
                   {card.data.audio && (
                     <button onClick={() => playAudio(card.data.audio)} className="mt-2 text-gray-400 hover:text-white">
                       <Volume2 size={16} />
                     </button>
                   )}
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* ХЕДЕР */}
      <div className="p-4 flex justify-between items-center border-b border-gray-800 bg-black z-10">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white"><X size={24} /></button>
        <div className="w-full mx-4 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-brand transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
        <button onClick={() => setShowList(true)} className="text-brand hover:text-white transition-colors p-2">
          <List size={24} />
        </button>
      </div>

      {/* КОНТЕНТ */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full relative overflow-y-auto">
        {currentItem.type === 'theory' && (
          <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl w-full text-center">
             <div className="w-16 h-16 bg-brand/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen size={32} className="text-brand" />
             </div>
             <h2 className="text-2xl font-bold text-white mb-4">{currentItem.data.title}</h2>
             <p className="text-gray-300 leading-relaxed text-lg">{currentItem.data.text}</p>
          </div>
        )}

        {currentItem.type === 'vocab_card' && (
          <div
            className="w-full aspect-[3/4] cursor-pointer perspective-1000 max-h-[500px]"
            onClick={() => {
                setIsFlipped(!isFlipped);
                if (!isFlipped && currentItem.data.audio) playAudio(currentItem.data.audio);
            }}
          >
            <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
              <div className="absolute w-full h-full bg-gray-900 border border-gray-700 rounded-3xl flex flex-col items-center justify-center p-6 backface-hidden shadow-2xl">
                <span className="text-gray-400 uppercase text-sm tracking-widest mb-4">Translate</span>
                <h2 className="text-4xl font-bold text-white mb-8 text-center">{currentItem.data.front}</h2>
                <p className="text-brand text-sm animate-pulse">Tap to reveal</p>
              </div>
              <div className="absolute w-full h-full bg-gray-800 border-2 border-brand rounded-3xl flex flex-col items-center justify-center p-6 backface-hidden rotate-y-180">
                <span className="text-brand uppercase text-sm tracking-widest mb-2">Khmer</span>
                <h2 className="text-5xl font-bold text-white mb-4 text-center leading-normal">{currentItem.data.back}</h2>
                {currentItem.data.pronunciation && <p className="text-gray-400 text-xl italic mb-8">"{currentItem.data.pronunciation}"</p>}
                <button onClick={(e) => { e.stopPropagation(); playAudio(currentItem.data.audio); }} className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center">
                  <Volume2 size={24} className="text-brand" />
                </button>
              </div>
            </div>
          </div>
        )}

        {currentItem.type === 'summary' && (
           <div className="bg-gray-900 border border-brand/30 p-8 rounded-2xl w-full">
             <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-2">{currentItem.data.title}</h2>
             <ul className="space-y-3">
                {currentItem.data.items.map((line, idx) => (
                  <li key={idx} className="text-lg text-gray-300 font-mono flex items-start">
                    <span className="text-brand mr-2">•</span>{line}
                  </li>
                ))}
             </ul>
           </div>
        )}

        {currentItem.type === 'quiz' && (
           <div className="w-full max-w-sm">
              <h2 className="text-2xl font-bold text-white mb-8 text-center leading-relaxed">{currentItem.data.question}</h2>
              <div className="space-y-3">
                {currentItem.data.options.map((option, idx) => {
                  let btnColor = "bg-gray-800 border-gray-600 hover:border-gray-400 text-white";
                  if (selectedOption === option) {
                    if (option === currentItem.data.correct_answer) btnColor = "bg-green-900/50 border-green-500 text-green-400";
                    else btnColor = "bg-red-900/50 border-red-500 text-red-400";
                  }
                  if (selectedOption && option === currentItem.data.correct_answer) btnColor = "bg-green-900/50 border-green-500 text-green-400";

                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuizAnswer(option, currentItem.data.correct_answer, currentItem.data.audio_map)}
                      disabled={!!selectedOption}
                      className={`w-full p-4 rounded-xl border text-lg font-medium transition-all text-left flex justify-between items-center ${btnColor}`}
                    >
                      <span className="leading-snug">{option}</span>
                      {selectedOption === option && option === currentItem.data.correct_answer && <Check size={20} />}
                      {selectedOption === option && option !== currentItem.data.correct_answer && <X size={20} />}
                    </button>
                  );
                })}
              </div>
              {selectedOption && (
                <div className="mt-6 p-4 bg-gray-800 rounded-lg text-sm text-gray-300 border border-gray-600">
                  <span className="font-bold text-brand block mb-1">Explanation:</span>
                  {currentItem.data.explanation}
                </div>
              )}
           </div>
        )}
      </div>

      <div className="p-6 border-t border-gray-800 bg-black/90 backdrop-blur pb-8 z-10">
        <button onClick={handleNext} className="w-full bg-brand text-black font-bold py-4 rounded-xl text-lg hover:bg-white transition-all flex items-center justify-center gap-2">
          {currentIndex === items.length - 1 ? 'Finish Lesson' : 'Continue'}
          <Check size={20} />
        </button>
      </div>
    </div>
  );
};

export default LessonPlayer;