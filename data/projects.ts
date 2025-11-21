import { Project } from './types';

export const projects: Project[] = [
  {
    slug: 'clix-cli',
    name: 'CLI_X - AI Command Line Tool',
    tagline: 'Transform natural language into safe, executable shell commands',
    shortDescription:
      'An intelligent Rust-based CLI tool that converts natural language to platform-specific shell commands using LLM technology with enterprise-grade safety.',
    longDescription: `# CLI_X - Natural Language to Shell Command Converter

CLI_X is a sophisticated command-line tool that leverages Large Language Models to convert natural language into platform-specific shell commands. Built with Rust for maximum performance and safety, it features a 4-stage intelligence pipeline, ML-inspired safety system, and support for multiple LLM providers.

## 🎯 Key Capabilities

- **Natural Language Processing**: Convert plain English to accurate shell commands with 95% accuracy
- **Multi-Provider Support**: OpenAI GPT-4, Anthropic Claude 3.5, Groq Llama 3.3, and Ollama local models
- **Enterprise Security**: 11-layer safety system with ML-inspired risk scoring and context awareness
- **Cross-Platform**: Native PowerShell, Bash, Sh, and Cmd generation with intelligent path conversion
- **High Performance**: 90ms startup time, 36MB memory footprint, sub-100ms intelligence overhead

## 🚀 v2.4.0 Features

### Conversation Mode
Multi-turn conversations with full context retention, persistent storage in SQLite, and project-aware responses. Export conversations for documentation.

### Workflow Automation
Automatic pattern detection from command history, intelligent workflow recommendations with confidence scoring, parameterized workflows with conditional execution, and cron scheduling support.

### Ollama Integration
Complete local model management with lifecycle controls (list, pull, remove), model pre-loading for instant responses, custom model creation with Modelfiles, and performance tuning.

### Template Analytics
Data-driven template optimization with automatic usage tracking, effectiveness scoring (0-100), failure pattern analysis, and team collaboration (export/import).

### Command Suggestions
Context-based proactive assistance including git status monitoring, project type detection, Docker alerts, disk space warnings, and dependency checking.

## 📊 Performance Metrics

- **Startup Time**: ~90ms (40% faster than baseline)
- **Memory Usage**: ~36MB typical workload (40% reduction)
- **Binary Size**: 4-6MB stripped (50% smaller)
- **Cache Speed**: ~1.5ms average lookup (70% faster with bloom filters)
- **Tests**: 850+ passing (100% pass rate)
- **Documentation**: 6,700+ lines

## 🛡️ Safety System

The enhanced safety system features:

- **11 Comprehensive Rules**: Critical (filesystem destruction, drive formatting), High (shutdown, permissions), Medium (deletion, processes)
- **ML-Inspired Risk Scoring**: Weighted algorithm (50% severity, 20% pattern, 30% context)
- **Context Awareness**: Detects working directory, privilege level, disk space
- **Impact Analysis**: Evaluates destructiveness, reversibility, affected resources
- **Safer Alternatives**: Suggests better options (e.g., \`rm -rf\` → \`rm -ri\`)

## 💡 Usage Examples

\`\`\`bash
# Basic usage
cli_x "list files in current directory"

# Interactive mode
cli_x interactive

# Start a conversation
cli_x conversation start

# Get workflow recommendations
cli_x workflow recommend

# Manage local models
cli_x ollama list
cli_x ollama pull qwen2.5-coder:7b
\`\`\`

## 📦 Installation

Multiple installation methods available:
- Cargo: \`cargo install cli_x\`
- Homebrew: \`brew install cli_x\`
- Package managers (DEB, RPM)
- MSI installer (Windows)
- Docker: \`docker pull tlexweb/cli_x:latest\`
- Binary downloads`,
    techStack: [
      'Rust',
      'Tokio',
      'OpenAI GPT-4',
      'Anthropic Claude 3.5',
      'Groq Llama 3.3',
      'Ollama',
      'SQLite',
      'Docker',
      'Clap',
      'Serde',
    ],
    links: {
      github: 'https://github.com/tlex-web/cli_x',
      docs: 'https://docs.cli-x.com',
    },
    status: 'active',
    version: 'v2.4.0',
    featured: true,
    features: [
      'Natural language to shell command conversion (95% accuracy)',
      '4-stage intelligence pipeline (intent analysis, context enrichment, prompt optimization, response parsing)',
      'Multi-provider LLM support (OpenAI, Anthropic, Groq, Ollama)',
      'ML-inspired safety system with 11 comprehensive rules',
      'Cross-platform command generation (PowerShell, Bash, Sh, Cmd)',
      'Conversation mode with persistent context retention',
      'Workflow automation with pattern detection and recommendations',
      'Template system with 60+ pre-built templates and interactive TUI',
      'Ollama integration for complete local model management',
      'Template analytics with usage tracking and effectiveness scoring',
      'Command suggestions with proactive assistance',
      'Intelligent caching (40-60% API cost reduction)',
      'Async context loading (<100ms startup)',
      'Comprehensive audit logging and command history',
    ],
    highlights: {
      performance: {
        startupTime: '~90ms (40% faster)',
        memoryUsage: '~36MB typical',
        binarySize: '4-6MB stripped',
        cacheSpeed: '~1.5ms lookup',
        intelligenceOverhead: '~28ms',
      },
      testing: {
        totalTests: '850+',
        passRate: '100%',
        newTests: '+90 from v2.3.0',
        documentation: '6,700+ lines',
        newDocs: '3,200+ for v2.4.0',
      },
      safety: {
        rules: 11,
        riskLevels: ['Low (0.0-0.3)', 'Medium (0.3-0.6)', 'High (0.6-0.8)', 'Critical (0.8-1.0)'],
        contextAware: true,
        impactAnalysis: true,
        alternatives: true,
      },
      features: {
        providers: 4,
        templates: '60+',
        commands: '40+',
        intentTypes: 17,
        contextSources: 5,
      },
    },
    demoCommands: [
      {
        input: 'show me all Python files larger than 1MB',
        output: 'find . -name "*.py" -size +1M -ls',
        riskLevel: 'low',
        explanation: 'Safe file search operation with no modifications',
      },
      {
        input: 'check how much disk space is available',
        output: 'df -h',
        riskLevel: 'low',
        explanation: 'Read-only system information query',
      },
      {
        input: 'create a backup of my documents folder',
        output: 'tar -czf documents_backup_$(date +%Y%m%d).tar.gz ~/Documents/',
        riskLevel: 'low',
        explanation: 'Safe backup operation with timestamped filename',
      },
      {
        input: 'kill all Chrome processes',
        output: 'pkill -f chrome',
        riskLevel: 'high',
        warning: 'This command terminates running processes',
        explanation: 'High-risk operation - requires explicit confirmation',
      },
    ],
    roadmapItems: ['cli-conversation-export', 'cli-workflow-scheduling', 'cli-plugin-system'],
  },
  {
    slug: 'clix-website',
    name: 'CLI_X Website & Licensing Platform',
    tagline: 'Modern licensing and distribution platform for CLI_X',
    shortDescription:
      'A Next.js 14 web application featuring subscription management, secure license generation, cross-platform binary distribution, and an interactive demo playground.',
    longDescription: `# CLI_X Website - Licensing & Distribution Platform

A comprehensive web platform built with Next.js 14 that handles everything from showcasing CLI_X to managing subscriptions, generating licenses, and distributing binaries across multiple platforms. Features a fully interactive demo playground powered by the actual CLI_X engine.

## 🎯 Core Features

### Interactive Demo Playground
- **Live Command Generation**: Test CLI_X directly in your browser
- **Real-time Feedback**: See generated commands instantly
- **Risk Analysis**: Visual indicators for command safety
- **Anonymous Usage**: No account required for testing

### Subscription Management
- **Stripe Integration**: PCI-compliant payment processing
- **Tiered Pricing**: Free and Pro tiers with clear value propositions
- **Flexible Billing**: Monthly ($9.99) or annual ($99) subscriptions
- **Auto-renewal**: Seamless subscription management

### License System
- **Cryptographic Security**: License keys generated with cryptographic randomness
- **Server-side Validation**: Secure API for license verification
- **Email Delivery**: Automated license key delivery
- **User Dashboard**: Manage active licenses and downloads

### Binary Distribution
- **Multi-Platform Support**: Windows (MSI), macOS (Homebrew), Linux (DEB/RPM)
- **Download Analytics**: Track download statistics per platform
- **Version Management**: Support for multiple CLI_X versions
- **CDN Delivery**: Fast, global binary distribution

## 🏗️ Architecture

### Frontend
- **React 18**: Latest features with Server Components
- **Next.js 14**: App Router with route handlers
- **Tailwind CSS**: Utility-first styling with dark theme
- **shadcn/ui**: Accessible, customizable components
- **Responsive Design**: Mobile-first approach

### Backend
- **API Routes**: Next.js route handlers for serverless functions
- **Database**: PostgreSQL with Prisma ORM for type-safe queries
- **Authentication**: NextAuth.js v5 with OAuth providers
- **Payment Processing**: Stripe webhooks for real-time events
- **Rate Limiting**: Protection against abuse

### Database Schema
- **User**: Accounts and authentication
- **License**: Secure license key management
- **Subscription**: Stripe subscription tracking
- **Download**: Binary download analytics
- **DemoUsage**: Anonymous playground metrics

## 💰 Pricing Tiers

### Free Tier
- Bring your own API keys
- 10 commands per day
- Basic models only (GPT-3.5, Llama 2)
- Local command history
- Community support

### Pro Tier ($9.99/month or $99/year)
- Pre-configured API keys included
- Unlimited commands
- Premium models (GPT-4, Claude 3.5 Sonnet)
- Cloud sync across devices
- Command history backup
- Priority support
- Advanced analytics
- Early access to new features

## 🔐 Security

- **Authentication**: Secure password hashing with bcrypt
- **License Validation**: Cryptographically signed keys prevent forgery
- **Payment Security**: PCI-compliant via Stripe (no credit card data stored)
- **Input Sanitization**: All user inputs validated and sanitized
- **Rate Limiting**: API and demo endpoints protected
- **HTTPS Everywhere**: TLS 1.3 encryption for all connections

## 📊 Analytics & Insights

- **User Metrics**: Registration, conversion, and retention tracking
- **Download Statistics**: Platform-specific download counts
- **Demo Usage**: Popular commands and conversion funnels
- **Performance Monitoring**: Real-time error tracking and alerts

## 🚀 Deployment

- **Platform**: Vercel with automatic CI/CD
- **Database**: Supabase PostgreSQL with connection pooling
- **CDN**: Vercel Edge Network for global performance
- **Monitoring**: Real-time logs and analytics
- **Scaling**: Automatic scaling based on demand`,
    techStack: [
      'Next.js 14',
      'TypeScript',
      'React 18',
      'Tailwind CSS',
      'shadcn/ui',
      'PostgreSQL',
      'Prisma ORM',
      'NextAuth.js v5',
      'Stripe',
      'Vercel',
      'Zod',
      'React Hook Form',
    ],
    links: {
      demo: 'https://cli-x.com',
      github: 'https://github.com/tlex-web/cli_x-website',
      docs: 'https://docs.cli-x.com',
    },
    status: 'active',
    version: 'v1.0.0',
    featured: true,
    features: [
      'Interactive demo playground with live command generation',
      'Subscription management with Stripe integration',
      'Secure license key generation and validation',
      'Cross-platform binary distribution (Windows, macOS, Linux)',
      'User authentication with NextAuth.js and OAuth',
      'PostgreSQL database with Prisma ORM',
      'Responsive, modern UI with dark theme',
      'Rate limiting and abuse prevention',
      'Download analytics and tracking',
      'Email notifications for licenses',
      'User dashboard for license management',
      'Real-time payment webhook processing',
      'SEO optimized with meta tags and sitemaps',
      'Accessibility compliant (WCAG 2.1)',
    ],
    highlights: {
      pricingTiers: {
        free: {
          price: 'Free',
          commands: '10/day',
          models: 'Basic',
          features: ['BYOK (Bring Your Own Keys)', 'Local history', 'Community support'],
        },
        pro: {
          price: '$9.99/mo or $99/yr',
          commands: 'Unlimited',
          models: 'Premium (GPT-4, Claude)',
          features: [
            'Pre-configured API keys',
            'Cloud sync',
            'Priority support',
            'Advanced analytics',
            'Early access',
          ],
        },
      },
      security: [
        'Bcrypt password hashing',
        'Cryptographically signed licenses',
        'PCI-compliant payments',
        'Input sanitization',
        'Rate limiting',
        'HTTPS/TLS 1.3',
      ],
      techStack: {
        frontend: ['Next.js 14', 'React 18', 'TypeScript', 'Tailwind CSS', 'shadcn/ui'],
        backend: ['Next.js API Routes', 'NextAuth.js', 'Prisma', 'PostgreSQL', 'Stripe'],
        deployment: ['Vercel', 'Edge Network', 'Serverless Functions'],
      },
    },
    roadmapItems: ['webshop-team-management', 'webshop-analytics', 'webshop-api-marketplace'],
  },
];
