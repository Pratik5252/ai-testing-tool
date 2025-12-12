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

