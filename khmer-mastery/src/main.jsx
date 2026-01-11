import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// МЫ ОТКЛЮЧИЛИ ВСЁ: App, Router, Supabase.
// import App from './App.jsx'

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <div style={{ padding: 20, background: 'white', color: 'black' }}>
    <h1>ЭТАП 1: ПРОВЕРКА ЖЕЛЕЗА</h1>
    <p>Если вы это читаете на телефоне, значит:</p>
    <ul>
      <li>Vite собрал проект правильно.</li>
      <li>Браузер телефона исправен.</li>
      <li>Проблема была в App.jsx или Supabase.</li>
    </ul>
    <p>Время сборки: {new Date().toLocaleTimeString()}</p>
  </div>
);