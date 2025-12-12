# Code Review Command

Perform a comprehensive code review of:
1. **Modified files** - Files that have been changed (from git diff or unsaved changes)
2. **Recently opened files** - Files that are currently open in the editor or were recently viewed
3. **Selected code** - If specific code is selected, review that instead

Prioritize reviewing modified/opened files first, then selected code if provided. Follow this systematic approach:

## Review Process

1. **Identify files to review:**
   - **Modified files**: Check git status/diff for files that have been changed (staged or unstaged)
   - **Open files**: Review all files currently open in the editor tabs
   - **Recently viewed**: Check recently viewed files from the file history
   - **Unsaved changes**: Include files with unsaved modifications
   - **List all files** that need review at the start of your response

2. **For each file identified:**
   - Read the entire file to understand context
   - Review using the checklist below
   - Note any issues with file path and line numbers
   - Check for consistency with related files

3. **Provide summary** of all findings across all reviewed files, organized by file and priority

## Review Checklist

### 1. **Code Quality & Best Practices**
- [ ] Code follows project conventions and style guide
- [ ] Proper TypeScript types and interfaces are used
- [ ] No `any` types without justification
- [ ] Functions are properly typed with return types
- [ ] Code is DRY (Don't Repeat Yourself)
- [ ] Meaningful variable and function names
- [ ] Appropriate comments and documentation

### 2. **Performance & Optimization**
- [ ] No unnecessary re-renders or effect dependencies
- [ ] Proper use of `useCallback`, `useMemo`, `useRef` where needed
- [ ] Efficient algorithms and data structures
- [ ] No memory leaks (proper cleanup in effects)
- [ ] Large operations are optimized or memoized

### 3. **React/TypeScript Specific**
- [ ] Proper hook dependencies (no missing or extra deps)
- [ ] No stale closures
- [ ] Proper error handling and edge cases
- [ ] Accessibility considerations (ARIA labels, keyboard navigation)
- [ ] Component props are properly validated
- [ ] State management is appropriate (local vs global)

### 4. **Security & Safety**
- [ ] No XSS vulnerabilities (proper sanitization)
- [ ] Input validation where needed
- [ ] No sensitive data exposed
- [ ] Proper error boundaries
- [ ] Safe handling of user input

### 5. **Architecture & Design**
- [ ] Proper separation of concerns
- [ ] Single Responsibility Principle
- [ ] Code is testable
- [ ] Dependencies are minimal and appropriate
- [ ] Follows established patterns in the codebase

### 6. **Bugs & Edge Cases**
- [ ] Handles null/undefined values
- [ ] Handles empty arrays/objects
- [ ] Handles error states
- [ ] No race conditions
- [ ] Proper cleanup on unmount

## Review Format

For each issue found, provide:
1. **Severity**: Critical / High / Medium / Low
2. **Location**: File path and line numbers
3. **Issue**: Clear description of the problem
4. **Impact**: What could go wrong
5. **Fix**: Suggested solution with code example

## Focus Areas

Pay special attention to:
- **State management**: Zustand store usage, proper immutability
- **Command pattern**: Proper undo/redo implementation
- **Canvas operations**: Fabric.js event handling, proper cleanup
- **Type safety**: TypeScript strict mode compliance
- **Effect dependencies**: React hooks dependency arrays

## Output Format

**Start with a summary:**
- List all files being reviewed
- Total number of issues found by severity
- Quick overview of main concerns

**Then organize findings by:**
1. **Critical Issues** (must fix) - grouped by file
2. **High Priority** (should fix soon) - grouped by file
3. **Medium Priority** (nice to have) - grouped by file
4. **Low Priority** (minor improvements) - grouped by file
5. **Suggestions** (best practices, optimizations) - grouped by file

**For each issue:**
- File path and line numbers
- Severity level
- Clear description of the problem
- Impact explanation
- Suggested fix with code example (if applicable)

**End with:**
- Overall assessment
- Recommended next steps
- Files that need immediate attention
