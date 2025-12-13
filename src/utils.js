/*
    Shared utilities for code analysis and test generation
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

function extractFunctions(content) {
  const functionRegex = /(?:function\s+(\w+)|(\w+)\s*=\s*(?:async\s+)?(?:function|\(.*?\)\s*=>)|export\s+(?:async\s+)?function\s+(\w+))/g;
  const matches = [];
  let match;
  while ((match = functionRegex.exec(content)) !== null) {
    matches.push(match[1] || match[2] || match[3]);
  }
  return [...new Set(matches)].filter(Boolean);
}

function extractClasses(content) {
  const classRegex = /(?:class\s+(\w+)|export\s+class\s+(\w+))/g;
  const matches = [];
  let match;
  while ((match = classRegex.exec(content)) !== null) {
    matches.push(match[1] || match[2]);
  }
  return matches;
}

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

function generateEnhancedTestTemplate(baseName, analysis, framework, file) {
  const templates = {
    jest: generateJestTemplate,
    vitest: generateVitestTemplate,
    mocha: generateMochaTemplate
  };
  
  const generator = templates[framework] || templates.jest;
  return generator(baseName, analysis, file);
}

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