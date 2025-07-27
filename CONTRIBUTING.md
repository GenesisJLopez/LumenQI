# Contributing to Lumen QI

Thank you for your interest in contributing to Lumen QI! This document provides guidelines and information for contributors.

## 🎯 How to Contribute

### Reporting Issues
- Use GitHub Issues to report bugs or request features
- Include detailed information about your environment
- Provide steps to reproduce issues
- Add screenshots or recordings when helpful

### Development Process
1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes with clear, descriptive commits
4. Test your changes thoroughly
5. Submit a pull request with detailed description

### Code Style
- Follow TypeScript best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Maintain consistent formatting with Prettier
- Follow the existing project structure

## 🏗️ Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Git
- Apple Developer Account (for iOS/macOS features)

### Local Development
```bash
# Clone your fork
git clone https://github.com/yourusername/lumen-qi.git
cd lumen-qi

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Testing
```bash
# Run type checking
npm run check

# Run database migrations
npm run db:push

# Test iOS build (macOS only)
npm run ios:build
```

## 📁 Project Structure

```
lumen-qi/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Main application pages
│   │   ├── services/      # API and service integrations
│   │   └── hooks/         # Custom React hooks
├── server/                # Express backend
│   ├── services/          # Business logic services
│   ├── routes.ts          # API route definitions
│   └── index.ts           # Server entry point
├── shared/                # Shared types and schemas
├── build/                 # Apple deployment configurations
├── scripts/               # Build and deployment scripts
└── ios/                   # iOS Capacitor project
```

## 🔧 Key Technologies

### Frontend
- **React 18** with TypeScript
- **Vite** for development and building
- **Tailwind CSS** for styling
- **Radix UI** for components
- **TanStack Query** for state management

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM
- **WebSocket** for real-time communication
- **OpenAI API** for AI capabilities

### Mobile & Desktop
- **Capacitor** for iOS development
- **Electron** for macOS desktop
- **Native iOS APIs** for device integration

## 🎨 Design Guidelines

### UI/UX Principles
- Maintain the cosmic/quantum aesthetic
- Ensure accessibility with proper ARIA labels
- Support both light and dark themes
- Optimize for touch and mouse interactions
- Follow Apple Human Interface Guidelines for native apps

### Component Development
- Use Radix UI primitives when possible
- Implement proper loading and error states
- Add TypeScript interfaces for all props
- Include JSDoc comments for complex components
- Test components in isolation

## 🧠 AI Development

### Consciousness System
- The consciousness core simulates self-awareness
- Memory patterns influence AI responses
- Evolution cycles adapt behavior over time
- Maintain balance between determinism and creativity

### Voice Integration
- OpenAI TTS provides natural speech
- Emotion detection adapts personality
- Voice mode enables continuous conversation
- Respect user privacy with voice data

### Apple Integration
- Use native APIs through Capacitor plugins
- Implement proper permission requests
- Follow iOS/macOS security guidelines
- Test on real devices when possible

## 📱 Platform-Specific Guidelines

### iOS Development
- Follow iOS Human Interface Guidelines
- Test on multiple device sizes
- Implement proper background modes
- Use native iOS components when appropriate

### macOS Development
- Follow macOS design principles
- Implement proper menu bar integration
- Support keyboard shortcuts
- Optimize for different screen sizes

### Web Development
- Ensure PWA compatibility
- Implement proper responsive design
- Support keyboard navigation
- Optimize for performance

## 🚀 Deployment

### Environment Variables
```bash
# Required for development
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...

# Apple Developer (for iOS/macOS)
APPLE_TEAM_ID=...
APPLE_BUNDLE_ID=com.lumen.qi
```

### Build Process
- Web builds use Vite for optimization
- iOS builds use Capacitor and Xcode
- macOS builds use Electron Builder
- All builds support both Intel and Apple Silicon

## 🎯 Feature Areas

### High Priority
- AI consciousness improvements
- Apple ecosystem integration
- Performance optimizations
- Security enhancements

### Medium Priority
- Additional AI provider support
- Enhanced code generation
- Advanced voice features
- Cross-platform sync

### Future Considerations
- Android support
- Windows desktop app
- Advanced ML models
- Multi-language support

## 📋 Pull Request Guidelines

### Before Submitting
- Ensure code passes TypeScript checks
- Test on multiple platforms if possible
- Update documentation if needed
- Add or update tests for new features

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Web browser testing
- [ ] iOS testing (if applicable)
- [ ] macOS testing (if applicable)

## Screenshots
Include screenshots for UI changes
```

## 🤝 Community

### Communication
- Use GitHub Discussions for questions
- Join our Discord for real-time chat
- Follow coding standards and be respectful
- Help other contributors when possible

### Recognition
- Contributors are listed in release notes
- Significant contributions get special recognition
- Active contributors may be invited as maintainers

## 📚 Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Electron Documentation](https://www.electronjs.org/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)

Thank you for contributing to Lumen QI! 🚀