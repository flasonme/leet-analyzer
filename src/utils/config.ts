import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import inquirer from 'inquirer';
import chalk from 'chalk';
import dotenv from 'dotenv';

// Load environment variables from .env file using absolute path
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Config interface
export interface Config {
  geminiApiKey?: string;
  obsidianVaultPath?: string;
  obsidianNotesFolder?: string;
}

/**
 * Expand the tilde (~) in a path to the home directory
 */
function expandTilde(filePath: string): string {
  if (filePath && filePath.startsWith('~')) {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

/**
 * Load user configuration from config file or environment variables
 */
export async function loadConfig(): Promise<Config> {
  // First priority: Environment variables from .env file
  const config: Config = {
    geminiApiKey: process.env.GEMINI_API_KEY,
    obsidianVaultPath: process.env.OBSIDIAN_VAULT_PATH ? 
      expandTilde(process.env.OBSIDIAN_VAULT_PATH) : undefined,
    obsidianNotesFolder: process.env.OBSIDIAN_NOTES_FOLDER || 'LeetCode',
  };

  // Log the loaded configuration (for debugging)
  console.log(chalk.gray('Loaded configuration:'));
  console.log(chalk.gray(` - Gemini API Key: ${config.geminiApiKey ? '*****' : 'not set'}`));
  console.log(chalk.gray(` - Obsidian Path: ${config.obsidianVaultPath || 'not set'}`));

  return config;
}

/**
 * Interactive setup wizard for configuration
 */
export async function setupConfig(existingConfig: Config = {}): Promise<Config> {
  console.log(chalk.cyan('Setting up Leet Analyzer configuration...'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'geminiApiKey',
      message: 'Enter your Gemini AI API key:',
      default: existingConfig.geminiApiKey || '',
      when: !existingConfig.geminiApiKey,
    },
    {
      type: 'input',
      name: 'obsidianVaultPath',
      message: 'Enter path to your Obsidian vault:',
      default: existingConfig.obsidianVaultPath || '',
      validate: (input) => {
        if (!input) return true; // Allow empty if user wants to skip
        const expandedPath = expandTilde(input);
        // Check if path exists only if a path is provided
        return fs.pathExistsSync(expandedPath) || 'Directory does not exist';
      },
    },
    {
      type: 'input',
      name: 'obsidianNotesFolder',
      message: 'Enter folder name for LeetCode notes (inside vault):',
      default: existingConfig.obsidianNotesFolder || 'LeetCode',
    },
  ]);

  // Expand tilde in path
  if (answers.obsidianVaultPath) {
    answers.obsidianVaultPath = expandTilde(answers.obsidianVaultPath);
  }

  const newConfig = { ...existingConfig, ...answers };
  
  console.log(chalk.green('✓ Configuration complete! Set these as environment variables to persist them:'));
  console.log(chalk.yellow(`GEMINI_API_KEY=${newConfig.geminiApiKey || ''}`));
  console.log(chalk.yellow(`OBSIDIAN_VAULT_PATH=${newConfig.obsidianVaultPath || ''}`));
  console.log(chalk.yellow(`OBSIDIAN_NOTES_FOLDER=${newConfig.obsidianNotesFolder || 'LeetCode'}`));
  
  return newConfig;
} 