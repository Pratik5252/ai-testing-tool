const fs = require('fs-extra')
const path = require('path')

// Recursively scans files of a given path
async function scanProjectFiles(projectPath){
    const files = [];

    try {
        const items = await fs.readdir(projectPath);
        
        for(const item of items){
            const fullPath = path.join(projectPath, item)
            const  stat = await fs.stat(fullPath)

            if(stat.isFile() && isCodeFile(item)){
                const content = await fs.readFile(fullPath,'utf-8');
                files.push({
                    name: item,
                    path: fullPath,
                    relativePath: path.relative(projectPath,fullPath),
                    content: content,
                    size: stat.size
                });
            }else if(stat.isDirectory() && !shouldIgnoreDir(item)){
                const subFiles = await scanProjectFiles(fullPath);
                files.push(...subFiles)
            }
        }
        return files;
    } catch (error) {
        throw new Error(`Failed to scan project: ${error.message}`);
    }
}

function isCodeFile(filename){
    const codeExtensions = ['.js','.ts','.jsx','.tsx'];
    return codeExtensions.some(ext => filename.endsWith(ext));
}

function shouldIgnoreDir(dirname){
    const ignoreDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next'];
    return ignoreDirs.includes(dirname);
}

function detectProjectType(files) {
  const packageJsonFile = files.find(f => f.name === 'package.json');
  
  if (packageJsonFile) {
    try {
      const packageData = JSON.parse(packageJsonFile.content);
      const deps = { ...packageData.dependencies, ...packageData.devDependencies };
      
      if (deps.react) return 'react';
      if (deps.vue) return 'vue';
      if (deps.angular || deps['@angular/core']) return 'angular';
      if (deps.express) return 'express';
      if (deps.next) return 'nextjs';
      if (deps.nuxt) return 'nuxt';
      
      return 'node';
    } catch (error) {
      return 'javascript';
    }
  }
  
  const hasJsFiles = files.some(f => f.name.endsWith('.js'));
  const hasTsFiles = files.some(f => f.name.endsWith('.ts'));
  const hasJsxFiles = files.some(f => f.name.endsWith('.jsx') || f.name.endsWith('.tsx'));
  
  if (hasJsxFiles) return 'react';
  if (hasTsFiles) return 'typescript';
  if (hasJsFiles) return 'javascript';
  
  return 'unknown';
}

async function analyzeProject(projectPath) {
  const files = await scanProjectFiles(projectPath);
  const projectType = detectProjectType(files);
  
  return {
    files,
    projectType,
    stats: {
      totalFiles: files.length,
      jsFiles: files.filter(f => f.name.endsWith('.js')).length,
      tsFiles: files.filter(f => f.name.endsWith('.ts')).length,
      jsxFiles: files.filter(f => f.name.endsWith('.jsx')).length,
      tsxFiles: files.filter(f => f.name.endsWith('.tsx')).length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0)
    }
  };
}

module.exports = {
    scanProjectFiles,
    detectProjectType,
    analyzeProject
}