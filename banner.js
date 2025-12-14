const figlet = require('figlet');
const chalk = require("chalk");

function displayBanner({version} = {}) {

  let banner = 'TEST-CLI';
  try {
    banner = figlet.textSync('TEST-CLI', {
      font: 'ANSI Shadow',
      horizontalLayout: 'fitted',
      verticalLayout: 'fitted'
    });
    console.log(chalk.cyan(banner));
    console.log(chalk.gray('═'.repeat(70)));
    if(version) console.log(chalk.white(`  🤖 AI-Powered Test Generation | v${version}`));
    console.log(chalk.white(`  🧪 Supporting Jest, Vitest & Mocha`));
    console.log(chalk.white(`  ⚡ Powered by Cline CLI`));
    console.log(chalk.gray('═'.repeat(70)));
    console.log();
  } catch (error) {
     console.log();
    console.log(chalk.cyan('╔══════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║') + chalk.white('                                                              ') + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.bold.blue('     🤖 AI TEST GENERATOR 🧪                                  ') + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.white('                                                              ') + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray('     Automated test generation for JavaScript/TypeScript      ') + chalk.cyan('║'));
    if(version) console.log(chalk.cyan('║') + chalk.gray(`     Version ${version} | Powered by Cline CLI                     `) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.white('                                                              ') + chalk.cyan('║'));
    console.log(chalk.cyan('╚══════════════════════════════════════════════════════════════╝'));
    console.log();
  }
}

module.exports = {displayBanner}