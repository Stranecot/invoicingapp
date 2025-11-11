# GitHub Issues Summary - Invoice App Refactoring

**Repository**: `Stranecot/invoicingapp`
**Total Issues Created**: 26
**Date**: 2025-11-11

---

## Overview

All 26 user stories have been created as GitHub issues and are ready to be added to the **IngenApp** project. The issues are organized into 7 epics following the implementation roadmap.

---

## Issues by Epic

### Epic 1: Monorepo Setup (3 issues)
**Goal**: Set up monorepo structure and shared packages

- **Issue #1**: [Create monorepo with Turborepo](https://github.com/Stranecot/invoicingapp/issues/1)
  - Story Points: 3
  - Labels: `epic:monorepo`, `type:refactor`, `priority:high`, `size:small`
  - Dependencies: None

- **Issue #2**: [Create shared @invoice-app/database package](https://github.com/Stranecot/invoicingapp/issues/2)
  - Story Points: 5
  - Labels: `epic:monorepo`, `type:refactor`, `priority:high`, `size:medium`
  - Dependencies: #1

- **Issue #3**: [Create shared @invoice-app/auth package](https://github.com/Stranecot/invoicingapp/issues/3)
  - Story Points: 3
  - Labels: `epic:monorepo`, `type:refactor`, `priority:high`, `size:small`
  - Dependencies: #1, #2

**Total Story Points**: 11

---

### Epic 2: Database Schema for Multi-Tenancy (3 issues)
**Goal**: Enhance database schema with Organization and Invitation models

- **Issue #4**: [Add Organization model for multi-tenancy](https://github.com/Stranecot/invoicingapp/issues/4)
  - Story Points: 5
  - Labels: `epic:database`, `type:feature`, `priority:high`, `size:medium`
  - Dependencies: #2

- **Issue #5**: [Add Invitation model for gated access](https://github.com/Stranecot/invoicingapp/issues/5)
  - Story Points: 5
  - Labels: `epic:database`, `type:feature`, `priority:high`, `size:medium`
  - Dependencies: #4

- **Issue #6**: [Update User model for multi-tenancy](https://github.com/Stranecot/invoicingapp/issues/6)
  - Story Points: 3
  - Labels: `epic:database`, `type:refactor`, `priority:high`, `size:small`
  - Dependencies: #4, #5

**Total Story Points**: 13

---

### Epic 3: Invitation System Backend (4 issues)
**Goal**: Build invitation creation, validation, and acceptance logic

- **Issue #7**: [Build invitation CRUD API endpoints](https://github.com/Stranecot/invoicingapp/issues/7)
  - Story Points: 8
  - Labels: `epic:invitation`, `type:feature`, `priority:high`, `size:large`
  - Dependencies: #3, #5

- **Issue #8**: [Set up email service and send invitation emails](https://github.com/Stranecot/invoicingapp/issues/8)
  - Story Points: 5
  - Labels: `epic:invitation`, `type:feature`, `priority:high`, `size:medium`
  - Dependencies: #7

- **Issue #9**: [Update Clerk webhook to enforce invitation-based signup](https://github.com/Stranecot/invoicingapp/issues/9) ⚠️ **CRITICAL**
  - Story Points: 8
  - Labels: `epic:invitation`, `type:security`, `priority:high`, `size:large`
  - Dependencies: #5, #6

- **Issue #10**: [Create invitation acceptance endpoints](https://github.com/Stranecot/invoicingapp/issues/10)
  - Story Points: 5
  - Labels: `epic:invitation`, `type:feature`, `priority:high`, `size:medium`
  - Dependencies: #5

**Total Story Points**: 26

---

### Epic 4: Admin Dashboard App (6 issues)
**Goal**: Build the admin dashboard Next.js app

- **Issue #11**: [Scaffold admin dashboard Next.js app](https://github.com/Stranecot/invoicingapp/issues/11)
  - Story Points: 3
  - Labels: `epic:admin-dashboard`, `type:feature`, `priority:high`, `size:small`
  - Dependencies: #1, #2, #3

- **Issue #12**: [Implement admin authentication and RBAC](https://github.com/Stranecot/invoicingapp/issues/12)
  - Story Points: 5
  - Labels: `epic:admin-dashboard`, `type:security`, `priority:high`, `size:medium`
  - Dependencies: #11, #3

