# Personal Portfolio Website

A modern, responsive portfolio website showcasing landscape photography and programming projects. Built with Next.js 16, TypeScript, and Tailwind CSS, featuring stunning 3D visualizations and interactive animations.

## ✨ Features

### Photography Gallery
- **Interactive Grid & 3D Carousel**: View photos in a responsive grid or immersive 3D carousel
- **Detailed Modal Views**: Zoom-in on high-resolution images with interactive hotspots
- **Rich Metadata**: Camera settings, location, stories behind each photograph

### Projects Showcase
- **Holographic Terminal**: Interactive 3D terminal demonstration for CLI projects
- **Feature Highlights**: Animated showcases of project capabilities
- **Tech Stack Display**: Visual representation of technologies used
- **Detailed Documentation**: Markdown-rendered project descriptions with syntax highlighting

### Interactive Elements
- **3D Mountain Hero**: WebGL-based animated mountain terrain on homepage
- **Animated Gradient Mesh**: Dynamic, GPU-accelerated background animations
- **Particle Systems**: Dual-particle effects for visual enhancement
- **Smooth Transitions**: Framer Motion animations throughout

### Development Features
- **Full TypeScript**: Type-safe codebase with strict mode enabled
- **Comprehensive Testing**: Jest + Testing Library with 16 passing tests
- **Form Validation**: Client and server-side validation with Zod
- **Rate Limiting**: Built-in API rate limiting for feedback form
- **Responsive Design**: Mobile-first design that works on all screen sizes
- **Dark Mode Support**: Automatic dark mode based on system preferences
- **Accessibility**: WCAG 2.1 Level AA compliant with keyboard navigation and screen reader support
- **Performance**: Optimized builds with code splitting and lazy loading

## 🛠️ Tech Stack

### Core
- **Framework**: Next.js 16 with App Router and Turbopack
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4.1

### 3D & Animation
- **Three.js**: 3D rendering and WebGL
- **react-three-fiber**: React renderer for Three.js
- **@react-three/drei**: Useful helpers for r3f
- **@react-spring/three**: Spring physics-based animations
- **Framer Motion**: Component animations and transitions

### Validation & Data
- **Zod**: Runtime type checking and validation
- **React Markdown**: Markdown rendering for project descriptions

### Testing & Quality
- **Jest**: Testing framework
- **Testing Library**: React component testing
- **ESLint**: Code linting with Next.js config
- **Prettier**: Code formatting
- **TypeScript**: Static type checking

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- Modern browser with WebGL support

### Installation

1. Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/portfolio-app.git
cd portfolio-app
```

2. Install dependencies:

```bash
npm install
```

3. (Optional) Create environment variables file:

```bash
cp .env.example .env.local
```

4. Edit `.env.local` with your configuration if needed:

```env
FEEDBACK_EMAIL=your.email@example.com
```

### Development

Run the development server with Turbopack:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The app will automatically reload when you make changes to the code.

### Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode during development:

```bash
npm run test:watch
```

Generate test coverage report:

```bash
npm run test:coverage
```

### Build for Production

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

### Code Quality

Run the linter:

```bash
npm run lint
```

Format code with Prettier:

```bash
npm run format
```

Type check without building:

```bash
npm run type-check
```

## 📁 Project Structure

```
portfolio-app/
├── app/                           # Next.js App Router pages
│   ├── api/
│   │   └── feedback/
│   │       └── route.ts          # Feedback API endpoint with rate limiting
│   ├── contact/
│   │   └── page.tsx              # Contact page with animated mesh background
│   ├── photos/
│   │   └── page.tsx              # Photography gallery with grid/3D views
│   ├── projects/
│   │   ├── [slug]/
│   │   │   └── page.tsx          # Dynamic project detail pages
│   │   └── page.tsx              # Projects listing page
│   ├── roadmap/
│   │   └── page.tsx              # Development roadmap with filters
│   ├── error.tsx                 # Error boundary
│   ├── globals.css               # Global styles and Tailwind directives
│   ├── layout.tsx                # Root layout with metadata
│   ├── not-found.tsx             # Custom 404 page
│   └── page.tsx                  # Homepage with 3D mountain hero
│
├── components/                    # React components
│   ├── __tests__/                # Component tests
│   │   ├── FeedbackForm.test.tsx
│   │   └── ProjectCard.test.tsx
│   ├── AnimatedGradientMesh.tsx  # GPU-accelerated gradient backgrounds
│   ├── DualParticleSystem.tsx    # WebGL particle effects
│   ├── FeatureShowcase.tsx       # Animated feature cards
│   ├── FeedbackForm.tsx          # Contact form with validation
│   ├── Footer.tsx                # Site footer
│   ├── GalleryGrid.tsx           # Photo grid with filtering
│   ├── GlassmorphismNav.tsx      # Glassmorphic navigation
│   ├── Header.tsx                # Site header/navigation
│   ├── Hero3DMountain.tsx        # 3D mountain scene for hero
│   ├── HologramTerminal.tsx      # 3D holographic terminal
│   ├── HologramTerminalDemo.tsx  # Terminal demo with typing effect
│   ├── ImageDetailModal.tsx      # Full-screen image viewer
│   ├── InteractiveHotspot.tsx    # Image annotation hotspots
│   ├── MountainTerrain3D.tsx     # 3D terrain generation
│   ├── PhotoCarousel3D.tsx       # 3D carousel for photos
│   ├── ProjectCard.tsx           # Project preview cards
│   ├── ProjectHighlights.tsx     # Project metrics display
│   ├── RoadmapFilters.tsx        # Roadmap filtering controls
│   ├── RoadmapProgress.tsx       # Progress visualization
│   ├── RoadmapTimeline.tsx       # Timeline component
│   └── TechStackDisplay.tsx      # Tech stack visualization
│
├── data/                          # Content data
│   ├── landscapes.ts             # Photography data with metadata
│   ├── projects.ts               # Project information
│   ├── roadmap.ts                # Development roadmap items
│   └── types.ts                  # TypeScript type definitions
│
├── lib/                           # Utilities
│   └── useReducedMotion.ts       # Hook for respecting motion preferences
│
├── public/                        # Static assets
│   └── images/
│       └── landscapes/           # Photography images
│
├── project_concept/              # Documentation
│   ├── AGENT.md                 # AI agent guidelines
│   ├── ANIMATION_PLAN.md        # Animation system planning
│   ├── README_CLIX.md           # CLI_X project docs
│   ├── README_CLIX_WEBSITE.md   # CLI_X website docs
│   └── TESTING.md               # Testing documentation
│
├── .gitignore                    # Git ignore rules
├── jest.config.js                # Jest configuration
├── jest.setup.js                 # Jest setup file
├── next.config.ts                # Next.js configuration
├── next-env.d.ts                 # Next.js TypeScript declarations
├── package.json                  # Dependencies and scripts
├── postcss.config.js             # PostCSS configuration
├── tailwind.config.ts            # Tailwind CSS configuration
└── tsconfig.json                 # TypeScript configuration
```

## 📝 Content Management

All content is managed through TypeScript files in the `data/` directory. This approach provides:
- Type safety for all content
- No CMS complexity
- Version control for content changes
- Fast compile-time validation

### Adding a Landscape Photo

1. Add your image to `public/images/landscapes/`
2. Open `data/landscapes.ts`
3. Add a new entry to the `landscapes` array:

```typescript
{
  id: 'unique-id',
  src: '/images/landscapes/your-image.jpg',
  alt: 'Descriptive alt text for accessibility',
  title: 'Photo Title',
  location: 'Location Name, Country',
  story: 'The story behind this photograph...',
  technicalDetails: {
    camera: 'Camera Model',
    lens: 'Lens Model',
    aperture: 'f/8',
    shutterSpeed: '1/125s',
    iso: 200,
    captureDate: '2024-01-01',
  },
  tags: ['mountains', 'sunrise', 'alpine'],
  hotspots: [
    {
      x: 50,  // Percentage from left
      y: 30,  // Percentage from top
      title: 'Interesting Feature',
      description: 'Details about this feature',
    },
  ],
}
```

4. Rebuild and deploy: `npm run build`

### Adding a Project

1. Open `data/projects.ts`
2. Add a new entry to the `projects` array:

```typescript
{
  slug: 'project-slug',
  name: 'Project Name',
  tagline: 'Short, catchy tagline',
  shortDescription: 'Brief description for cards...',
  longDescription: `
# Full Description

Use **Markdown** for rich formatting:
- Feature 1
- Feature 2

## Code Examples
\`\`\`typescript
const example = 'You can include code!';
\`\`\`
  `,
  techStack: ['TypeScript', 'React', 'Next.js'],
  links: {
    github: 'https://github.com/username/repo',
    demo: 'https://example.com',
    docs: 'https://docs.example.com',
  },
  status: 'active',  // 'active' | 'beta' | 'complete' | 'archived'
  featured: true,
  version: 'v1.0.0',
  features: [
    {
      icon: '🚀',
      title: 'Fast',
      description: 'Lightning-fast performance',
    },
  ],
  highlights: {
    performance: '99.9% uptime',
    users: '1000+ users',
    rating: '4.9/5 stars',
  },
}
```

3. Rebuild and deploy: `npm run build`

### Updating the Roadmap

1. Open `data/roadmap.ts`
2. Add or modify `RoadmapItem` entries:

```typescript
{
  id: 'unique-id',
  title: 'Feature Name',
  description: 'Detailed description...',
  area: 'frontend', // 'frontend' | 'backend' | 'cli' | 'design'
  status: 'planned', // 'planned' | 'in-progress' | 'completed'
  priority: 'high', // 'low' | 'medium' | 'high'
  estimatedCompletion: '2024-Q1',
}
```

3. Rebuild and deploy: `npm run build`

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file for local development:

```env
# Optional: Email address to receive feedback (for production)
FEEDBACK_EMAIL=your.email@example.com

