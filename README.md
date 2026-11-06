# Personal Portfolio Website

A modern, responsive portfolio website showcasing landscape photography and programming projects. Built with Next.js 16, TypeScript, and Tailwind CSS, featuring stunning 3D visualizations and interactive animations.

## ✨ Features

### Home
- **The ascent**: scrolling climbs a terrain model of the Zermatt area built from a 10 m DEM, past four photo waypoints to the summit; a static poster stands in when WebGL or the device budget rules the canvas out

### Photographs
- **Map, grid and carousel views**: each photo is pinned on the terrain map where it was taken
- **Lightbox and photo pages**: zoom, hotspots and an EXIF strip; every photo also has its own page

### Engineering and roadmap
- **Case studies**: box (a command-line toolkit for PowerShell, with a terminal demo) and coin-flip (a 3D coin toss for Android, with a screen-recording clip)
- **Route log**: the roadmap as finished, current and planned work, filtered by project and status

### Contact and edge pages
- **Summit register**: a contact form posting to `/api/feedback` (zod validation, Origin check, Upstash rate limit, Resend email)
- **Edge pages**: designed 404, error and offline pages; the service worker keeps visited pages readable offline

### Development Features
- **Full TypeScript**: Type-safe codebase with strict mode enabled
- **Testing**: Jest + Testing Library unit tests, Playwright end-to-end and visual-regression specs
- **Form Validation**: Client and server-side validation with Zod
- **Rate Limiting**: Built-in API rate limiting for feedback form
- **Responsive Design**: Mobile-first design that works on all screen sizes
- **One palette**: the dark topographic palette renders the same in light and dark colour schemes
- **Accessibility**: keyboard navigation, reduced-motion support and accessible names, checked by axe and keyboard-only Playwright specs
- **Performance**: Optimized builds with code splitting and lazy loading

## 🛠️ Tech Stack

### Core
- **Framework**: Next.js 16 with the App Router (`next dev --webpack` locally)
- **Language**: TypeScript 6
- **Styling**: Tailwind CSS 4

### 3D & Animation
- **Three.js**: 3D rendering and WebGL
- **react-three-fiber**: React renderer for Three.js
- **@react-three/drei**: Useful helpers for r3f
- **@react-spring/three**: Spring physics-based animations
- **Motion**: Component animations and transitions (`motion/react`)

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

- **Node.js** (the version in `.node-version`) and npm
- Modern browser with WebGL support

### Installation

1. Clone the repository:

```bash
git clone https://github.com/tlex-web/portfolio-app.git
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

4. Edit `.env.local` with the contact-form settings:

```env
# Resend (email delivery, required)
RESEND_API_KEY=re_your_api_key
FEEDBACK_RECIPIENT_EMAIL=your.email@example.com
# Optional, defaults to onboarding@resend.dev
FEEDBACK_FROM_EMAIL=noreply@yourdomain.com

# Upstash Redis (rate limiting, optional)
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

The form answers "Couldn't send." until `RESEND_API_KEY` and `FEEDBACK_RECIPIENT_EMAIL` are set, and rate limiting is off without the Upstash pair.

### Development

Run the development server:

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

Check the contact form on the live site. It runs against production, not in CI, and sends no email by default:

```bash
npm run test:prod-form
```

`PROD_FORM_SEND=1` adds one real email through the form, and `PROD_FORM_LIMIT=1` proves the rate limiter is on but locks your IP out for up to an hour. `e2e/prod/contact-form.prod.ts` lists what each level costs.

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

The tree below lists the top-level folders and their key files (from `git ls-files`). Unit tests sit next to the code in `__tests__/` folders.

