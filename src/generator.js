const axios = require('axios');
const {
  analyzeFileContent,
  generateEnhancedTestTemplate
} = require('./utils');

const API_BASE_URL = process.env.AI_TEST_API || 'http://localhost:3000';

async function generateTests(files, framework = 'jest') {
  const generatedTests = [];
  
  try {
    for (const file of files) {
      if (shouldGenerateTest(file)) {
        console.log(`🔍 Generating test for: ${file.name}`);
        
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
  if (file.name.includes('.test.') || file.name.includes('.spec.')) {
    return false;
  }
  
  const configFiles = ['webpack.config.js', 'vite.config.js', 'jest.config.js', 'package.json'];
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
    console.log(`📡 Connecting to server: ${API_BASE_URL}/analyze`);
    
    const response = await axios.post(`${API_BASE_URL}/analyze`, {
      file: {
        name: file.name,
        content: file.content,
        path: file.relativePath || file.path
      },
      framework: framework,
      options: {
        generateEdgeCases: true,
        includeSetup: true
      }
    }, {
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log(`✅ Test generated via ${response.data.metadata.method} for ${file.name}`);
      return response.data.generatedTest;
    } else {
      throw new Error('Server returned unsuccessful response');
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.warn(`🔄 Server unavailable, using local fallback for ${file.name}`);
      return generateLocalFallbackTest(file, framework);
    } else if (error.response) {
      console.warn(`⚠️ Server error (${error.response.status}): ${error.response.data.error}`);
      return generateLocalFallbackTest(file, framework);
    } else {
      console.warn(`⚠️ Network error: ${error.message}`);
      return generateLocalFallbackTest(file, framework);
    }
  }
}

// Enhanced local fallback using shared utilities
function generateLocalFallbackTest(file, framework) {
  const baseName = file.name.replace(/\.(js|ts|jsx|tsx)$/, '');
  
  console.log(`🔧 Generating enhanced local test for ${file.name} using shared utilities`);
  
  const analysis = analyzeFileContent(file.content);

  return generateEnhancedTestTemplate(baseName, analysis, framework, file);
}

module.exports = {
  generateTests,
  generateSingleTest
};