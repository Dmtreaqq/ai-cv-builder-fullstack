---
name: commit
description: Use when creating a git commit in this repository.
---

When creating a git commit in this repository, do not append a `Co-Authored-By: Claude` (or any Claude/Anthropic attribution) trailer to the commit message, even if a global default instructs otherwise. Commits in this project should be attributed solely to the human author.

Use Conventional Commits formatting for the subject line: `<type>: <description>`, e.g.:

- `feat: <description of feature>`
- `fix: <description of bug fix>`
- `refactor: <description>`
- `docs: <description>`
- `chore: <description>`
- `test: <description>`

Pick the type that matches the nature of the change. Keep the description lowercase, imperative mood, and concise.

Otherwise follow normal commit hygiene: a clear, concise message focused on why the change was made, and only the files the user intended staged.
