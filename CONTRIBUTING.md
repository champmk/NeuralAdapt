# Contributing to Neural Adapt

Thank you for your interest in contributing to Neural Adapt! We welcome contributions from the community.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/NeuralAdapt.git
   cd NeuralAdapt/web
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up your environment**:
   - Copy `.env.example` to `.env.local` (if available)
   - Add your `OPENAI_API_KEY`
5. **Run database migrations**:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```
6. **Start the dev server**:
   ```bash
   npm run dev
   ```

## 📝 Development Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Commit with clear messages**:
   ```bash
   git commit -m "feat: add amazing new feature"
   ```
   Follow [Conventional Commits](https://www.conventionalcommits.org/) format:
   - `feat:` - New features
   - `fix:` - Bug fixes
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request** on GitHub

## 🎯 Pull Request Guidelines

- **Describe your changes** clearly in the PR description
- **Link related issues** using keywords like "Fixes #123"
- **Keep PRs focused** - one feature/fix per PR
- **Update documentation** if needed (README, comments, etc.)
- **Ensure tests pass** (when we add tests)
- **Follow code style** - run `npm run lint` before submitting

## 🏗️ Code Style

- Use TypeScript for all new code
- Follow existing code formatting (we may add Prettier later)
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Use server actions for mutations, server components for data fetching

## 🐛 Reporting Bugs

If you find a bug, please open an issue with:
- **Clear title** describing the problem
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Environment details** (OS, Node version, browser)
- **Screenshots** if applicable

## 💡 Suggesting Features

Feature requests are welcome! Please:
- **Search existing issues** to avoid duplicates
- **Describe the use case** clearly
- **Explain why it would be valuable** to users
- **Provide examples** if possible

## ❓ Questions

- Open a [GitHub Discussion](https://github.com/champmk/NeuralAdapt/discussions) for general questions
- Use [GitHub Issues](https://github.com/champmk/NeuralAdapt/issues) for bugs and feature requests

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Neural Adapt! 🎉
