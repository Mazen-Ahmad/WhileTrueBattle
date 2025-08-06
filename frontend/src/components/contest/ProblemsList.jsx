import React from 'react';

const ProblemsList = ({ problems, selectedProblem, onSelectProblem, userSubmissions }) => {
  const getProblemStatus = (problemId) => {
    const submission = userSubmissions.find(s => s.problemId === problemId);
    if (!submission) return 'unsolved';
    
    // Check if last submission passed all tests
    if (submission.testResults?.passed === submission.testResults?.total) {
      return 'solved';
    }
    return 'attempted';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'solved':
        return '✅';
      case 'attempted':
        return '❌';
      default:
        return '⭕';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'solved':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'attempted':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty) => {
    const rating = parseInt(difficulty);
    if (rating <= 1200) return 'text-green-600';
    if (rating <= 1600) return 'text-yellow-600';
    if (rating <= 2000) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Problems</h2>
      </div>
      
      <div className="p-2 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100% - 80px)' }}>
        {problems.map((problem, index) => {
          const status = getProblemStatus(problem.id);
          const isSelected = selectedProblem?.id === problem.id;
          
          return (
            <div
              key={problem.id}
              onClick={() => onSelectProblem(problem)}
              className={`
                p-3 rounded-lg border-2 cursor-pointer transition-all
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : `${getStatusColor(status)} hover:shadow-md`
                }
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getStatusIcon(status)}</span>
                  <span className="font-medium text-sm">
                    {String.fromCharCode(65 + index)}. {problem.name}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${getDifficultyColor(problem.difficulty)}`}>
                  {problem.difficulty}
                </span>
                <div className="flex space-x-1">
                  {problem.tags?.slice(0, 2).map((tag, i) => (
                    <span 
                      key={i}
                      className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProblemsList;