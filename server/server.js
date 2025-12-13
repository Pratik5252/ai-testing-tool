const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const {exec} = require('child_process');
const {promisify} = require('util')

const {
  analyzeFileContent,
  getTestExtension,
  generateEnhancedTestTemplate
} = require('../src/utils');

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => {
  res.json({ 
    status: 'AI Test Suite API Running',
    version: '1.0.0',
    cline: 'Not integrated yet',
    timestamp: new Date().toISOString()
  });
});

app.post('/analyze', async (req,res) => {
    try {
        const {file, framework = 'jest', options = {}} = req.body;

        if(!file || !file.content){
            return res.status(400).json({error: 'File content is required'})
        }

        const MAX_FILE_CONTENT_SIZE = 1024 * 1024; // 1MB
        if (typeof file.content !== 'string') {
            return res.status(400).json({error: 'File content must be a string'});
        }
        if (Buffer.byteLength(file.content, 'utf8') > MAX_FILE_CONTENT_SIZE) {
            return res.status(413).json({error: 'File content too large (max 1MB)'});
        }

        console.log(`🔍 Analyzing ${file.name} with Cline CLI...`);

        const testContent = await generateTestWithCline(file,framework,options);

        res.json({
            success: true,
            generatedTest: testContent,
            metadata: {
                framework,
                sourceFile: file.name,
                method: 'cline-cli',
                timestamp: new Date().toISOString()
            }
        })
    } catch (error) {
        console.error('❌ Cline integration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

async function generateTestWithCline(file, framework, options) {
  try {
    const workspaceDir = path.join(__dirname, 'temp', `workspace-${Date.now()}`);
    await fs.ensureDir(workspaceDir);
    
    const sourceFilePath = path.join(workspaceDir, file.name);
    await fs.writeFile(sourceFilePath, file.content);
    
    const prompt = buildClinePrompt(file, framework, options);
    
    const testContent = await executeClineCommand(workspaceDir, prompt, file.name, framework);
    
    // Cleanup
    await fs.remove(workspaceDir);
    
    return testContent;
    
  } catch (error) {
    throw new Error(`Cline CLI execution failed: ${error.message}`);
  }
}

function buildClinePrompt(file, framework, options) {
  // Use shared analysis function
  const analysis = analyzeFileContent(file.content);
  const testFileName = file.name.replace(/\.(js|ts|jsx|tsx)$/, getTestExtension(framework));
  
  return `Create a comprehensive ${framework} test file named "${testFileName}" for the JavaScript/TypeScript file "${file.name}".

SOURCE FILE ANALYSIS:
- Functions found: ${analysis.functions.join(', ') || 'None detected'}
- Classes found: ${analysis.classes.join(', ') || 'None detected'}  
- External dependencies: ${analysis.imports.join(', ') || 'None'}
- Contains async code: ${analysis.hasAsync ? 'Yes' : 'No'}
- Contains promises: ${analysis.hasPromises ? 'Yes' : 'No'}
- React component: ${analysis.isReactComponent ? 'Yes' : 'No'}
- API route: ${analysis.isApiRoute ? 'Yes' : 'No'}
- Complexity score: ${analysis.complexity}

REQUIREMENTS:
1. Generate complete ${framework} test suite
2. Test all exported functions and classes
3. Include proper imports and mocking
4. ${options.generateEdgeCases ? 'Add comprehensive edge cases (null, undefined, empty values, boundary conditions)' : 'Include basic edge case tests'}
5. ${options.includeSetup ? 'Add proper beforeEach/afterEach setup and teardown' : 'Keep setup minimal'}
6. Handle async functions with proper await/async testing
7. Mock external dependencies appropriately
8. Use ${framework} best practices and conventions
9. ${analysis.isReactComponent ? 'Include React component testing with @testing-library/react' : ''}
10. ${analysis.isApiRoute ? 'Include API endpoint testing with request/response mocking' : ''}

Create the test file with meaningful test descriptions and thorough coverage.`;
}

async function executeClineCommand(workspaceDir, prompt, fileName, framework) {
  try {
    const testFileName = fileName.replace(/\.(js|ts|jsx|tsx)$/, getTestExtension(framework));
    const sourceFilePath = path.join(workspaceDir, fileName);
    
    // Correct Cline CLI command based on help output
    const clineArgs = [
      `"${prompt}"`,                    
      '-f', `"${sourceFilePath}"`,      
      '-m', 'act',                      
      '--oneshot',                      
      '--no-interactive',               
      '--output-format', 'json',        
      '-y'                              
    ];
    
    const clineCommand = `cline ${clineArgs.join(' ')}`;
    
    console.log(`🤖 Executing Cline: ${clineCommand}`);
    console.log(`📁 Working directory: ${workspaceDir}`);
    
    // Execute Cline CLI
    const maxBuffer = process.env.CLINE_MAX_BUFFER
      ? parseInt(process.env.CLINE_MAX_BUFFER, 10)
      : 1024 * 1024 * 50; // Default to 50MB
    const { stdout, stderr } = await execAsync(clineCommand, {
      cwd: workspaceDir,
      timeout: 120000,
      maxBuffer
    });
    
    if (stderr && !stderr.includes('warning')) {
      console.warn(`⚠️ Cline CLI stderr: ${stderr}`);
    }
    
    console.log(`📤 Cline stdout: ${stdout.substring(0, 500)}...`);
    
    let clineResult;
    try {
      clineResult = JSON.parse(stdout);
    } catch (e) {
      clineResult = { output: stdout };
    }
    
    // Look for generated test file in workspace
    const testFilePath = path.join(workspaceDir, testFileName);
    
    if (await fs.pathExists(testFilePath)) {
      const testContent = await fs.readFile(testFilePath, 'utf8');
      console.log(`✅ Generated test file: ${testFileName}`);
      return testContent;
    } else {
      if (clineResult.output && (clineResult.output.includes('describe(') || clineResult.output.includes('test('))) {
        console.log(`✅ Generated test content in output`);
        return clineResult.output;
      } else {
        throw new Error('Cline CLI did not generate test file or content');
      }
    }
    
  } catch (error) {
    console.error('❌ Cline execution error:', error);
    console.log(`🔄 Falling back to enhanced mock test for ${fileName}`);
    return generateEnhancedFallback(fileName, framework);
  }
}

function generateEnhancedFallback(fileName, framework) {
  const baseName = fileName.replace(/\.(js|ts|jsx|tsx)$/, '');
  const mockFileContent = `// Mock content for fallback\nfunction ${baseName}() {}\nmodule.exports = { ${baseName} };`;
  const analysis = analyzeFileContent(mockFileContent);
  
  console.log(`⚠️ Using enhanced shared template fallback for ${fileName}`);
  
  return generateEnhancedTestTemplate(baseName, analysis, framework, { name: fileName });
}

app.get('/cline/health', async (req, res) => {
  try {
    const { stdout } = await execAsync('cline version');
    res.json({
      status: 'healthy',
      version: stdout.trim(),
      available: true,
      commands: ['cline [prompt] [flags]', 'cline auth', 'cline task', 'cline instance']
    });
  } catch (error) {
    res.json({
      status: 'unavailable',
      error: error.message,
      available: false,
      suggestion: 'Install Cline CLI: npm install -g @cline/cli'
    });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 AI Test Suite API running on port ${PORT}`);
  console.log(`🤖 Cline CLI integration with shared utilities`);
  console.log(`📡 Ready for test generation requests`);
  console.log(`🔍 Health check: GET /cline/health`)
});