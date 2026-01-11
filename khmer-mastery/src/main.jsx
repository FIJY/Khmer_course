import React from 'react'
import ReactDOM from 'react-dom/client'

// Стили отключены
// import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
    <h1 style={{ color: 'red' }}>ЯДЕРНАЯ ЗАЧИСТКА УСПЕШНА</h1>
    <p>Если вы это видите — Netlify приказал браузеру удалить старый кэш.</p>
    <p>Теперь Лимон должен исчезнуть.</p>
    <button onClick={() => window.location.reload()} style={{padding: 10, fontSize: 20}}>
      Нажми меня еще раз
    </button>
  </div>
)