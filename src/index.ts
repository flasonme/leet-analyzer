#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { analyzeSolution } from './core/analyzer';
import { loadConfig } from './utils/config';
import { checkPrerequisites } from './utils/prerequisites';

// Load banner and version from package.json
import fs from 'fs';
import path from 'path';

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
);

// CLI setup
const program = new Command();

// Print banner
console.log(chalk.bold.cyan(`
╭─────────────────────────────────╮
│                                 │
│      LeetCode Analyzer CLI      │
│                                 │
╰─────────────────────────────────╯
`));

program
  .name('leet-analyzer')
  .description('Analyze LeetCode solutions and export to Obsidian')
  .version(packageJson.version);

program
  .argument('<file>', 'Path to LeetCode solution file')
  .option(
    '-m, --my-solution',
    'Analyze as initial solution (default)'
  )
  .option(
    '-s, --solution-name <name>',
    'Name for this solution approach'
  )
  .option(
    '-o, --output <path>',
    'Custom output path for the Obsidian note'
  )
  .option(
    '--no-ai',
    'Skip AI analysis and use static analysis only'
  )
  .option(
    '--no-export',
    'Skip exporting to Obsidian'
  )
  .action(async (file, options) => {
    try {
      // Load user configuration
      const config = await loadConfig();
      
      // Add the file path to options for prerequisites check
      options.filePath = file;
      
      // Check prerequisites
      await checkPrerequisites(config, options);

      // Determine solution name
      const solutionName = options.solutionName || (options.mySolution ? 'Initial Submission' : 'Unnamed Approach');

      console.log(chalk.yellow(`Analyzing solution: ${chalk.bold(file)}`));
      console.log(chalk.gray(`Solution name: ${solutionName}`));

      // Run the analysis
      await analyzeSolution({
        filePath: file,
        solutionName,
        useAI: options.ai !== false,
        outputPath: options.output,
        config,
        skipExport: options.export === false
      });

      console.log(chalk.green(`✓ Analysis completed successfully!`));

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`Error: ${errorMessage}`));
      process.exit(1);
    }
  });

// Parse command-line arguments
program.parse(process.argv);

// If no arguments, show help
if (process.argv.length < 3) {
  program.help();
} 