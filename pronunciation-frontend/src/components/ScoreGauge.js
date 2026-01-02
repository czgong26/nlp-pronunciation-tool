import React from 'react';

const ScoreGauge = ({ score }) => {
  const radius = 70;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Color based on score
  const getColor = (score) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle */}
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.8s ease-in-out',
            }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        {/* Score text in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold" style={{ color }}>
            {score}
          </div>
          <div className="text-sm text-gray-500 font-medium">out of 100</div>
        </div>
      </div>
      {/* Score label */}
      <div className="mt-4 text-center">
        <div className="text-sm font-semibold text-gray-700">
          {score >= 90 && 'Excellent!'}
          {score >= 80 && score < 90 && 'Great Job!'}
          {score >= 70 && score < 80 && 'Good Work!'}
          {score >= 60 && score < 70 && 'Keep Practicing!'}
          {score < 60 && 'Need More Practice'}
        </div>
      </div>
    </div>
  );
};

export default ScoreGauge;