```
portfolio-app/
├── app/                                   # Next.js App Router
│   ├── (site)/                            # every page that wears the site shell
│   │   ├── layout.tsx                     # mounts SiteChrome (nav, skip link, footer)
│   │   ├── page.tsx                       # Home: the ascent over the Zermatt terrain
│   │   ├── photos/                        # map, grid and carousel views; [slug] photo page
│   │   │   └── @modal/(.)[slug]/          # intercepted route: a photo opens in the lightbox
│   │   ├── projects/                      # project index and the [slug] case studies
│   │   ├── roadmap/page.tsx               # the route log with its project and status filters
│   │   ├── contact/page.tsx               # the summit register (contact form) and direct contact
│   │   ├── offline/page.tsx               # offline page with the pages saved on this device
│   │   ├── error.tsx                      # error page inside the shell
│   │   └── not-found.tsx                  # 404 inside the shell
│   ├── api/feedback/route.ts              # POST /api/feedback: validation, CSRF, rate limit, email
│   ├── layout.tsx                         # root layout and default metadata
│   ├── global-error.tsx                   # last-resort error page
│   ├── not-found.tsx                      # root 404
│   ├── opengraph-image.tsx                # default Open Graph card
│   ├── robots.ts, sitemap.ts              # robots.txt and sitemap.xml
│   └── globals.css                        # Tailwind v4 theme and design tokens
│
├── components/
│   ├── site/                              # the shell: SiteChrome, SiteNav, SiteFooter, SkipLink,
│   │                                      #   EdgeLayout and EdgeArt for the 404, error and offline pages
│   ├── home/                              # the Home ascent: hero, waypoint cards, altimeter rail,
│   │   └── terrain/                       #   summit plaque, poster sheet; the lazy R3F terrain canvas
│   ├── photos/                            # map sheet, justified grid, carousel, lightbox, EXIF strip
│   ├── projects/                          # project panels, case-study layout, demo terminal and clip
│   │   └── sections/                      #   the case-study sections (Problem, Pipeline, Metrics, ...)
│   ├── roadmap/                           # route log, its filters and rows
│   ├── contact/                           # SummitRegister form, DirectContactPanel, CopyEmailButton
│   ├── terrain/ContourField.tsx           # contour art drawn as a CSS mask
│   ├── providers/MotionProvider.tsx       # app-wide reduced-motion setting for Motion
│   ├── SafeCanvas.tsx                     # error boundary that swaps a failed canvas for its fallback
│   └── ServiceWorkerRegistration.tsx      # registers the service worker in production
│
├── data/                                  # content and generated data, checked by zod
│   ├── schemas/                           # strict zod contracts (projects, route log, photos, terrain)
│   ├── generated/                         # pipeline outputs (photos, image manifest, terrain, tokens)
│   ├── photos/                            # EXIF sidecar, corrections and the editorial photo copy
│   ├── terrain/source/                    # the DEM, its source record and the trail polylines
│   ├── projects.ts                        # box and coin-flip
│   ├── roadmap.ts                         # route-log rows
│   ├── home.ts, sheet.ts                  # Home and photos-sheet copy
│   └── site.ts                            # identity, nav and links (the single source)
│
├── lib/                                   # pure helpers and hooks
│   ├── ascent/                            # the Home ascent: progress, framing, waypoints, summit
│   ├── photos/                            # view model, grid justification, zoom, lightbox tiers
│   ├── terrain/                           # DEM sampling, heightmap, hillshade, contour paths
│   ├── og/template.tsx                    # the shared Open Graph template (fonts in og/fonts/)
│   ├── metadata.ts                        # per-route title, description and canonical URL
│   ├── route-log.ts                       # route-log bands and filters
│   ├── demo-terminal.ts                   # the demo terminal's state machine
│   ├── csrf.ts, rate-limit.ts, email.ts   # the contact API's Origin check, Upstash limiter, Resend
│   └── sw-update.ts, saved-pages.ts       # service-worker reload guard and offline saved pages
│
├── public/
│   ├── images/photos/                     # hashed photo derivatives (AVIF, WebP, JPEG)
│   ├── terrain/                           # hashed contour SVGs, heightmaps and hillshades
│   ├── media/                             # the coin-flip clip and its poster
│   └── service-worker.js                  # offline support; build hash injected after the build
│
├── scripts/                               # data pipeline and guards (see scripts/README.md)
│   ├── photos/, terrain/, media/, tokens/ # local generators with a --check mode for CI
│   ├── guards/                            # palette, contrast, identity, parity, served-images, test-count
│   └── inject-build-hash.mjs              # postbuild: build hash and precache list into the worker
│
├── e2e/                                   # Playwright specs; visual/ holds the visual baselines
├── proxy.ts                               # per-request CSP nonce and the 404 decision for unknown slugs
├── next.config.ts                         # Next.js config and static-asset headers
├── playwright.config.ts                   # Playwright projects and the dev or production server
├── jest.config.js, jest.setup.js          # Jest config and setup
├── eslint.config.mjs                      # ESLint flat config
└── vercel.json                            # Vercel settings
```

