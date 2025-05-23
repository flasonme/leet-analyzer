import fs from 'fs-extra';
import path from 'path';
import { AnalysisResult } from '../core/analyzer';
import chalk from 'chalk';

interface ComparisonRecord {
  problemName: string;
  leetcodeId: number;
  solutionName: string;
  timeComplexity: string;
  spaceComplexity: string;
  percentile?: number;
}

/**
 * Export analysis results to an Obsidian note file
 */
export async function exportToObsidian(
  result: AnalysisResult,
  targetPath: string,
  problemName: string,
  leetcodeId: number
): Promise<void> {
  // Check if note already exists
  const noteExists = await fs.pathExists(targetPath);
  
  let existingContent = '';
  let existingSolutions: ComparisonRecord[] = [];
  
  if (noteExists) {
    // Read existing note
    existingContent = await fs.readFile(targetPath, 'utf8');
    console.log(chalk.gray('Reading existing note content...'));
    
    // Parse existing solutions for comparison table
    existingSolutions = parseExistingSolutions(existingContent);
    console.log(chalk.gray(`Found ${existingSolutions.length} existing solutions`));
    
    if (existingSolutions.length > 0) {
      existingSolutions.forEach((solution, index) => {
        console.log(chalk.gray(`  Solution ${index + 1}: ${solution.solutionName} (${solution.timeComplexity}, ${solution.spaceComplexity})`));
      });
    }
    
    // Add the current solution to the list
    const currentSolution: ComparisonRecord = {
      problemName: result.problemName,
      leetcodeId: result.leetcodeId,
      solutionName: result.solutionName,
      timeComplexity: result.timeComplexity,
      spaceComplexity: result.spaceComplexity,
      percentile: result.percentile
    };
    
    // Check if this solution name already exists and replace it
    const existingIndex = existingSolutions.findIndex(s => s.solutionName === result.solutionName);
    if (existingIndex >= 0) {
      console.log(chalk.gray(`Updating existing solution: ${result.solutionName}`));
      existingSolutions[existingIndex] = currentSolution;
    } else {
      console.log(chalk.gray(`Adding new solution: ${result.solutionName}`));
      existingSolutions.push(currentSolution);
    }
  } else {
    console.log(chalk.gray('Creating new note...'));
    // Add the first solution to the comparison list
    existingSolutions.push({
      problemName: result.problemName,
      leetcodeId: result.leetcodeId,
      solutionName: result.solutionName,
      timeComplexity: result.timeComplexity,
      spaceComplexity: result.spaceComplexity,
      percentile: result.percentile
    });
  }
  
  // Generate the content for the solution section
  const solutionContent = generateSolutionSection(result);
  
  // Generate comparison table
  const comparisonTable = generateComparisonTable(existingSolutions);
  
  // Create the new note content
  let newContent = '';
  
  if (noteExists) {
    // Extract the header and title from the existing content
    const headerMatch = existingContent.match(/^# .*$/m);
    const header = headerMatch ? headerMatch[0] : generateHeader(problemName, leetcodeId);
    
    // Build the content with all solutions
    newContent = header + '\n\n';
    
    // Add each solution section
    for (const solution of existingSolutions) {
      if (solution.solutionName === result.solutionName) {
        // Use the new solution content for the current solution
        newContent += solutionContent + '\n\n';
      } else {
        // Extract the existing solution section for other solutions
        const solutionMatch = extractSolutionSection(existingContent, solution.solutionName);
        if (solutionMatch) {
          newContent += solutionMatch + '\n\n';
        } else {
          console.log(chalk.yellow(`Warning: Could not find content for solution: ${solution.solutionName}`));
          // If we can't find the section but we have the solution data, recreate it
          const recreatedSolution: AnalysisResult = {
            problemName: solution.problemName,
            leetcodeId: solution.leetcodeId,
            solutionName: solution.solutionName,
            timeComplexity: solution.timeComplexity,
            spaceComplexity: solution.spaceComplexity,
            percentile: solution.percentile,
            codeSnippet: "// Code not available",
            language: 'typescript', // Default language
            filePath: '',
            timestamp: new Date().toISOString().split('T')[0]
          };
          newContent += generateSolutionSection(recreatedSolution) + '\n\n';
        }
      }
    }
    
    // Add the comparison table
    newContent += comparisonTable;
  } else {
    // Create new note
    newContent = generateHeader(problemName, leetcodeId) + 
                solutionContent + '\n\n' + 
                comparisonTable;
  }
  
  // Write the content to the file
  await fs.ensureDir(path.dirname(targetPath));
  await fs.writeFile(targetPath, newContent);
}

/**
 * Generate Markdown content for a solution section
 */
function generateSolutionSection(result: AnalysisResult): string {
  return `## Solution: ${result.solutionName}
- **Date Analyzed:** ${result.timestamp}
- **Time Complexity:** ${result.timeComplexity}
- **Space Complexity:** ${result.spaceComplexity}
${result.percentile ? `- **Estimated Performance:** Beats ~${result.percentile}% of submissions` : ''}
${result.explanation ? `
- **Analysis:**
  > ${result.explanation.trim().replace(/\n/g, '\n  > ')}
` : ''}

- **Code Snippet:**
\`\`\`${result.language}
${result.codeSnippet}
\`\`\`
`;
}

/**
 * Extract a solution section from the content
 */
function extractSolutionSection(content: string, solutionName: string): string | null {
  const escapedName = solutionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Look for the section header
  const headerRegex = new RegExp(`## Solution: ${escapedName}`, 'm');
  const headerMatch = content.match(headerRegex);
  
  if (!headerMatch || headerMatch.index === undefined) {
    return null;
  }
  
  // Find the start position of this section
  const sectionStart = headerMatch.index;
  
  // Find the start of the next section or the end of the content
  const nextSectionRegex = /\n## /g;
  nextSectionRegex.lastIndex = sectionStart + headerMatch[0].length;
  
  const nextSectionMatch = nextSectionRegex.exec(content);
  const sectionEnd = nextSectionMatch ? nextSectionMatch.index : content.length;
  
  // Extract the section content
  const sectionContent = content.substring(sectionStart, sectionEnd).trim();
  
  return sectionContent;
}

/**
 * Generate comparison table for all solutions
 */
function generateComparisonTable(solutions: ComparisonRecord[]): string {
  let table = `## Comparison Summary
| Solution | Time Complexity | Space Complexity | Estimated Performance |
|----------|----------------|-----------------|----------------------|
`;

  for (const solution of solutions) {
    table += `| ${solution.solutionName} | ${solution.timeComplexity} | ${solution.spaceComplexity} | ${solution.percentile ? `~${solution.percentile}%` : 'N/A'} |\n`;
  }

  return table;
}

/**
 * Generate the header for the Obsidian note
 * ---
  tags: [project, coding, leetcode, cli, tools, automation]
  status: completed
  created: ${new Date().toISOString().split('T')[0]}
  modified: ${new Date().toISOString().split('T')[0]}
  ---
 */
function generateHeader(problemName: string, problemId: number): string {
  const tags = ['leetcode', problemName.toLowerCase().replace(/ /g, '-'), 'leetcode-' + problemId.toString()];
  const status = 'completed';
  const created = new Date().toISOString().split('T')[0];
  const modified = new Date().toISOString().split('T')[0];
  const header = `---
  tags: ${JSON.stringify(tags)}
  status: ${status}
  created: ${created}
  modified: ${modified}
  ---

  # LeetCode Problem: ${problemName}
  `;
  return header;
}

/**
 * Parse existing solutions from an Obsidian note
 */
function parseExistingSolutions(content: string): ComparisonRecord[] {
  const solutions: ComparisonRecord[] = [];
  
  // Look for all solution sections
  const solutionHeaderRegex = /## Solution: (.*?)$/gm;
  let match;
  
  console.log(chalk.gray('Parsing solution sections...'));
  
  while ((match = solutionHeaderRegex.exec(content)) !== null) {
    const solutionName = match[1].trim();
    console.log(chalk.gray(`Found solution header: "${solutionName}" at position ${match.index}`));
    
    // Find complexity information for this solution
    const sectionContent = content.slice(match.index);
    
    // More specific regex patterns that match the exact format
    const problemNameMatch = sectionContent.match(/## LeetCode Problem: (.*?)$/m);
    const leetcodeIdMatch = sectionContent.match(/\*\*Leetcode ID:\*\* (\d+)/m);
    const timeComplexityMatch = sectionContent.match(/\*\*Time Complexity:\*\* (.*?)$/m);
    const spaceComplexityMatch = sectionContent.match(/\*\*Space Complexity:\*\* (.*?)$/m);
    const percentileMatch = sectionContent.match(/\*\*Estimated Performance:\*\* Beats ~(\d+)%/m);
    
    console.log(chalk.gray(`  Time complexity match: ${timeComplexityMatch ? `found: ${timeComplexityMatch[1]}` : 'not found'}`));
    console.log(chalk.gray(`  Space complexity match: ${spaceComplexityMatch ? `found: ${spaceComplexityMatch[1]}` : 'not found'}`));
    
    if (timeComplexityMatch && spaceComplexityMatch) {
      solutions.push({
        problemName: problemNameMatch ? problemNameMatch[1].trim() : '',
        leetcodeId: leetcodeIdMatch ? parseInt(leetcodeIdMatch[1], 10) : 0,
        solutionName,
        timeComplexity: timeComplexityMatch[1].trim(),
        spaceComplexity: spaceComplexityMatch[1].trim(),
        percentile: percentileMatch ? parseInt(percentileMatch[1], 10) : undefined
      });
      console.log(chalk.gray(`  Added solution: ${solutionName}`));
    } else {
      console.log(chalk.yellow(`  Could not extract complexity info for: ${solutionName}`));
    }
  }
  
  return solutions;
} 