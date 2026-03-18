/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';

const App = () => {
  const [isRecording, setIsRecording] = useState(true);
  const [timeCode, setTimeCode] = useState('00:00:00');
  const [statusText, setStatusText] = useState('BOOTLEG_01.RAW\nSIGNAL_DETECTED');
  const startTimeRef = useRef(Date.now());
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const isRecordingRef = useRef(true);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Special+Elite&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
      body {
        background-color: #1a1a1a;
        font-family: 'Special Elite', 'Courier New', Courier, monospace;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
      }
      .widget-font { font-family: 'Special Elite', 'Courier New', Courier, monospace; }
      .is-recording .trigger-icon {
        background-color: #000;
        width: 16px !important;
        height: 16px !important;
        border-radius: 50%;
        animation: pulse 0.5s infinite alternate;
      }
      @keyframes pulse {
        from { transform: scale(1); }
        to { transform: scale(1.2); }
      }
      canvas { filter: contrast(200%) brightness(80%) grayscale(100%); }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const drawHandDrawnTick = useCallback((ctx, x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1 + (Math.random() - 0.5) * 2, y1 + (Math.random() - 0.5) * 2);
    ctx.lineTo(x2 + (Math.random() - 0.5) * 2, y2 + (Math.random() - 0.5) * 2);
    ctx.stroke();
  }, []);

  const drawRadialTicks = useCallback((ctx, recording) => {
    ctx.clearRect(0, 0, 160, 160);
    const tickCount = 40;
    const cx = 80;
    const cy = 80;
    const baseRadius = 55;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2.5;

    for (let i = 0; i < tickCount; i++) {
      const angle = (i / tickCount) * Math.PI * 2;
      const noise = recording ? Math.random() * 15 : Math.random() * 4;

      const r1 = baseRadius;
      const r2 = baseRadius + 4 + noise;

      const x1 = cx + Math.cos(angle) * r1;
      const y1 = cy + Math.sin(angle) * r1;
      const x2 = cx + Math.cos(angle) * r2;
      const y2 = cy + Math.sin(angle) * r2;

      drawHandDrawnTick(ctx, x1, y1, x2, y2);
    }
  }, [drawHandDrawnTick]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const update = () => {
      if (isRecordingRef.current) {
        const diff = Date.now() - startTimeRef.current;
        const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
        const m = Math.floor((diff / 60000) % 60).toString().padStart(2, '0');
        const ms = Math.floor((diff % 1000) / 10).toString().padStart(2, '0');
        setTimeCode(`${m}:${s}:${ms}`);
      }
      drawRadialTicks(ctx, isRecordingRef.current);
      animFrameRef.current = requestAnimationFrame(update);
    };

    animFrameRef.current = requestAnimationFrame(update);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [drawRadialTicks]);

  const handleRecordClick = () => {
    const newRecording = !isRecordingRef.current;
    isRecordingRef.current = newRecording;
    setIsRecording(newRecording);
    if (newRecording) {
      startTimeRef.current = Date.now();
      setStatusText('BOOTLEG_01.RAW\nSIGNAL_DETECTED');
    } else {
      setStatusText('TAPE_END\nSTOPPED');
    }
  };

  const statusLines = statusText.split('\n');

  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    }}>
      <div
        className={`widget-font${isRecording ? ' is-recording' : ''}`}
        style={{
          width: '320px',
          height: '240px',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '2px solid #000',
          boxShadow: 'inset 0 0 50px rgba(0,0,0,0.1)',
        }}
      >
        {/* Noise overlay */}
        <div style={{
          content: '""',
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.2'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
          zIndex: 20,
          mixBlendMode: 'multiply',
        }} />

        {/* Header */}
        <div style={{
          padding: '10px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: '3px solid #000',
          background: '#fff',
          transform: 'rotate(-0.5deg)',
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            background: '#000',
            color: '#fff',
            padding: '0 4px',
            fontFamily: 'inherit',
          }}>SIDE_A</span>
          <span style={{
            fontSize: '11px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            background: '#000',
            color: '#fff',
            padding: '0 4px',
            fontFamily: 'inherit',
          }}>REC_094</span>
        </div>

        {/* Visualizer Stage */}
        <div style={{
          flexGrow: 1,
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'repeating-linear-gradient(45deg, #e0e0e0, #e0e0e0 2px, #f0f0f0 2px, #f0f0f0 4px)',
        }}>
          <div style={{
            width: '140px',
            height: '140px',
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {/* Radial track circle */}
            <div style={{
              position: 'absolute',
              width: '100px',
              height: '100px',
              border: '2px solid #000',
              borderRadius: '50%',
              borderStyle: 'double',
            }} />

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              width={160}
              height={160}
              style={{ position: 'absolute', top: '-10px', left: '-10px' }}
            />

            {/* Record Button */}
            <button
              onClick={handleRecordClick}
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid #000',
                background: '#fff',
                cursor: 'pointer',
                zIndex: 10,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                transform: 'rotate(3deg)',
                boxShadow: '2px 2px 0px #000',
                padding: 0,
              }}
            >
              <div
                className="trigger-icon"
                style={isRecording ? {} : {
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#000',
                }}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 12px',
          background: '#fff',
          borderTop: '3px solid #000',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{
              fontSize: '10px',
              fontWeight: 'bold',
              textDecoration: 'underline',
              fontFamily: 'inherit',
            }}>TRACK_INFO</div>
            <div style={{
              fontSize: '11px',
              lineHeight: '1.1',
              marginTop: '2px',
              fontFamily: 'inherit',
            }}>
              {statusLines.map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < statusLines.length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div style={{
            fontSize: '11px',
            textAlign: 'right',
            background: '#000',
            color: '#fff',
            padding: '2px 4px',
            transform: 'rotate(1deg)',
            fontFamily: 'inherit',
          }}>
            {timeCode}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
