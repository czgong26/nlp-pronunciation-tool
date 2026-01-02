import React, { useEffect, useRef, useState } from 'react';

const AudioWaveform = ({ isRecording, audioStream }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const analyserRef = useRef(null);
  const [audioContext, setAudioContext] = useState(null);

  useEffect(() => {
    if (isRecording && audioStream) {
      // Create audio context and analyser
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = context.createAnalyser();
      const source = context.createMediaStreamSource(audioStream);

      analyser.fftSize = 256;
      source.connect(analyser);

      analyserRef.current = analyser;
      setAudioContext(context);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationRef.current = requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);

        // Clear canvas with gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#f0f9ff');
        gradient.addColorStop(1, '#e0f2fe');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw waveform
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#6366f1';
        ctx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      };

      draw();
    } else {
      // Stop animation when not recording
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContext) {
        audioContext.close();
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContext) {
        audioContext.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, audioStream]);

  return (
    <div className="w-full bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border-2 border-blue-200">
      <div className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
        {isRecording ? 'Recording...' : 'Waveform Visualization'}
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={100}
        className="w-full h-24 rounded"
      />
    </div>
  );
};

export default AudioWaveform;
