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
        return '⚠️';
      default:
        return '⭕';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'solved':
        return 'bg-green-50 border-green-300 text-green-800';
      case 'attempted':
        return 'bg-yellow-50 border-yellow-300 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-300 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty) => {
    const rating = parseInt(difficulty);
    if (rating <= 1200) return 'text-green-600 bg-green-100';
    if (rating <= 1600) return 'text-blue-600 bg-blue-100';
    if (rating <= 2000) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getDifficultyLabel = (difficulty) => {
    const rating = parseInt(difficulty);
    if (rating <= 1200) return 'Easy';
    if (rating <= 1600) return 'Medium';
    if (rating <= 2000) return 'Hard';
    return 'Expert';
  };

  const truncateTitle = (title, maxLength = 25) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  return (
    <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <h2 className="text-lg font-bold text-gray-900 flex items-center">
          <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
          Problems ({problems.length})
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {problems.map((problem, index) => {
            const status = getProblemStatus(problem.id);
            const isSelected = selectedProblem?.id === problem.id;
            
            return (
              <div
                key={problem.id}
                onClick={() => onSelectProblem(problem)}
                className={`
                  relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md
                  ${isSelected 
                    ? 'border-purple-500 bg-purple-50 shadow-lg transform scale-[1.02]' 
                    : `${getStatusColor(status)} hover:border-gray-400 hover:bg-opacity-80`
                  }
                `}
              >
                {/* Status indicator */}
                <div className="absolute top-2 right-2">
                  <span className="text-lg" title={status}>
                    {getStatusIcon(status)}
                  </span>
                </div>
                
                <div className="pr-8">
                  {/* Problem letter and title */}
                  <div className="flex items-start mb-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-sm font-bold mr-2 flex-shrink-0">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <h3 className="font-semibold text-sm leading-tight" title={problem.name}>
                      {truncateTitle(problem.name)}
                    </h3>
                  </div>
                  
                  {/* Rating and difficulty */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
                        {getDifficultyLabel(problem.difficulty)}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {problem.difficulty}
                      </span>
                    </div>
                    
                    {/* Submission count indicator */}
                    {userSubmissions.filter(s => s.problemId === problem.id).length > 0 && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                        {userSubmissions.filter(s => s.problemId === problem.id).length} attempts
                      </span>
                    )}
                  </div>

                  {/* Time and memory limits */}
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>⏱️ {problem.timeLimit}ms</span>
                    <span>💾 {problem.memoryLimit}MB</span>
                  </div>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 rounded-l-lg"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress:</span>
          <span>
            {userSubmissions.length > 0 ? 
              `${new Set(userSubmissions.map(s => s.problemId)).size}/${problems.length} solved` 
              : `0/${problems.length} solved`
            }
          </span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${problems.length > 0 ? (new Set(userSubmissions.map(s => s.problemId)).size / problems.length) * 100 : 0}%`
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ProblemsList;