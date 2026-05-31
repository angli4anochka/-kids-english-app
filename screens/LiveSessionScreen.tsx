import React from 'react';

const LiveSessionScreen: React.FC = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🎓 Живая сессия урока</h1>
      <p>Это временная версия компонента для тестирования маршрутизации.</p>
      <button 
        onClick={() => window.location.href = '/teacher/lessons'}
        style={{ marginTop: '20px', padding: '10px 20px' }}
      >
        ⏹️ Закончить урок
      </button>
    </div>
  );
};

export default LiveSessionScreen;
