---
name: summarize-changes
description: Summarize all repository changes since the latest commit, with a concise explanation first and a developer-focused file-by-file overview after.
argument-hint: [optional focus or base ref]
agent: agent
---

Review the changes in the current Git repository relative to `HEAD` (the latest commit). If the user supplies a base ref or focus in the arguments, use it as an additional scope or focus, but still make clear what comparison was used.

Inspect the repository state without changing it:

1. Check `git status --short` and `git diff HEAD --name-status` to identify staged and unstaged tracked changes, including deletions and renames.
2. Inspect the complete tracked diff with `git diff HEAD --`.
3. Identify untracked files with `git ls-files --others --exclude-standard` and read each relevant file so new-file contents are included in the review.
4. Do not treat ignored files as changes. Do not include commits already contained in `HEAD` unless the user explicitly asks for a commit comparison.

Respond in German unless the user asks for another language. The output must start with the short content summary, before any technical or file details:

## Inhaltliche Zusammenfassung

Give a concise, plain-language explanation of what the changes accomplish and why they matter. Lead with the overall purpose, not with Git terminology. If the purpose cannot be established confidently from the diff, say so explicitly rather than guessing.

## Änderungen für Entwickler:innen

List every changed, deleted, renamed, and newly added file, grouped by feature or area where useful. For each file, briefly explain the substantive code/config/documentation changes. Focus on behavior, interfaces, data flow, and noteworthy implementation details; avoid merely paraphrasing filenames. Mention relevant tests and whether they were added or changed. Do not claim tests were run unless there is evidence in the conversation that they were run.

If the working tree is clean, say that there are no uncommitted changes relative to `HEAD`. If there are no changes, do not invent a summary. Keep the report concise but complete, and do not modify files, stage changes, or create commits.
