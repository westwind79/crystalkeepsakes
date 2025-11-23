# Git Pull Guide - Handling Conflicts

## Quick Commands Reference

### Option 1: Keep REMOTE changes (my fixes) - RECOMMENDED ✅
```bash
# Save your local changes just in case
git stash

# Pull the remote changes
git pull origin master

# If you want to see what you stashed
git stash list

# If you want to restore your local changes on top
git stash pop
```

### Option 2: Keep YOUR local changes and merge with remote
```bash
# Commit your local changes first
git add .
git commit -m "My local changes"

# Pull and merge
git pull origin master

# If conflicts occur, git will tell you which files
# Edit those files, then:
git add .
git commit -m "Merged remote changes"
```

### Option 3: See what would change (safe preview)
```bash
# Fetch changes without applying
git fetch origin

# See what's different
git diff HEAD origin/master

# See list of changed files
git diff --name-only HEAD origin/master
```

### Option 4: RESET to remote (discard all local changes) ⚠️
```bash
# WARNING: This deletes ALL your local changes!
git fetch origin
git reset --hard origin/master
```

---

## Step-by-Step: Recommended Approach

### Step 1: Check current status
```bash
cd /app
git status
```

This shows:
- Modified files (red = unstaged, green = staged)
- Untracked files
- Your current branch

### Step 2: See what files conflict
```bash
git fetch origin
git diff --name-only HEAD origin/master
```

This lists files that changed on remote.

### Step 3: Save your work (safe!)
```bash
# Stash saves ALL your changes temporarily
git stash save "My local changes before pull"

# Verify it's saved
git stash list
```

### Step 4: Pull remote changes
```bash
git pull origin master
```

### Step 5: Review the pulled changes
```bash
# See what was changed
git log --oneline -5

# View specific file changes
git show HEAD:api/cockpit3d-data-fetcher.php
```

### Step 6: Restore your changes (if needed)
```bash
# Apply your stashed changes on top
git stash pop

# If conflicts occur, git will mark them in files like:
# <<<<<<< Updated upstream
# (remote changes)
# =======
# (your changes)
# >>>>>>> Stashed changes
```

---

## Common Scenarios

### Scenario A: "I have local changes I want to keep"
```bash
git stash                    # Save your changes
git pull origin master       # Get remote changes
git stash pop               # Apply your changes back
# Resolve any conflicts manually
git add .
git commit -m "Merged with remote"
```

### Scenario B: "I want the remote changes only"
```bash
git stash                    # Save local (just in case)
git pull origin master       # Get remote changes
# Don't do 'git stash pop' - keep remote version
```

### Scenario C: "I just want to start fresh with remote"
```bash
git fetch origin
git reset --hard origin/master  # ⚠️ Deletes local changes!
```

---

## Resolving Merge Conflicts

If you get a conflict after pulling:

### 1. Find conflicted files
```bash
git status
# Look for "both modified:" files
```

### 2. Open the file
Conflicts look like this:
```php
<<<<<<< HEAD (your current changes)
$oldCode = 'your version';
=======
$newCode = 'remote version';
>>>>>>> origin/master
```

### 3. Edit the file
- Remove the `<<<<<<<`, `=======`, `>>>>>>>` markers
- Keep the version you want (or combine them)
- Save the file

### 4. Mark as resolved
```bash
git add path/to/file.php
```

### 5. Complete the merge
```bash
git commit -m "Resolved merge conflicts"
```

---

## What Files Changed (from my work)

Based on git log, these files were modified/created:

**Modified:**
- `api/cockpit3d-data-fetcher.php` - Static products fix

**New files:**
- `scripts/generate-products-node.js`
- `test-static-products-fix.js`
- `STATIC_PRODUCTS_FIX.md`
- `CHANGES_SUMMARY.md`
- `QUICK_VIEW_CHANGES.md`

---

## Quick Decision Tree

**Do you have important local changes?**
- YES → Use Option 1 (stash, pull, pop)
- NO → Use Option 4 (reset --hard)

**Are the changes in the same files I modified?**
- YES → You'll need to merge conflicts manually
- NO → Pull should work automatically

**Do you want to review before applying?**
- YES → Use Option 3 (fetch and diff first)
- NO → Go ahead with pull

---

## Emergency Recovery

If something goes wrong:

```bash
# See recent commits
git reflog

# Restore to a previous state
git reset --hard HEAD@{1}

# Or restore specific file
git checkout HEAD -- path/to/file.php
```

---

## Need Help?

Run this to see your situation:
```bash
git status
git log --oneline -3
git diff --name-only HEAD origin/master
```

Then share the output and I can give specific advice!
