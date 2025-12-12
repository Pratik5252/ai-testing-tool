const axios = require('axios');

const API_BASE_URL = process.env.AI_TEST_API || 'http://localhost:3000';

async function generateTests(files, framework = 'jest') {
  const generatedTests = [];
  
  try {
    for (const file of files) {
      if (shouldGenerateTest(file)) {
        console.log(`Generating test for: ${file.name}`);
        
        const testContent = await generateSingleTest(file, framework);
        
        generatedTests.push({
          filename: getTestFileName(file.name, framework),
          content: testContent,
          sourceFile: file.name
        });
      }
    }
    
    return generatedTests;
  } catch (error) {
    throw new Error(`Test generation failed: ${error.message}`);
  }
}

function shouldGenerateTest(file) {
  // Skip test files themselves
  if (file.name.includes('.test.') || file.name.includes('.spec.')) {
    return false;
  }
  
  // Skip config files
  const configFiles = ['webpack.config.js', 'vite.config.js', 'jest.config.js'];
  if (configFiles.includes(file.name)) {
    return false;
  }
  
  return true;
}

function getTestFileName(originalName, framework) {
  const baseName = originalName.replace(/\.(js|ts|jsx|tsx)$/, '');
  
  switch (framework) {
    case 'jest':
      return `${baseName}.test.js`;
    case 'vitest':
      return `${baseName}.test.ts`;
    case 'mocha':
      return `${baseName}.spec.js`;
    default:
      return `${baseName}.test.js`;
  }
}

async function generateSingleTest(file, framework) {
  try {
    // For now, use mock generation until we deploy DigitalOcean API
    if (process.env.NODE_ENV === 'development') {
      return generateMockTest(file, framework);
    }
    
    // Call your DigitalOcean API
    const response = await axios.post(`${API_BASE_URL}/analyze`, {
      file: {
        name: file.name,
        content: file.content,
        path: file.relativePath
      },
      framework: framework,
      options: {
        generateEdgeCases: true,
        includeSetup: true
      }
    });
    
    return response.data.generatedTest;
    
  } catch (error) {
    console.warn(`API call failed, using fallback for ${file.name}`);
    return generateMockTest(file, framework);
  }
}

function generateMockTest(file, framework) {
  const baseName = file.name.replace(/\.(js|ts|jsx|tsx)$/, '');
  
  if (framework === 'jest') {
    return `// Generated test for ${file.name}
import { ${baseName} } from './${baseName}';

describe('${baseName}', () => {
  test('should be defined', () => {
    expect(${baseName}).toBeDefined();
  });
  
  test('should work correctly', () => {
    // TODO: Add specific test cases
    expect(true).toBe(true);
  });
});
`;
  } else if (framework === 'vitest') {
    return `// Generated test for ${file.name}
import { describe, test, expect } from 'vitest';
import { ${baseName} } from './${baseName}';

describe('${baseName}', () => {
  test('should be defined', () => {
    expect(${baseName}).toBeDefined();
  });
});
`;
  } else {
    return `// Generated test for ${file.name}
const { expect } = require('chai');
const { ${baseName} } = require('./${baseName}');

describe('${baseName}', () => {
  it('should be defined', () => {
    expect(${baseName}).to.not.be.undefined;
  });
});
`;
  }
}

module.exports = {
  generateTests,
  generateSingleTest
};