import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import Button from '../common/Button';

const CodeEditor = ({ problem, onSubmit, contestActive }) => {
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [error, setError] = useState('');
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
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-semibold text-gray-900">
            {problem.name}
          </h2>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            {problem.difficulty}
          </span>
        </div>
        
        <div className="flex space-x-2 mb-3">
          {problem.tags?.slice(0, 3).map((tag, i) => (
            <span 
              key={i}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Problem Statement */}
        <div className="text-sm text-gray-700 mb-3">
          <p>{problem.statement}</p>
        </div>

        {/* Sample Test Cases */}
        {problem.sampleTests && problem.sampleTests.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Sample Input:</h4>
              <pre className="bg-gray-50 p-2 rounded border text-xs">
                {problem.sampleTests[0].input}
              </pre>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Sample Output:</h4>
              <pre className="bg-gray-50 p-2 rounded border text-xs">
                {problem.sampleTests[0].output}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Editor Section */}
      <div className="flex-1 flex flex-col">
        {/* Language Selector and Submit Button */}
        <div className="p-3 border-b border-gray-200 flex justify-between items-center">
          <div className="flex space-x-2">
            {Object.entries(languageConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handleLanguageChange(key)}
                className={`
                  px-3 py-1 rounded text-sm font-medium transition-colors
                  ${language === key 
                    ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          >
            Submit Code
          </Button>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1">
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
            }}
          />
        </div>

        {/* Results/Error Section */}
        {(testResults || error) && (
          <div className="p-3 border-t border-gray-200">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-2">
                {error}
              </div>
            )}
            
            {testResults && (
              <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Submission Successful!</span>
                  <span className="text-sm">
                    Score: {testResults.submission?.score?.total?.toFixed(1) || 'N/A'}
                  </span>
                </div>
                <div className="text-sm">
                  Questions Completed: <span className="font-medium">{testResults.questionsCompleted}</span>
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
