# Project Management Commands

Quick reference for managing the IngenApp refactoring project using GitHub CLI.

---

## View Issues

### List all issues
```bash
gh issue list --limit 30
```

### List issues by epic
```bash
# Epic 1: Monorepo Setup
gh issue list --label "epic:monorepo"

# Epic 2: Database Schema
gh issue list --label "epic:database"

# Epic 3: Invitation System
gh issue list --label "epic:invitation"

# Epic 4: Admin Dashboard
gh issue list --label "epic:admin-dashboard"

# Epic 5: Client Portal
gh issue list --label "epic:client-portal"

# Epic 6: Security & Testing
gh issue list --label "epic:security"

# Epic 7: Deployment
gh issue list --label "epic:deployment"
```

### List issues by priority
```bash
gh issue list --label "priority:high"
gh issue list --label "priority:medium"
```

### List issues by size
```bash
gh issue list --label "size:small"
gh issue list --label "size:medium"
gh issue list --label "size:large"
```

---

## Work with Specific Issues

### View issue details
```bash
gh issue view 1  # View issue #1
gh issue view 9  # View issue #9 (critical webhook enforcement)
```

### Assign issue to yourself
```bash
gh issue edit 1 --add-assignee @me
```

### Add comment to issue
```bash
gh issue comment 1 --body "Started working on this issue"
```

### Close issue when complete
```bash
gh issue close 1 --comment "Completed: Monorepo setup with Turborepo"
```

---

## Add Issues to Project

To add issues to the IngenApp project, you'll need to know the project number first.

### Find project number
```bash
gh project list --owner Stranecot
```

### Add issue to project (replace PROJECT_NUMBER)
```bash
# Add single issue
gh project item-add PROJECT_NUMBER --owner Stranecot --url https://github.com/Stranecot/invoicingapp/issues/1

# Add all issues (run this in bash/powershell)
for i in {1..26}; do
  gh project item-add PROJECT_NUMBER --owner Stranecot --url https://github.com/Stranecot/invoicingapp/issues/$i
done
```

**PowerShell version**:
```powershell
1..26 | ForEach-Object {
  gh project item-add PROJECT_NUMBER --owner Stranecot --url "https://github.com/Stranecot/invoicingapp/issues/$_"
}
```

---

## Create Milestones

### Create milestones for each phase
```bash
gh api repos/Stranecot/invoicingapp/milestones -f title="Phase 1: Foundation" -f description="Monorepo setup and database schema" -f due_on="2025-11-25T00:00:00Z"

gh api repos/Stranecot/invoicingapp/milestones -f title="Phase 2: Invitation System" -f description="Invitation backend and email service" -f due_on="2025-12-02T00:00:00Z"

gh api repos/Stranecot/invoicingapp/milestones -f title="Phase 3: Admin Dashboard" -f description="Admin dashboard app" -f due_on="2025-12-16T00:00:00Z"

gh api repos/Stranecot/invoicingapp/milestones -f title="Phase 4: Client Portal" -f description="Client portal updates" -f due_on="2025-12-23T00:00:00Z"

gh api repos/Stranecot/invoicingapp/milestones -f title="Phase 5: Security & Testing" -f description="Security audit and tests" -f due_on="2025-12-30T00:00:00Z"

gh api repos/Stranecot/invoicingapp/milestones -f title="Phase 6: Deployment" -f description="Production deployment" -f due_on="2026-01-06T00:00:00Z"
```

### Assign issues to milestones
```bash
# Phase 1: Issues 1-6
gh issue edit 1 --milestone "Phase 1: Foundation"
gh issue edit 2 --milestone "Phase 1: Foundation"
gh issue edit 3 --milestone "Phase 1: Foundation"
gh issue edit 4 --milestone "Phase 1: Foundation"
gh issue edit 5 --milestone "Phase 1: Foundation"
gh issue edit 6 --milestone "Phase 1: Foundation"

# Phase 2: Issues 7-10
gh issue edit 7 --milestone "Phase 2: Invitation System"
gh issue edit 8 --milestone "Phase 2: Invitation System"
gh issue edit 9 --milestone "Phase 2: Invitation System"
gh issue edit 10 --milestone "Phase 2: Invitation System"

# Phase 3: Issues 11-16
gh issue edit 11 --milestone "Phase 3: Admin Dashboard"
gh issue edit 12 --milestone "Phase 3: Admin Dashboard"
gh issue edit 13 --milestone "Phase 3: Admin Dashboard"
gh issue edit 14 --milestone "Phase 3: Admin Dashboard"
gh issue edit 15 --milestone "Phase 3: Admin Dashboard"
gh issue edit 16 --milestone "Phase 3: Admin Dashboard"

# Phase 4: Issues 17-20
gh issue edit 17 --milestone "Phase 4: Client Portal"
gh issue edit 18 --milestone "Phase 4: Client Portal"
gh issue edit 19 --milestone "Phase 4: Client Portal"
gh issue edit 20 --milestone "Phase 4: Client Portal"

# Phase 5: Issues 21-23
gh issue edit 21 --milestone "Phase 5: Security & Testing"
gh issue edit 22 --milestone "Phase 5: Security & Testing"
gh issue edit 23 --milestone "Phase 5: Security & Testing"

# Phase 6: Issues 24-26
gh issue edit 24 --milestone "Phase 6: Deployment"
gh issue edit 25 --milestone "Phase 6: Deployment"
gh issue edit 26 --milestone "Phase 6: Deployment"
```

---

## Track Progress

### View milestone progress
```bash
gh api repos/Stranecot/invoicingapp/milestones
```

### View open vs closed issues
```bash
gh issue list --state open | wc -l    # Count open issues
gh issue list --state closed | wc -l  # Count closed issues
```

