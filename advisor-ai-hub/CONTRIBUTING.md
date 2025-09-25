# 🤝 Contributing to AI Advisor Hub

> **We welcome contributions from everyone!** Whether you're a seasoned developer or just getting started, there are many ways to help make AI Advisor Hub better.

---

## 🌟 How You Can Help

### For Non-Technical Contributors

| Type of Contribution | Description | How to Get Started |
|---------------------|-------------|-------------------|
| 🐛 **Bug Reports** | Help us find and fix issues | Use our [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) |
| 💡 **Feature Requests** | Suggest new features or improvements | Use our [feature request template](.github/ISSUE_TEMPLATE/feature_request.md) |
| 📖 **Documentation** | Improve guides, tutorials, and explanations | Edit files in the `docs/` folder |
| 🧪 **Testing** | Test new features and report issues | Join our beta testing program |
| 🌍 **Translation** | Help translate the app to other languages | Contact us at translations@advisorai.com |
| 💬 **Community** | Help other users in discussions and forums | Join our [Discord](https://discord.gg/advisorai) |

### For Developers

| Type of Contribution | Description | Complexity |
|---------------------|-------------|------------|
| 🐛 **Bug Fixes** | Fix reported issues | ⭐⭐ |
| ✨ **New Features** | Add new functionality | ⭐⭐⭐ |
| 🎨 **UI/UX Improvements** | Enhance the user interface | ⭐⭐ |
| 🔧 **Performance** | Optimize speed and efficiency | ⭐⭐⭐ |
| 🧪 **Tests** | Add or improve test coverage | ⭐⭐ |
| 📚 **API Documentation** | Improve API docs and examples | ⭐ |

---

## 🚀 Getting Started

### Prerequisites

- **Git** installed on your computer
- **Node.js 18+** and **npm 9+**
- **Basic understanding** of web development (HTML, CSS, JavaScript)
- **GitHub account**

### Quick Start

1. **Fork the repository**
   - Click the "Fork" button on GitHub
   - Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/AI-Advisor.git
   cd AI-Advisor/advisor-ai-hub
   ```

2. **Set up development environment**
   ```bash
   # Install dependencies
   npm install
   
   # Set up environment variables
   cp packages/backend/env.example packages/backend/.env
   cp packages/frontend/.env.example packages/frontend/.env.local
   
   # Start development servers
   npm run dev
   ```

3. **Create a branch for your changes**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b bugfix/issue-description
   ```

4. **Make your changes and test them**
   ```bash
   # Run tests
   npm test
   
   # Check code style
   npm run lint
   
   # Build to ensure everything works
   npm run build
   ```

5. **Commit and push your changes**
   ```bash
   git add .
   git commit -m "Add: your feature description"
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Fill out the PR template
   - Submit your PR

---

## 📋 Development Guidelines

### Code Style

We use **ESLint** and **Prettier** for code formatting:

```bash
# Check code style
npm run lint

# Fix code style issues
npm run lint:fix

# Format code
npm run format
```

### Commit Message Format

We use **Conventional Commits**:

```
type(scope): description

Examples:
feat(auth): add OAuth login support
fix(api): resolve database connection timeout
docs(readme): update installation instructions
style(ui): improve button hover effects
refactor(backend): simplify user service logic
test(auth): add unit tests for login flow
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Branch Naming

- `feature/feature-name` - New features
- `bugfix/issue-description` - Bug fixes
- `hotfix/critical-fix` - Critical production fixes
- `docs/documentation-update` - Documentation changes
- `refactor/component-name` - Code refactoring

---

## 🏗️ Project Structure

Understanding the codebase structure will help you contribute effectively:

```
advisor-ai-hub/
├── packages/
│   ├── backend/                 # Express.js API server
│   │   ├── src/
│   │   │   ├── controllers/     # Request handlers
│   │   │   ├── services/        # Business logic
│   │   │   ├── middleware/      # Authentication, validation
│   │   │   ├── routes/          # API route definitions
│   │   │   ├── utils/           # Helper functions
│   │   │   └── types/           # TypeScript type definitions
│   │   ├── prisma/              # Database schema and migrations
│   │   └── __tests__/           # Backend tests
│   ├── frontend/                # Next.js React application
│   │   ├── src/
│   │   │   ├── app/             # App Router pages
│   │   │   ├── components/      # Reusable UI components
│   │   │   ├── services/        # API service functions
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── store/           # State management (Zustand)
│   │   │   └── lib/             # Utility functions
│   │   └── __tests__/           # Frontend tests
│   └── shared/                  # Shared code between packages
│       ├── src/
│       │   ├── types/           # Shared TypeScript types
│       │   ├── utils/           # Shared utility functions
│       │   └── constants/       # Shared constants
├── docs/                        # Documentation
├── .github/                     # GitHub templates and workflows
└── infrastructure/              # Deployment configurations
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=auth.service.test.ts
```

### Writing Tests

**Backend Tests (Jest):**
```typescript
// packages/backend/src/services/__tests__/auth.service.test.ts
import { AuthService } from '../auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  it('should register a new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };

    const result = await authService.register(userData);
    
    expect(result.success).toBe(true);
    expect(result.user.email).toBe(userData.email);
  });
});
```

**Frontend Tests (Jest + React Testing Library):**
```typescript
// packages/frontend/src/components/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    screen.getByText('Click me').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

---

## 🎨 UI/UX Guidelines

### Design System

We use **Tailwind CSS** with **Radix UI** components:

```tsx
// Good: Using design system components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function UserCard({ user }) {
  return (
    <Card>
      <CardHeader>
        <h3>{user.name}</h3>
      </CardHeader>
      <CardContent>
        <Button variant="outline">Edit Profile</Button>
      </CardContent>
    </Card>
  );
}
```

### Accessibility

- Use semantic HTML elements
- Include proper ARIA labels
- Ensure keyboard navigation works
- Maintain good color contrast
- Test with screen readers

### Responsive Design

```tsx
// Mobile-first responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>Content</Card>
</div>
```

---

## 🔌 API Development

### Adding New Endpoints

1. **Create the route** in `packages/backend/src/routes/`
2. **Add the controller** in `packages/backend/src/controllers/`
3. **Implement the service** in `packages/backend/src/services/`
4. **Add validation** middleware
5. **Write tests**
6. **Update documentation**

Example:
```typescript
// packages/backend/src/routes/users.routes.ts
import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const usersController = new UsersController();

