# Git Setup and Pull Request Instructions

## Repository Setup

Since this project isn't currently connected to GitHub, here are the steps to set up version control and create the pull request:

### 1. Initialize Git Repository

```bash
cd yacht-charter-dashboard
git init
git add .
git commit -m "Initial commit: Yacht charter dashboard with yacht dropdown fix and SitRep improvements

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 2. Create GitHub Repository

**Option A: Using GitHub CLI**
```bash
gh repo create Seascape-op --public --description "Yacht Charter Dashboard - Management system for yacht bookings and charters"
git remote add origin https://github.com/[your-username]/Seascape-op.git
git branch -M main
git push -u origin main
```

**Option B: Using GitHub Web Interface**
1. Go to https://github.com/new
2. Repository name: `Seascape-op`
3. Description: `Yacht Charter Dashboard - Management system for yacht bookings and charters`
4. Make it Public or Private as needed
5. Click "Create repository"
6. Follow the commands to connect your local repo

### 3. Create Feature Branch for PR

```bash
git checkout -b feature/yacht-dropdown-fix-and-sitrep-reordering
```

### 4. Stage Current Changes

```bash
# Stage the modified files from our session
git add src/components/booking/BookingPanel.jsx
git add src/services/UnifiedDataService.js  
git add src/components/dashboard/SitRepSection.jsx
git add session-summary/session-14-yacht-dropdown-fix-and-sitrep-reordering/

# Commit with detailed message
git commit -m "Fix yacht dropdown data binding and reorder SitRep widget display

• Fixed yacht dropdown to use yacht IDs instead of names for proper database sync
• Updated save logic to directly map yacht selection to database fields  
• Enhanced SitRep widget data model with customer names and booking codes
• Reordered SitRep display: Yacht Name → Customer Name → Dates
• Comprehensive testing completed with database verification

Files changed:
- src/components/booking/BookingPanel.jsx (yacht dropdown fix)
- src/services/UnifiedDataService.js (enhanced data model) 
- src/components/dashboard/SitRepSection.jsx (reordered hierarchy)

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 5. Push Feature Branch

```bash
git push -u origin feature/yacht-dropdown-fix-and-sitrep-reordering
```

### 6. Create Pull Request

**Option A: Using GitHub CLI**
```bash
gh pr create --title "Fix yacht dropdown data binding and reorder SitRep widget display" --body-file PULL_REQUEST_TEMPLATE.md
```

**Option B: Using GitHub Web Interface**
1. Go to your repository on GitHub
2. Click "Compare & pull request" button
3. Use the content from `PULL_REQUEST_TEMPLATE.md` as the PR description
4. Set base branch to `main` and compare branch to `feature/yacht-dropdown-fix-and-sitrep-reordering`
5. Click "Create pull request"

## Pre-Push Checklist

Before pushing to GitHub, ensure:

- [ ] All sensitive information removed (API keys, passwords, etc.)
- [ ] Environment files (.env) are in .gitignore
- [ ] Node modules and build artifacts excluded
- [ ] Session documentation is complete
- [ ] Code follows project conventions
- [ ] All tests passing

## Recommended .gitignore

Create/update `.gitignore` file:

```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
/dist
/build

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Logs
*.log
logs/

# Testing
coverage/

# Temporary files
*.tmp
*.temp

# Database
*.db
*.sqlite

# Supabase (if using local development)
supabase/.branches
supabase/.temp
```

## Branch Strategy

**Recommended workflow:**
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Individual feature branches
- `hotfix/*` - Critical fixes
- `release/*` - Release preparation

## Commit Message Convention

Follow conventional commits:
```
type(scope): description

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix  
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tool changes

**Example:**
```
feat(booking): fix yacht dropdown data binding

- Changed dropdown to use yacht IDs instead of names
- Updated save logic for proper database synchronization
- Added comprehensive testing with database verification

Fixes yacht name field updates in Supabase bookings table.
```

## Next Steps After PR Creation

1. **Review Process**: Assign reviewers familiar with the codebase
2. **CI/CD Setup**: Configure automated testing and deployment
3. **Documentation**: Update project README with recent changes
4. **Monitoring**: Set up error tracking and performance monitoring
5. **User Testing**: Gather feedback on new SitRep layout

---

**Note**: This file can be deleted after repository setup is complete.