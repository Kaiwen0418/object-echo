/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';

const MusicCard = () => {
  const canvasRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const animationRef = useRef(null);
  const [timer, setTimer] = useState('00:00:00');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const time = Date.now() * 0.002;

      ctx.beginPath();
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;

      const points = 100;
      const step = canvas.width / points;

      for (let i = 0; i <= points; i++) {
        const x = i * step;
        const noise =
          Math.sin(i * 0.15 + time) * 8 +
          Math.sin(i * 0.3 - time * 0.5) * 4;
        const y = canvas.height / 2 + noise;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();

      const elapsed = Date.now() - startTimeRef.current;
      const s = Math.floor(elapsed / 1000) % 60;
      const m = Math.floor(elapsed / 60000) % 60;
      const h = Math.floor(elapsed / 3600000);
      const pad = (n) => n.toString().padStart(2, '0');
      setTimer(`${pad(h)}:${pad(m)}:${pad(s)}`);

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const containerStyle = {
    width: '320px',
    height: '240px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    position: 'relative',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  };

  const trackNameStyle = {
    fontSize: '14px',
    fontWeight: '400',
    color: '#000000',
    letterSpacing: '-0.01em',
  };

  const visualizerContainerStyle = {
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  };

  const footerStyle = {
    display: 'flex',
    justifyContent: 'flex-start',
  };

  const timestampStyle = {
    fontSize: '11px',
    color: '#000000',
    fontWeight: '300',
    letterSpacing: '0.05em',
  };

  return (
    <div style={containerStyle}>
      <div style={trackNameStyle}>Master Mix</div>
      <div style={visualizerContainerStyle}>
        <canvas
          ref={canvasRef}
          width={272}
          height={40}
          style={{ width: '100%', height: '40px' }}
        />
      </div>
      <div style={footerStyle}>
        <div style={timestampStyle}>{timer}</div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const pageStyle = {
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  return (
    <div style={pageStyle}>
      <MusicCard />
    </div>
  );
};

const App = () => {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400&display=swap';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.textContent = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  return <HomePage />;
};

export default App;
