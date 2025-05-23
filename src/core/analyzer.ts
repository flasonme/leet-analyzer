import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { Config } from '../utils/config';
import { parseCodeFile } from './parser';
import { analyzeWithAI, fallbackAnalysis } from '../ai/complexity';
import { exportToObsidian } from '../obsidian/exporter';

export interface AnalysisOptions {
  filePath: string;
  solutionName: string;
  useAI: boolean;
  outputPath?: string;
  config: Config;
  skipExport?: boolean;
}

export interface AnalysisResult {
  problemName: string;
  leetcodeId: number;
  timeComplexity: string;
  spaceComplexity: string;
  percentile?: number;
  explanation?: string;
  codeSnippet: string;
  language: 'typescript' | 'javascript' | 'go';
  solutionName: string;
  filePath: string;
  timestamp: string;
}

/**
 * Extract the base problem slug from a filename, removing approach-specific suffixes
 */
function extractBaseProblemSlug(filename: string): string {
  // Remove file extension
  let slug = filename.split('.')[0];
  
  // List of common approach-specific suffixes to strip
  const approachSuffixes = [
    '-optimized', 
    '-improved', 
    '-two-pointer', 
    '-sliding-window', 
    '-hash-map',
    '-hash-table',
    '-hash-set',
  ];
  
  // Remove any approach-specific suffixes
  for (const suffix of approachSuffixes) {
    if (slug.endsWith(suffix)) {
      return slug.slice(0, slug.length - suffix.length);
    }
  }
  
  return slug;
}

/**
 * Main function to analyze a LeetCode solution
 */
export async function analyzeSolution(options: AnalysisOptions): Promise<AnalysisResult> {
  const {filePath, solutionName, useAI, outputPath, config, skipExport} = options;
  
  console.log(chalk.blue('🔍 Analyzing code...'));
  
  // 1. Parse the code file
  const parsedCode = await parseCodeFile(filePath);
  
  console.log(chalk.gray('Language detected:', parsedCode.language));
  console.log(chalk.gray('Main function identified:', parsedCode.mainFunction?.name || 'unnamed function'));
  
  let analysisResult: AnalysisResult;
  
  // 2. Analyze complexity using AI or fallback method
  if (useAI && config.geminiApiKey) {
    console.log(chalk.blue('🧠 Asking AI for complexity analysis...'));
    analysisResult = await analyzeWithAI(parsedCode, config.geminiApiKey, solutionName);
  } else {
    if (useAI && !config.geminiApiKey) {
      console.log(chalk.yellow('⚠️ No Gemini API key available. Falling back to static analysis.'));
    } else {
      console.log(chalk.blue('⚙️ Running static code analysis...'));
    }
    analysisResult = await fallbackAnalysis(parsedCode, solutionName);
  }
  
  // 3. Display results in the console
  console.log('\n' + chalk.green('Analysis Results:'));
  console.log(chalk.white(`Solution Name: ${chalk.bold(analysisResult.solutionName)}`));
  console.log(chalk.white(`Leetcode ID: ${chalk.bold(analysisResult.leetcodeId)}`));
  console.log(chalk.white(`Time Complexity: ${chalk.bold(analysisResult.timeComplexity)}`));
  console.log(chalk.white(`Space Complexity: ${chalk.bold(analysisResult.spaceComplexity)}`));
  
  if (analysisResult.percentile) {
    console.log(chalk.white(`Estimated Performance: ${chalk.bold(`Beats ~${analysisResult.percentile}% of submissions`)}`));
  }
  
  if (analysisResult.explanation) {
    console.log('\n' + chalk.white('Explanation:'));
    console.log(chalk.gray(analysisResult.explanation));
  }
  
  // 4. Export to Obsidian
  if (!skipExport && config.obsidianVaultPath) {
    console.log(chalk.blue('\n📝 Exporting to Obsidian...'));
    
    // Extract problem name from filename
    const fileName = path.basename(filePath);
    // Extract the base problem slug without approach-specific suffixes
    const problemSlug = extractBaseProblemSlug(fileName.split('.')[0]);
    
    const problemName = problemSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Determine output path
    const notesFolder = config.obsidianNotesFolder || 'LeetCode';
    const targetNotePath = outputPath || 
      path.join(config.obsidianVaultPath, notesFolder, `${problemSlug}.md`);
    
    console.log(chalk.gray(`Using problem slug: ${problemSlug}`));
    console.log(chalk.gray(`Exporting to: ${targetNotePath}`));
    
    await exportToObsidian(analysisResult, targetNotePath, problemName, analysisResult.leetcodeId);
    
    console.log(chalk.green(`✓ Exported to: ${targetNotePath}`));
  }
  
  return analysisResult;
} 