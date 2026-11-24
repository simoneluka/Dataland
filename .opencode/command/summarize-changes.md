---
description: Summarize repository changes since HEAD, with the content summary first and a developer-focused file-by-file explanation after.
agent: build
---

Review all changes in the current Git repository relative to `HEAD` (the latest commit). Inspect the state without changing it:

1. Check `git status --short` and `git diff HEAD --name-status` for staged and unstaged tracked changes, including deletions and renames.
2. Inspect the complete tracked diff using `git diff HEAD --`.
3. Find untracked files using `git ls-files --others --exclude-standard` and read each relevant file so its contents are included.
4. Ignore ignored files. Do not include commits already contained in `HEAD` unless explicitly requested.

Respond in German unless asked otherwise. Start with this section, before technical details:

## Inhaltliche Zusammenfassung

Explain briefly in plain language what the changes do and why they matter. Lead with the overall purpose rather than Git terminology. If the purpose is unclear, say so instead of guessing.

Then provide:

## Änderungen für Entwickler:innen

List every changed, deleted, renamed, and newly added file, grouping by feature or area where useful. Explain substantive changes to behavior, interfaces, data flow, configuration, or documentation. Mention relevant test changes, but never claim tests were run without evidence. If the working tree is clean, state that there are no uncommitted changes relative to `HEAD`. Do not modify files, stage changes, or create commits.
