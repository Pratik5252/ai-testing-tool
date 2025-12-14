const figlet = require('figlet');
const chalk = require("chalk");
const packageJson = require("./package.json");

function displayBanner() {
  const banner = figlet.textSync('AI TEST SUITE', {
    font: 'ANSI Shadow',
    horizontalLayout: 'fitted',
    verticalLayout: 'fitted'
  });
  
  console.log(chalk.cyan(banner));
  console.log(chalk.gray('═'.repeat(70)));
  console.log(chalk.white(`  🤖 AI-Powered Test Generation | v${packageJson.version}`));
  console.log(chalk.white(`  🧪 Supporting Jest, Vitest & Mocha`));
  console.log(chalk.white(`  ⚡ Powered by Cline CLI`));
  console.log(chalk.gray('═'.repeat(70)));
  console.log();
}

module.exports = {displayBanner}