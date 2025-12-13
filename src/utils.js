/**
 * Produce a summary analysis object describing the provided source file content.
 * 
 * @param {string} content - Source file text to analyze.
 * @returns {{functions: string[], classes: string[], imports: string[], hasAsync: boolean, hasPromises: boolean, hasExports: boolean, isReactComponent: boolean, isApiRoute: boolean, hasDatabase: boolean, hasTypeScript: boolean, hasJSX: boolean, complexity: number}} An analysis object containing:
 *  - functions: list of function names extracted from the content.
 *  - classes: list of class names extracted from the content.
 *  - imports: list of import/require source strings found in the content.
 *  - hasAsync: `true` if the content contains the token "async", `false` otherwise.
 *  - hasPromises: `true` if the content contains the token "Promise", `false` otherwise.
 *  - hasExports: `true` if the content appears to export values (`export` or `module.exports`), `false` otherwise.
 *  - isReactComponent: `true` if the content references "React" or "jsx", `false` otherwise.
 *  - isApiRoute: `true` if both "req" and "res" tokens are present, indicating an API route, `false` otherwise.
 *  - hasDatabase: `true` if the content references common database identifiers (e.g., "db.", "mongoose", "prisma"), `false` otherwise.
 *  - hasTypeScript: `true` if the content appears to use TypeScript declarations ("interface" or "type "), `false` otherwise.
 *  - hasJSX: `true` if the content appears to contain JSX (the token "jsx" or both "<" and ">"), `false` otherwise.
 *  - complexity: numeric complexity score computed from control-structure patterns.
 */

function analyzeFileContent(content){
    return {
    functions: extractFunctions(content),
    classes: extractClasses(content),
    imports: extractImports(content),
    hasAsync: content.includes('async'),
    hasPromises: content.includes('Promise'),
    hasExports: content.includes('export') || content.includes('module.exports'),
    isReactComponent: content.includes('React') || content.includes('jsx'),
    isApiRoute: content.includes('req') && content.includes('res'),
    hasDatabase: content.includes('db.') || content.includes('mongoose') || content.includes('prisma'),
    hasTypeScript: content.includes('interface') || content.includes('type '),
    hasJSX: content.includes('jsx') || content.includes('<') && content.includes('>'),
    complexity: calculateComplexity(content)
  };
}

/**
 * Extracts declared function names from source code text.
 *
 * Detects named function declarations, function expressions or arrow functions assigned to identifiers, and exported function declarations.
 * @param {string} content - Source code to analyze.
 * @returns {string[]} An array of unique function names found in the content.
 */
function extractFunctions(content) {
  const functionRegex = /(?:function\s+(\w+)|(\w+)\s*=\s*(?:async\s+)?(?:function|\(.*?\)\s*=>)|export\s+(?:async\s+)?function\s+(\w+))/g;
  const matches = [];
  let match;
  while ((match = functionRegex.exec(content)) !== null) {
    matches.push(match[1] || match[2] || match[3]);
  }
  return [...new Set(matches)].filter(Boolean);
}

/**
 * Extracts class names declared in the given source content.
 * @param {string} content - Source code to scan for `class` declarations.
 * @returns {string[]} An array of class names found (empty if none).
 */
function extractClasses(content) {
  const classRegex = /(?:class\s+(\w+)|export\s+class\s+(\w+))/g;
  const matches = [];
  let match;
  while ((match = classRegex.exec(content)) !== null) {
    matches.push(match[1] || match[2]);
  }
  return matches;
}

/**
 * Extracts module import sources from ES module `import ... from 'module'` statements and CommonJS `require('module')` calls in the provided source text.
 * @param {string} content - Source code to scan for import and require statements.
 * @returns {string[]} An array of module source strings (e.g. 'fs', './module') in the order they are found.
 */
