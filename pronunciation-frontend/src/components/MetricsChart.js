import React from 'react';

const MetricsChart = ({ audioFeatures, prosodyFeedback, score }) => {
  // Calculate individual metric scores
  const calculateMetrics = () => {
    const volumeScore = audioFeatures.rms_energy > 0.05 ? 85 : audioFeatures.rms_energy > 0.01 ? 60 : 40;
    const clarityScore = audioFeatures.zcr < 0.1 ? 90 : audioFeatures.zcr < 0.15 ? 70 : 50;

    // Prosody score based on feedback count (fewer issues = better)
    const prosodyScore = prosodyFeedback.length === 0 ? 95 :
                         prosodyFeedback.length === 1 ? 75 :
                         prosodyFeedback.length === 2 ? 60 : 45;

    // Accuracy is the overall score
    const accuracyScore = score;

    return [
      { label: 'Accuracy', score: accuracyScore, color: '#6366f1', bgColor: '#e0e7ff' },
      { label: 'Volume', score: volumeScore, color: '#8b5cf6', bgColor: '#ede9fe' },
      { label: 'Clarity', score: clarityScore, color: '#ec4899', bgColor: '#fce7f3' },
      { label: 'Prosody', score: prosodyScore, color: '#14b8a6', bgColor: '#ccfbf1' },
    ];
  };

  const metrics = calculateMetrics();
  const maxScore = 100;

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h4 className="text-sm font-semibold text-gray-700 mb-4">Performance Breakdown</h4>
      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={index}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">{metric.label}</span>
              <span className="text-sm font-bold" style={{ color: metric.color }}>
                {metric.score}%
              </span>
            </div>
            <div className="relative w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: metric.bgColor }}>
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${(metric.score / maxScore) * 100}%`,
                  backgroundColor: metric.color,
                }}
              >
                {/* Shine effect */}
                <div className="h-full w-full opacity-30 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span>Pronunciation match</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Audio level</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-500"></div>
            <span>Speech clarity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-teal-500"></div>
            <span>Natural rhythm</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsChart;
