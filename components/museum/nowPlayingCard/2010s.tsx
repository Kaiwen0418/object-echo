/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const [clockText, setClockText] = useState('SP 00:00:00');

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=VT323&display=swap');

      @keyframes flicker {
        0% { opacity: 0.9; }
        50% { opacity: 1; }
        100% { opacity: 0.8; }
      }

      @keyframes tape-scroll {
        0% { top: -2%; }
        100% { top: 102%; }
      }

      .record-dot-anim {
        animation: flicker 0.1s infinite;
      }

      .tape-noise-anim {
        animation: tape-scroll 4s linear infinite;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const pad = n => n.toString().padStart(2, '0');

    const draw = () => {
      ctx.clearRect(0, 0, 200, 200);
      const time = Date.now() * 0.001;

      const count = 72;
      const radius = 65;

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const noise = Math.sin(i * 0.3 + time * 5) * 12 + (Math.random() * 5);
        const len = 4 + Math.max(0, noise);

        const x1 = 100 + Math.cos(angle) * radius;
        const y1 = 100 + Math.sin(angle) * radius;
        const x2 = 100 + Math.cos(angle) * (radius + len);
        const y2 = 100 + Math.sin(angle) * (radius + len);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = i % 2 === 0 ? '#ffb000' : '#7a5500';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      const elapsed = Date.now() - startTimeRef.current;
      const s = Math.floor(elapsed / 1000) % 60;
      const m = Math.floor(elapsed / 60000) % 60;
      const h = Math.floor(elapsed / 3600000);
      setClockText(`SP ${pad(h)}:${pad(m)}:${pad(s)}`);

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
    backgroundColor: '#1a140d',
    borderRadius: '8px',
    position: 'relative',
    overflow: 'hidden',
    border: '4px solid #111',
    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8), 0 10px 30px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Libre Baskerville', serif",
  };

  const pseudoOverlayStyle = {
    position: 'absolute',
    inset: 0,
    backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')",
    opacity: 0.15,
    pointerEvents: 'none',
    zIndex: 20,
  };

  const scanlinesStyle = {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.2) 50%)',
    backgroundSize: '100% 4px',
    pointerEvents: 'none',
    zIndex: 21,
  };

  const tapeNoiseStyle = {
    position: 'absolute',
    width: '100%',
    height: '2px',
    background: 'rgba(255,255,255,0.05)',
    top: '-10px',
    zIndex: 22,
  };

  const headerStyle = {
    padding: '10px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottom: '1px solid #7a5500',
  };

  const labelGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
  };

  const labelMainStyle = {
    fontSize: '12px',
    fontWeight: 700,
    color: '#ffb000',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const labelSubStyle = {
    fontSize: '8px',
    color: '#7a5500',
    fontStyle: 'italic',
  };

  const visualizerAreaStyle = {
    flexGrow: 1,
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'radial-gradient(circle, #2a1e0f 0%, #1a140d 100%)',
  };

  const radialStageStyle = {
    width: '130px',
    height: '130px',
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const centerSpindleStyle = {
    width: '36px',
    height: '36px',
    border: '2px solid #7a5500',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#111',
    zIndex: 10,
  };

  const recordDotStyle = {
    width: '8px',
    height: '8px',
    background: '#ffb000',
    borderRadius: '1px',
    boxShadow: '0 0 8px #ffb000',
  };

  const footerStyle = {
    height: '60px',
    background: '#111',
    padding: '8px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #333',
  };

  const vhsReadoutStyle = {
    fontFamily: "'VT323', monospace",
    color: '#ffb000',
    fontSize: '18px',
    letterSpacing: '1px',
    textShadow: '2px 0 0 rgba(255,0,0,0.2), -2px 0 0 rgba(0,0,255,0.2)',
  };

  const trackInfoStyle = {
    textAlign: 'right',
  };

  const trackTitleStyle = {
    color: '#888',
    fontSize: '9px',
    textTransform: 'uppercase',
    fontFamily: "'VT323', monospace",
  };

  const trackSideStyle = {
    color: '#ffb000',
    fontSize: '14px',
    fontWeight: 'bold',
  };

  const canvasStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    filter: 'blur(0.5px) contrast(1.2)',
  };

  return (
    <div style={{ backgroundColor: '#000', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      <div style={widgetContainerStyle}>
        <div style={pseudoOverlayStyle}></div>
        <div style={scanlinesStyle}></div>
        <div className="tape-noise-anim" style={tapeNoiseStyle}></div>

        <div style={headerStyle}>
          <div style={labelGroupStyle}>
            <span style={labelMainStyle}>Master Mix</span>
            <span style={labelSubStyle}>Chromium Dioxide / Type II</span>
          </div>
          <div style={{ ...labelGroupStyle, textAlign: 'right' }}>
            <span style={labelMainStyle}>© 1992</span>
            <span style={labelSubStyle}>High Fidelity</span>
          </div>
        </div>

        <div style={visualizerAreaStyle}>
          <canvas
            ref={canvasRef}
            width={200}
            height={200}
            style={canvasStyle}
          />
          <div style={radialStageStyle}>
            <div style={centerSpindleStyle}>
              <div className="record-dot-anim" style={recordDotStyle}></div>
            </div>
          </div>
        </div>

        <div style={footerStyle}>
          <div style={vhsReadoutStyle}>{clockText}</div>
          <div style={trackInfoStyle}>
            <div style={trackTitleStyle}>Input Signal</div>
            <div style={trackSideStyle}>SIDE A</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
