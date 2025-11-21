import { RoadmapItem } from './types';

export const roadmapItems: RoadmapItem[] = [
  // Portfolio Website
  {
    id: 'portfolio-3d-gallery',
    title: '3D Image Gallery Enhancement',
    description:
      'Add Three.js powered 3D transitions and parallax effects to the landscape gallery for a more immersive viewing experience.',
    area: 'portfolio',
    status: 'planned',
    targetRelease: 'v1.1.0',
    priority: 'medium',
  },
  {
    id: 'portfolio-blog',
    title: 'Photography Blog',
    description:
      'Add a blog section with MDX support for sharing photography stories, techniques, and behind-the-scenes content.',
    area: 'portfolio',
    status: 'planned',
    targetRelease: 'v1.2.0',
    priority: 'low',
  },

  // CLI_X Tool
  {
    id: 'cli-conversation-export',
    title: 'Enhanced Conversation Export',
    description:
      'Expand conversation export capabilities to support multiple formats (Markdown, JSON, PDF) with syntax highlighting and rich formatting for documentation.',
    area: 'cli',
    status: 'in-progress',
    targetRelease: 'v2.5.0',
    priority: 'high',
  },
  {
    id: 'cli-workflow-scheduling',
    title: 'Advanced Workflow Scheduling',
    description:
      'Implement cron-based workflow scheduling with timezone support, retry logic, and notification systems for automated command execution.',
    area: 'cli',
    status: 'in-progress',
    targetRelease: 'v2.5.0',
    priority: 'high',
  },
  {
    id: 'cli-plugin-system',
    title: 'Plugin System Architecture',
    description:
      'Design and implement a plugin system allowing users to create custom command generators, safety rules, and LLM providers. Includes plugin marketplace and hot-reloading.',
    area: 'cli',
    status: 'planned',
    targetRelease: 'v3.0.0',
    priority: 'high',
  },
  {
    id: 'cli-autocomplete',
    title: 'Shell Autocomplete Integration',
    description:
      'Add native shell autocomplete for bash, zsh, fish, and PowerShell with context-aware suggestions and template completions.',
    area: 'cli',
    status: 'planned',
    targetRelease: 'v2.6.0',
    priority: 'medium',
  },
  {
    id: 'cli-collaborative-commands',
    title: 'Collaborative Command Building',
    description:
      'Enable team collaboration features including shared command history, team templates, and real-time command suggestions based on team patterns.',
    area: 'cli',
    status: 'planned',
    targetRelease: 'v3.0.0',
    priority: 'low',
  },
  {
    id: 'cli-web-interface',
    title: 'Web Interface (Terminal in Browser)',
    description:
      'Build a web-based terminal interface using xterm.js for CLI_X, enabling browser-based access with full command history and collaboration features.',
    area: 'cli',
    status: 'planned',
    targetRelease: 'v3.1.0',
    priority: 'medium',
  },

  // CLI_X Website
  {
    id: 'webshop-team-management',
    title: 'Team License Management',
    description:
      'Add enterprise features for team license management including user provisioning, role-based access control, usage analytics, and centralized billing.',
    area: 'webshop',
    status: 'planned',
    targetRelease: 'v1.1.0',
    priority: 'high',
  },
  {
    id: 'webshop-analytics',
    title: 'Advanced Usage Analytics Dashboard',
    description:
      'Build comprehensive analytics dashboard showing command usage patterns, cost optimization opportunities, popular templates, and team productivity metrics.',
    area: 'webshop',
    status: 'planned',
    targetRelease: 'v1.2.0',
    priority: 'medium',
  },
  {
    id: 'webshop-api-marketplace',
    title: 'API Key Marketplace',
    description:
      'Create a marketplace for users to purchase pre-configured API access to various LLM providers with tiered pricing and usage tracking.',
    area: 'webshop',
    status: 'planned',
    targetRelease: 'v1.3.0',
    priority: 'low',
  },
  {
    id: 'webshop-mobile-app',
    title: 'Mobile App (iOS/Android)',
    description:
      'Develop native mobile apps using React Native for CLI_X management, command history browsing, and quick command execution on-the-go.',
    area: 'webshop',
    status: 'planned',
    targetRelease: 'v2.0.0',
    priority: 'medium',
  },

  // Recently Completed
  {
    id: 'cli-conversation-mode',
    title: 'Conversation Mode with Context Retention',
    description:
      'Multi-turn conversations with persistent storage in SQLite, context-aware responses, thread management, and export capabilities.',
    area: 'cli',
    status: 'completed',
    targetRelease: 'v2.4.0',
    priority: 'high',
  },
  {
    id: 'cli-ollama-integration',
    title: 'Complete Ollama Integration',
    description:
      'Local model management with lifecycle controls, model pre-loading, custom model creation, and performance tuning for privacy-focused users.',
    area: 'cli',
    status: 'completed',
    targetRelease: 'v2.4.0',
    priority: 'high',
  },
  {
    id: 'cli-template-analytics',
    title: 'Template Analytics & Optimization',
    description:
      'Data-driven template optimization with usage tracking, effectiveness scoring, failure pattern analysis, and team collaboration features.',
    area: 'cli',
    status: 'completed',
    targetRelease: 'v2.4.0',
    priority: 'medium',
  },
];