- **Issue #13**: [Build overview dashboard page](https://github.com/Stranecot/invoicingapp/issues/13)
  - Story Points: 8
  - Labels: `epic:admin-dashboard`, `type:feature`, `priority:medium`, `size:large`
  - Dependencies: #12, #4, #5

- **Issue #14**: [Build organization management pages](https://github.com/Stranecot/invoicingapp/issues/14)
  - Story Points: 13
  - Labels: `epic:admin-dashboard`, `type:feature`, `priority:high`, `size:large`
  - Dependencies: #12, #4

- **Issue #15**: [Build user management pages](https://github.com/Stranecot/invoicingapp/issues/15)
  - Story Points: 8
  - Labels: `epic:admin-dashboard`, `type:feature`, `priority:medium`, `size:large`
  - Dependencies: #12, #6

- **Issue #16**: [Build invitation management UI](https://github.com/Stranecot/invoicingapp/issues/16)
  - Story Points: 13
  - Labels: `epic:admin-dashboard`, `type:feature`, `priority:high`, `size:large`
  - Dependencies: #7, #8, #12

**Total Story Points**: 50

---

### Epic 5: Client Portal Updates (4 issues)
**Goal**: Update client portal for multi-tenancy and invitation flow

- **Issue #17**: [Create invitation acceptance page](https://github.com/Stranecot/invoicingapp/issues/17)
  - Story Points: 8
  - Labels: `epic:client-portal`, `type:feature`, `priority:high`, `size:large`
  - Dependencies: #10

- **Issue #18**: [Add organization filtering to all data queries](https://github.com/Stranecot/invoicingapp/issues/18) ⚠️ **CRITICAL**
  - Story Points: 13
  - Labels: `epic:client-portal`, `type:refactor`, `priority:high`, `size:large`
  - Dependencies: #6, #4

- **Issue #19**: [Create welcome wizard for new users](https://github.com/Stranecot/invoicingapp/issues/19)
  - Story Points: 8
  - Labels: `epic:client-portal`, `type:feature`, `priority:medium`, `size:large`
  - Dependencies: #17

- **Issue #20**: [Enhance RBAC for organization-level permissions](https://github.com/Stranecot/invoicingapp/issues/20)
  - Story Points: 8
  - Labels: `epic:client-portal`, `type:security`, `priority:medium`, `size:large`
  - Dependencies: #18

**Total Story Points**: 37

---

### Epic 6: Security & Testing (3 issues)
**Goal**: Ensure system security and comprehensive test coverage

- **Issue #21**: [Conduct comprehensive security audit](https://github.com/Stranecot/invoicingapp/issues/21)
  - Story Points: 8
  - Labels: `epic:security`, `type:security`, `priority:high`, `size:large`
  - Dependencies: All previous issues

- **Issue #22**: [Write comprehensive unit tests](https://github.com/Stranecot/invoicingapp/issues/22)
  - Story Points: 13
  - Labels: `epic:security`, `type:feature`, `priority:medium`, `size:large`
  - Dependencies: All core functionality

- **Issue #23**: [Write end-to-end tests with Playwright](https://github.com/Stranecot/invoicingapp/issues/23)
  - Story Points: 13
  - Labels: `epic:security`, `type:feature`, `priority:medium`, `size:large`
  - Dependencies: All features, #22

**Total Story Points**: 34

---

### Epic 7: Deployment (3 issues)
**Goal**: Deploy both apps to production with monitoring

- **Issue #24**: [Set up Vercel projects for both apps](https://github.com/Stranecot/invoicingapp/issues/24)
  - Story Points: 5
  - Labels: `epic:deployment`, `type:feature`, `priority:high`, `size:medium`
  - Dependencies: All features complete

- **Issue #25**: [Configure CI/CD pipeline with GitHub Actions](https://github.com/Stranecot/invoicingapp/issues/25)
  - Story Points: 5
  - Labels: `epic:deployment`, `type:feature`, `priority:medium`, `size:medium`
  - Dependencies: #22, #23, #24

- **Issue #26**: [Set up monitoring and error tracking](https://github.com/Stranecot/invoicingapp/issues/26)
  - Story Points: 3
  - Labels: `epic:deployment`, `type:feature`, `priority:medium`, `size:small`
  - Dependencies: #24

**Total Story Points**: 13

---

## Summary Statistics

