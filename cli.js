#!/usr/bin/env node
const { program } = require("commander");
const chalk = require("chalk");
const ora = require("ora");
const inquirer = require("inquirer").default || require("inquirer");
const fs = require("fs-extra");
const path = require("path");
const {displayBanner} = require('./banner')

const {
  analyzeProject,
  scanProjectFiles,
  detectProjectType,
} = require("./src/analyzer");
const { generateTests } = require("./src/generator");
const {analyzeFileContent,shouldGenerateTest} = require('./src/utils')
const packageJson = require("./package.json");

program.configureHelp({
  beforeAll: () => {
    displayBanner({version: packageJson.version});
    return '';
  }
});

program
  .name("test-cli")
  .description(
    "AI-powered test generation for JavaScript/TypeScript projects"
  )
  .version(packageJson.version);

program.action(() => {
  program.help();
});

program
  .command("analyze [path]")
  .description("Analyze project and generate test files")
  .option(
    "-f, --framework <framework>",
    "Test framework (jest, vitest, mocha)",
    "jest"
  )
  .option(
    "-o, --output <path>",
    "Output directory for generated tests",
    "./tests"
  )
  .action(async (projectPath, options) => {
    const targetPath = projectPath || process.cwd();

    console.log(chalk.blue("\n🔍 AI Test Suite Generator"));
    console.log(chalk.gray(`Analyzing: ${targetPath}\n`));

    const spinner = ora("Scanning projects files...").start();

    try {
      const stat = await fs.stat(targetPath);
      let files;
      let analysisType;

      if (stat.isFile()) {
        // Single file analysis
        if (!targetPath.match(/\.(js|ts|jsx|tsx)$/)) {
          throw new Error(
            "File must be a JavaScript/TypeScript file (.js, .ts, .jsx, .tsx)"
          );
        }

        const content = await fs.readFile(targetPath, "utf8");
        files = [
          {
            name: path.basename(targetPath),
            path: targetPath,
            relativePath: path.basename(targetPath),
            content: content,
            size: stat.size,
          },
        ];
        analysisType = "file";
      } else {
        // Directory analysis
        files = await scanProjectFiles(targetPath);
        analysisType = "directory";
      }

      const projectType = detectProjectType(files);

      spinner.succeed(
        `Found ${files.length} files to analyze (${projectType} project)`
      );

      await displayAnalysisResults(files, projectType, options.framework);

      const generateSpinner = ora("Generating tests with AI...").start();
      const generatedTests = await generateTests(files, options.framework);
      generateSpinner.succeed("Test generation complete!");

      await fs.ensureDir(options.output);

      let savedCount = 0;
      for (const test of generatedTests) {
        const outputPath = path.join(options.output, test.filename);
        await fs.writeFile(outputPath, test.content);
        savedCount++;
        console.log(chalk.gray(`  ✓ ${test.filename}`));
      }

      console.log(
        chalk.green(
          `\n✅ Generated ${savedCount} test files in ${options.output}`
        )
      );
      console.log(chalk.yellow("\nNext steps:"));
      console.log(chalk.yellow("  npm test   # Run your generated tests"));
    } catch (error) {
      spinner.fail("Analysis failed");
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

async function displayAnalysisResults(files, projectType, framework) {
  console.log(chalk.blue("\n📊 PROJECT ANALYSIS"));
  console.log(chalk.blue("====================\n"));
  
  // Project Overview
  console.log(chalk.white(`📁 Project Type: ${chalk.cyan(projectType)}`));
  console.log(chalk.white(`🧪 Framework: ${chalk.cyan(framework)}`));
  console.log(chalk.white(`📄 Total Files: ${chalk.cyan(files.length)}\n`));

  // Get testable files
  const testableFiles = files.filter(file => shouldGenerateTest(file));
  
  console.log(chalk.white("🔍 Files to test:"));
  
  testableFiles.slice(0, 8).forEach((file, index) => {
    const analysis = analyzeFileContent(file.content);
    const size = (file.size / 1024).toFixed(1);
    
    console.log(chalk.gray(`  ${index + 1}. ${chalk.white(file.name)} (${size}KB)`));
    
    if (analysis.functions.length > 0) {
      const funcList = analysis.functions.slice(0, 3).join(', ');
      const extra = analysis.functions.length > 3 ? ` +${analysis.functions.length - 3} more` : '';
      console.log(chalk.gray(`     Functions: ${funcList}${extra}`));
    }
    
    const features = [];
    if (analysis.hasAsync) features.push('async');
    if (analysis.isReactComponent) features.push('React');
    if (analysis.isApiRoute) features.push('API');
    if (features.length > 0) {
      console.log(chalk.gray(`     Features: ${features.join(', ')}`));
    }
  });

  if (testableFiles.length > 8) {
    console.log(chalk.gray(`  ... and ${testableFiles.length - 8} more files`));
  }

  // Summary
  const totalComplexity = testableFiles.reduce((sum, file) => {
    const analysis = analyzeFileContent(file.content);
    return sum + analysis.complexity;
  }, 0);

  const avgComplexity = testableFiles.length > 0 ? (totalComplexity / testableFiles.length).toFixed(1) : '0';
  
  console.log(chalk.white(`\n📈 Summary:`));
  console.log(chalk.gray(`  Test files to generate: ${chalk.cyan(testableFiles.length)}`));
  console.log(chalk.gray(`  Average complexity: ${chalk.cyan(avgComplexity)}`));
  
  const estimatedTime = Math.max(1, Math.ceil(testableFiles.length * 0.5));
  console.log(chalk.gray(`  Estimated time: ~${chalk.cyan(estimatedTime)} minutes`));
}

program
  .command("watch [path]")
  .description("Watch for file changes and auto-generate tests")
  .option(
    "-f, --framework <framework>",
    "Test framework (jest, vitest, mocha)",
    "jest"
  )
  .action(async (projectPath, options) => {
    const targetPath = projectPath || process.cwd();

    console.log(chalk.blue("\n👁️  AI Test Suite Watcher"));
    console.log(chalk.gray(`Watching: ${targetPath}`));
    console.log(chalk.yellow("Press Ctrl+C to stop\n"));

    const chokidar = require("chokidar");

    const watcher = chokidar.watch(targetPath, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
    });

    watcher.on("change", async (filePath) => {
      if (filePath.match(/\.(js|ts|jsx|tsx)$/)) {
        console.log(chalk.cyan(`📝 File changed: ${path.basename(filePath)}`));

        try {
          const spinner = ora("Regenerating tests...").start();

          const files = await scanProjectFiles(targetPath);
          const generatedTests = await generateTests(files, options.framework);

          await fs.ensureDir("./tests");

          for (const test of generatedTests) {
            const outputPath = path.join("./tests", test.filename);
            await fs.writeFile(outputPath, test.content);
          }

          spinner.succeed(`Updated ${generatedTests.length} test files`);
        } catch (error) {
          console.error(chalk.red(`Watch error: ${error.message}`));
        }
      }
    });

    watcher.on("ready", () => {
      console.log(chalk.green("🟢 Watching for changes..."));
    });
  });

program
  .command("init")
  .description("Initialize AI test suite configuration")
  .action(async () => {
    displayBanner({version: packageJson.version});
    console.log(chalk.blue("\n🚀 Initialize AI Test Suite\n"));

    const answers = await inquirer.prompt([
      {
        type: "list",
        name: "framework",
        message: "Which test framework do you want to use?",
        choices: ["jest", "vitest", "mocha"],
        default: "jest",
      },
      {
        type: "input",
        name: "outputDir",
        message: "Where should test files be saved?",
        default: "./tests",
      },
    ]);

    const config = {
      framework: answers.framework,
      outputDir: answers.outputDir,
      filePatterns: ["**/*.js", "**/*.ts", "**/*.jsx", "**/*.tsx"],
      excludePatterns: [
        "node_modules/**",
        "dist/**",
        "build/**",
        "**/*.test.*",
      ],
    };

    await fs.writeFile(".test-cli.json", JSON.stringify(config, null, 2));

    console.log(chalk.green("\n✅ Configuration saved to .test-cli .json"));

    console.log(chalk.yellow("\n📦 Install your test framework:"));
    if (answers.framework === "jest") {
      console.log(chalk.cyan("  npm install jest --save-dev"));
    } else if (answers.framework === "vitest") {
      console.log(chalk.cyan("  npm install vitest --save-dev"));
    } else if (answers.framework === "mocha") {
      console.log(chalk.cyan("  npm install mocha --save-dev"));
    }

    console.log(chalk.yellow("\nYou can now run:"));
    console.log(chalk.yellow("  test-cli analyze"));
    console.log(chalk.yellow("  test-cli watch"));
  });

program.parse();
