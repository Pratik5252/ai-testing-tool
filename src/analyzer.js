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



module.exports = {
    scanProjectFiles,
    detectProjectType,
    analyzeProject
}