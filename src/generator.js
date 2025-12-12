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

module.exports = {
  generateTests
}