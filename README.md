# Leet Analyzer

<a href="https://www.npmjs.com/package/leet-analyzer">
  <img src="https://img.shields.io/badge/npm-leet_analyzer-red" alt="npm">
</a>
<a href="https://opensource.org/licenses/MIT">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT">
</a>

An interactive CLI tool to analyze LeetCode solutions, determine time and space complexity, and export analysis into formatted Obsidian notes. Leet Analyzer leverages AI for intelligent insights (via Gemini API) and supports solutions in TypeScript, JavaScript, and Go.

## Features

- **Solution Analysis**: Analyze your LeetCode solutions for time and space complexity.
- **AI-Powered Insights**: Utilizes Google's Gemini AI API for intelligent code analysis, providing explanations and performance estimations.
- **Multi-Language Support**: Currently supports TypeScript, JavaScript, and Go.
- **Obsidian Integration**: Automatically exports analysis results into well-structured Obsidian notes, including comparison tables for multiple solution approaches.
- **Solution Comparison**: Easily compare different algorithmic approaches to the same LeetCode problem within a single note.
- **Fallback Analysis**: Provides basic static analysis if AI is unavailable or not configured.
- **Interactive Setup**: Guides users through an interactive setup process if configuration is missing.

## Prerequisites

- Node.js (version 16.0.0 or higher)
- npm (Node Package Manager)
- For AI features: A Google Gemini API Key.
- For Obsidian export: Obsidian installed and a vault created.

## Installation

### Global Installation (Recommended)

```bash
npm install -g leet-analyzer
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/flasonme/leet-analyzer.git

cd leet-analyzer

# Install dependencies
npm install

# Build the project
npm run build

# Link for local development (makes `leet-analyzer` command available globally)
npm link
```

## Configuration

Leet Analyzer can be configured in two ways:

### 1. Environment Variables

Create a `.env` file in the project root (or in the directory where you run the command if installed globally):

```bash
# Gemini API Key (required for AI-powered analysis)
GEMINI_API_KEY=your_gemini_api_key_here

# Obsidian vault path (required for export functionality)
OBSIDIAN_VAULT_PATH=/path/to/your/obsidian/vault

# Obsidian folder for LeetCode notes (relative to vault root, defaults to "LeetCode")
OBSIDIAN_NOTES_FOLDER=LeetCode_Submissions 
```
*(Note: If you've cloned the repository, you can copy `.env.example` to `.env` and fill in your details.)*

## Usage

The basic command structure is:

```bash
leet-analyzer [options] <file_path_to_solution>
```

### Examples:

**1. Analyze a Single Solution (with AI and Obsidian export by default):**
   Provide the path to your LeetCode solution file.

   ```bash
   leet-analyzer path/to/your/leetcode-problem.ts
   ```
   This will:
   - Analyze the solution using Gemini AI (if configured).
   - Export the analysis to an Obsidian note (e.g., `/path/to/your/obsidian/vault/LeetCode/leetcode-problem.md`).

**2. Analyze a Solution with a Specific Name for the Approach:**
   Useful when analyzing multiple approaches to the same problem.

   ```bash
   leet-analyzer --solution-name="Optimized Hash Map Approach" path/to/your/leetcode-problem-optimized.js
   ```
   The `solutionName` will be used in the Obsidian note.

**3. Specify a Custom Output Path for the Obsidian Note:**
   Overrides the default Obsidian path and note naming.

   ```bash
   leet-analyzer path/to/leetcode-problem.go --output ~/my_notes/leetcode/custom-problem-name.md
   ```

**4. Skip AI Analysis (Use Static Fallback Analysis Only):**

   ```bash
   leet-analyzer path/to/leetcode-problem.ts --no-ai
   ```

**5. Skip Exporting to Obsidian:**
   Analysis results will only be shown in the console.

   ```bash
   leet-analyzer path/to/leetcode-problem.ts --no-export
   ```

### Available Options:

| Option                   | Alias | Description                                                                      | Default                                  |
|--------------------------|-------|----------------------------------------------------------------------------------|------------------------------------------|
| `--solution-name <name>` | `-s`  | A specific name for this solution approach (e.g., "Two Pointer").                | "Initial Submission" or AI-detected      |
| `--output <path>`        | `-o`  | Custom file path for the exported Obsidian note.                                 | Based on vault path and problem name     |
| `--no-ai`                |       | Disable AI analysis and use the fallback static analyzer.                        | `false` (AI is enabled if configured)    |
| `--no-export`            |       | Disable exporting the analysis to Obsidian.                                      | `false` (Export is enabled if configured)|
| `--help`                 | `-h`  | Display help information.                                                        |                                          |


## Example Solutions (for testing)

The repository includes example LeetCode solutions in the `examples/` directory. You can use the npm scripts defined in `package.json` to test them:

```bash
# Navigate to the cloned repository directory first
cd leet-analyzer 

# Analyze the example TypeScript solution
npm run analyze:ts

# Analyze the optimized TypeScript solution with a custom name
npm run analyze:ts-optimized

# Analyze the Go solution
npm run analyze:go
```
These scripts use `ts-node` to run the CLI with the example files.

## Obsidian Note Format

The tool generates or updates Obsidian notes with the following structure. If a note for a problem already exists, new solution analyses are appended, and the comparison summary is updated.

```markdown
---
tags: ["leetcode", "two-sum", "leetcode-1"]
status: completed
created: YYYY-MM-DD
modified: YYYY-MM-DD
---

# LeetCode Problem: Two Sum

## Solution: Initial Submission
- **Date Analyzed:** YYYY-MM-DD
- **Time Complexity:** O(n²)
- **Space Complexity:** O(1)
- **Estimated Performance:** Beats ~40% of submissions
- **Analysis:**
  > The nested loop structure leads to O(n²) time complexity... (AI-generated explanation)

- **Code Snippet:**
  // Your code snippet for "Initial Submission" here

## Solution: Hash Map Approach
- **Date Analyzed:** YYYY-MM-DD
- **Time Complexity:** O(n)
- **Space Complexity:** O(n)
- **Estimated Performance:** Beats ~85% of submissions
- **Analysis:**
  > By using a hash map, we can reduce the time complexity to O(n)... (AI-generated explanation)

- **Code Snippet:**
  // Your code snippet for "Hash Map Approach" here

## Comparison Summary
| Solution            | Time Complexity | Space Complexity | Estimated Performance |
|---------------------|-----------------|------------------|-----------------------|
| Initial Submission  | O(n²)           | O(1)             | ~40%                  |
| Hash Map Approach   | O(n)            | O(n)             | ~85%                  |
```

## Contributing

Contributions are welcome! If you have suggestions for improvements, new features, or bug fixes, please feel free to:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature` or `bugfix/YourBugfix`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature/YourFeature`).
6. Open a Pull Request.

Please ensure your code adheres to the existing style and that any new dependencies are justified.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details  