### View issues in current phase
```bash
gh issue list --milestone "Phase 1: Foundation"
```

---

## Start Working on an Issue

### Recommended workflow for starting an issue:

```bash
# 1. Create a feature branch
git checkout -b feature/issue-1-monorepo-setup

# 2. Assign issue to yourself
gh issue edit 1 --add-assignee @me

# 3. Add comment that you're starting
gh issue comment 1 --body "Started working on monorepo setup"

# 4. Do the work...

# 5. Commit with issue reference
git add .
git commit -m "feat: implement monorepo structure (#1)

- Set up Turborepo configuration
- Created src/apps and src/packages structure
- Configured workspace scripts

Closes #1"

# 6. Push and create PR
git push origin feature/issue-1-monorepo-setup
gh pr create --title "feat: implement monorepo structure" --body "Closes #1"

# 7. After PR is merged and tests pass
gh issue close 1 --comment "✅ Completed and merged to main"
```

---

## Batch Operations

### Close all issues in a phase (when phase is complete)
```bash
# Example: Close all Phase 1 issues
gh issue list --milestone "Phase 1: Foundation" --json number --jq '.[].number' | while read issue; do
  gh issue close $issue --comment "Phase 1 completed"
done
```

### Update all high-priority issues with a label
```bash
gh issue list --label "priority:high" --json number --jq '.[].number' | while read issue; do
  gh issue edit $issue --add-label "needs-review"
done
```

---

## Advanced Queries

### Find unassigned issues
```bash
gh issue list --assignee ""
```

### Find issues assigned to you
```bash
gh issue list --assignee @me
```

### Find issues without a milestone
```bash
gh issue list --json number,title,milestone --jq '.[] | select(.milestone == null) | "\(.number): \(.title)"'
```

### Search issues by keyword
```bash
gh issue list --search "invitation"
gh issue list --search "security"
```

---

## Generate Reports

### Issues by epic (counts)
```bash
echo "Epic 1: Monorepo Setup: $(gh issue list --label 'epic:monorepo' --state all | wc -l)"
echo "Epic 2: Database Schema: $(gh issue list --label 'epic:database' --state all | wc -l)"
echo "Epic 3: Invitation System: $(gh issue list --label 'epic:invitation' --state all | wc -l)"
echo "Epic 4: Admin Dashboard: $(gh issue list --label 'epic:admin-dashboard' --state all | wc -l)"
echo "Epic 5: Client Portal: $(gh issue list --label 'epic:client-portal' --state all | wc -l)"
echo "Epic 6: Security & Testing: $(gh issue list --label 'epic:security' --state all | wc -l)"
echo "Epic 7: Deployment: $(gh issue list --label 'epic:deployment' --state all | wc -l)"
```

### Progress report
```bash
TOTAL=$(gh issue list --state all | wc -l)
CLOSED=$(gh issue list --state closed | wc -l)
OPEN=$(gh issue list --state open | wc -l)
PERCENT=$((CLOSED * 100 / TOTAL))

echo "Total Issues: $TOTAL"
echo "Closed: $CLOSED"
echo "Open: $OPEN"
echo "Progress: $PERCENT%"
```

---

## Useful Aliases

Add these to your shell profile for quick access:

```bash
# ~/.bashrc or ~/.zshrc or PowerShell profile

# List current phase issues
alias phase1="gh issue list --milestone 'Phase 1: Foundation'"
alias phase2="gh issue list --milestone 'Phase 2: Invitation System'"
alias phase3="gh issue list --milestone 'Phase 3: Admin Dashboard'"

# Quick issue views
alias issues-high="gh issue list --label 'priority:high'"
alias issues-mine="gh issue list --assignee @me"
alias issues-open="gh issue list --state open"

# Start working on issue
function start-issue() {
  ISSUE_NUM=$1
  git checkout -b "feature/issue-$ISSUE_NUM"
  gh issue edit $ISSUE_NUM --add-assignee @me
  gh issue comment $ISSUE_NUM --body "Started working on this"
  echo "✅ Started working on issue #$ISSUE_NUM"
}

# Complete issue
function complete-issue() {
  ISSUE_NUM=$1
  gh issue close $ISSUE_NUM --comment "✅ Completed"
  echo "✅ Closed issue #$ISSUE_NUM"
}
```

**PowerShell version**:
```powershell
# Add to $PROFILE

function Start-Issue {
  param([int]$IssueNum)
  git checkout -b "feature/issue-$IssueNum"
  gh issue edit $IssueNum --add-assignee "@me"
  gh issue comment $IssueNum --body "Started working on this"
  Write-Host "✅ Started working on issue #$IssueNum" -ForegroundColor Green
}

function Complete-Issue {
  param([int]$IssueNum)
  gh issue close $IssueNum --comment "✅ Completed"
  Write-Host "✅ Closed issue #$IssueNum" -ForegroundColor Green
}

Set-Alias issues-high -Value { gh issue list --label "priority:high" }
Set-Alias issues-mine -Value { gh issue list --assignee "@me" }
```

---

## Quick Reference: Issue Numbers

**Epic 1**: #1-3 (Monorepo)
**Epic 2**: #4-6 (Database)
**Epic 3**: #7-10 (Invitation)
**Epic 4**: #11-16 (Admin Dashboard)
**Epic 5**: #17-20 (Client Portal)
**Epic 6**: #21-23 (Security)
**Epic 7**: #24-26 (Deployment)

**Critical Issues**: #9 (Webhook), #18 (Org Filtering)

---

## Need Help?

```bash
# GitHub CLI help
gh help

# Issue-specific help
gh issue --help

# Project-specific help
gh project --help
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-11
