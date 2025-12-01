# Contributing to BachOS API

Thank you for considering contributing to BachOS API! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)
   - Screenshots if applicable

### Suggesting Features

1. Check if the feature has been suggested
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/bachos-api.git
   cd bachos-api
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the code style guidelines
   - Add tests if applicable
   - Update documentation

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```
   
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Provide a clear description
   - Reference related issues
   - Ensure all checks pass

## Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

## Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type when possible
- Use meaningful variable and function names

### Formatting

- Use Prettier for code formatting
- Run `npm run format` before committing
- 2 spaces for indentation
- Single quotes for strings
- Semicolons required

### Linting

- Use ESLint for code quality
- Run `npm run lint` before committing
- Fix all linting errors
- Address warnings when possible

### File Organization

```
src/
├── config/       # Configuration files
├── constants/    # Constants and enums
├── middleware/   # Express middleware
├── models/       # Database models
├── routes/       # API routes
├── types/        # TypeScript types
└── utils/        # Utility functions
```

### Naming Conventions

- **Files**: kebab-case (e.g., `user-service.ts`)
- **Classes**: PascalCase (e.g., `UserService`)
- **Functions**: camelCase (e.g., `getUserById`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- **Interfaces**: PascalCase with 'I' prefix (e.g., `IUser`)

### Error Handling

- Use custom error classes from `utils/errors.ts`
- Always use try-catch in async functions
- Provide meaningful error messages
- Log errors appropriately

### API Design

- Use RESTful conventions
- Consistent response format
- Proper HTTP status codes
- Input validation with Zod
- Authentication where required

### Database

- Use Mongoose models
- Add indexes for frequently queried fields
- Use transactions for multi-document operations
- Validate data at schema level

### Testing

- Write unit tests for utilities
- Write integration tests for routes
- Maintain test coverage above 80%
- Use descriptive test names

## Commit Message Guidelines

Format: `<type>(<scope>): <subject>`

Examples:
```
feat(auth): add password reset functionality
fix(meals): correct meal calculation logic
docs(readme): update installation instructions
refactor(middleware): simplify error handling
test(users): add user creation tests
```

## Review Process

1. All PRs require at least one review
2. Address review comments promptly
3. Keep PRs focused and reasonably sized
4. Ensure CI/CD checks pass
5. Update documentation as needed

## Questions?

Feel free to open an issue for any questions or clarifications.

Thank you for contributing! 🎉