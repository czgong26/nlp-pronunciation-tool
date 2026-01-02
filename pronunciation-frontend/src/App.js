import React, { useState, useRef } from 'react';
import { Mic, Square, Volume2, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import './index.css';
import ScoreGauge from './components/ScoreGauge';
import AudioWaveform from './components/AudioWaveform';
import MetricsChart from './components/MetricsChart';

const PronunciationApp = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('en');
  const [mode, setMode] = useState('preset');
  const [customText, setCustomText] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [generatedPhrase, setGeneratedPhrase] = useState('');
  const [generatingPhrase, setGeneratingPhrase] = useState(false);
  const [audioStream, setAudioStream] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const generateNewPhrase = async () => {
    setGeneratingPhrase(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('language', language);
      formData.append('difficulty', difficulty);

      const response = await fetch('http://localhost:8000/generate-phrase', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate phrase');
      }

      const result = await response.json();
      setGeneratedPhrase(result.phrase);
    } catch (err) {
      setError('Could not generate phrase. Please try again.');
      console.error('Error generating phrase:', err);
    } finally {
      setGeneratingPhrase(false);
    }
  };

  const getCurrentTargetText = () => {
    if (mode === 'custom') {
      return customText;
    } else if (mode === 'difficulty') {
      return generatedPhrase;
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        setAudioStream(null);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setFeedback(null);
    } catch (err) {
      setError('Could not access microphone. Please check permissions.');
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const analyzeRecording = async () => {
    if (!audioBlob) return;

    if (mode === 'custom' && !customText.trim()) {
      setError('Please enter some text to practice');
      return;
    }
    if (mode === 'difficulty' && !generatedPhrase.trim()) {
      setError('Please generate a phrase first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('target_text', getCurrentTargetText());
      formData.append('language', language);

      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setFeedback(result);
    } catch (err) {
      setError('Analysis failed. Make sure the backend server is running on localhost:8000');
      console.error('Error analyzing audio:', err);
    } finally {
      setLoading(false);
    }
  };

  const playRecording = () => {
    if (audioBlob) {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.play();
    }
  };

  const playTargetAudio = async () => {
    try {
      const formData = new FormData();
      formData.append('text', getCurrentTargetText());
      formData.append('language', language);

      const response = await fetch('http://localhost:8000/generate-audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (err) {
      console.error('Error playing target audio:', err);
      setError('Could not generate target audio');
    }
  };

  return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          AI Pronunciation Coach
        </h1>
        <p className="text-gray-600">
          Practice speaking naturally and get instant feedback on your pronunciation.
        </p>
      </header>

      {/* Main Card */}
      <main className="bg-white rounded-2xl shadow-xl p-8 mb-6">

        {/* Language Selector */}
        <section className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select Language
          </label>
          <div className="flex gap-4">
            {['en', 'es'].map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  setLanguage(lang);
                  setFeedback(null);
                  setAudioBlob(null);
                  setGeneratedPhrase('');
                }}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                  language === lang
                    ? 'bg-indigo-500 text-white shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {lang === 'en' ? 'English' : 'Spanish'}
              </button>
            ))}
          </div>
        </section>

        {/* Mode Selector */}
        <section className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Practice Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setMode('custom');
                setFeedback(null);
                setAudioBlob(null);
              }}
              className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                mode === 'custom'
                  ? 'bg-indigo-500 text-white shadow'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom Phrase
            </button>
            <button
              onClick={() => {
                setMode('difficulty');
                setFeedback(null);
                setAudioBlob(null);
                setGeneratedPhrase('');
              }}
              className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                mode === 'difficulty'
                  ? 'bg-indigo-500 text-white shadow'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Level Practice
            </button>
          </div>
        </section>

        {/* Custom Mode Input */}
        {mode === 'custom' && (
          <section className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Enter a word or phrase
            </label>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder={
                language === 'en'
                  ? 'Type any English phrase...'
                  : 'Escribe cualquier frase en español...'
              }
              className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none resize-none"
              rows="3"
            />
          </section>
        )}

        {/* Difficulty Mode */}
        {mode === 'difficulty' && (
          <section className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Difficulty
            </label>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {['easy', 'intermediate', 'difficult'].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                    difficulty === level
                      ? {
                          easy: 'bg-green-500 text-white shadow',
                          intermediate: 'bg-yellow-500 text-white shadow',
                          difficult: 'bg-red-500 text-white shadow',
                        }[level]
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>

            <button
              onClick={generateNewPhrase}
              disabled={generatingPhrase}
              className="w-full py-3 px-6 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {generatingPhrase ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Phrase'
              )}
            </button>
          </section>
        )}

        {/* Target Phrase */}
        {((mode === 'custom' && customText) ||
          (mode === 'difficulty' && generatedPhrase)) && (
          <section className="bg-indigo-50 rounded-lg p-6 mb-6">
            <div className="text-sm font-semibold text-indigo-600 mb-1">
              Practice saying:
            </div>
            <div className="text-2xl font-bold text-gray-800">
              "{getCurrentTargetText()}"
            </div>
          </section>
        )}

        {/* Audio Waveform Visualization */}
        {((mode === 'custom' && customText) ||
          (mode === 'difficulty' && generatedPhrase)) && (
          <section className="mb-6">
            <AudioWaveform isRecording={isRecording} audioStream={audioStream} />
          </section>
        )}

        {/* Recording Button */}
        <section className="flex items-center justify-center gap-4 mb-6">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={
                (mode === 'custom' && !customText.trim()) ||
                (mode === 'difficulty' && !generatedPhrase.trim())
              }
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-8 py-4 rounded-full shadow-lg transition-all transform hover:scale-105"
            >
              <Mic size={24} />
              Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-semibold px-8 py-4 rounded-full shadow-lg transition-all animate-pulse"
            >
              <Square size={24} />
              Stop Recording
            </button>
          )}

          {audioBlob && !isRecording && (
            <>
              <button
                onClick={playRecording}
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-6 py-4 rounded-full transition-all"
              >
                <Volume2 size={20} />
                Play
              </button>
              <button
                onClick={analyzeRecording}
                disabled={loading}
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 text-white font-semibold px-6 py-4 rounded-full transition-all"
              >
                {loading ? (
                  <Loader size={20} className="animate-spin" />
                ) : (
                  <CheckCircle size={20} />
                )}
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </>
          )}
        </section>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <div className="text-red-700">{error}</div>
          </div>
        )}

        {/* Feedback Display */}
        {feedback && (
          <div className="border-t pt-6 mt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              Pronunciation Feedback
            </h3>

            {/* Score Gauge and Metrics Chart Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Score Gauge */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 flex flex-col items-center justify-center">
                <div className="text-sm font-semibold text-gray-600 mb-4">
                  Overall Score
                </div>
                <ScoreGauge score={feedback.score} />
                {feedback.score < 100 && (
                  <button
                    onClick={playTargetAudio}
                    className="mt-6 flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg transition-all"
                  >
                    <Volume2 size={20} />
                    Listen to Target Audio
                  </button>
                )}
              </div>

              {/* Metrics Chart */}
              <MetricsChart
                audioFeatures={feedback.audio_features}
                prosodyFeedback={feedback.prosody_feedback || []}
                score={feedback.score}
              />
            </div>

            {feedback.audio_features && (
              <div className="bg-purple-50 rounded-lg p-4 mb-4">
                <div className="text-sm font-semibold text-purple-700 mb-2">
                  Audio Analysis
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Volume:</span>
                    <span className="ml-2 font-semibold text-gray-800">
                      {feedback.audio_features.rms_energy > 0.05
                        ? 'Good'
                        : 'Low'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Clarity:</span>
                    <span className="ml-2 font-semibold text-gray-800">
                      {feedback.audio_features.zcr < 0.1
                        ? 'Clear'
                        : 'Needs Work'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {feedback.prosody_feedback?.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-4 mb-4">
                <div className="text-sm font-semibold text-yellow-700 mb-2">
                  Speaking Style Feedback
                </div>
                <ul className="space-y-1">
                  {feedback.prosody_feedback.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <span className="text-yellow-600 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-4">
              <div className="text-sm font-semibold text-gray-600 mb-2">
                Transcription
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-gray-800 italic">
                "{feedback.transcription}"
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-600 mb-2">
                Feedback
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-gray-700 leading-relaxed">
                {feedback.feedback}
              </div>
            </div>

            {feedback.suggestions?.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-semibold text-gray-600 mb-2">
                  Tips for Improvement
                </div>
                <ul className="space-y-2">
                  {feedback.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">•</span>
                      <span className="text-gray-700">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="text-center text-sm text-gray-600">
        Powered by OpenAI Whisper & GPT-4
      </footer>
    </div>
  </div>
);
}
export default PronunciationApp;