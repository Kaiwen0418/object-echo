/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [vuLevels, setVuLevels] = useState({ L: 0, R: 0 });

  const timerIntervalRef = useRef(null);
  const vuIntervalRef = useRef(null);
  const isRecordingRef = useRef(false);

  const SEGMENT_COUNT = 20;

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@700&display=swap');

      @keyframes blink {
        50% { opacity: 0.3; }
      }

      .rec-dot-active {
        background: #ff0000 !important;
        box-shadow: 0 0 8px #ff0000 !important;
        animation: blink 1s infinite !important;
      }

      .transport-btn:active {
        transform: translateY(1px);
        box-shadow: 0 1px 0 #888 !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    vuIntervalRef.current = setInterval(() => {
      if (isRecordingRef.current) {
        setVuLevels({
          L: Math.floor(Math.random() * 15) + 3,
          R: Math.floor(Math.random() * 12) + 4,
        });
      } else {
        setVuLevels({ L: 0, R: 0 });
      }
    }, 80);

    return () => clearInterval(vuIntervalRef.current);
  }, []);

  const handleRec = () => {
    if (!isRecording) {
      setIsRecording(true);
      timerIntervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
  };

  const handleStop = () => {
    setIsRecording(false);
    clearInterval(timerIntervalRef.current);
  };

  const formatTime = (s) => {
    const mins = Math.floor(s / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    return `00:${mins}:${secs}`;
  };

  const styles = {
    body: {
      backgroundColor: '#222',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      overflow: 'hidden',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
    },
    hifiCard: {
      width: '320px',
      height: '240px',
      background: 'linear-gradient(180deg, #E8E8E8 0%, #C0C0C0 10%, #C0C0C0 90%, #888888 100%)',
      borderRadius: '8px',
      border: '1px solid #666',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 10px 30px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      padding: '12px',
      position: 'relative',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      boxSizing: 'border-box',
    },
    hifiCardAfter: {
      content: '""',
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.03) 3px)',
      pointerEvents: 'none',
      borderRadius: '8px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: '10px',
      borderBottom: '1px solid #999',
      paddingBottom: '4px',
      zIndex: 2,
    },
    brand: {
      fontWeight: 900,
      fontStyle: 'italic',
      fontSize: '14px',
      letterSpacing: '-0.5px',
      color: '#333',
    },
    modelNo: {
      fontSize: '8px',
      fontWeight: 'bold',
      color: '#555',
      letterSpacing: '1px',
    },
    lcdViewport: {
      backgroundColor: '#0D2B1D',
      flex: 1,
      border: '3px solid #444',
      borderRadius: '4px',
      boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8)',
      position: 'relative',
      padding: '8px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      overflow: 'hidden',
      zIndex: 2,
    },
    lcdLabel: {
      fontSize: '7px',
      color: '#39FF14',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      opacity: 0.6,
    },
    vuMeterContainer: {
      height: '40px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    vuRow: {
      display: 'flex',
      gap: '2px',
      height: '12px',
    },
    vuSegmentOff: {
      flex: 1,
      backgroundColor: '#1A3826',
      transition: 'background-color 0.05s ease',
    },
    vuSegmentOn: {
      flex: 1,
      backgroundColor: '#39FF14',
      boxShadow: '0 0 5px #39FF14',
      transition: 'background-color 0.05s ease',
    },
    vuSegmentPeakOn: {
      flex: 1,
      backgroundColor: '#ff3300',
      boxShadow: '0 0 5px #ff3300',
      transition: 'background-color 0.05s ease',
    },
    timecode: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '28px',
      color: '#39FF14',
      textShadow: '0 0 8px rgba(57, 255, 20, 0.4)',
      letterSpacing: '2px',
      textAlign: 'right',
      marginTop: '4px',
    },
    controlsPanel: {
      marginTop: '12px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 2,
    },
    knobContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
    },
    knob: {
      width: '32px',
      height: '32px',
      background: 'radial-gradient(circle at 30% 30%, #eee, #999)',
      borderRadius: '50%',
      border: '2px solid #777',
      position: 'relative',
      boxShadow: '0 3px 5px rgba(0,0,0,0.3)',
      cursor: 'default',
    },
    knobLabel: {
      fontSize: '7px',
      fontWeight: 'bold',
      color: '#444',
      textTransform: 'uppercase',
    },
    btnGroup: {
      display: 'flex',
      gap: '8px',
    },
    transportBtn: {
      width: '40px',
      height: '28px',
      background: 'linear-gradient(180deg, #f0f0f0, #ccc)',
      border: '1px solid #888',
      borderRadius: '2px',
      boxShadow: '0 2px 0 #888',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer',
    },
    recDot: {
      width: '10px',
      height: '10px',
      background: '#900',
      borderRadius: '50%',
    },
    stopSquare: {
      width: '10px',
      height: '10px',
      background: '#444',
    },
  };

  const getVuSegmentStyle = (index, level) => {
    const isPeak = index > 16;
    const isActive = index < level;
    if (!isActive) return styles.vuSegmentOff;
    if (isPeak) return styles.vuSegmentPeakOn;
    return styles.vuSegmentOn;
  };

  return (
    <div style={styles.body}>
      <div style={styles.hifiCard}>
        <div style={styles.hifiCardAfter} />

        <div style={styles.header}>
          <div style={styles.brand}>VARIANT SONYC</div>
          <div style={styles.modelNo}>TC-900 DIGITAL CAPTURE</div>
        </div>

        <div style={styles.lcdViewport}>
          <div style={styles.vuMeterContainer}>
            <div style={styles.lcdLabel}>Level L/R</div>
            <div style={styles.vuRow}>
              {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
                <div key={`L-${i}`} style={getVuSegmentStyle(i, vuLevels.L, 'L')} />
              ))}
            </div>
            <div style={styles.vuRow}>
              {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
                <div key={`R-${i}`} style={getVuSegmentStyle(i, vuLevels.R, 'R')} />
              ))}
            </div>
          </div>

          <div>
            <div style={styles.lcdLabel}>Counter</div>
            <div style={styles.timecode}>{formatTime(seconds)}</div>
          </div>
        </div>

        <div style={styles.controlsPanel}>
          <div style={styles.knobContainer}>
            <div style={styles.knob}>
              <div style={{
                content: '""',
                position: 'absolute',
                top: '4px',
                left: '50%',
                width: '2px',
                height: '8px',
                background: '#444',
                transform: 'translateX(-50%) rotate(-45deg)',
                transformOrigin: '50% 12px',
              }} />
            </div>
            <div style={styles.knobLabel}>Rec Lev</div>
          </div>

          <div style={styles.btnGroup}>
            <div style={styles.transportBtn} onClick={handleStop}>
              <div style={styles.stopSquare} />
            </div>
            <div style={styles.transportBtn} onClick={handleRec}>
              <div
                style={{
                  ...styles.recDot,
                  ...(isRecording ? {
                    background: '#ff0000',
                    boxShadow: '0 0 8px #ff0000',
                  } : {}),
                }}
                className={isRecording ? 'rec-dot-active' : ''}
              />
            </div>
          </div>

          <div style={styles.knobContainer}>
            <div style={{ ...styles.knob, transform: 'rotate(40deg)' }}>
              <div style={{
                position: 'absolute',
                top: '4px',
                left: '50%',
                width: '2px',
                height: '8px',
                background: '#444',
                transform: 'translateX(-50%) rotate(-45deg)',
                transformOrigin: '50% 12px',
              }} />
            </div>
            <div style={styles.knobLabel}>Output</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
