import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// Временно не загружаем само приложение
// import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white', color: 'black', padding: 20 }}>
    <h1 style={{ fontSize: 30, marginBottom: 20 }}>СИСТЕМА ВОССТАНОВЛЕНА</h1>
    <p>Если вы видите этот текст на Айфоне:</p>
    <ul style={{ textAlign: 'left', marginTop: 10 }}>
      <li>✅ Сервер работает</li>
      <li>✅ Vite (сборщик) работает</li>
      <li>✅ Браузер телефона исправен</li>
    </ul>
    <p style={{ marginTop: 20, color: 'blue' }}>
      Значит, проблема была в коде App.jsx (бесконечный редирект).
    </p>
  </div>
)