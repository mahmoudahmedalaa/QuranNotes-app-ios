---
name: project-cleanup
description: Audit, reorganise, and clean up project file structures. Use when the project has scattered files, duplicate folders, inconsistent naming, orphaned content, or when the user asks to "organise", "clean up", "restructure", or "find where things are". Also use when starting a new phase of development and you suspect the file structure has drifted from its intended organisation. Covers skills, documentation, configuration, and any other project files.
---
# Project Cleanup

Systematically audit, classify, and reorganise project files for optimal efficiency and maintainability. This skill ensures nothing breaks during reorganisation and that all references are updated.

## When to Use

- User says "organise", "clean up", "restructure", or "where are my files"
- You notice scattered files, duplicate folders, or inconsistent naming
- Starting a new phase of development and the structure has drifted
- After adding many files over time without a clear organisational plan
- When onboarding needs to be smoother (new AI agents or collaborators)

---

## Phase 1: Audit — Map What Exists

Before moving anything, build a complete inventory. Use `find_by_name`, `list_dir`, and `grep_search` to discover all files.

### 1.1 Scan for file clusters

Look for these common patterns of disorganisation:

| Pattern                          | What to Look For                                                                       |
| :------------------------------- | :------------------------------------------------------------------------------------- |
| **Duplicate structures**   | Two folders serving the same purpose (e.g.,`.agent/` and `02-agent/`)              |
| **Orphaned files**         | Files in the wrong folder or with no clear parent                                      |
| **Inconsistent naming**    | `SKILL.md` vs `skill.md` vs `MySkill.md` — no convention                        |
| **Deep nesting**           | Important files buried 4+ levels deep                                                  |
| **Numbered prefixes**      | `00-research/`, `01-docs/` — often a sign of early organisation that didn't scale |
| **Temp files left behind** | `HANDOVER.md`, `TODO.md`, debug files that should have been deleted                |
| **Scattered by type**      | Skills in 3 different folders, docs in 5 different places                              |

### 1.2 Read every file before classifying

Never classify a file by its name alone — always read at least the first 30-50 lines to understand what it actually is. A file named `rules.md` might be a skill, a file named `DEPLOYMENT.md` might be documentation or a workflow.

### 1.3 Classify each file

Assign every file to exactly one category:

| Category            | Definition                                                | Naming Convention    | Destination              |
| :------------------ | :-------------------------------------------------------- | :------------------- | :----------------------- |
| **Skill**     | Teaches the AI how to behave, work, or follow a process   | `<name>-SKILL.md`  | `.agent/skills/`       |
| **Workflow**  | Slash-command shortcut (framework reads from this folder) | `<name>.md`        | `.agent/workflows/`    |
| **Config**    | Locked project values — IDs, keys, URLs                  | `<name>.md`        | `.agent/config/`       |
| **Doc**       | Project knowledge — PRD, architecture, research, legal   | `<name>.md`        | `docs/`                |
| **Reference** | Binary business files — PDFs, presentations, logos       | Keep original name   | `docs/reference-docs/` |
| **Research**  | Competitive analysis, market research, decision logs      | `<name>.md`        | `docs/research/`       |
| **Temp**      | Handover docs, debug logs, one-time-use files             | Delete after reading | Delete                   |

### Classification decision tree

```
Does this file teach the AI how to do something?
├─ Yes → SKILL
│   Does it have a slash-command shortcut?
│   ├─ Yes → Also create a WORKFLOW redirect
│   └─ No → Skill only
└─ No
    Does it contain locked project values (keys, IDs)?
    ├─ Yes → CONFIG
    └─ No
        Is it project knowledge (architecture, requirements)?
        ├─ Yes → DOC (or RESEARCH if it's analysis/decisions)
        └─ No
            Is it a temporary/handover file?
            ├─ Yes → TEMP (delete)
            └─ No → Ask the user
```

---

## Phase 2: Plan — Design the Target Structure

### 2.1 Propose the clean structure

Present the user with a clear before/after showing:

1. **Current state** — every file and its current location
2. **Proposed state** — where each file will go, with new name if applicable
3. **Rationale** — why each move makes sense

### 2.2 Naming conventions

Enforce consistent naming:

| Rule                          | Example                             |
| :---------------------------- | :---------------------------------- |
| Skills end with `-SKILL.md` | `systematic-debugging-SKILL.md`   |
| Use kebab-case for filenames  | `core-project-rules-SKILL.md`     |
| Names should be descriptive   | `core-project-rules` not `base` |
| Complex skills get a folder   | `ui-ux-pro-max/SKILL.md`          |

