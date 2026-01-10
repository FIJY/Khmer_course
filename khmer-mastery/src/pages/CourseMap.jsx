import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase'; // Обрати внимание на путь (../)

const CourseMap = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: modData } = await supabase.from('modules').select('*').order('order_index');
        const { data: lesData } = await supabase.from('lessons').select('*').order('order_index');
        setModules(modData || []);
        setLessons(lesData || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="h-full flex items-center justify-center text-brand">Loading Map...</div>;

  return (
    <div className="h-full bg-black overflow-y-auto p-6 pb-20">
      <header className="flex justify-between items-center mb-8 sticky top-0 bg-black/90 backdrop-blur z-20 py-4 border-b border-gray-800">
        <h2 className="text-2xl font-bold text-white">Course Map</h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 rounded-full border border-gray-700">
             <span className="text-brand font-bold">💎 0</span>
          </div>
        </div>
      </header>

      <div className="space-y-12 relative">
        <div className="absolute left-8 top-4 bottom-0 w-1 bg-gray-800 -z-10"></div>

        // Внутри CourseMap.jsx
{modules.map((module) => (
  <div key={module.id} className="relative animate-fade-in">
    <h3 className="text-gray-500 uppercase tracking-widest text-xs font-bold mb-6 ml-16 bg-black inline-block px-2">
      {module.title}
    </h3>
    <div className="space-y-6">
      {/* Проверь, что lesson.module_id совпадает с типом данных module.id (number vs string) */}
      {lessons
        .filter(l => Number(l.module_id) === Number(module.id))
        .map((lesson, idx) => (
          <div
            key={lesson.id}
            onClick={() => navigate(`/lesson/${lesson.id}`)}
            className="flex items-center gap-6 cursor-pointer group"
          >
            {/* Твоя верстка карточки урока */}
            <div className="w-16 h-16 rounded-full flex items-center justify-center border-4 border-brand text-brand bg-black z-10">
              <Play size={24} fill="currentColor" />
            </div>
            <div className="flex-1 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
              <h4 className="text-white font-bold text-lg">{lesson.title}</h4>
              <p className="text-gray-500 text-sm">{lesson.description}</p>
            </div>
          </div>
      ))}
    </div>
  </div>
))}
        ))}
      </div>
    </div>
  );
};

export default CourseMap;