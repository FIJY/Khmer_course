import React from 'react'
import ReactDOM from 'react-dom/client'

// УБИРАЕМ СТИЛИ ВРЕМЕННО, ЧТОБЫ ИСКЛЮЧИТЬ ОШИБКИ
// import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
    <h1 style={{ color: 'green' }}>ВЕРСИЯ БЕЗ СТИЛЕЙ</h1>
    <p>Если вы видите это — значит, проблема была в файле index.css.</p>
    <p>Сейчас мы проверим, работает ли чистый React.</p>
    <button onClick={() => window.location.reload()}>Обновить страницу</button>
  </div>
)