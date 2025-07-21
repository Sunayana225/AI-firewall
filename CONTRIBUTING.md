# Contributing to AI-Firewall

We welcome contributions to AI-Firewall! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- Git
- Chrome Browser

### Development Setup
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/AI-firewall.git
   ```
3. Create a development branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📝 How to Contribute

### 🐛 Reporting Bugs
- Use the GitHub issue tracker
- Include detailed reproduction steps
- Provide system information (OS, Chrome version, etc.)
- Include relevant logs and error messages

### 💡 Suggesting Features
- Open an issue with the "enhancement" label
- Describe the feature and its benefits
- Include use cases and examples

### 🔧 Code Contributions

#### Code Style
- **Python**: Follow PEP 8 guidelines
- **JavaScript**: Use ESLint configuration provided
- **React**: Follow React best practices

#### Testing
- Add tests for new features
- Ensure all existing tests pass
- Test the extension manually in Chrome

#### Pull Request Process
1. Update documentation if needed
2. Add tests for new functionality
3. Ensure the build passes
4. Update the changelog
5. Request review from maintainers

## 🏗️ Project Structure

```
AI-Firewall/
├── backend/              # Flask API
├── extension/            # Chrome Extension
├── dashboard/            # React Dashboard
├── tests/               # Test files
├── docs/                # Documentation
└── scripts/             # Build and utility scripts
```

## 🧪 Testing Guidelines

### Backend Tests
```bash
cd backend
python -m pytest tests/
```

### Frontend Tests
```bash
cd dashboard
npm test
```

### Extension Testing
- Load unpacked extension in Chrome
- Test on various websites
- Verify popup and options functionality

## 📋 Code of Conduct

### Our Standards
- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a safe environment for all

### Enforcement
Unacceptable behavior may result in temporary or permanent bans from the project.

## 🏷️ Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature request
- `documentation`: Documentation improvements
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention needed

## 📞 Questions?

- Open a discussion on GitHub
- Check existing issues and documentation
- Contact maintainers directly

Thank you for contributing to AI-Firewall! 🙏
