import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import Button from '../common/Button';
import { formatProblemText } from '../../utils/textFormatter';

const CodeEditor = ({ problem, onSubmit, contestActive }) => {
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [error, setError] = useState('');
  const [showProblemDetails, setShowProblemDetails] = useState(false);
  const [executionResults, setExecutionResults] = useState(null);
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  const editorRef = useRef(null);

  const languageTemplates = {
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    // Your solution here
    
    return 0;
}`,
    java: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        
        // Your solution here
        
    }
}`,
    python: `# Your solution here

`
  };

  const languageConfig = {
    cpp: { id: 'cpp', name: 'C++', monacoLang: 'cpp' },
    java: { id: 'java', name: 'Java', monacoLang: 'java' },
    python: { id: 'python', name: 'Python', monacoLang: 'python' }
  };

  React.useEffect(() => {
    if (problem && !code) {
      setCode(languageTemplates[language]);
    }
  }, [problem, language]);

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setCode(languageTemplates[newLanguage]);
    setTestResults(null);
    setError('');
    setExecutionResults(null);
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError('Please write some code before submitting');
      return;
    }

    setSubmitting(true);
    setError('');
    setExecutionResults(null);
    
    try {
      const result = await onSubmit(code, language);
      setTestResults(result);
      setExecutionResults(result.submission?.testResults);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Set editor theme
    monaco.editor.setTheme('vs-dark');
    
    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, handleSubmit);
  };

  const getDifficultyColor = (rating) => {
    const ratingNum = parseInt(rating);
    if (ratingNum <= 1200) return 'bg-green-100 text-green-800 border-green-300';
    if (ratingNum <= 1600) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (ratingNum <= 2000) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  // Test Results Panel Component
  const TestResultsPanel = ({ results }) => {
    if (!results || !results.details) return null;

    return (
      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-gray-900">Test Results</h4>
          <button
            onClick={() => setShowDetailedResults(!showDetailedResults)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {showDetailedResults ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-green-50 p-3 rounded">
            <div className="text-lg font-bold text-green-600">
              {results.passed}/{results.total}
            </div>
            <div className="text-sm text-green-600">Tests Passed</div>
          </div>
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-lg font-bold text-blue-600">
              {results.executionTime?.toFixed(3) || '0.000'}s
            </div>
            <div className="text-sm text-blue-600">Max Time</div>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <div className="text-lg font-bold text-purple-600">
              {(results.memoryUsed / 1024).toFixed(1)}KB
            </div>
            <div className="text-sm text-purple-600">Max Memory</div>
          </div>
        </div>

        {showDetailedResults && results.details && (
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {results.details.map((detail, index) => (
              <div
                key={index}
                className={`p-3 rounded border-l-4 ${
                  detail.passed
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">
                    Test Case {index + 1}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      detail.passed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {detail.passed ? 'PASSED' : 'FAILED'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {detail.executionTime?.toFixed(3) || '0.000'}s
                    </span>
                  </div>
                </div>

                {detail.error && (
                  <div className="mb-2">
                    <div className="text-sm font-medium text-red-700">Error:</div>
                    <pre className="text-xs bg-red-100 p-2 rounded overflow-x-auto">
                      {detail.error}
                    </pre>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="font-medium text-gray-700">Input:</div>
                    <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
                      {detail.input || 'No input'}
                    </pre>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Expected:</div>
                    <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
                      {detail.expectedOutput}
                    </pre>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Your Output:</div>
                    <pre className={`p-2 rounded overflow-x-auto ${
                      detail.passed ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {detail.actualOutput || 'No output'}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const formatStatement = (statement) => {
    return formatProblemText(statement);
  };

  if (!problem) {
    return (
      <div className="bg-white rounded-lg shadow-md h-full flex items-center justify-center">
        <p className="text-gray-500">Select a problem to start coding</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
      {/* Compact Problem Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-gray-900 truncate">
            {problem.name}
          </h2>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(problem.difficulty)}`}>
              {problem.difficulty}
            </span>
            <Button
              size="small"
              variant="outline"
              onClick={() => setShowProblemDetails(!showProblemDetails)}
              className="text-xs px-2 py-1"
            >
              {showProblemDetails ? 'Hide' : 'Details'}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>⏱️ {problem.timeLimit}ms • 💾 {problem.memoryLimit}MB</span>
        </div>

        {/* Collapsible Problem Details */}
        {showProblemDetails && (
          <div className="mt-4 max-h-60 overflow-y-auto custom-scrollbar">
            <div className="space-y-3">
              {/* Problem Statement */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Problem Statement</h4>
                <div className="text-gray-300 leading-relaxed whitespace-pre-line bg-gray-800 p-4 rounded-lg">
                  {formatProblemText(problem.statement)}
                </div>
              </div>

              {/* Input/Output Format */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1 text-sm">Input Format</h4>
                  <div className="text-gray-300 whitespace-pre-line bg-gray-800 p-4 rounded-lg">
                    {formatProblemText(problem.inputFormat)}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1 text-sm">Output Format</h4>
                  <div className="text-gray-300 whitespace-pre-line bg-gray-800 p-4 rounded-lg">
                    {formatProblemText(problem.outputFormat)}
                  </div>
                </div>
              </div>

              {/* Sample Test Cases */}
              {problem.sampleTests && problem.sampleTests.length > 0 && (
                <div className="space-y-2">
                  {problem.sampleTests.slice(0, 1).map((test, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-1 text-sm">Sample Input:</h4>
                        <pre className="bg-gray-100 border rounded p-2 text-xs font-mono overflow-x-auto">
                          {test.input}
                        </pre>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-1 text-sm">Sample Output:</h4>
                        <pre className="bg-gray-100 border rounded p-2 text-xs font-mono overflow-x-auto">
                          {test.output}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Editor Section - Takes up most space */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Language Selector and Submit Button */}
        <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="flex space-x-2">
            {Object.entries(languageConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handleLanguageChange(key)}
                className={`
                  px-3 py-1.5 rounded text-sm font-medium transition-all duration-200
                  ${language === key 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }
                `}
              >
                {config.name}
              </button>
            ))}
          </div>

          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={!contestActive}
            variant="primary"
            size="small"
            className="px-4"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>

        {/* Monaco Editor - Main area */}
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            language={languageConfig[language].monacoLang}
            value={code}
            onChange={setCode}
            onMount={handleEditorDidMount}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              tabSize: 4,
              insertSpaces: true,
              lineNumbers: 'on',
              roundedSelection: false,
              cursorStyle: 'line',
              renderLineHighlight: 'line',
            }}
          />
        </div>

        {/* Results/Error Section - Expandable */}
        {(testResults || error || executionResults) && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 max-h-80 overflow-y-auto custom-scrollbar">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 font-medium">Execution Error</p>
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {testResults && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-green-700 font-medium">Submitted Successfully!</p>
                    <div className="flex justify-between items-center text-xs text-green-600 mt-1">
                      <span>Score: {testResults.score?.total?.toFixed(1) || 'N/A'}</span>
                      <span>Problems Solved: {testResults.questionsCompleted}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {executionResults && <TestResultsPanel results={executionResults} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
