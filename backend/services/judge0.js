const axios = require('axios');

class Judge0Service {
  constructor() {
    this.baseURL = process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com';
    this.apiKey = process.env.JUDGE0_API_KEY;
  }

  async submitCode(code, language, input = '', expectedOutput = '') {
    try {
      const languageMap = {
        'cpp': 54,      // C++ (GCC 9.2.0)
        'java': 62,     // Java (OpenJDK 13.0.1)
        'python': 71    // Python (3.8.1)
      };

      const submission = {
        source_code: Buffer.from(code).toString('base64'),
        language_id: languageMap[language] || 54,
        stdin: Buffer.from(input).toString('base64'),
        expected_output: expectedOutput ? Buffer.from(expectedOutput).toString('base64') : null
      };

      const headers = {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      };

      // Submit code
      const submitResponse = await axios.post(
        `${this.baseURL}/submissions?base64_encoded=true&wait=true`,
        submission,
        { headers }
      );

      return this.formatResult(submitResponse.data);
    } catch (error) {
      console.error('Judge0 error:', error);
      throw new Error('Code execution failed');
    }
  }

  async runTestCases(code, language, testCases) {
    const results = [];
    let totalTime = 0;
    let totalMemory = 0;
    let passedTests = 0;

    for (const testCase of testCases) {
      try {
        const result = await this.submitCode(code, language, testCase.input, testCase.output);
        results.push(result);
        
        if (result.status === 'accepted') {
          passedTests++;
        }
        
        totalTime += result.time || 0;
        totalMemory = Math.max(totalMemory, result.memory || 0);
      } catch (error) {
        results.push({
          status: 'error',
          message: error.message,
          time: 0,
          memory: 0
        });
      }
    }

    return {
      results,
      summary: {
        passed: passedTests,
        total: testCases.length,
        totalTime,
        maxMemory: totalMemory,
        verdict: passedTests === testCases.length ? 'ACCEPTED' : 'WRONG_ANSWER'
      }
    };
  }

  formatResult(judgeResult) {
    const statusMap = {
      1: 'queued',
      2: 'processing',
      3: 'accepted',
      4: 'wrong_answer',
      5: 'time_limit_exceeded',
      6: 'compilation_error',
      7: 'runtime_error',
      8: 'runtime_error',
      9: 'runtime_error',
      10: 'runtime_error',
      11: 'runtime_error',
      12: 'runtime_error',
      13: 'internal_error',
      14: 'exec_format_error'
    };

    return {
      status: statusMap[judgeResult.status?.id] || 'error',
      time: parseFloat(judgeResult.time) || 0,
      memory: parseInt(judgeResult.memory) || 0,
      stdout: judgeResult.stdout ? Buffer.from(judgeResult.stdout, 'base64').toString() : '',
      stderr: judgeResult.stderr ? Buffer.from(judgeResult.stderr, 'base64').toString() : '',
      compile_output: judgeResult.compile_output ? Buffer.from(judgeResult.compile_output, 'base64').toString() : '',
      message: judgeResult.status?.description || 'Unknown error'
    };
  }
}

module.exports = new Judge0Service();