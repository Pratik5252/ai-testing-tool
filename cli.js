#!/usr/bin/env node
const {program} = require('commander')
const chalk = require('chalk')
const ora = require('ora')
const inquirer = require('inquirer')
const fs = require('fs-extra')
const path = require('path')

const { analyzeProject, scanProjectFiles, detectProjectType } = require('./src/analyzer');
const { generateTests } = require('./src/generator');

const packageJson = require('./package.json');

program
    .name('ai-test-suite')
    .description('AI-powered test suite generation for JavaScript/TypeScript projects')
    .version(packageJson.version)

program
    .command('analyze [path]')
    .description('Analyze project and generate test suites')
    .option('-f, --framework <framework>','Test framework (jest, vitest, mocha)','jest')
    .option('-o, --output <path>', 'Output directory for generated tests', './tests')
    .action(async (projectPath, options) => {
        const targetPath = projectPath || process.cwd();
        
        console.log(chalk.blue('\n🔍 AI Test Suite Generator'));
        console.log(chalk.gray(`Analyzing: ${targetPath}\n`));

        const spinner = ora('Scanning projects files...').start();

        try {
            const files = await scanProjectFiles(targetPath);
            const projectType = detectProjectType(files);

            spinner.succeed(`Found ${files.length} files to analyze (${projectType} project)`);

            const generateSpinner = ora('Generating tests with AI...').start();
            const generatedTests = await generateTests(files, options.framework);
            generateSpinner.succeed('Test generation complete!');

            await fs.ensureDir(options.output)

            let savedCount = 0;
            for(const test of generatedTests){
                const outputPath = path.join(options.output, test.filename);
                await fs.writeFile(outputPath,test.content)
                savedCount++;
            }

            console.log(chalk.green(`\n✅ Generated ${savedCount} test files in ${options.output}`));
            console.log(chalk.yellow('\nNext steps:'));
            console.log(chalk.yellow('  npm test   # Run your generated tests'));
      
        }catch (error) {
            spinner.fail('Analysis failed');
            console.error(chalk.red(`Error: ${error.message}`));
            process.exit(1);
        }
    });