## 📝 Content Management

All content is managed through TypeScript files in the `data/` directory. This approach provides:
- Type safety for all content
- No CMS complexity
- Version control for content changes
- Fast compile-time validation

### Adding a Photograph

Photos go through a local pipeline; the originals never enter the repository. See `scripts/README.md` ("After adding or editing a photo"):

```bash
# Put the sRGB original in assets/photos-original/ (gitignored), then:
npm run photos:exif     # EXIF sidecar (data/photos/exif-sidecar.json)
npm run photos:derive   # hashed derivatives in public/images/photos/ and the image manifest
npm run photos:build    # typed photo facts in data/generated/photos.ts
npm run data:check      # what CI runs
```

Titles, places and stories live in `data/photos/editorial.ts`; hand-placed positions and capture overrides in `data/photos/corrections.json`.

### Editing a Project

Projects live in `data/projects.ts` and are checked by the strict zod contract in `data/schemas/project.ts`: a discriminated union on `slug` (`box` or `coin-flip`) whose case-study blocks are all optional. A block without data does not render, and the section order is fixed in `components/projects/CaseStudy.tsx`.

### Updating the Roadmap

Route-log rows live in `data/roadmap.ts` and are checked by `data/schemas/roadmap.ts`:

```typescript
// The box v2 row as committed:
{
  id: 'box-v2',              // lowercase slug: the row's DOM id and #fragment
  title: 'v2.0 Toolbox → toolkit',
  description: 'The tools became scriptable: JSON output, `--clip`, config-file defaults, ...',
  area: 'box',               // 'portfolio' | 'box' | 'coin-flip'
  status: 'completed',       // 'planned' | 'in-progress' | 'completed'
  order: 3,                  // unique; places the row on the climb
  completedAt: '2026-07-14', // YYYY-MM-DD, completed rows only; optional
}
```

`targetRelease` (a string) is optional too, and the portfolio v2.0 row carries `phases`. Then run `npx jest data` (the data tests check unique ids and order values, dates and areas).

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file for local development:

`.env.example` lists every variable. The contact form needs:

```env
# Resend (email delivery)
RESEND_API_KEY=
FEEDBACK_RECIPIENT_EMAIL=
FEEDBACK_FROM_EMAIL=

# Upstash Redis (persistent rate limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Customization

- **Colors and tokens**: the Tailwind v4 `@theme` block in `app/globals.css` (the palette and contrast guards check it; `npm run tokens:build` regenerates the shader colours)
- **Fonts**: `app/layout.tsx`
- **Motion durations**: the `--duration-*` tokens in `app/globals.css`

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
   - Required for the contact form: `RESEND_API_KEY` and `FEEDBACK_RECIPIENT_EMAIL`
   - Optional: `FEEDBACK_FROM_EMAIL` (defaults to `onboarding@resend.dev`)
   - Rate limiting: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, or add Vercel's Upstash integration, which injects them

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
- **Self-hosted**: Run `npm run build && npm start` on a Node.js 24 server (`engines.node` 24.x, `.node-version`)

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

- Portfolio: [https://www.tlui.de](https://www.tlui.de)
- GitHub: [tlex-web](https://github.com/tlex-web)
- Email: your.email@example.com

## 🙏 Acknowledgments

- Photography locations: Swiss Alps
- 3D libraries: Three.js, react-three-fiber community
- UI inspiration: Modern web design trends
- Testing utilities: Testing Library team

---

**Built with ❤️ using Next.js, TypeScript, and Three.js**

