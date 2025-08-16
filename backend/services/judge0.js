const axios = require('axios');

class Judge0Service {
  constructor() {
    this.apiUrl = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
    this.apiKey = process.env.JUDGE0_API_KEY; // RapidAPI key
    this.apiHost = process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com';
    if (!this.apiKey) {
      console.error('Judge0 API key is missing! Please set JUDGE0_API_KEY in .env');
    }
  }

  // Language mappings
  getLanguageId(language) {
    const languageMap = {
      'cpp': 54,      // C++ (GCC 9.2.0)
      'java': 62,     // Java (OpenJDK 13.0.1)
      'python': 71    // Python (3.8.1)
    };
    return languageMap[language] || 54;
  }

  // Submit code for execution
  async submitCode(sourceCode, languageId, stdin = '', expectedOutput = '') {
    try {
      // Encode inputs to base64
      const encodedSource = Buffer.from(sourceCode).toString('base64');
      const encodedInput = stdin ? Buffer.from(stdin).toString('base64') : '';
      const encodedExpected = expectedOutput ? Buffer.from(expectedOutput).toString('base64') : '';

      const payload = {
        source_code: encodedSource,
        language_id: languageId,
        stdin: encodedInput,
        expected_output: encodedExpected,
        cpu_time_limit: 2,      // 2 seconds
        memory_limit: 128000,   // 128 MB
        wall_time_limit: 5      // 5 seconds
      };

      const response = await axios.post(
        `${this.apiUrl}/submissions?base64_encoded=true&wait=true`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': this.apiHost
          }
        }
      );

      return this.processResponse(response.data);
    } catch (error) {
      console.error('Judge0 API Error:', error.response?.data || error.message);
      throw new Error('Code execution failed');
    }
  }

  // Process Judge0 response
  processResponse(data) {
    const result = {
      status: data.status?.description || 'Unknown',
      statusId: data.status?.id || 0,
      executionTime: parseFloat(data.time) || 0,
      memory: parseInt(data.memory) || 0,
      output: '',
      error: '',
      compileOutput: ''
    };

    // Decode base64 outputs
    if (data.stdout) {
      result.output = Buffer.from(data.stdout, 'base64').toString('utf-8');
    }
    
    if (data.stderr) {
      result.error = Buffer.from(data.stderr, 'base64').toString('utf-8');
    }
    
    if (data.compile_output) {
      result.compileOutput = Buffer.from(data.compile_output, 'base64').toString('utf-8');
    }

    // Determine if execution was successful
    result.success = data.status?.id === 3; // Status ID 3 = Accepted
    
    return result;
  }

  // Run code against multiple test cases
  async runTestCases(sourceCode, language, testCases) {
    const languageId = this.getLanguageId(language);
    const results = [];

    for (const testCase of testCases) {
      try {
        const result = await this.submitCode(
          sourceCode,
          languageId,
          testCase.input,
          testCase.output
        );

        // Check if output matches expected
        const actualOutput = result.output.trim();
        const expectedOutput = testCase.output.trim();
        const passed = actualOutput === expectedOutput && result.success;

        results.push({
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: result.output,
          passed,
          executionTime: result.executionTime,
          memory: result.memory,
          error: result.error,
          compileOutput: result.compileOutput,
          status: result.status
        });
      } catch (error) {
        results.push({
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: '',
          passed: false,
          executionTime: 0,
          memory: 0,
          error: error.message,
          status: 'Error'
        });
      }

      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return results;
  }

  // Calculate score based on test results
  calculateScore(testResults) {
    if (testResults.length === 0) return 0;

    const passedTests = testResults.filter(r => r.passed).length;
    const totalTests = testResults.length;
    const correctnessScore = (passedTests / totalTests) * 100;

    // Calculate average execution time (bonus for faster solutions)
    const avgTime = testResults.reduce((sum, r) => sum + r.executionTime, 0) / totalTests;
    const timeScore = Math.max(0, 100 - (avgTime * 10)); // Penalty for slower execution

    // Calculate average memory usage
    const avgMemory = testResults.reduce((sum, r) => sum + r.memory, 0) / totalTests;
    const memoryScore = Math.max(0, 100 - (avgMemory / 1000)); // Penalty for high memory usage

    return {
      correctness: correctnessScore,
      timeEfficiency: Math.min(100, timeScore),
      memoryEfficiency: Math.min(100, memoryScore),
      total: (correctnessScore * 0.7) + (timeScore * 0.2) + (memoryScore * 0.1),
      testResults: {
        passed: passedTests,
        total: totalTests
      }
    };
  }
}

module.exports = new Judge0Service();