### 2.3 Key principles

- **Two main locations**: `.agent/` for AI-facing files, `docs/` for project knowledge
- **Flat over deep**: prefer `.agent/skills/file.md` over `.agent/skills/category/subcategory/file.md`
- **One source of truth**: no duplicates; use redirects if the same content must be accessible from two places
- **Subfolder only for clusters**: create subfolders (like `docs/research/`) only when there are 2+ related files
- **Don't break framework features**: workflows must stay in `.agent/workflows/` for slash commands to work

### 2.4 Get user approval

Present the plan via `notify_user` with the implementation plan as a `PathsToReview`. Do not proceed without approval — reorganisation is hard to undo.

---

## Phase 3: Execute — Move Files Safely

### 3.1 Order of operations

Execute moves in this specific order to minimise risk:

1. **Create destination directories** (`mkdir -p`)
2. **Move files** (`mv` — never copy-then-delete, to preserve git history)
3. **Create redirects** (e.g., workflow redirects pointing to skills)
4. **Update references** (AGENTS.md, README.md, any cross-references in moved files)
5. **Delete empty source folders** (`rm -rf` only after confirming empty)
6. **Delete temp/orphaned files**

### 3.2 Batch moves by category

Group moves into logical batches and execute them together. This reduces the number of shell commands and makes it easier to verify:

```bash
# Skills batch
mv .agent/rules/base.md .agent/skills/core-project-rules-SKILL.md
mv .agent/rules/design-reference.md .agent/skills/fintech-design-reference-SKILL.md
# ... etc

# Docs batch
mv 01-docs/PRD.md docs/
mv 01-docs/TECH_STACK.md docs/
# ... etc
```

### 3.3 Create workflow redirects

For skills that had slash-command workflows, create thin redirects:

```markdown
---
description: <original description — this is what the slash-command listing shows>
---
> **This is a slash-command shortcut.** Full skill content is in [<name>-SKILL.md](../skills/<name>-SKILL.md). Read that file for complete instructions.
```

### 3.4 Update the master AI instructions

After all moves, update `AGENTS.md` with:

- New folder structure diagram
- Updated file paths in all references
- Updated skill index table
- Verify the reading order in the "MANDATORY — Read Before ANYTHING Else" section

This is critical — if AGENTS.md points to old paths, every future AI session starts confused.

---

## Phase 4: Verify — Confirm Nothing is Broken

### 4.1 Structural verification

```bash
# Verify all skills are in place
ls -la .agent/skills/

# Verify all docs are consolidated  
ls -la docs/

# Verify old folders are gone
ls -d 00-* 01-* 02-* 03-* 04-* 05-* 2>/dev/null  # should return nothing

# Verify no orphaned files
find . -maxdepth 1 -name "*.md" -not -name "README.md"  # only README.md should remain at root
```

### 4.2 Reference verification

Check that no moved file is referenced by its old path:

```bash
# Search for old paths in remaining files
grep -r "02-agent" .agent/ docs/ README.md 2>/dev/null
grep -r "01-docs" .agent/ docs/ README.md 2>/dev/null
grep -r "03-workflows" .agent/ docs/ README.md 2>/dev/null
grep -r "rules/base.md" .agent/ 2>/dev/null
```

### 4.3 Slash-command verification

Confirm each workflow redirect file exists and points to a real skill:

```bash
for f in .agent/workflows/*.md; do
  echo "--- $f ---"
  cat "$f"
  echo ""
done
```

### 4.4 Present results to user

Show the final clean structure and confirm everything looks correct.

---

## Anti-Patterns

| ❌ Don't                              | ✅ Do                                               |
| :------------------------------------ | :-------------------------------------------------- |
| Move files without reading them first | Read every file to understand its purpose           |
| Classify by filename alone            | Read content to determine the category              |
| Move without a plan                   | Present the full plan and get approval first        |
| Forget to update AGENTS.md            | Always update the master instructions last          |
| Create deep nested hierarchies        | Keep it flat — 2 levels max                        |
| Create folders for single files       | Only create subfolders for 2+ related files         |
| Copy-then-delete files                | Use `mv` to preserve git history                  |
| Delete without confirming empty       | Always verify folders are empty before `rm -rf`   |
| Start moving before auditing          | Complete the full audit before moving anything      |
| Skip the verification step            | Always verify paths, references, and slash commands |
