import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Volume2, ArrowRight, CheckCircle2, AlertCircle,
  Settings, Ear, Eye, BrainCircuit, Shuffle
} from 'lucide-react';
import MobileLayout from '../components/Layout/MobileLayout';
import Button from '../components/UI/Button';
import useReviewSession from '../hooks/useReviewSession';

export default function ReviewPlayer() {
  const navigate = useNavigate();
  const {
    loading,
    sessionData,
    currentIndex,
    selectedOption,
    isFinished,
    showSettings,
    settings,
    setSettings,
    setShowSettings,
    playAudio,
    handleAnswer,
    nextCard,
    getCardMode
  } = useReviewSession();

    return (
      <MobileLayout withNav={false} className="justify-center items-center text-center p-6">
        <CheckCircle2 size={64} className="text-emerald-500 mb-6 mx-auto" />
        <h1 className="text-3xl font-black text-white italic uppercase mb-2">{emptyTitle}</h1>
        <p className="text-gray-400 text-xs">{emptyBody}</p>
        <Button onClick={() => navigate('/review')} className="mt-8">Back to Hub</Button>
      </MobileLayout>
    );
  }

  if (isFinished) {
    return (
      <MobileLayout withNav={false} className="justify-center items-center text-center p-6">
        <CheckCircle2 size={64} className="text-emerald-500 mb-6 mx-auto" />
        <h1 className="text-3xl font-black text-white italic uppercase mb-2">Session Complete!</h1>
        <Button onClick={() => navigate('/review')} className="mt-8">Back to Hub</Button>
      </MobileLayout>
    );
  }

  const currentItem = sessionData[currentIndex];
  const target = currentItem.target;
  const activeMode = getCardMode();

  let questionMain = "";
  let questionSub = "";
  let showBigAudioBtn = false;

  let renderOptionContent = (opt) => {
    const eng = opt.english || opt.front || "???";
    const khm = opt.back || opt.khmer || "???";
    const pron = opt.pronunciation || "";

    if (activeMode === 'recall') {
      return (
        <div className="flex flex-col items-start">
          <span className="text-lg font-bold">{khm}</span>
          {settings.showPhonetics && pron && (
            <span className="text-xs text-gray-400 font-mono opacity-80">/{pron}/</span>
          )}
        </div>
      );
    }
    return <span className="text-sm font-bold">{eng}</span>;
  };

  if (activeMode === 'read') {
     questionMain = target.back || target.khmer;
     questionSub = "How do you read this?";
     showBigAudioBtn = true;
  } else if (activeMode === 'recall') {
     questionMain = target.front || target.english;
     questionSub = "Select the Khmer translation";
  } else if (activeMode === 'listen') {
     questionMain = "Listen...";
     questionSub = "What did you hear?";
     showBigAudioBtn = true;
  }

  const isAnswered = selectedOption !== null;
  const isCorrectAnswer = (opt) => (opt.front || opt.english) === (target.front || target.english);

  return (
    <MobileLayout withNav={false}>
        {/* HEADER */}
        <div className="p-4 flex justify-between items-center bg-gray-900/50 z-10">
           <button onClick={() => navigate('/review')} className="p-2"><X size={24} className="text-gray-500 hover:text-white" /></button>
           <div className="h-1 w-24 bg-gray-800 rounded-full overflow-hidden mx-4">
              <div className="h-full bg-cyan-500 transition-all" style={{width: `${(currentIndex / sessionData.length) * 100}%`}}></div>
           </div>
           <button onClick={() => setShowSettings(true)} className="p-2 bg-gray-800 rounded-full text-cyan-400 hover:bg-gray-700 transition-colors">
             <Settings size={18} />
           </button>
        </div>

        {/* SETTINGS MODAL */}
        {showSettings && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
             <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-white font-black uppercase tracking-widest text-sm">Review Settings</h3>
                  <button onClick={() => setShowSettings(false)} className="bg-black p-2 rounded-full hover:bg-gray-800 transition-colors">
                    <X size={20} className="text-white"/>
                  </button>
                </div>
                <div className="mb-6">
                  <p className="text-gray-500 text-[10px] font-bold uppercase mb-3">Training Mode</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      {id: 'mix', icon: Shuffle, label: 'Mix'},
                      {id: 'read', icon: Eye, label: 'Read'},
                      {id: 'listen', icon: Ear, label: 'Listen'},
                      {id: 'recall', icon: BrainCircuit, label: 'Recall'}
                    ].map(mode => (
                      <button key={mode.id} onClick={() => setSettings({...settings, mode: mode.id})}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all
                          ${settings.mode === mode.id ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-gray-800 border-transparent text-gray-400 hover:bg-gray-700'}`}
                      >
                        <mode.icon size={20} className="mb-1" />
                        <span className="text-[9px] font-black uppercase">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                   <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🅰️</span>
                        <div>
                          <p className="text-white font-bold text-sm">Show Phonetics</p>
                          <p className="text-gray-500 text-[10px]">Helper text for reading</p>
                        </div>
                      </div>
                      <button onClick={() => setSettings({...settings, showPhonetics: !settings.showPhonetics})}
                        className={`w-12 h-6 rounded-full transition-colors relative ${settings.showPhonetics ? 'bg-emerald-500' : 'bg-gray-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.showPhonetics ? 'left-7' : 'left-1'}`} />
                      </button>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🔊</span>
                        <div>
                          <p className="text-white font-bold text-sm">Auto-play Audio</p>
                          <p className="text-gray-500 text-[10px]">Hear words automatically</p>
                        </div>
                      </div>
                      <button onClick={() => setSettings({...settings, autoPlay: !settings.autoPlay})}
                        className={`w-12 h-6 rounded-full transition-colors relative ${settings.autoPlay ? 'bg-emerald-500' : 'bg-gray-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.autoPlay ? 'left-7' : 'left-1'}`} />
                      </button>
                   </div>
                </div>
                <Button onClick={() => setShowSettings(false)} variant="secondary" className="mt-6 py-4">Save & Close</Button>
             </div>
          </div>
        )}

        {/* MAIN QUESTION AREA */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 pb-10 min-h-[30vh]">
           <span className="text-gray-500 text-[10px] uppercase tracking-widest mb-6 font-bold">{questionSub}</span>
           <div onClick={() => target.audio && playAudio(target.audio)} className="cursor-pointer active:scale-95 transition-transform flex flex-col items-center text-center group">
             {activeMode === 'listen' ? (
                <div className="w-24 h-24 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.2)] animate-pulse">
                   <Volume2 size={40} />
                </div>
             ) : (
                <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight uppercase italic">
                  {questionMain}
                </h1>
             )}
             {showBigAudioBtn && activeMode !== 'listen' && (
               <div className="p-3 bg-gray-800 rounded-full text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                 <Volume2 size={24} />
               </div>
             )}
           </div>
        </div>

        {/* ANSWERS LIST */}
        <div className="p-6 pb-40 space-y-3">
           {currentItem.options.map((opt, idx) => {
             let btnStyle = "bg-gray-900/50 border-white/5 text-white hover:bg-gray-800";
             if (isAnswered) {
               if (isCorrectAnswer(opt)) btnStyle = "bg-emerald-600/20 border-emerald-500 text-emerald-400";
               else if (selectedOption === opt) btnStyle = "bg-red-600/20 border-red-500 text-red-400";
               else btnStyle = "bg-gray-900 opacity-20";
             }
             return (
               <button key={idx} disabled={isAnswered} onClick={() => handleAnswer(opt)}
                 className={`w-full p-4 border rounded-2xl text-left transition-all flex justify-between items-center ${btnStyle}`}
               >
                 <div className="flex-1">{renderOptionContent(opt)}</div>
                 {isAnswered && isCorrectAnswer(opt) && <CheckCircle2 size={20} className="text-emerald-500 shrink-0 ml-2" />}
                 {isAnswered && selectedOption === opt && !isCorrectAnswer(opt) && <AlertCircle size={20} className="text-red-500 shrink-0 ml-2" />}
               </button>
             );
           })}
        </div>

        {/* BOTTOM ACTION BAR */}
        {isAnswered && (
           <div className="absolute bottom-0 left-0 right-0 p-6 pt-6 pb-8 bg-black/90 backdrop-blur-xl border-t border-white/10 animate-in slide-in-from-bottom-full z-20">
             <Button onClick={nextCard} variant={isCorrectAnswer(selectedOption) ? "primary" : "secondary"}>
                {isCorrectAnswer(selectedOption) ? 'Continue' : 'Got it'} <ArrowRight size={20} />
             </Button>
           </div>
        )}
    </MobileLayout>
  );
}
