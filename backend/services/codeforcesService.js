const axios = require('axios');

class CodeforcesService {
  constructor() {
    this.baseURL = 'https://codeforces.com/api';
  }

  // Fetch problems from Codeforces
  async fetchProblems() {
    try {
      const response = await axios.get(`${this.baseURL}/problemset.problems`);
      return response.data.result.problems;
    } catch (error) {
      console.error('Error fetching Codeforces problems:', error);
      throw new Error('Failed to fetch problems from Codeforces');
    }
  }

  // Filter problems by difficulty range
  filterProblemsByDifficulty(problems, difficultyRange) {
    const ranges = {
      '800-1200': { min: 800, max: 1200 },
      '1200-1600': { min: 1200, max: 1600 },
      '1600-2000': { min: 1600, max: 2000 },
      '2000+': { min: 2000, max: 5000 }
    };

    const range = ranges[difficultyRange] || ranges['800-1200'];
    
    return problems.filter(problem => {
      const rating = problem.rating;
      return rating && rating >= range.min && rating <= range.max;
    });
  }

  // Get random problems for contest
  async getContestProblems(count, difficulty) {
    try {
      const allProblems = await this.fetchProblems();
      const filteredProblems = this.filterProblemsByDifficulty(allProblems, difficulty);
      
      // Remove problems without proper samples or descriptions
      const validProblems = filteredProblems.filter(problem => 
        problem.name && problem.rating && !problem.name.includes('*special*')
      );

      // Shuffle and select random problems
      const shuffled = validProblems.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    } catch (error) {
      console.error('Error getting contest problems:', error);
      throw error;
    }
  }

  // Get problem details with samples
  async getProblemDetails(contestId, index) {
    try {
      // Note: Codeforces doesn't provide sample I/O via API
      // We'll simulate this or scrape if needed in production
      return {
        statement: `Problem statement for ${contestId}${index}`,
        inputFormat: 'Input format description',
        outputFormat: 'Output format description',
        sampleTests: [
          {
            input: '3\n1 2 3',
            output: '6'
          }
        ]
      };
    } catch (error) {
      console.error('Error fetching problem details:', error);
      throw error;
    }
  }
}

module.exports = new CodeforcesService();
