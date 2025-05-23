import fs from 'fs-extra';
import chalk from 'chalk';
import { Config, setupConfig } from './config';
import path from 'path';

// Define a more specific type for options passed to checkPrerequisites
interface PrerequisiteCheckOptions {
  filePath: string;
  ai: boolean; // Corresponds to --no-ai, true by default, false if --no-ai specified
  export: boolean; // Corresponds to --no-export, true by default, false if --no-export specified
  // Add other relevant options from commander if needed for checks
}

/**
 * Check all prerequisites before analysis
 */
export async function checkPrerequisites(config: Config, options: PrerequisiteCheckOptions): Promise<void> {
  // Check if the file exists
  const filePath = options.filePath;
  if (!filePath || !(await fs.pathExists(filePath))) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Check file extension
  const fileExtension = filePath.split('.').pop()?.toLowerCase();
  if (!['js', 'ts', 'go'].includes(fileExtension as string)) {
    throw new Error(`Unsupported file extension: ${fileExtension}. Supported: .js, .ts, .go`);
  }

  // If AI is enabled, check for Gemini API key
  if (options.ai) { // True if AI is enabled (default), false if --no-ai specified
    if (!config.geminiApiKey) {
      console.log(chalk.yellow('No Gemini API key found in configuration or environment.'));
      console.log(chalk.yellow('Please set up your configuration:'));
      // Update config object with values from setup, as setupConfig might prompt for them
      const updatedConfig = await setupConfig(config);
      config.geminiApiKey = updatedConfig.geminiApiKey;
      config.obsidianVaultPath = updatedConfig.obsidianVaultPath;
      config.obsidianNotesFolder = updatedConfig.obsidianNotesFolder;
    }
  }

  // Skip Obsidian checks if export is disabled
  if (options.export === false) { // True if --no-export was passed
    console.log(chalk.gray('Obsidian export disabled, skipping vault checks.'));
    return;
  }

  // --- Obsidian Export Checks (only if options.export is true) ---

  // Check Obsidian configuration
  let obsidianConfigured = false;
  
  if (config.obsidianVaultPath) {
    try {
      const pathExists = await fs.pathExists(config.obsidianVaultPath);
      if (pathExists) {
        obsidianConfigured = true;
      } else {
        console.log(chalk.yellow(`Configured Obsidian vault path does not exist: ${config.obsidianVaultPath}`));
        obsidianConfigured = false;
      }
    } catch (error) {
      console.log(chalk.yellow(`Error accessing Obsidian vault path: ${error instanceof Error ? error.message : String(error)}`));
      obsidianConfigured = false;
    }
  }

  // If Obsidian is not configured (and export is enabled), run the setup
  if (!obsidianConfigured) {
    console.log(chalk.yellow('Valid Obsidian vault path not found for export.'));
    console.log(chalk.yellow('Please set up your configuration:'));
    const updatedConfig = await setupConfig(config);
    
    config.geminiApiKey = updatedConfig.geminiApiKey; // Keep all parts of config in sync
    config.obsidianVaultPath = updatedConfig.obsidianVaultPath;
    config.obsidianNotesFolder = updatedConfig.obsidianNotesFolder;
  }

  // After potential setup, if export is enabled, re-check vault path and ensure notes folder exists
  if (config.obsidianVaultPath) { // This implies export is enabled due to the earlier return
    const notesFolder = config.obsidianNotesFolder || 'LeetCode';
    const notesFolderPath = path.join(config.obsidianVaultPath, notesFolder);
    
    if (!(await fs.pathExists(notesFolderPath))) {
      console.log(chalk.yellow(`Creating Obsidian notes folder: ${notesFolderPath}`));
      await fs.ensureDir(notesFolderPath);
    }
  } else {
    // If export is enabled (which it is if we reach here) and vault path is still not set after setup
    console.log(chalk.yellow('Obsidian vault path is not configured. Skipping export.'));
  }
} 