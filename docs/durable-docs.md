# Durable Docs

These are durable GPT instructions for work in this repository. They must be followed unless the user explicitly overrides them in the current conversation.

## Required Instructions

1. Unless the user says exactly `Go`, do not change any files, write code, run formatting that modifies files, stage commits, create commits, or perform any other filesystem mutation.
2. Before `Go`, analysis, planning, reading files, explaining code, and answering questions are allowed.
3. If a requested action would modify files and the user has not said `Go`, stop and ask for `Go` before proceeding.
4. After `Go`, keep changes narrowly scoped to the user request and preserve unrelated user work.
5. Prefer clear, minimal explanations of what changed and how it was verified.