router.get('/users', authMiddleware, usersController.getAllUsers);
router.get('/users/:id', authMiddleware, usersController.getUserById);
router.post('/users', authMiddleware, usersController.createUser);

export default router;
```

### API Response Format

```typescript
// Success response
{
  success: true,
  data: { /* actual data */ },
  message?: "Optional success message"
}

// Error response
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid email format",
    details?: { /* additional error details */ }
  }
}
```

---

## 🐛 Bug Reports

### Before Reporting

1. **Search existing issues** to avoid duplicates
2. **Try the latest version** to ensure it's not already fixed
3. **Check the documentation** to ensure it's not user error

### Bug Report Template

When creating a bug report, include:

```markdown
## 🐛 Bug Description
Brief description of the bug

## 🔄 Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## 🎯 Expected Behavior
What you expected to happen

## 📱 Environment
- OS: [e.g., Windows 10, macOS 12, Ubuntu 20.04]
- Browser: [e.g., Chrome 91, Firefox 89, Safari 14]
- Node.js version: [e.g., 18.17.0]
- Package version: [e.g., 1.2.3]

## 📸 Screenshots
If applicable, add screenshots

## 📋 Additional Context
Any other context about the problem
```

---

## ✨ Feature Requests

### Before Requesting

1. **Check existing features** to avoid duplicates
2. **Consider the scope** - is this a core feature or plugin?
3. **Think about use cases** - who would benefit from this?

### Feature Request Template

```markdown
## 💡 Feature Description
Brief description of the feature

## 🎯 Problem Statement
What problem does this solve?

## 💭 Proposed Solution
How should this feature work?

## 🔄 Alternative Solutions
Other ways to solve this problem

