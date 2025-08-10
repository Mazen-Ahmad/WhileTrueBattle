import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import Button from '../common/Button';

const CodeEditor = ({ problem, onSubmit, contestActive }) => {
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [error, setError] = useState('');
  const [showFullStatement, setShowFullStatement] = useState(false);
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
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError('Please write some code before submitting');
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      const result = await onSubmit(code, language);
      setTestResults(result);
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

  const formatStatement = (statement) => {
    // Convert LaTeX math notation to readable format
    return statement
      .replace(/\$\$\$(.*?)\$\$\$/g, '$1')
      .replace(/\$\$(.*?)\$\$/g, '$1')
      .replace(/\$(.*?)\$/g, '$1');
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
      {/* Problem Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">
            {problem.name}
          </h2>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getDifficultyColor(problem.difficulty)}`}>
              {problem.difficulty}
            </span>
            <div className="text-sm text-gray-600">
              {problem.timeLimit}ms / {problem.memoryLimit}MB
            </div>
          </div>
        </div>

        {/* Problem Statement */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Problem Statement</h3>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className={`text-gray-700 leading-relaxed ${!showFullStatement ? 'line-clamp-4' : ''}`}>
              {formatStatement(problem.statement)}
            </div>
            {problem.statement.length > 200 && (
              <button
                onClick={() => setShowFullStatement(!showFullStatement)}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showFullStatement ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        </div>

        {/* Input/Output Format */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Input Format
            </h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-gray-700">
              {formatStatement(problem.inputFormat)}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Output Format
            </h4>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-gray-700">
              {formatStatement(problem.outputFormat)}
            </div>
          </div>
        </div>

        {/* Sample Test Cases */}
        {problem.sampleTests && problem.sampleTests.length > 0 && (
          <div className="space-y-4">
            {problem.sampleTests.slice(0, 2).map((test, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Sample Input {index + 1}:
                  </h4>
                  <pre className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-sm font-mono overflow-x-auto">
{test.input}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Sample Output {index + 1}:
                  </h4>
                  <pre className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-sm font-mono overflow-x-auto">
{test.output}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor Section */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Language Selector and Submit Button */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="flex space-x-2">
            {Object.entries(languageConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handleLanguageChange(key)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
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
            size="medium"
            className="px-6"
          >
            {submitting ? 'Submitting...' : 'Submit Solution'}
          </Button>
        </div>

        {/* Monaco Editor */}
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

        {/* Results/Error Section */}
        {(testResults || error) && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg mb-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-red-700 font-medium">Submission Error</p>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {testResults && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-green-700 font-medium">Submission Successful!</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-green-600 text-sm">
                        Problems Completed: <span className="font-semibold">{testResults.questionsCompleted}</span>
                      </span>
                      <span className="text-green-600 text-sm">
                        Score: <span className="font-semibold">{testResults.submission?.score?.total?.toFixed(1) || 'N/A'}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;