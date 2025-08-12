export const formatProblemText = (text) => {
  if (!text) return text;
  
  // Replace LaTeX math symbols
  let formatted = text
    // Less than or equal
    .replace(/\\le\b/g, '≤')
    .replace(/\\leq\b/g, '≤')
    // Greater than or equal
    .replace(/\\ge\b/g, '≥')
    .replace(/\\geq\b/g, '≥')
    // Not equal
    .replace(/\\ne\b/g, '≠')
    .replace(/\\neq\b/g, '≠')
    // Subscripts (a_i -> aᵢ, x_1 -> x₁, etc.)
    .replace(/([a-zA-Z])_([0-9]+)/g, (match, letter, number) => {
      const subscripts = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
      const subscriptNum = number.split('').map(digit => subscripts[parseInt(digit)]).join('');
      return letter + subscriptNum;
    })
    .replace(/([a-zA-Z])_([a-zA-Z])/g, (match, letter, subscript) => {
      const subscriptMap = {
        'i': 'ᵢ', 'j': 'ⱼ', 'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 
        'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'x': 'ₓ'
      };
      return letter + (subscriptMap[subscript] || subscript);
    })
    // Superscripts (2^n -> 2ⁿ)
    .replace(/\^([0-9]+)/g, (match, number) => {
      const superscripts = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
      return number.split('').map(digit => superscripts[parseInt(digit)]).join('');
    })
    // Common mathematical symbols
    .replace(/\\times\b/g, '×')
    .replace(/\\cdot\b/g, '·')
    .replace(/\\infty\b/g, '∞')
    .replace(/\\sum\b/g, '∑')
    .replace(/\\prod\b/g, '∏')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    // Remove LaTeX math delimiters
    .replace(/\$\$\$([^$]*)\$\$\$/g, '$1')
    .replace(/\$\$([^$]*)\$\$/g, '$1')
    .replace(/\$([^$]*)\$/g, '$1')
    // HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&le;/g, '≤')
    .replace(/&ge;/g, '≥')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  return formatted;
};
