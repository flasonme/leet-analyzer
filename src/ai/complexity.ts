import { ParsedCode } from '../core/parser';
import { AnalysisResult } from '../core/analyzer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import chalk from 'chalk';

/**
 * Analyze code complexity using Google's Gemini API
 */
export async function analyzeWithAI(
  parsedCode: ParsedCode, 
  apiKey: string,
  solutionName: string
): Promise<AnalysisResult> {
  try {
    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash" 
    });
    
    // Prepare prompt with the code to analyze
    const codeToAnalyze = parsedCode.mainFunction?.code || parsedCode.content;
    
    const prompt = `
      You are an expert algorithm analyst. Please analyze the following ${parsedCode.language} code from a LeetCode problem:
      
      \`\`\`${parsedCode.language}
      ${codeToAnalyze}
      \`\`\`
      
      Please provide:
      1. Leetcode Problem Number/Name (e.g., 1. Two Sum, 2. Add Two Numbers, etc.)
      2. Analyze the solution and detect the approach algorithms used in the solution (e.g., Two Pointer, Sliding Window, Hash Map, Hash Table, Hash Set, etc.)
      3. Time complexity in Big O notation (e.g., O(n), O(n log n), etc.)
      4. Space complexity in Big O notation
      5. Brief explanation of the complexity analysis in markdown format for Obsidian notes (max 200 words)
      6. Estimated performance percentile compared to other LeetCode submissions (e.g., 90% means it's faster than 90% of submissions)
      
      Format your response as JSON:
      {
        "leetcodeProblem": "Example: Two Sum, Add Two Numbers, etc.",
        "leetcodeId": "Example: 1, 2, etc.",
        "solutionName": "Example: Two Pointer, Sliding Window, Hash Map, Hash Table, Hash Set, etc.",
        "timeComplexity": "O(?)",
        "spaceComplexity": "O(?)",
        "explanation": "Explain the reasoning...",
        "percentile": number between 1-100
      }
    `;
    
    // Send the prompt to Gemini
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Parse JSON response from Gemini
    // Extract JSON from the response text (in case there's any extra text)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response");
    }
    
    const aiResponse = JSON.parse(jsonMatch[0]);
    
    // Generate timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    
    return {
      problemName: aiResponse.problemName,
      leetcodeId: aiResponse.leetcodeId,
      timeComplexity: aiResponse.timeComplexity || "O(?)",
      spaceComplexity: aiResponse.spaceComplexity || "O(?)",
      percentile: aiResponse.percentile,
      explanation: aiResponse.explanation,
      codeSnippet: codeToAnalyze,
      language: parsedCode.language,
      solutionName: solutionName == 'Unnamed Approach' ? aiResponse.solutionName : solutionName,
      filePath: parsedCode.filePath,
      timestamp
    };
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("AI analysis failed:", errorMessage);
    console.log("Falling back to static analysis...");
    return fallbackAnalysis(parsedCode, solutionName);
  }
}

/**
 * Fallback analysis method when AI is not available
 * For testing purposes, using default values instead of prompts
 */
export async function fallbackAnalysis(
  parsedCode: ParsedCode,
  solutionName: string
): Promise<AnalysisResult> {
  // Basic static analysis (very simplistic)
  const code = parsedCode.mainFunction?.code || parsedCode.content;
  
  // Simple heuristic - count nested loops
  const loopKeywords = ['for', 'while', 'forEach', '.map', '.filter', '.reduce'];
  
  let maxNestingLevel = 0;
  let currentNestingLevel = 0;
  const lines = code.split('\n');
  
  for (const line of lines) {
    // Check for opening loop
    for (const keyword of loopKeywords) {
      if (line.includes(keyword) && line.includes('(')) {
        currentNestingLevel++;
        maxNestingLevel = Math.max(maxNestingLevel, currentNestingLevel);
      }
    }
    
    // Check for closing loop
    if (line.includes('}')) {
      currentNestingLevel = Math.max(0, currentNestingLevel - 1);
    }
  }
  
  // Very naive time complexity guess based on loop nesting
  let timeComplexity;
  let spaceComplexity = 'O(n)';
  let percentile = 50;
  
  switch (maxNestingLevel) {
    case 0:
      timeComplexity = 'O(1)';
      spaceComplexity = 'O(1)';
      percentile = 95;
      break;
    case 1:
      timeComplexity = 'O(n)';
      spaceComplexity = 'O(n)';
      percentile = 75;
      break;
    case 2:
      timeComplexity = 'O(n²)';
      spaceComplexity = 'O(1)';
      percentile = 50;
      break;
    case 3:
      timeComplexity = 'O(n³)';
      spaceComplexity = 'O(1)';
      percentile = 25;
      break;
    default:
      timeComplexity = `O(n^${maxNestingLevel})`;
      percentile = 10;
  }
  
  // Try to detect recursion
  const hasRecursion = code.includes(parsedCode.mainFunction?.name || '');
  if (hasRecursion) {
    timeComplexity = 'O(2^n)'; // Very simplistic assumption for recursion
    percentile = 30;
  }
  
  console.log(chalk.blue(`Using automatic analysis for ${solutionName}:`));
  console.log(chalk.gray(`- Time: ${timeComplexity}`));
  console.log(chalk.gray(`- Space: ${spaceComplexity}`));
  console.log(chalk.gray(`- Performance: ~${percentile}%`));
  
  // Generate timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  
  return {
    problemName: '',
    leetcodeId: 0,
    timeComplexity,
    spaceComplexity,
    percentile,
    codeSnippet: code,
    language: parsedCode.language,
    solutionName,
    filePath: parsedCode.filePath || '',
    timestamp
  };
} 