function extractImports(content) {
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  const imports = [];
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  while ((match = requireRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

/**
 * Estimates a simple cyclomatic-like complexity score from source text.
 * @param {string} content - Source code or text to analyze for control-flow constructs.
 * @returns {number} A numeric complexity score (starts at 1 and increments for each occurrence of control structures such as `if`, `else if`, `switch`, `case`, `for`, `while`, `catch`, and logical `&&`/`||`).
 */
function calculateComplexity(content) {
  // Simple complexity calculation based on control structures
  const complexityPatterns = [
    /if\s*\(/g,
    /else\s+if/g,
    /switch\s*\(/g,
    /case\s+/g,
    /for\s*\(/g,
    /while\s*\(/g,
    /catch\s*\(/g,
    /&&|\|\|/g
  ];
  
  let complexity = 1; // Base complexity
  complexityPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  });
  
  return complexity;
}

/**
 * Map a testing framework identifier to its conventional test file extension.
 * @param {string} framework - Testing framework name ('jest', 'vitest', 'mocha'). Other values are allowed.
 * @returns {string} The file extension to use for test files: '.test.js' for Jest (default), '.test.ts' for Vitest, or '.spec.js' for Mocha.
 */
function getTestExtension(framework) {
  switch (framework) {
    case 'jest':
      return '.test.js';
    case 'vitest':
      return '.test.ts';
    case 'mocha':
      return '.spec.js';
    default:
      return '.test.js';
  }
}

/**
 * Selects and runs a framework-specific generator to produce an enhanced test file template.
 * @param {string} baseName - Base name used in test suite titles and import targets.
 * @param {Object} analysis - File analysis object produced by analyzeFileContent (functions, imports, flags, complexity).
 * @param {string} framework - Target test framework identifier ('jest', 'vitest', 'mocha'); defaults to 'jest' when unrecognized.
 * @param {Object} file - Original file metadata (e.g., { name, path }) used for header/comments in the template.
 * @returns {string} The generated test file template as a string.
 */
function generateEnhancedTestTemplate(baseName, analysis, framework, file) {
  const templates = {
    jest: generateJestTemplate,
    vitest: generateVitestTemplate,
    mocha: generateMochaTemplate
  };
  
  const generator = templates[framework] || templates.jest;
  return generator(baseName, analysis, file);
}

/**
 * Generate a Jest test file template string for a given module or React component.
 *
 * The produced template includes imports (or placeholders), per-function describe/test blocks,
 * optional React render test, API-route test placeholder, database mock note, and a complexity section
 * based on the provided analysis.
 *
 * @param {string} baseName - File base name (import name / filename without extension) used in imports and describes.
 * @param {object} analysis - Static analysis summary (as returned by analyzeFileContent) containing:
 *   - functions: Array of function names found in the file
 *   - classes: Array of class names found in the file
 *   - imports: Array of import source strings
 *   - hasAsync: boolean indicating presence of async functions
 *   - hasPromises: boolean indicating presence of Promise usage
 *   - hasExports: boolean indicating whether the file exports symbols
 *   - isReactComponent: boolean indicating React component presence
 *   - isApiRoute: boolean indicating API route handler presence
 *   - hasDatabase: boolean indicating database usage
 *   - hasTypeScript: boolean indicating TypeScript constructs
 *   - hasJSX: boolean indicating JSX usage
 *   - complexity: numeric complexity score
 * @param {object} file - Source file metadata; expected to include at least a `name` property used in the template header.
 * @returns {string} A string containing the complete Jest test file scaffold tailored to the analysis and file. 
 */
function generateJestTemplate(baseName, analysis, file) {
  return `// Enhanced generated test for ${file.name}
${analysis.imports.map(imp => {
  if (imp.startsWith('./') || imp.startsWith('../')) {
    return `// import from '${imp}'; // TODO: Add proper imports`;
  }
  return `// Mock: ${imp}`;
}).join('\n')}

${analysis.functions.length > 0 ? `import { ${analysis.functions.join(', ')} } from './${baseName}';` : `import ${baseName} from './${baseName}';`}

${analysis.isReactComponent ? `import { render, screen } from '@testing-library/react';` : ''}
${analysis.hasDatabase ? `// TODO: Mock database connections` : ''}

describe('${baseName}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

${analysis.functions.map(func => `
  describe('${func}', () => {
    test('should be defined', () => {
      expect(${func}).toBeDefined();
    });
    
    ${analysis.hasAsync ? `test('should handle async operations', async () => {
      // TODO: Add async test for ${func}
    });` : ''}
    
    test('should handle valid inputs', () => {
      // TODO: Test ${func} with valid inputs
    });
    
    test('should handle edge cases', () => {
      // TODO: Test ${func} with edge cases (null, undefined, empty)
    });
  });`).join('\n')}

${analysis.isReactComponent ? `
  test('should render without crashing', () => {
    render(<${baseName} />);
  });` : ''}

${analysis.isApiRoute ? `
  test('should handle API requests correctly', () => {
    // TODO: Test API endpoint logic
  });` : ''}

  describe('Complexity Tests (Complexity: ${analysis.complexity})', () => {
    ${analysis.complexity > 5 ? `test('should handle complex logic paths', () => {
      // TODO: Test complex execution paths
    });` : ''}
  });
});
`;
}

/**
 * Generate a Vitest test file template for a module, using the provided analysis to tailor imports and example tests.
 *
 * @param {string} baseName - Module basename used for imports and the top-level describe block.
 * @param {object} analysis - Analysis object; expected keys include `functions` (array of function names) and `hasAsync` (boolean).
 * @param {object} file - Source file metadata; expected to include `name` (string) for the header comment.
 * @returns {string} The generated Vitest test file content as a string, including imports, a describe block, a defined-value test, and an optional async test scaffold.
 */
function generateVitestTemplate(baseName, analysis, file) {
  return `// Enhanced generated test for ${file.name}
import { describe, test, expect, beforeEach, vi } from 'vitest';
${analysis.functions.length > 0 ? `import { ${analysis.functions.join(', ')} } from './${baseName}';` : `import ${baseName} from './${baseName}';`}

describe('${baseName}', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should be defined', () => {
    expect(${analysis.functions[0] || baseName}).toBeDefined();
  });

  ${analysis.hasAsync ? `test('should handle async operations', async () => {
    // TODO: Add async test cases
  });` : ''}
});
`;
}

/**
 * Generate a Mocha + Chai test file template for the given module.
 *
 * Produces a scaffolded test file that requires Chai's `expect`, imports either named functions
 * or the default module export, includes a basic `describe` block for `baseName`, a definition
 * assertion for the first exported function (or the module), and an optional async test when
 * the analysis indicates async usage.
 *
 * @param {string} baseName - Base filename (without extension) used to import the module under test.
 * @param {Object} analysis - File analysis summary. Only `functions` (array of exported function names)
 *                            and `hasAsync` (boolean) are used to shape the template.
 * @param {Object} file - File metadata; `file.name` is inserted into the generated header comment.
 * @returns {string} A string containing the generated Mocha/Chai test file content.
function generateMochaTemplate(baseName, analysis, file) {
  return `// Enhanced generated test for ${file.name}
const { expect } = require('chai');
${analysis.functions.length > 0 ? `const { ${analysis.functions.join(', ')} } = require('./${baseName}');` : `const ${baseName} = require('./${baseName}');`}

describe('${baseName}', () => {
  beforeEach(() => {
    // Setup
  });

  it('should be defined', () => {
    expect(${analysis.functions[0] || baseName}).to.not.be.undefined;
  });

  ${analysis.hasAsync ? `it('should handle async operations', async () => {
    // TODO: Add async test cases
  });` : ''}
});
`;
}

module.exports = {
  analyzeFileContent,
  extractFunctions,
  extractClasses,
  extractImports,
  calculateComplexity,
  getTestExtension,
  generateEnhancedTestTemplate,
  generateJestTemplate,
  generateVitestTemplate,
  generateMochaTemplate
};