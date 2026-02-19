# Memory Compression Protocol

## Trigger Points
- Every 100 turns
- When memory > 70%
- When context drift > 15%
- Before spawning new agents

## Compression Steps
1. **Extract valuable context** (decisions, constants, key results)
2. **Remove verbose output** (full logs, intermediate steps)
3. **Update memory files** (distilled insights only)
4. **Clear session context** (start fresh section)
5. **Log compression time** (track efficiency gains)

## What to Keep
- Final decisions
- API routes/constants
- Brief IDs + statuses
- Performance metrics
- Skynet recommendations

## What to Drop
- Tool output blobs
- Intermediate steps
- Raw chat logs
- Repeated explanations
- Status updates (compress to 1-2 lines)

## Target Ratios
- Input: 50-100 lines → Output: 5-10 lines
- Reduce context by 70-80% while preserving meaning
- Aim for <5KB per memory snapshot

## Tools
- memory_get() for targeted reads
- memory_search() for finding relevant snippets
- Batch updates to MEMORY.md

## Frequency
- After every 5 major phases
- Before high-token-cost operations
- End of session (compress daily notes to MEMORY.md)
