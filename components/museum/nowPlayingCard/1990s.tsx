/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';

const BauhausWidget = () => {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const [clockDisplay, setClockDisplay] = useState('00:00:00');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      ctx.clearRect(0, 0, 200, 200);
      const time = Date.now() * 0.001;

      const count = 4;
      for (let i = 1; i <= count; i++) {
        const baseRadius = 60;
        const pulse = Math.sin(time * 2 - i * 0.5) * 5;
        const radius = baseRadius + i * 12 + pulse;

        ctx.beginPath();
        ctx.arc(100, 100, radius, 0, Math.PI * 2);
        ctx.strokeStyle = i % 2 === 0 ? '#ffcc00' : 'rgba(232, 232, 232, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const elapsed = Date.now() - startTimeRef.current;
      const s = Math.floor(elapsed / 1000) % 60;
      const m = Math.floor(elapsed / 60000) % 60;
      const h = Math.floor(elapsed / 3600000);
      const pad = (n) => n.toString().padStart(2, '0');
      setClockDisplay(`${pad(h)}:${pad(m)}:${pad(s)}`);

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const widgetContainerStyle = {
    width: '320px',
    height: '240px',
    backgroundColor: '#121212',
    borderRadius: '8px',
    position: 'relative',
    overflow: 'hidden',
    display: 'grid',
    gridTemplateRows: 'auto 1fr auto',
    color: '#e8e8e8',
    border: '1px solid #333',
    fontFamily: "'Inter', sans-serif",
  };

  const gridOverlayStyle = {
    position: 'absolute',
    inset: 0,
    backgroundImage:
      'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
    backgroundSize: '20px 20px',
    pointerEvents: 'none',
    zIndex: 1,
  };

  const headerStyle = {
    zIndex: 2,
    padding: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '2px solid #e61919',
  };

  const labelMainStyle = {
    fontSize: '14px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '-0.5px',
    lineHeight: 1,
  };

  const labelSubStyle = {
    fontSize: '8px',
    textTransform: 'uppercase',
    fontWeight: 400,
    opacity: 0.7,
    marginTop: '2px',
  };

  const visualizerAreaStyle = {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const bauhausRingsStyle = {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    border: '12px solid #ffcc00',
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const bauhausRingsInnerStyle = {
    width: '80%',
    height: '80%',
    borderRadius: '50%',
    border: '4px solid #e8e8e8',
    position: 'absolute',
  };

  const bauhausRingsDotStyle = {
    width: '24px',
    height: '24px',
    backgroundColor: '#e61919',
    borderRadius: '50%',
    position: 'relative',
    zIndex: 1,
  };

  const vizCanvasStyle = {
    position: 'absolute',
    zIndex: 3,
    mixBlendMode: 'screen',
  };

  const footerStyle = {
    zIndex: 2,
    height: '50px',
    padding: '0 12px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    alignItems: 'center',
    borderTop: '1px solid #333',
    background: 'rgba(255,255,255,0.02)',
  };

  const vhsReadoutStyle = {
    fontSize: '16px',
    fontWeight: 900,
    letterSpacing: '-0.5px',
    color: '#e8e8e8',
  };

  const trackInfoStyle = {
    textAlign: 'right',
  };

  const trackTitleStyle = {
    fontSize: '7px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#ffcc00',
  };

  const trackSideStyle = {
    fontSize: '14px',
    fontWeight: 900,
    color: '#e8e8e8',
  };

  const accentSquareStyle = {
    position: 'absolute',
    width: '40px',
    height: '40px',
    background: '#0044cc',
    bottom: '40px',
    right: 0,
    zIndex: 1,
    opacity: 0.8,
  };

  return (
    <div style={widgetContainerStyle}>
      <div style={gridOverlayStyle}></div>
      <div style={accentSquareStyle}></div>

      <div style={headerStyle}>
        <div>
          <div style={labelMainStyle}>Master Mix</div>
          <div style={labelSubStyle}>Minimalist Form 02</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={labelMainStyle}>1992</div>
          <div style={labelSubStyle}>Bauhaus Edition</div>
        </div>
      </div>

      <div style={visualizerAreaStyle}>
        <canvas ref={canvasRef} width={200} height={200} style={vizCanvasStyle} />
        <div style={bauhausRingsStyle}>
          <div style={bauhausRingsInnerStyle}></div>
          <div style={bauhausRingsDotStyle}></div>
        </div>
      </div>

      <div style={footerStyle}>
        <div style={vhsReadoutStyle}>{clockDisplay}</div>
        <div style={trackInfoStyle}>
          <div style={trackTitleStyle}>Input Signal</div>
          <div style={trackSideStyle}>SIDE A</div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
      body { margin: 0; padding: 0; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div
      style={{
        backgroundColor: '#000',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <BauhausWidget />
    </div>
  );
};

export default App;