## 📊 Use Cases
Who would use this feature and how?

## 🎨 Mockups/Wireframes
If applicable, include design mockups

## 📋 Additional Context
Any other relevant information
```

---

## 📝 Pull Request Process

### Before Submitting

1. **Ensure tests pass**: `npm test`
2. **Check code style**: `npm run lint`
3. **Update documentation** if needed
4. **Add tests** for new features
5. **Update CHANGELOG.md** if applicable

### PR Template

```markdown
## 📋 Description
Brief description of changes

## 🔗 Related Issues
Closes #123, Fixes #456

## 🧪 Testing
- [ ] Tests pass
- [ ] Manual testing completed
- [ ] Screenshots/videos attached (if UI changes)

## 📚 Documentation
- [ ] README updated
- [ ] API docs updated
- [ ] Code comments added

## 🎨 UI Changes
- [ ] Mobile responsive
- [ ] Accessibility tested
- [ ] Design system followed

## ✅ Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Automated checks** must pass (tests, linting)
2. **Code review** by maintainers
3. **Testing** by QA team (for major changes)
4. **Approval** from at least 2 maintainers
5. **Merge** by maintainer

---

## 🏷️ Release Process

### Version Numbering

We use **Semantic Versioning** (SemVer):
- `MAJOR.MINOR.PATCH` (e.g., 1.2.3)
- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes (backward compatible)

### Release Checklist

- [ ] Update version numbers
- [ ] Update CHANGELOG.md
- [ ] Run full test suite
- [ ] Update documentation
- [ ] Create release notes
- [ ] Tag the release
- [ ] Deploy to production

---

## 🎓 Learning Resources

### For Beginners

- [Git Tutorial](https://learngitbranching.js.org/)
- [JavaScript Fundamentals](https://javascript.info/)
- [React Tutorial](https://react.dev/learn)
- [Node.js Guide](https://nodejs.org/en/docs/guides/)

### For Advanced Developers

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Testing Best Practices](https://testingjavascript.com/)

---

## 🏆 Recognition

### Contributors

We recognize all contributors in our:
- [Contributors page](https://github.com/lukebarhoumeh/AI-Advisor/graphs/contributors)
- [README acknowledgments](README.md#acknowledgments)
- Monthly contributor spotlights

### Types of Recognition

- 🌟 **Star Contributors** - Major feature contributions
- 🐛 **Bug Hunters** - Excellent bug reports and fixes
- 📚 **Documentation Heroes** - Documentation improvements
- 🎨 **Design Champions** - UI/UX improvements
- 🧪 **Testing Advocates** - Test coverage improvements

---

## 📞 Getting Help

### Community Support

- 💬 [Discord Server](https://discord.gg/advisorai)
- 💬 [GitHub Discussions](https://github.com/lukebarhoumeh/AI-Advisor/discussions)
- 📧 Email: contributors@advisorai.com

### Mentorship Program

New to open source? We offer:
- **Pair programming** sessions
- **Code review** mentorship
- **Project guidance** for first-time contributors

Contact us at mentorship@advisorai.com to get started!

---

## 📄 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of:
- Age, body size, disability, ethnicity
- Gender identity and expression
- Level of experience, nationality
- Personal appearance, race, religion
- Sexual identity and orientation

### Expected Behavior

- ✅ Be respectful and inclusive
- ✅ Accept constructive criticism
- ✅ Focus on what's best for the community
- ✅ Show empathy towards others

### Unacceptable Behavior

- ❌ Harassment or discrimination
- ❌ Trolling or inflammatory comments
- ❌ Personal attacks or political discussions
- ❌ Unwelcome sexual attention

### Enforcement

Violations should be reported to conduct@advisorai.com. All complaints will be reviewed and investigated promptly and fairly.

---

<div align="center">

**Thank you for contributing to AI Advisor Hub! 🚀**

*Together, we're building the future of AI-powered business automation.*

[⭐ Star the Repository](https://github.com/lukebarhoumeh/AI-Advisor) • [💬 Join Discord](https://discord.gg/advisorai) • [📧 Contact Us](mailto:contributors@advisorai.com)

</div>
