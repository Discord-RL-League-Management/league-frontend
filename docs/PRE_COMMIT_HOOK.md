# Pre-commit and Commit-msg Hooks

This project uses Git hooks to enforce code quality and commit message standards before commits are made.

## Overview

Two Git hooks are configured:

1. **Pre-commit hook** - Runs before the commit is created
2. **Commit-msg hook** - Validates the commit message format

## Pre-commit Hook

The pre-commit hook performs the following checks before allowing a commit:

### 1. Branch Protection

- Blocks all commits directly to `main` or `master` branches
- Requires creating a feature branch and using pull requests
- Prevents accidental commits to protected branches

### 2. Linter (ESLint)

Runs `npm run lint` which includes:

- ESLint recommended rules
- TypeScript ESLint rules
- **Cyclomatic Complexity** - Blocks functions with complexity >= 30
- Code style and best practices

### 3. Test Suite

- Runs `npm test` (Jest)
- Blocks commit if any test fails
- Ensures all tests pass before committing

## Commit-msg Hook

The commit-msg hook validates that commit messages follow the [Conventional Commits](https://www.conventionalcommits.org/) specification using `commitlint`.

### Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Valid Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `build`: Build system or dependency changes
- `ci`: CI/CD changes
- `revert`: Revert previous commit

### Rules

- Type and scope must be lowercase
- Subject is required and cannot be empty
- Max header length: 72 characters
- No period at end of subject

### Examples

✅ **Valid commit messages:**

```
feat: add user authentication
fix(auth): resolve login timeout issue
docs: update API documentation
refactor(api): simplify error handling
test: add unit tests for user service
```

❌ **Invalid commit messages:**

```
Added new feature  # Missing type
FEAT: Add feature  # Type must be lowercase
fix:              # Missing description
feat: add a very long commit message that exceeds the maximum allowed length of 72 characters  # Too long
feat: add feature.  # Period at end
```

## Installation

The hooks are located in `.git/hooks/` and are automatically active once created and made executable.

### Manual Installation

If you need to reinstall the hooks:

1. **Pre-commit hook:**
   ```bash
   cp .git/hooks/pre-commit.sample .git/hooks/pre-commit
   chmod +x .git/hooks/pre-commit
   ```
   Then replace the content with the actual pre-commit hook script.

2. **Commit-msg hook:**
   ```bash
   cp .git/hooks/commit-msg.sample .git/hooks/commit-msg
   chmod +x .git/hooks/commit-msg
   ```
   Then replace the content with the actual commit-msg hook script.

3. **Install dependencies:**
   ```bash
   npm install
   ```
   This installs `@commitlint/cli` and `@commitlint/config-conventional` required for commit message validation.

## Bypassing Hooks

While not recommended, you can bypass the hooks in emergency situations:

```bash
git commit --no-verify
```

**Warning:** Only use this in exceptional circumstances. The hooks exist to maintain code quality and consistency.

## Testing the Hooks

### Test Branch Protection

```bash
git checkout main
# Try to commit - should be blocked
git commit -m "test: test commit"
```

### Test Linting

```bash
# Create a file with lint errors and try to commit
git commit -m "test: test commit"
```

### Test Commit Message Format

```bash
# Try an invalid commit message
git commit -m "invalid commit message"
# Should be rejected

# Try a valid commit message
git commit -m "test: valid commit message"
# Should pass
```

## Configuration Files

- **ESLint config:** `eslint.config.js` - Contains complexity rules and linting configuration
- **Commitlint config:** `commitlint.config.js` - Contains conventional commit validation rules
- **Pre-commit hook:** `.git/hooks/pre-commit` - Branch protection and quality checks
- **Commit-msg hook:** `.git/hooks/commit-msg` - Commit message validation

## Troubleshooting

### Hook not running

- Ensure the hook file is executable: `chmod +x .git/hooks/pre-commit`
- Verify you're in a git repository: `git rev-parse --git-dir`

### Commitlint not found

- Install dependencies: `npm install`
- Verify commitlint is installed: `npm list @commitlint/cli`

### Complexity errors

- Review the function causing the error
- Consider breaking it down into smaller functions
- Maximum allowed complexity is 30

### Commit message validation fails

- Review the error message for specific validation failures
- Ensure the message follows the conventional commit format
- Check that type is lowercase and description is present