### By Epic
| Epic | Issues | Story Points | Priority |
|------|--------|--------------|----------|
| Epic 1: Monorepo Setup | 3 | 11 | High |
| Epic 2: Database Schema | 3 | 13 | High |
| Epic 3: Invitation System | 4 | 26 | High |
| Epic 4: Admin Dashboard | 6 | 50 | High/Medium |
| Epic 5: Client Portal | 4 | 37 | High/Medium |
| Epic 6: Security & Testing | 3 | 34 | High/Medium |
| Epic 7: Deployment | 3 | 13 | High/Medium |
| **TOTAL** | **26** | **184** | - |

### By Size
| Size | Count | Story Points Range |
|------|-------|-------------------|
| Small | 6 | 3 |
| Medium | 10 | 5-8 |
| Large | 10 | 13 |

### By Priority
| Priority | Count |
|----------|-------|
| High | 18 |
| Medium | 8 |

### By Type
| Type | Count |
|------|-------|
| Feature | 17 |
| Refactor | 5 |
| Security | 4 |

---

## Critical Path Issues

These issues are on the critical path and block other work:

1. **Issue #1** (Monorepo setup) - Blocks all Epic 1 issues
2. **Issue #4** (Organization model) - Blocks all multi-tenancy features
3. **Issue #9** (Webhook enforcement) - **CRITICAL SECURITY** - Gates all user signups
4. **Issue #18** (Organization filtering) - **CRITICAL SECURITY** - Prevents data leaks

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
Issues: #1, #2, #3, #4, #5, #6
Story Points: 24

### Phase 2: Invitation Backend (Weeks 2-3)
Issues: #7, #8, #9, #10
Story Points: 26

### Phase 3: Admin Dashboard (Weeks 3-5)
Issues: #11, #12, #13, #14, #15, #16
Story Points: 50

### Phase 4: Client Portal (Weeks 5-6)
Issues: #17, #18, #19, #20
Story Points: 37

### Phase 5: Security & Testing (Weeks 6-7)
Issues: #21, #22, #23
Story Points: 34

### Phase 6: Deployment (Weeks 7-8)
Issues: #24, #25, #26
Story Points: 13

---

## Labels Created

### Epic Labels
- `epic:monorepo` - Epic 1 issues
- `epic:database` - Epic 2 issues
- `epic:invitation` - Epic 3 issues
- `epic:admin-dashboard` - Epic 4 issues
- `epic:client-portal` - Epic 5 issues
- `epic:security` - Epic 6 issues
- `epic:deployment` - Epic 7 issues

### Priority Labels
- `priority:high` - Must be done
- `priority:medium` - Should be done
- `priority:low` - Nice to have

### Type Labels
- `type:feature` - New feature
- `type:refactor` - Code refactoring
- `type:security` - Security-related

### Size Labels
- `size:small` - 1-3 story points
- `size:medium` - 5-8 story points
- `size:large` - 13+ story points

---

## Next Steps

1. **Add issues to IngenApp project**:
   ```bash
   # You can manually add them via GitHub UI or use gh CLI
   gh project item-add PROJECT_NUMBER --owner Stranecot --url ISSUE_URL
   ```

2. **Create project views**:
   - Kanban board by status (To Do, In Progress, Done)
   - Table view grouped by Epic
   - Roadmap view by timeline

3. **Assign team members** to issues

4. **Set milestones**:
   - Milestone 1: Foundation (Issues #1-6)
   - Milestone 2: Invitation System (Issues #7-10)
   - Milestone 3: Admin Dashboard (Issues #11-16)
   - Milestone 4: Client Portal (Issues #17-20)
   - Milestone 5: Security & Testing (Issues #21-23)
   - Milestone 6: Deployment (Issues #24-26)

5. **Start with Issue #1** and work sequentially through the critical path

---

## Important Notes

⚠️ **SECURITY CRITICAL ISSUES**:
- **Issue #9**: Webhook enforcement - Must be implemented correctly or unauthorized users can sign up
- **Issue #18**: Organization filtering - Must be implemented correctly or data leaks between tenants

🎯 **HIGH PRIORITY FEATURES**:
- Invitation system (Epic 3) - Core differentiator
- Admin dashboard (Epic 4) - Required for managing users
- Organization filtering (Issue #18) - Required for multi-tenancy

📋 **RECOMMENDED WORKFLOW**:
1. Complete Phase 1 (Foundation) entirely before moving to Phase 2
2. Test each phase thoroughly before proceeding
3. Do NOT skip security issues (#9, #18, #21)
4. Write tests as you go (don't leave for the end)

---

**Document Status**: Complete
**All Issues Created**: ✅
**Labels Created**: ✅
**Ready for Project Assignment**: ✅
