import fs from 'fs-extra';
import path from 'path';

export interface ParsedCode {
  content: string;
  language: 'typescript' | 'javascript' | 'go';
  mainFunction?: {
    name: string;
    code: string;
    startLine: number;
    endLine: number;
  };
  imports: string[];
  filePath: string;
}

/**
 * Parse the content of a code file to identify language and main components
 */
export async function parseCodeFile(filePath: string): Promise<ParsedCode> {
  // Read file content
  const content = await fs.readFile(filePath, 'utf8');
  const fileExtension = path.extname(filePath).toLowerCase();
  
  // Determine language based on file extension
  let language: ParsedCode['language'];
  switch (fileExtension) {
    case '.ts':
      language = 'typescript';
      break;
    case '.js':
      language = 'javascript';
      break;
    case '.go':
      language = 'go';
      break;
    default:
      throw new Error(`Unsupported file extension: ${fileExtension}`);
  }
  
  // Extract imports
  const imports: string[] = [];
  
  if (language === 'typescript' || language === 'javascript') {
    // Match import statements in JS/TS
    const importRegex = /import\s+.*?from\s+['"].*?['"]/g;
    const importMatches = content.match(importRegex) || [];
    imports.push(...importMatches);
  } else if (language === 'go') {
    // Match import statements in Go
    const importRegex = /import\s*\(\s*(?:.*\s*)*\)/g;
    const importMatches = content.match(importRegex) || [];
    imports.push(...importMatches);
  }
  
  // Try to identify the main function (LeetCode solution)
  let mainFunction = findMainFunction(content, language);
  return {
    content,
    language,
    mainFunction,
    imports,
    filePath
  };
}

/**
 * Identify the main function in the code (the LeetCode solution)
 */
function findMainFunction(code: string, language: ParsedCode['language']): ParsedCode['mainFunction'] | undefined {
  if (language === 'typescript' || language === 'javascript') {
    // Common LeetCode function patterns in JS/TS
    const patterns = [
      // Function declaration (now handles return types, greedy body)
      /function\s+(\w+)\s*\([^)]*\)\s*(?::\s*[^\{]+)?\s*{([\s\S]*)}/g,
      // Arrow function with identifier (now handles return types, greedy body)
      /const\s+(\w+)\s*=\s*(\([^)]*\)|[^=]*)\s*=>\s*(?::\s*[^\{]+)?\s*{([\s\S]*)}/g,
      // Function method in a class (greedy body)
      /(\w+)\s*\([^)]*\)\s*{([\s\S]*)}/g,
    ];
    
    for (const pattern of patterns) {
      const matches = Array.from(code.matchAll(pattern));
      
      if (matches.length > 0) {
        // Use the first match or prioritize based on LeetCode-like names
        let bestMatch = matches[0];
        
        for (const match of matches) {
          const functionName = match[1];
          if (functionName && (
            functionName.toLowerCase().includes('solution') ||
            functionName.toLowerCase() === 'solve' ||
            functionName.toLowerCase() === 'answer'
          )) {
            bestMatch = match;
            break;
          }
        }
        
        // Calculate start and end lines
        const matchedText = bestMatch[0];
        const startPos = code.indexOf(matchedText);
        const beforeText = code.substring(0, startPos);
        const startLine = beforeText.split('\n').length;
        const endLine = startLine + matchedText.split('\n').length - 1;
        
        return {
          name: bestMatch[1] || 'unnamed function',
          code: matchedText,
          startLine,
          endLine
        };
      }
    }
  } else if (language === 'go') {
    // Look for func patterns in Go
    const pattern = /func\s+(\w+)\s*\([^)]*\)[^{]*{([^{}]|{[^{}]*})*}/g;
    const matches = Array.from(code.matchAll(pattern));
    
    if (matches.length > 0) {
      // Prioritize based on naming or use first match
      let bestMatch = matches[0];
      
      for (const match of matches) {
        const functionName = match[1];
        if (functionName && (
          functionName.toLowerCase().includes('solve') ||
          functionName.toLowerCase() === 'solution' ||
          functionName.toLowerCase() === 'answer'
        )) {
          bestMatch = match;
          break;
        }
      }
      
      // Calculate start and end lines
      const matchedText = bestMatch[0];
      const startPos = code.indexOf(matchedText);
      const beforeText = code.substring(0, startPos);
      const startLine = beforeText.split('\n').length;
      const endLine = startLine + matchedText.split('\n').length - 1;
      
      return {
        name: bestMatch[1] || 'unnamed function',
        code: matchedText,
        startLine,
        endLine
      };
    }
  }
  
  return undefined;
} 