# Optional: API keys for services
# SENDGRID_API_KEY=your-api-key
```

### Customization

- **Colors**: Edit `tailwind.config.ts` for theme colors
- **Fonts**: Add fonts in `app/layout.tsx`
- **3D Settings**: Adjust particle counts and effects in respective component files
- **Animation Timings**: Modify Framer Motion configs in components

## 🚀 Deployment

### Vercel (Recommended)

This project is optimized for [Vercel](https://vercel.com):

1. Push your code to GitHub:
```bash
git push origin main
```

2. Import the project in Vercel:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. Configure environment variables in Vercel dashboard:
   - Add `FEEDBACK_EMAIL` if using email notifications

4. Deploy! Vercel will automatically:
   - Run tests
   - Build the project
   - Deploy to a global CDN
   - Set up automatic deployments for new commits

### Other Platforms

The app can also be deployed to:
- **Netlify**: Use the Next.js plugin
- **AWS Amplify**: Compatible with Next.js SSR
- **Digital Ocean App Platform**: Supports Next.js
- **Self-hosted**: Run `npm run build && npm start`

## ♿ Accessibility

This portfolio follows WCAG 2.1 Level AA guidelines:

- ✅ Semantic HTML5 structure
- ✅ Full keyboard navigation support
- ✅ ARIA labels and live regions
- ✅ Screen reader compatibility tested
- ✅ Sufficient color contrast (4.5:1 minimum)
- ✅ Focus indicators on all interactive elements
- ✅ Alt text for all images and icons
- ✅ Form labels, hints, and error messages
- ✅ Respects `prefers-reduced-motion` for animations
- ✅ Responsive text sizing
- ✅ Skip-to-content links

## 🚀 Deployment

This project is optimized for deployment on Vercel (recommended) but can be deployed to any platform that supports Next.js.

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tlex-web/portfolio-app)

**Quick Deploy:**

1. Push your code to GitHub
2. Import your repo to [Vercel](https://vercel.com/new)
3. Vercel auto-detects Next.js and deploys
4. Your site is live in ~2 minutes!

**Detailed instructions**: See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide including:
- Environment variables setup
- Custom domain configuration
- Performance optimization tips
- Troubleshooting common issues

### Other Platforms

This Next.js app can also deploy to:
- **Netlify**: Use the Netlify CLI or connect your GitHub repo
- **Railway**: One-click deploy from GitHub
- **Cloudflare Pages**: Deploy via Wrangler or dashboard
- **Self-hosted**: Run `npm run build && npm start` on any Node.js 20+ server

## 🎨 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

Note: WebGL features require modern browsers with GPU acceleration.

## 📊 Performance

- Lighthouse Score: 90+ across all metrics
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Bundle size optimized with code splitting
- Images optimized with Next.js Image component
- Lazy loading for 3D components

## 🤝 Contributing

While this is a personal portfolio, suggestions and bug reports are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**Your Name**

- Portfolio: [https://your-domain.com](https://your-domain.com)
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## 🙏 Acknowledgments

- Photography locations: Swiss Alps
- 3D libraries: Three.js, react-three-fiber community
- UI inspiration: Modern web design trends
- Testing utilities: Testing Library team

---

**Built with ❤️ using Next.js, TypeScript, and Three.js**

