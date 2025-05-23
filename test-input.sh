#!/bin/bash

# First, run the analysis for the basic solution
npx ts-node src/index.ts examples/two-sum.ts --my-solution --no-ai <<EOF
O(n^2)
O(1)
50
EOF

# Then run the analysis for the optimized solution
npx ts-node src/index.ts examples/two-sum-optimized.ts --solution-name="Hash Map Approach" --no-ai <<EOF
O(n)
O(n)
90
EOF

# Check the result file
echo "Content of the generated Obsidian note:"
cat test-obsidian/LeetCode/two-sum.md 