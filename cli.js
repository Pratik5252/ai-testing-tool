#!/usr/bin/env node
const { program } = require("commander");
const chalk = require("chalk");
const ora = require("ora");
const inquirer = require("inquirer");
const fs = require("fs-extra");
const path = require("path");

const {
  analyzeProject,
  scanProjectFiles,
  detectProjectType,
} = require("./src/analyzer");
const { generateTests } = require("./src/generator");

const packageJson = require("./package.json");

program
  .name("ai-test-suite")
  .description(
    "AI-powered test suite generation for JavaScript/TypeScript projects"
  )
  .version(packageJson.version);

program
  .command("analyze [path]")
  .description("Analyze project and generate test suites")
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
      const files = await scanProjectFiles(targetPath);
      const projectType = detectProjectType(files);

      spinner.succeed(
        `Found ${files.length} files to analyze (${projectType} project)`
      );

      const generateSpinner = ora("Generating tests with AI...").start();
      const generatedTests = await generateTests(files, options.framework);
      generateSpinner.succeed("Test generation complete!");

      await fs.ensureDir(options.output);

      let savedCount = 0;
      for (const test of generatedTests) {
        const outputPath = path.join(options.output, test.filename);
        await fs.writeFile(outputPath, test.content);
        savedCount++;
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

    await fs.writeFile(".ai-test-suite.json", JSON.stringify(config, null, 2));

    console.log(chalk.green("\n✅ Configuration saved to .ai-test-suite.json"));

    console.log(chalk.yellow("\n📦 Install your test framework:"));
    if (answers.framework === "jest") {
      console.log(chalk.cyan("  npm install jest --save-dev"));
    } else if (answers.framework === "vitest") {
      console.log(chalk.cyan("  npm install vitest --save-dev"));
    } else if (answers.framework === "mocha") {
      console.log(chalk.cyan("  npm install mocha --save-dev"));
    }

    console.log(chalk.yellow("\nYou can now run:"));
    console.log(chalk.yellow("  ai-test-suite analyze"));
    console.log(chalk.yellow("  ai-test-suite watch"));
  });

program.parse();
