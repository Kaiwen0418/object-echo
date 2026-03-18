/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const [isRecording, setIsRecording] = useState(true);
  const [seconds, setSeconds] = useState(44);
  const intervalRef = useRef(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Archivo+Black&display=swap');

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      @keyframes pulse {
        from { opacity: 1; box-shadow: 2px 2px 0px #000; }
        to { opacity: 0.7; box-shadow: 0px 0px 8px #FF0000; }
      }

      .record-spinning {
        animation: spin 3s linear infinite;
      }

      .rec-btn-active {
        animation: pulse 1s infinite alternate;
        background: #FF0000!important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (isRecording) {
        setSeconds(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRecording]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleRecBtnClick = () => {
    setIsRecording(prev => !prev);
  };

  const widgetContainerStyle = {
    width: '320px',
    height: '240px',
    backgroundColor: '#4A0E0E',
    borderRadius: '8px',
    border: '3px solid #D4AF37',
    boxShadow: '10px 10px 0px rgba(0,0,0,0.5)',
    display: 'flex',
    position: 'relative',
    overflow: 'hidden',
    padding: '10px',
    gap: '12px',
  };

  const vinylSideStyle = {
    width: '140px',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  };

  const recordSleeveStyle = {
    width: '130px',
    height: '130px',
    background: '#111',
    borderRadius: '50%',
    border: '2px solid #D4AF37',
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: 'inset 0 0 20px rgba(0,0,0,1)',
  };

  const recordGroovesStyle = {
    position: 'absolute',
    width: '90%',
    height: '90%',
    borderRadius: '50%',
    border: '1px solid rgba(212, 175, 55, 0.1)',
    boxShadow: '0 0 0 4px rgba(0,0,0,0.5), 0 0 0 8px rgba(0,0,0,0.5)',
  };

  const recordLabelStyle = {
    width: '50px',
    height: '50px',
    background: '#D4AF37',
    borderRadius: '50%',
    zIndex: 2,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    fontFamily: "'Permanent Marker', cursive",
    fontSize: '8px',
    color: '#2D0A0A',
    lineHeight: 1,
    border: '1px solid #000',
  };

  const infoSideStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '5px 0',
  };

  const headerTitleStyle = {
    fontFamily: "'Archivo Black', sans-serif",
    fontStyle: 'italic',
    fontSize: '18px',
    textTransform: 'uppercase',
    color: '#FFD700',
    textShadow: '3px 3px 0px #000',
    lineHeight: 0.9,
    marginBottom: '4px',
  };

  const subLabelStyle = {
    fontFamily: "'Permanent Marker', cursive",
    fontSize: '12px',
    color: '#D4AF37',
    transform: 'rotate(-2deg)',
    marginBottom: '10px',
    display: 'block',
  };

  const statusBoxStyle = {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid #996515',
    padding: '6px',
    fontFamily: "'Archivo Black', sans-serif",
    fontStyle: 'italic',
    fontSize: '10px',
    color: '#FFF',
  };

  const controlsStyle = {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  };

  const recBtnBaseStyle = {
    width: '32px',
    height: '32px',
    background: '#CC0000',
    border: '2px solid #D4AF37',
    borderRadius: '4px',
    cursor: 'pointer',
    boxShadow: '2px 2px 0px #000',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const timerStyle = {
    fontFamily: "'Archivo Black', sans-serif",
    fontSize: '14px',
    color: '#D4AF37',
    textShadow: '2px 2px 0px #000',
  };

  const outerBodyStyle = {
    backgroundColor: '#2D0A0A',
    width: '100vw',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    WebkitFontSmoothing: 'antialiased',
  };

  return (
    <div style={outerBodyStyle}>
      <div style={widgetContainerStyle}>
        <div style={vinylSideStyle}>
          <div
            style={recordSleeveStyle}
            className={isRecording ? 'record-spinning' : ''}
          >
            <div style={recordGroovesStyle}></div>
            <div style={recordLabelStyle}>
              SIDE A<br />90&apos;s FLAVOR
            </div>
          </div>
        </div>

        <div style={infoSideStyle}>
          <div>
            <div style={headerTitleStyle}>
              PHAT BEAT<br />RECORDER
            </div>
            <span style={subLabelStyle}>Golden Era Vol. 1</span>
          </div>

          <div style={statusBoxStyle}>
            {isRecording ? "DROPPIN' THE NEEDLE..." : 'STATION IDLE.'}
          </div>

          <div style={controlsStyle}>
            <div style={timerStyle}>{formatTime(seconds)}</div>
            <button
              style={recBtnBaseStyle}
              className={isRecording ? 'rec-btn-active' : ''}
              onClick={handleRecBtnClick}
            >
              <div style={{ width: '10px', height: '10px', background: 'white', borderRadius: '2px' }}></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
