---
type: tool_order
before: { tool: Bash, input_match: 'smoke\.mjs' }
after: { tool: Bash, input_match: 'audit\.mjs\b(?![^"]*smoke)' }
---
