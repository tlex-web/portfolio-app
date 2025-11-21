# AGENT.md: Portfolio Website Implementation Guide

## Project Overview

### Vision

Build a personal portfolio website that serves two primary purposes:

1. **Showcase landscape photography** through a beautiful, immersive, partly 3D experience that tells the story of locations, moments, and technical craft.

2. **Present programming projects** with clear explanations and technical details, including:
   - An LLM-supported CLI tool written in Rust
   - A webshop for offering licenses for that application, built with TypeScript/React/Next.js
   - An extensible structure for adding future projects

### Design Goals

- **Visually stunning yet performant**: Balance aesthetic ambition with real-world performance constraints.
- **Strong storytelling**: Each image and project should communicate context, purpose, and narrative.
- **Smooth, tasteful animations**: Enhance the experience without feeling gimmicky or distracting.
- **Code-driven content**: Explicitly **no CMS or admin dashboard**. All content updates happen through code or static data files.

---

## Tech Stack & Libraries

### Frontend Stack

#### Core Framework
- **Next.js** (latest stable, using App Router)
  - Reason: Built-in routing, server components, excellent image optimization, API routes
  - Prefer **server components** by default; use client components only when necessary (interactivity, browser APIs, state)
- **TypeScript**
  - Strict mode enabled for maximum type safety
- **React 18+**
  - Leverage concurrent features and suspense where appropriate

#### Styling
- **Tailwind CSS**
  - Utility-first approach for rapid, consistent styling
  - Use `tailwind.config.ts` for custom theme values (colors, spacing, animations)
  - Consider Tailwind plugins for typography and forms

#### 3D and Animation Libraries (Recommended)

- **Three.js** with **react-three-fiber** (`@react-three/fiber`)
  - For 3D parallax effects and landscape scene manipulation
  - Keep scenes lightweight; avoid complex geometries
- **@react-three/drei**
  - Helper components for common Three.js patterns
- **Framer Motion** or **GSAP**
  - For scroll-triggered animations, entrance effects, and transitions
  - Framer Motion integrates well with React; GSAP offers more advanced control
  - Choose one to avoid library bloat

**Note**: These 3D/animation libraries are recommended but replaceable. If you choose alternatives, maintain the same performance and accessibility standards.

### Build Tools & Code Quality

- **ESLint**
  - `eslint-config-next` for Next.js-specific rules
  - TypeScript ESLint parser and plugins
- **Prettier**
  - Consistent code formatting
  - Integrate with ESLint via `eslint-config-prettier`
- **Husky + lint-staged** (Optional but recommended)
  - Pre-commit hooks to enforce linting and formatting
  - Prevents committing broken or poorly formatted code

### Deployment Considerations

- Target **Vercel** or similar platforms optimized for Next.js
- Use environment variables for any API keys or sensitive configuration
- Enable Image Optimization through Next.js `next/image`

---

## Functional Requirements

### 1. Entry Point (Landing Hero)

#### Description
The portfolio opens with a **full-screen landscape hero image** that uses scroll-based 3D animation to create an immersive experience.

#### Core Features
- Display a high-quality landscape photograph at full viewport height
- As the user scrolls down, implement a **3D parallax effect**:
  - Separate the image into layers (e.g., foreground, middle ground, background, sky)
  - Apply varying scroll speeds or 3D depth transformations to create parallax
  - Reveal **overlaid text annotations** that highlight specific features of the landscape (e.g., "Captured at dawn in the Norwegian fjords")
- Include subtle entrance animations for text overlays

#### Implementation Strategy
1. **Layer preparation**: Use image editing software (or automated masking) to separate the hero image into 2-4 layers with transparent backgrounds
2. **3D scene setup**: Position layers at different Z-depths in a Three.js scene
3. **Scroll binding**: Use an animation library (Framer Motion, GSAP ScrollTrigger) to map scroll position to camera movement or layer transforms
4. **Text overlays**: Position React components absolutely over the canvas; animate opacity and position based on scroll progress
5. **Performance**: Use `requestAnimationFrame` throttling; test on mid-range devices

#### Accessibility
- Respect `prefers-reduced-motion`: disable or minimize animations for users with motion sensitivity
- Provide a "Skip to content" link for keyboard users
- Ensure text overlays have sufficient contrast against the background

---

### 2. Landscape Gallery

#### Description
A dedicated section (or page) showcasing multiple landscape photographs with rich metadata and storytelling.

#### Core Features
- **Grid or masonry layout** of landscape images
- **Hover/focus states**: Subtle scale or brightness changes
- **Click to expand**: Open a modal or dedicated view with:
  - Full-resolution image
  - Location name and story (e.g., "Taken during a solo hike in Iceland's Westfjords")
  - Technical details: camera, lens, aperture, shutter speed, ISO, time of day
  - Optional tags (e.g., "mountains", "sunrise", "long exposure")
- **Lazy loading**: Load images as they enter the viewport

#### Data Structure
Define a TypeScript interface for landscape images:

```typescript
interface LandscapeImage {
  id: string;
  src: string; // Path to image file
  thumbnail?: string; // Optional optimized thumbnail
  alt: string; // Accessibility description
  title: string;
  location: string;
  story: string; // Narrative description
  technicalDetails: {
    camera?: string;
    lens?: string;
    aperture?: string;
    shutterSpeed?: string;
    iso?: number;
    captureDate?: string;
  };
  tags: string[];
}
```

Store data in `data/landscapes.ts` as a typed array:

```typescript
export const landscapes: LandscapeImage[] = [
  {
    id: 'fjord-dawn',
    src: '/images/landscapes/fjord-dawn.jpg',
    alt: 'Misty fjord at sunrise with mountains reflected in still water',
    title: 'Norwegian Fjord at Dawn',
    location: 'Geirangerfjord, Norway',
    story: 'Woke up at 4 AM to catch the first light...',
    technicalDetails: {
      camera: 'Sony A7R IV',
      lens: '24-70mm f/2.8',
      aperture: 'f/8',
      shutterSpeed: '1/60s',
      iso: 100,
      captureDate: '2024-06-15',
    },
    tags: ['mountains', 'sunrise', 'water', 'norway'],
  },
  // ... more images
];
```

---

### 3. Programming Projects Showcase

#### Description
A section (or dedicated page) that lists and describes programming projects with rich technical detail.

#### Core Features
- **Project listing**: Cards or tiles displaying project name, tagline, tech stack icons
- **Click to expand**: Navigate to `/projects/:slug` or open an overlay with full details:
  - Project name and tagline
  - Short description (elevator pitch)
  - Long-form explanation with implementation highlights
  - Tech stack used (with icons if available)
  - Links to GitHub, live demo, documentation
  - Current status and roadmap items
- **Featured projects**: Ability to pin or highlight specific projects

#### Required Projects

##### A. LLM-Supported Rust CLI Tool
- **Name**: (e.g., "Lumina CLI")
- **Description**: A command-line interface tool that integrates large language model capabilities to assist with [specific task, e.g., code review, documentation generation, data analysis]
- **Tech stack**: Rust, `clap` for CLI, `tokio` for async, `reqwest` or similar for HTTP, `serde` for JSON
- **Safety patterns**:
  - API keys loaded from environment variables, never hardcoded
  - Clear error messages using `anyhow` or `thiserror`
  - Timeout and retry logic for LLM API calls
  - Opt-in data sharing, privacy-first design
- **Showcase highlights**:
  - Command structure and examples
  - Performance characteristics
  - How error handling is managed
  - Future roadmap items

##### B. Webshop for Application Licenses
- **Name**: (e.g., "Lumina Licensing")
- **Description**: A Next.js-based web application for purchasing and managing licenses for the Rust CLI tool
- **Tech stack**: TypeScript, React, Next.js, Tailwind CSS, Stripe/PayPal integration (conceptual), database (PostgreSQL or similar)
- **Architecture**:
  - Frontend: Product pages, checkout flow, license management dashboard
  - Backend: Next.js API routes for payment processing, license generation, validation
  - Security: License keys generated server-side, stored securely, validated via API
- **Safety patterns**:
  - Environment variables for payment API keys and database credentials
  - Input validation on all API routes
  - Rate limiting to prevent abuse
  - HTTPS-only in production
- **Showcase highlights**:
  - Clean checkout UX
  - License key delivery mechanism
  - User account management (optional)

##### C. Extensible Structure for Future Projects
Ensure the data model and component structure can easily accommodate additional projects without refactoring.

#### Data Structure

```typescript
interface Project {
  slug: string; // URL-friendly identifier
  name: string;
  tagline: string;
  shortDescription: string;
  longDescription: string; // Markdown or rich text
  techStack: string[]; // e.g., ['Rust', 'TypeScript', 'Next.js']
  links: {
    github?: string;
    demo?: string;
    docs?: string;
  };
  status: 'active' | 'beta' | 'complete' | 'archived';
  featured: boolean;
  thumbnailImage?: string;
  roadmapItems?: RoadmapItem[]; // Optional project-specific roadmap
}
```

Store in `data/projects.ts`:

```typescript
export const projects: Project[] = [
  {
    slug: 'lumina-cli',
    name: 'Lumina CLI',
    tagline: 'LLM-powered command-line assistant',
    shortDescription: 'A Rust-based CLI tool that brings large language model capabilities to your terminal.',
    longDescription: `
Lumina CLI is a command-line interface that integrates cutting-edge language models...

**Features:**
- Interactive and batch modes
- Safe error handling and retry logic
- Privacy-first design

**Example usage:**
\`\`\`bash
lumina review --file src/main.rs
\`\`\`
    `,
    techStack: ['Rust', 'Tokio', 'Clap'],
    links: {
      github: 'https://github.com/user/lumina-cli',
    },
    status: 'beta',
    featured: true,
  },
  {
    slug: 'lumina-licensing',
    name: 'Lumina Licensing',
    tagline: 'Secure license management webshop',
    shortDescription: 'A Next.js web application for purchasing and managing Lumina CLI licenses.',
    longDescription: `
Built with modern web technologies, this licensing platform provides a seamless experience...
    `,
    techStack: ['TypeScript', 'React', 'Next.js', 'Tailwind CSS', 'PostgreSQL'],
    links: {
      demo: 'https://lumina-licenses.example.com',
    },
    status: 'active',
    featured: true,
  },
  // ... more projects
];
```

---

### 4. Roadmap Section

#### Description
A dedicated page or section displaying planned features and improvements across the portfolio and showcased projects.

#### Core Features
- **Visual timeline or kanban-style layout** showing roadmap items
- Categorize by area:
  - Portfolio website enhancements
  - Rust CLI tool features
  - Webshop features
  - Other projects
- Each item displays:
  - Title
  - Description
  - Status (Planned, In Progress, Completed)
  - Target release or timeframe (optional)
  - Priority (optional)

#### Data Structure

```typescript
interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  area: 'portfolio' | 'cli' | 'webshop' | 'other';
  status: 'planned' | 'in-progress' | 'completed';
  targetRelease?: string; // e.g., 'Q1 2024', 'v2.0'
  priority?: 'low' | 'medium' | 'high';
}
```

Store in `data/roadmap.ts`:

```typescript
export const roadmapItems: RoadmapItem[] = [
  {
    id: 'portfolio-blog',
    title: 'Add blog section',
    description: 'Create a blog for sharing photography stories and development insights',
    area: 'portfolio',
    status: 'planned',
    targetRelease: 'Q2 2025',
    priority: 'medium',
  },
  {
    id: 'cli-plugin-system',
    title: 'Plugin architecture',
    description: 'Allow users to extend Lumina CLI with custom plugins',
    area: 'cli',
    status: 'in-progress',
    targetRelease: 'v2.0',
    priority: 'high',
  },
  // ... more items
];
```

#### Design
- Use color coding for status (e.g., gray for planned, blue for in-progress, green for completed)
- Allow filtering by area or status
- Keep it simple and scannable

---

### 5. Feedback & Collaboration Form

#### Description
A user-friendly contact form for feedback, questions, and collaboration inquiries.

#### Core Features
- Form fields:
  - **Name** (required)
  - **Email** (required, validated)
  - **Message** (required, textarea)
  - **Interested in collaboration** (optional checkbox or multi-select: photography, development, other)
- Submit button with loading state
- Success/error messages displayed inline
- Form validation (client-side and server-side)

#### Implementation
- Use a **Next.js API Route** (e.g., `app/api/feedback/route.ts`) to handle form submission
- Validate input using a schema validation library (e.g., `zod` or `yup`)
- Send email via a service (e.g., SendGrid, Resend, Nodemailer with SMTP)
- Return appropriate HTTP status codes (200 for success, 400 for validation errors, 500 for server errors)

#### Safety & Privacy Considerations
- **Input validation**: Check for required fields, valid email format, reasonable message length
- **Sanitization**: Strip HTML tags or dangerous characters from user input
- **Rate limiting**: Use Next.js middleware or an in-memory store (e.g., `lru-cache`) to limit submissions per IP (e.g., 5 per hour)
- **CAPTCHA** (optional): Consider adding reCAPTCHA or hCaptcha to prevent spam
- **Logging**: Log submission attempts (without sensitive data) for monitoring
- **No persistent storage of sensitive data**: Send email immediately; do not store messages in database unless explicitly needed
- **Privacy policy**: Include a brief note about how submitted data is used

#### Example API Route Structure

```typescript
// app/api/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const feedbackSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(2000),
  interestedInCollaboration: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = feedbackSchema.parse(body);
    
    // TODO: Rate limiting check
    
    // TODO: Send email via SendGrid/Resend
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

### 6. Routing & Navigation

#### Information Architecture

Recommended page structure:

- **`/`** – Landing page with hero scroll-3D animation and highlights
- **`/photos`** – Landscape gallery
- **`/projects`** – Projects overview (list/grid of all projects)
- **`/projects/:slug`** – Individual project detail page
- **`/roadmap`** – Roadmap timeline
- **`/contact`** – Feedback and collaboration form

#### Navigation Component
- **Header/navbar**: Present on all pages
  - Logo or site title
  - Links to main sections
  - Mobile-responsive (hamburger menu for small screens)
- **Footer**: Copyright, social links, brief tagline

#### Routing Strategy: Use Next.js App Router Exclusively

**Do not use React Router.** Next.js App Router provides all necessary routing capabilities:

- **File-based routing**: Create pages by adding files to the `app/` directory
- **Dynamic routes**: Use `[slug]` folders for dynamic segments (e.g., `app/projects/[slug]/page.tsx`)
- **Layouts**: Share common UI (header, footer) via `layout.tsx` files
- **Server and client components**: Optimize performance by rendering on the server where possible

**Why not React Router?**
- Redundant: Next.js routing is sufficient and more performant
- Complexity: Adding React Router introduces unnecessary dependency and configuration
- Server-side rendering: Next.js routing integrates seamlessly with SSR and SSG

**Exception**: If building a client-side-only single-page application (SPA) without Next.js, React Router would be appropriate. In this project, stick with Next.js routing.

---

### 7. No Admin Dashboard / CMS

#### Explicit Constraint
This portfolio **does not include an admin dashboard or content management system (CMS)**. All content is managed directly through code and static data files.

#### Rationale
- **Simplicity**: No database, authentication, or admin UI to maintain
- **Version control**: All content changes are tracked in Git
- **Security**: No admin endpoints to secure or potential CMS vulnerabilities
- **Performance**: Static or server-rendered content without extra database queries

#### Content Management Workflow
To add or update content:

1. **Adding a new landscape image**:
   - Add image file to `public/images/landscapes/`
   - Open `data/landscapes.ts`
   - Add a new entry to the `landscapes` array with all metadata
   - Commit and deploy

2. **Adding a new project**:
   - Open `data/projects.ts`
   - Add a new entry to the `projects` array
   - Create a new page at `app/projects/[slug]/page.tsx` if needed (or use a dynamic template)
   - Commit and deploy

3. **Updating roadmap**:
   - Open `data/roadmap.ts`
   - Modify or add `RoadmapItem` entries
   - Commit and deploy

4. **Editing page content**:
   - Modify the relevant React component or page file
   - Update text, styling, or layout as needed
   - Commit and deploy

This workflow is straightforward for technical users and keeps the codebase lean.

---

## System Architecture & Implementation Plan

### High-Level Architecture

#### Layers

1. **Presentation Layer** (React Components)
   - Pages: Home, Photos, Projects, ProjectDetail, Roadmap, Contact
   - Reusable components: Header, Footer, ImageGallery, ProjectCard, RoadmapTimeline, FeedbackForm
   - 3D/Animation components: Hero3DSection, ParallaxLayer

2. **Data Layer** (Static TypeScript Modules)
   - `data/landscapes.ts`: Array of `LandscapeImage` objects
   - `data/projects.ts`: Array of `Project` objects
   - `data/roadmap.ts`: Array of `RoadmapItem` objects

3. **API Layer** (Next.js Route Handlers)
   - `app/api/feedback/route.ts`: Handle form submission

4. **Utilities** (Helper Functions)
   - Image loading/optimization helpers
   - Animation utilities (scroll progress, easing functions)
   - Validation schemas

#### Data Flow

```
User interacts with UI
  ↓
React components (client or server)
  ↓
Data from static TypeScript modules (server components fetch directly)
  OR
API routes (for form submission, future dynamic features)
  ↓
External services (email, analytics)
```

#### Component Hierarchy

```
App (root layout)
├── Header (navigation)
├── Page-specific content
│   ├── Home
│   │   ├── Hero3DSection
│   │   ├── HighlightsSection
│   ├── Photos
│   │   ├── GalleryGrid
│   │   ├── ImageDetailModal
│   ├── Projects
│   │   ├── ProjectsList
│   │   ├── ProjectCard
│   ├── ProjectDetail (dynamic)
│   │   ├── ProjectHeader
│   │   ├── ProjectContent
│   ├── Roadmap
│   │   ├── RoadmapTimeline
│   │   ├── RoadmapItem
│   ├── Contact
│   │   ├── FeedbackForm
└── Footer
```

---

### Core Components

#### Hero3DSection

**Purpose**: Render the landing hero with 3D parallax effect

**Inputs/Props**:
- `heroImage: { layers: string[], alt: string, annotations: { text: string, position: { x: number, y: number } }[] }`

**Interactions**:
- Uses `react-three-fiber` to create a 3D scene
- Listens to scroll events (via Framer Motion or GSAP)
- Updates camera position or layer transforms based on scroll progress
- Renders text annotations as absolutely positioned React components

**Implementation Notes**:
- Mark as a client component (`'use client'`)
- Use `useScroll` from Framer Motion or GSAP ScrollTrigger
- Optimize performance: throttle scroll listeners, use `will-change` CSS property

---

#### GalleryGrid

**Purpose**: Display a grid of landscape images

**Inputs/Props**:
- `images: LandscapeImage[]`

**Interactions**:
- Maps over `images` and renders image cards
- Each card is clickable and opens `ImageDetailModal`
- Uses `next/image` for optimization

**Implementation Notes**:
- Use CSS Grid or Flexbox for layout
- Implement lazy loading with `next/image` or Intersection Observer
- Hover effects with Tailwind (`hover:scale-105 transition-transform`)

---

#### ImageDetailModal

**Purpose**: Display full-resolution image with metadata in a modal

**Inputs/Props**:
- `image: LandscapeImage | null`
- `onClose: () => void`

**Interactions**:
- Renders a modal overlay when `image` is not null
- Displays full image, title, location, story, technical details
- Close on backdrop click or Escape key

**Implementation Notes**:
- Use React Portal for modal rendering
- Focus trap for accessibility
- Animate entrance/exit with Framer Motion

---

#### ProjectCard

**Purpose**: Display a project in a card format

**Inputs/Props**:
- `project: Project`

**Interactions**:
- Links to `/projects/:slug`
- Displays project name, tagline, tech stack icons

**Implementation Notes**:
- Use Next.js `Link` component for navigation
- Show status badge (e.g., "Beta", "Active")

---

#### ProjectDetailPage

**Purpose**: Render full details of a project

**Inputs/Props**:
- Dynamic route parameter: `slug`

**Interactions**:
- Fetches project from `data/projects.ts` by slug
- Displays long description, tech stack, links, roadmap items

**Implementation Notes**:
- Server component (default in Next.js App Router)
- Use `notFound()` if project not found
- Optionally use MDX for rich content in `longDescription`

---

#### RoadmapTimeline

**Purpose**: Display roadmap items in a timeline or kanban layout

**Inputs/Props**:
- `items: RoadmapItem[]`

**Interactions**:
- Renders each item with status, title, description
- Optional filtering by area or status

**Implementation Notes**:
- Use Tailwind for layout and color coding
- Consider horizontal timeline for desktop, vertical for mobile

---

#### FeedbackForm

**Purpose**: Capture user feedback and collaboration inquiries

**Inputs/Props**: None (self-contained)

**Interactions**:
- Manages form state with React `useState`
- Validates input client-side
- Submits to `/api/feedback`
- Displays success/error messages

**Implementation Notes**:
- Client component (`'use client'`)
- Use controlled inputs
- Show loading state during submission
- Clear form on success

---

### State Management

**Approach**: Keep it simple.

- **Local component state** (`useState`, `useReducer`): For form inputs, modal open/close, UI toggles
- **URL state** (Next.js routing): For current page, dynamic route parameters (e.g., project slug)
- **React Context** (if needed): For theme (dark/light mode), user preferences (e.g., reduced motion)
- **Avoid heavy global state libraries** (Redux, Zustand) unless justified by complexity

**Example**: Managing modal state in GalleryGrid

```typescript
'use client';

import { useState } from 'react';
import { LandscapeImage } from '@/data/landscapes';
import ImageDetailModal from './ImageDetailModal';

export default function GalleryGrid({ images }: { images: LandscapeImage[] }) {
  const [selectedImage, setSelectedImage] = useState<LandscapeImage | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => (
          <button
            key={image.id}
            onClick={() => setSelectedImage(image)}
            className="hover:scale-105 transition-transform"
          >
            {/* Image content */}
          </button>
        ))}
      </div>
      <ImageDetailModal image={selectedImage} onClose={() => setSelectedImage(null)} />
    </>
  );
}
```

---

### Step-by-Step Implementation Roadmap

#### Phase 1: Setup

**Tasks**:
- [ ] Initialize Next.js project with TypeScript: `npx create-next-app@latest --typescript`
- [ ] Install Tailwind CSS: follow [Next.js + Tailwind setup guide](https://tailwindcss.com/docs/guides/nextjs)
- [ ] Configure ESLint and Prettier
- [ ] Set up Husky and lint-staged (optional)
- [ ] Install 3D/animation libraries: `npm install three @react-three/fiber @react-three/drei framer-motion`
- [ ] Create basic folder structure:
  - `app/` (pages and layouts)
  - `components/` (reusable components)
  - `data/` (TypeScript data modules)
  - `public/images/` (static assets)
  - `lib/` (utilities)

**Definition of Done**:
- Project runs locally (`npm run dev`)
- Linting and formatting work without errors
- Folder structure is in place

---

#### Phase 2: Basic Routing and Static Pages

**Tasks**:
- [ ] Create page files:
  - `app/page.tsx` (home)
  - `app/photos/page.tsx`
  - `app/projects/page.tsx`
  - `app/projects/[slug]/page.tsx`
  - `app/roadmap/page.tsx`
  - `app/contact/page.tsx`
- [ ] Add placeholder content to each page (simple text)
- [ ] Test navigation between pages

**Definition of Done**:
- All pages are accessible via browser
- Next.js routing works without errors
- No console errors

---

#### Phase 3: Layout, Navigation, and Base Styling

**Tasks**:
- [ ] Create `app/layout.tsx` with HTML structure, metadata, and font imports
- [ ] Build `Header` component with navigation links
- [ ] Build `Footer` component
- [ ] Apply Tailwind base styles and custom theme (colors, fonts)
- [ ] Make Header responsive (hamburger menu for mobile)
- [ ] Test on multiple screen sizes

**Definition of Done**:
- Header and Footer appear on all pages
- Navigation works on desktop and mobile
- Base styling is consistent and visually appealing

---

#### Phase 4: Hero Image + Scroll/3D Animation

**Tasks**:
- [ ] Prepare hero image layers (foreground, midground, background)
- [ ] Create `Hero3DSection` component
- [ ] Set up Three.js scene with react-three-fiber
- [ ] Position image layers at different Z-depths
- [ ] Implement scroll-based camera movement or layer transforms
- [ ] Add text annotations with scroll-triggered animations
- [ ] Test performance and adjust complexity if needed
- [ ] Implement `prefers-reduced-motion` fallback (static image or minimal animation)

**Definition of Done**:
- Hero animation works smoothly on desktop and tablet
- Reduced motion preference is respected
- No jank or dropped frames (test on mid-range device)
- Text overlays are readable and accessible

---

#### Phase 5: Gallery and Project Sections

**Tasks**:
- [ ] Define `LandscapeImage` and `Project` interfaces in `data/types.ts`
- [ ] Create `data/landscapes.ts` with at least 3 example images
- [ ] Create `data/projects.ts` with at least 2 projects (Rust CLI, webshop)
- [ ] Build `GalleryGrid` component
- [ ] Build `ImageDetailModal` component
- [ ] Build `ProjectCard` component
- [ ] Build `ProjectDetailPage` component
- [ ] Populate `/photos` page with `GalleryGrid`
- [ ] Populate `/projects` page with list of `ProjectCard`s
- [ ] Implement dynamic project detail route
- [ ] Optimize images with `next/image`
- [ ] Add lazy loading

**Definition of Done**:
- Gallery displays images and opens detail modal on click
- Project cards link to detail pages
- Detail pages render correct content for each project
- Images load efficiently with lazy loading

---

#### Phase 6: Roadmap and Feedback Form

**Tasks**:
- [ ] Define `RoadmapItem` interface
- [ ] Create `data/roadmap.ts` with example items
- [ ] Build `RoadmapTimeline` component
- [ ] Populate `/roadmap` page
- [ ] Build `FeedbackForm` component with validation
- [ ] Create `app/api/feedback/route.ts` API handler
- [ ] Implement server-side validation with `zod`
- [ ] Integrate email sending service (SendGrid, Resend, or Nodemailer)
- [ ] Add rate limiting
- [ ] Test form submission (success and error cases)

**Definition of Done**:
- Roadmap displays all items with correct status and styling
- Feedback form submits successfully
- Validation errors display correctly
- Rate limiting prevents spam
- Emails are sent successfully (or logged if in dev mode)

---

#### Phase 7: Testing, Accessibility, and Performance Tuning

**Tasks**:
- [ ] Write unit tests for key components (FeedbackForm, ProjectCard, etc.)
- [ ] Write integration tests for critical flows (form submission, project navigation)
- [ ] Run accessibility audit (axe DevTools, Lighthouse)
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Test with screen reader (NVDA, JAWS, or VoiceOver)
- [ ] Run Lighthouse performance audit
- [ ] Optimize images further if needed (WebP format, responsive sizes)
- [ ] Minimize JavaScript bundle size (check for unused dependencies)
- [ ] Test on various devices and browsers (Chrome, Firefox, Safari, Edge)
- [ ] Add error boundaries for graceful error handling
- [ ] Review and fix any remaining linter errors

**Definition of Done**:
- Lighthouse scores: Performance >85, Accessibility >90, Best Practices >90, SEO >90
- All critical accessibility issues resolved
- Key user flows covered by automated tests
- Cross-browser testing complete
- No console errors in production build

---

## Best Practices & Safe Usage Examples

### 1. TypeScript + React + Next.js Examples

#### Idiomatic React Component with TypeScript and Tailwind

```typescript
// components/ProjectCard.tsx
import Link from 'next/link';
import { Project } from '@/data/types';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow"
      aria-label={`View details for ${project.name}`}
    >
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {project.name}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        {project.tagline}
      </p>
      <div className="flex flex-wrap gap-2">
        {project.techStack.map((tech) => (
          <span
            key={tech}
            className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
          >
            {tech}
          </span>
        ))}
      </div>
      {project.status === 'beta' && (
        <span className="inline-block mt-4 px-3 py-1 text-xs font-semibold bg-yellow-200 text-yellow-800 rounded">
          Beta
        </span>
      )}
    </Link>
  );
}
```

**Key points**:
- Strongly typed props with `ProjectCardProps` interface
- Next.js `Link` for client-side navigation
- Accessibility: `aria-label` describes link purpose
- Tailwind classes for styling, including dark mode variants
- Conditional rendering for status badge

---

#### Next.js API Route for Feedback Form

```typescript
// app/api/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email'; // Hypothetical email utility
import { checkRateLimit } from '@/lib/rateLimit'; // Hypothetical rate limiter

// Define and validate input schema
const feedbackSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  interestedInCollaboration: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const data = feedbackSchema.parse(body);

    // Send email (environment variables loaded securely)
    await sendEmail({
      to: process.env.FEEDBACK_EMAIL!,
      subject: `Feedback from ${data.name}`,
      text: `Name: ${data.name}\nEmail: ${data.email}\n\nMessage:\n${data.message}\n\nInterested in collaboration: ${data.interestedInCollaboration ? 'Yes' : 'No'}`,
    });

    // Success response
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    // Log server errors (do not expose details to client)
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
```

**Key points**:
- Use `zod` for runtime validation of input
- Rate limiting to prevent abuse (check by IP address)
- Environment variables (e.g., `process.env.FEEDBACK_EMAIL`) for sensitive config
- Proper HTTP status codes (200, 400, 429, 500)
- No secrets or sensitive error details exposed to client
- Server-side error logging for debugging

---

### 2. 3D / Animation Examples

#### Simple 3D Parallax Effect with react-three-fiber

```typescript
// components/Hero3DSection.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { useScroll, useTransform, motion } from 'framer-motion';
import { useRef } from 'react';

function ParallaxLayer({ imageSrc, depth }: { imageSrc: string; depth: number }) {
  // Create a plane with texture
  return (
    <mesh position={[0, 0, depth]}>
      <planeGeometry args={[10, 6]} />
      <meshBasicMaterial map={/* load texture */} transparent />
    </mesh>
  );
}

export default function Hero3DSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Map scroll progress to camera Z position
  const cameraZ = useTransform(scrollYProgress, [0, 1], [5, 15]);

  return (
    <div ref={containerRef} className="h-[200vh] relative">
      <div className="sticky top-0 h-screen">
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <ambientLight intensity={0.5} />
          <ParallaxLayer imageSrc="/images/hero-background.png" depth={-5} />
          <ParallaxLayer imageSrc="/images/hero-midground.png" depth={-2} />
          <ParallaxLayer imageSrc="/images/hero-foreground.png" depth={0} />
          {/* Camera movement based on scroll */}
          <motion.perspectiveCamera position-z={cameraZ} />
        </Canvas>
      </div>
    </div>
  );
}
```

**Key points**:
- Use `useScroll` from Framer Motion to track scroll progress
- Map scroll to 3D transformations with `useTransform`
- Keep geometries simple (planes) for performance
- Sticky positioning for canvas while scroll container is taller
- Ensure textures are optimized (compressed, appropriate resolution)

---

#### Performance and Accessibility Best Practices for Animations

```typescript
// lib/useReducedMotion.ts
import { useEffect, useState } from 'react';

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return prefersReducedMotion;
}
```

**Usage in component**:

```typescript
'use client';

import { useReducedMotion } from '@/lib/useReducedMotion';

export default function AnimatedSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
    >
      {/* Content */}
    </motion.div>
  );
}
```

**Key points**:
- Respect `prefers-reduced-motion` media query
- Disable or minimize animations for users with motion sensitivity
- Avoid autoplay of videos or heavy animations
- Test animations on lower-end devices

---

### 3. Rust CLI (LLM-Supported) Examples

#### Safe Error Handling in Rust

```rust
// src/main.rs
use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use std::env;

#[derive(Parser)]
#[command(name = "lumina")]
#[command(about = "LLM-powered CLI assistant", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Review a source code file
    Review { file: String },
    /// Generate documentation
    Docs { file: String },
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Review { file } => review_file(&file).await?,
        Commands::Docs { file } => generate_docs(&file).await?,
    }

    Ok(())
}

async fn review_file(file_path: &str) -> Result<()> {
    // Read file content
    let content = std::fs::read_to_string(file_path)
        .context(format!("Failed to read file: {}", file_path))?;

    // Get API key from environment
    let api_key = env::var("LUMINA_API_KEY")
        .context("LUMINA_API_KEY environment variable not set")?;

    // Call LLM API (with timeout and retry logic)
    let response = call_llm_api(&content, &api_key)
        .await
        .context("Failed to call LLM API")?;

    println!("Review:\n{}", response);
    Ok(())
}

async fn call_llm_api(content: &str, api_key: &str) -> Result<String> {
    use reqwest::Client;
    use std::time::Duration;

    let client = Client::builder()
        .timeout(Duration::from_secs(30))
        .build()?;

    let res = client
        .post("https://api.example.com/review")
        .bearer_auth(api_key)
        .json(&serde_json::json!({ "code": content }))
        .send()
        .await
        .context("HTTP request failed")?;

    if !res.status().is_success() {
        anyhow::bail!("API returned error status: {}", res.status());
    }

    let body: serde_json::Value = res.json().await?;
    let result = body["result"]
        .as_str()
        .context("Invalid API response format")?;

    Ok(result.to_string())
}

async fn generate_docs(file_path: &str) -> Result<()> {
    // Similar implementation
    todo!()
}
```

**Key points**:
- Use `anyhow::Result` for ergonomic error handling with context
- Load API keys from environment variables, never hardcode
- Use `clap` for clean, type-safe CLI argument parsing
- Set HTTP timeouts to avoid hanging indefinitely
- Provide clear error messages using `.context()`
- Return errors to caller rather than panicking

---

### 4. Webshop Project Examples

#### Safe License Key Generation and Validation

**Backend (Next.js API Route)**:

```typescript
// app/api/licenses/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db'; // Hypothetical database connection

export async function POST(request: NextRequest) {
  try {
    // Authenticate user (e.g., check session token)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !isValidAuth(authHeader)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate a secure license key
    const licenseKey = generateLicenseKey();

    // Store in database (hash or encrypt if needed)
    await db.licenses.create({
      key: licenseKey,
      userId: getUserIdFromAuth(authHeader),
      createdAt: new Date(),
      expiresAt: getExpiryDate(), // e.g., 1 year from now
    });

    // Return license key to user
    return NextResponse.json({ licenseKey }, { status: 201 });
  } catch (error) {
    console.error('License generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateLicenseKey(): string {
  // Generate a cryptographically secure random key
  const buffer = crypto.randomBytes(16);
  return buffer.toString('hex').toUpperCase();
}

function isValidAuth(authHeader: string): boolean {
  // Implement authentication logic (JWT, session token, etc.)
  return true; // Placeholder
}

function getUserIdFromAuth(authHeader: string): string {
  // Extract user ID from auth token
  return 'user-123'; // Placeholder
}

function getExpiryDate(): Date {
  const now = new Date();
  now.setFullYear(now.getFullYear() + 1);
  return now;
}
```

**Key points**:
- Generate license keys using cryptographically secure random methods (`crypto.randomBytes`)
- Store keys securely in database (consider hashing if keys are sensitive)
- Authenticate users before generating licenses
- Use environment variables for database credentials and secrets
- Return appropriate HTTP status codes
- Never expose database queries or internal errors to the client

---

#### Frontend Environment Variables in Next.js

```typescript
// lib/config.ts
// Only variables prefixed with NEXT_PUBLIC_ are exposed to the browser
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  stripePublicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '',
};

// Server-side only (not prefixed with NEXT_PUBLIC_)
export const serverConfig = {
  databaseUrl: process.env.DATABASE_URL || '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  emailApiKey: process.env.EMAIL_API_KEY || '',
};
```

**Usage**:

```typescript
// In client component
import { config } from '@/lib/config';
console.log(config.apiUrl); // Safe to use in browser

// In API route or server component
import { serverConfig } from '@/lib/config';
console.log(serverConfig.databaseUrl); // Only available server-side
```

**Key points**:
- Use `NEXT_PUBLIC_` prefix for environment variables that should be accessible in the browser
- Keep secrets (API keys, database URLs) without the prefix (server-only)
- Store environment variables in `.env.local` (never commit to Git)
- Use a `.env.example` file to document required variables

---

### 5. Security, Performance & Accessibility

#### Security Checklist

- [ ] **No hardcoded secrets**: Use environment variables for all API keys, database credentials, etc.
- [ ] **Input validation**: Validate and sanitize all user input (forms, URL parameters)
- [ ] **Output encoding**: Prevent XSS by escaping user-generated content
- [ ] **HTTPS only**: Enforce HTTPS in production (automatic on Vercel)
- [ ] **Secure headers**: Set headers like `Content-Security-Policy`, `X-Frame-Options`
- [ ] **Rate limiting**: Prevent abuse of API endpoints (especially contact forms)
- [ ] **Authentication**: Use secure, modern auth methods (JWT, OAuth, or session cookies with httpOnly flag)
- [ ] **SQL injection**: Use parameterized queries or ORMs (Prisma, Drizzle)
- [ ] **Dependency updates**: Regularly update dependencies to patch vulnerabilities
- [ ] **Error handling**: Don't expose stack traces or internal errors to users

---

#### Performance Checklist

- [ ] **Image optimization**: Use `next/image` with appropriate sizes and formats (WebP)
- [ ] **Lazy loading**: Load images and heavy components only when needed
- [ ] **Code splitting**: Let Next.js automatically split routes; use dynamic imports for large components
- [ ] **Minimize JavaScript**: Remove unused dependencies; tree-shake where possible
- [ ] **Server components**: Use server components by default in Next.js App Router
- [ ] **Caching**: Use HTTP caching headers and Next.js static generation where appropriate
- [ ] **CDN**: Deploy static assets to a CDN (automatic on Vercel)
- [ ] **3D optimization**: Keep meshes simple, use compressed textures, limit particle counts
- [ ] **Bundle analysis**: Use `@next/bundle-analyzer` to identify large dependencies

---

#### Accessibility Checklist

- [ ] **Semantic HTML**: Use `<header>`, `<nav>`, `<main>`, `<footer>`, `<article>`, etc.
- [ ] **Keyboard navigation**: Ensure all interactive elements are reachable via Tab, Enter, Space
- [ ] **Focus indicators**: Visible focus outlines (don't remove with `outline: none` unless providing alternative)
- [ ] **ARIA attributes**: Use `aria-label`, `aria-describedby`, `role` where needed
- [ ] **Alt text**: All images have descriptive `alt` attributes
- [ ] **Color contrast**: Text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- [ ] **Screen reader testing**: Test with NVDA, JAWS, or VoiceOver
- [ ] **Reduced motion**: Respect `prefers-reduced-motion` media query
- [ ] **Forms**: Label all inputs, provide error messages, use appropriate input types
- [ ] **Headings**: Use heading hierarchy correctly (h1, h2, h3...)

---

## Testing & Quality

### Unit and Component Testing

#### Recommended Tools
- **Jest**: JavaScript testing framework
- **React Testing Library**: Test React components from a user perspective
- **@testing-library/jest-dom**: Custom matchers for DOM assertions

#### Setup

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

Configure `jest.config.js`:

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

module.exports = createJestConfig(customJestConfig);
```

Create `jest.setup.js`:

```javascript
import '@testing-library/jest-dom';
```

---

#### Example Test: FeedbackForm Component

```typescript
// components/__tests__/FeedbackForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeedbackForm from '../FeedbackForm';

// Mock fetch
global.fetch = jest.fn();

describe('FeedbackForm', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders form fields', () => {
    render(<FeedbackForm />);
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<FeedbackForm />);

    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.type(screen.getByLabelText(/message/i), 'This is a test message.');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  it('submits form successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const user = userEvent.setup();
    render(<FeedbackForm />);

    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/message/i), 'This is a test message.');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/feedback', expect.any(Object));
    });

    expect(await screen.findByText(/thank you/i)).toBeInTheDocument();
  });

  it('shows error message on submission failure', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const user = userEvent.setup();
    render(<FeedbackForm />);

    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/message/i), 'This is a test message.');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/error/i)).toBeInTheDocument();
  });
});
```

**Key points**:
- Test user interactions (typing, clicking) with `@testing-library/user-event`
- Use `getByLabelText`, `getByRole` for accessible queries
- Mock external dependencies (fetch, API calls)
- Test both success and error states

---

#### What to Test

Focus on:
- **Critical UI components**: Forms, modals, navigation
- **User interactions**: Click handlers, form submissions, keyboard navigation
- **Conditional rendering**: Components that show/hide based on state
- **Data transformation**: Utility functions, formatting helpers
- **Validation logic**: Form validation, input sanitization

Skip:
- Third-party library internals
- Trivial components with no logic
- Implementation details (internal state names, CSS classes)

---

### Integration and End-to-End Testing

#### Recommended Tools
- **Playwright** or **Cypress**: Modern E2E testing frameworks with excellent developer experience

#### Setup (Playwright)

```bash
npm install --save-dev @playwright/test
npx playwright install
```

Configure `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

#### Example E2E Test: User Flow for Viewing Project

```typescript
// e2e/project-detail.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Project Detail Page', () => {
  test('user can navigate to project and view details', async ({ page }) => {
    // Start at home page
    await page.goto('/');

    // Navigate to projects page
    await page.click('text=Projects');
    await expect(page).toHaveURL('/projects');

    // Click on first project card
    await page.click('text=Lumina CLI');
    await expect(page).toHaveURL(/\/projects\/lumina-cli/);

    // Verify project details are displayed
    await expect(page.locator('h1')).toContainText('Lumina CLI');
    await expect(page.locator('text=LLM-powered')).toBeVisible();

    // Verify tech stack is shown
    await expect(page.locator('text=Rust')).toBeVisible();
  });

  test('404 page shown for non-existent project', async ({ page }) => {
    await page.goto('/projects/non-existent-slug');
    await expect(page.locator('text=404')).toBeVisible();
  });
});
```

---

#### Critical User Flows to Test

1. **Landing page load and scroll**:
   - Hero animation loads and plays smoothly
   - Scroll down reveals content sections
   - Navigation remains accessible

2. **Gallery interaction**:
   - Click on image opens detail modal
   - Modal displays correct image and metadata
   - Close modal returns to gallery

3. **Project navigation**:
   - Navigate from projects list to project detail
   - Verify correct project content loads
   - Back button returns to list

4. **Feedback form submission**:
   - Fill out form with valid data
   - Submit and verify success message
   - Submit with invalid data and verify error messages

5. **Accessibility navigation**:
   - Navigate entire site using only keyboard (Tab, Enter, Escape)
   - Verify focus indicators are visible
   - Test with screen reader (basic checks)

---

### Accessibility Testing

#### Automated Tools
- **axe DevTools** (browser extension): Scan pages for common accessibility issues
- **Lighthouse** (Chrome DevTools): Includes accessibility audit
- **eslint-plugin-jsx-a11y**: Catch accessibility issues during development

#### Manual Testing
- **Keyboard navigation**: Navigate with Tab, Shift+Tab, Enter, Space, Escape, Arrow keys
- **Screen reader**: Test with NVDA (Windows), JAWS (Windows), or VoiceOver (Mac/iOS)
- **Zoom**: Test at 200% zoom (requirement for WCAG)
- **Color blindness**: Use tools like Stark or Color Oracle to simulate color blindness

#### Accessibility Test Checklist

- [ ] All images have descriptive alt text
- [ ] Form inputs have associated labels
- [ ] Headings are in logical order (no skipped levels)
- [ ] Focus is visible on all interactive elements
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] No keyboard traps (user can navigate away from any element)
- [ ] Skip link allows jumping to main content
- [ ] ARIA attributes used correctly (not overused)
- [ ] Status messages announced to screen readers (use `role="status"` or `aria-live`)
- [ ] Animations respect `prefers-reduced-motion`

---

### Performance Checks

#### Tools
- **Lighthouse** (Chrome DevTools): Comprehensive performance audit
- **WebPageTest**: Detailed loading analysis
- **Next.js Bundle Analyzer**: Visualize JavaScript bundle size

#### Performance Targets

- **Lighthouse Performance Score**: >85
- **First Contentful Paint (FCP)**: <1.8s
- **Largest Contentful Paint (LCP)**: <2.5s
- **Cumulative Layout Shift (CLS)**: <0.1
- **Time to Interactive (TTI)**: <3.8s
- **Total Bundle Size**: <300 KB (JavaScript, gzipped)

#### Performance Optimization Strategies

1. **Image optimization**:
   - Use `next/image` for automatic optimization
   - Serve WebP or AVIF formats
   - Use responsive image sizes (`sizes` prop)
   - Lazy load images below the fold

2. **JavaScript optimization**:
   - Use server components by default (Next.js App Router)
   - Dynamic imports for large client components
   - Remove unused dependencies
   - Enable tree-shaking

3. **3D/animation optimization**:
   - Simplify geometries (low-poly models)
   - Compress textures
   - Limit particle counts and effects
   - Use `requestAnimationFrame` throttling
   - Disable animations on low-end devices

4. **Font optimization**:
   - Use `next/font` for automatic font optimization
   - Subset fonts to include only needed characters
   - Use font-display: swap or optional

5. **Caching**:
   - Leverage Next.js automatic static optimization
   - Use `Cache-Control` headers for static assets
   - Consider ISR (Incremental Static Regeneration) for semi-static content

---

## Content Modeling and Extensibility

### Data Modeling

All content is stored as TypeScript modules in the `data/` directory. This approach provides:
- Type safety
- Easy version control
- No database or CMS overhead
- Simple editing workflow for developers

---

### Landscape Images Data Model

#### Interface Definition

```typescript
// data/types.ts
export interface LandscapeImage {
  id: string; // Unique identifier
  src: string; // Path to image file (e.g., '/images/landscapes/filename.jpg')
  thumbnail?: string; // Optional path to optimized thumbnail
  alt: string; // Accessibility description (for screen readers)
  title: string; // Display title
  location: string; // Where the photo was taken
  story: string; // Narrative description, context, personal reflection
  technicalDetails: {
    camera?: string;
    lens?: string;
    aperture?: string;
    shutterSpeed?: string;
    iso?: number;
    captureDate?: string; // ISO 8601 format (YYYY-MM-DD)
  };
  tags: string[]; // e.g., ['mountains', 'sunrise', 'long-exposure']
}
```

#### Data File

```typescript
// data/landscapes.ts
import { LandscapeImage } from './types';

export const landscapes: LandscapeImage[] = [
  {
    id: 'norwegian-fjord-dawn',
    src: '/images/landscapes/norwegian-fjord-dawn.jpg',
    alt: 'Misty Norwegian fjord at sunrise with mirror-like reflections of surrounding mountains',
    title: 'Dawn at Geirangerfjord',
    location: 'Geirangerfjord, Norway',
    story: `Woke up at 4 AM to catch the first light over this iconic fjord. The mist was thick, but as the sun began to rise, it slowly lifted to reveal this breathtaking scene. The complete stillness of the water created perfect reflections. One of the most serene moments I've experienced.`,
    technicalDetails: {
      camera: 'Sony A7R IV',
      lens: 'Sony FE 24-70mm f/2.8 GM',
      aperture: 'f/8',
      shutterSpeed: '1/60s',
      iso: 100,
      captureDate: '2024-06-15',
    },
    tags: ['mountains', 'sunrise', 'water', 'norway', 'fjord'],
  },
  {
    id: 'icelandic-waterfall',
    src: '/images/landscapes/icelandic-waterfall.jpg',
    alt: 'Powerful waterfall in Iceland surrounded by moss-covered volcanic rocks',
    title: 'Skógafoss in Winter',
    location: 'Skógafoss, Iceland',
    story: `Iceland's power and beauty on full display. The sheer force of Skógafoss is humbling. I used a long exposure to smooth the water while keeping the surrounding landscape sharp.`,
    technicalDetails: {
      camera: 'Canon EOS R5',
      lens: 'Canon RF 15-35mm f/2.8L',
      aperture: 'f/11',
      shutterSpeed: '2s',
      iso: 50,
      captureDate: '2024-01-22',
    },
    tags: ['waterfall', 'iceland', 'long-exposure', 'winter'],
  },
  // Add more images here
];
```

---

### Projects Data Model

#### Interface Definition

```typescript
// data/types.ts
export interface Project {
  slug: string; // URL-friendly identifier (e.g., 'lumina-cli')
  name: string; // Display name
  tagline: string; // Short one-liner
  shortDescription: string; // 1-2 sentences for cards/previews
  longDescription: string; // Full description (plain text or Markdown)
  techStack: string[]; // Technologies used
  links: {
    github?: string;
    demo?: string;
    docs?: string;
  };
  status: 'active' | 'beta' | 'complete' | 'archived';
  featured: boolean; // Pin to top of projects list
  thumbnailImage?: string; // Optional project screenshot/logo
  roadmapItems?: string[]; // IDs of related RoadmapItems
}
```

#### Data File

```typescript
// data/projects.ts
import { Project } from './types';

export const projects: Project[] = [
  {
    slug: 'lumina-cli',
    name: 'Lumina CLI',
    tagline: 'LLM-powered command-line assistant for developers',
    shortDescription: 'A Rust-based CLI tool that brings large language model capabilities directly to your terminal for code review, documentation, and more.',
    longDescription: `
# Lumina CLI

Lumina CLI is a command-line interface tool designed to integrate cutting-edge large language models into your development workflow. Built with Rust for performance and reliability, it provides seamless access to AI-powered code review, documentation generation, and intelligent assistance.

## Features

- **Interactive Mode**: Conversational interface for iterative problem-solving
- **Batch Processing**: Analyze multiple files or directories at once
- **Safe Error Handling**: Clear error messages and graceful degradation
- **Privacy-First**: All API keys stored locally; opt-in telemetry
- **Fast**: Rust performance with async I/O

## Example Usage

\`\`\`bash
# Review a source file
lumina review src/main.rs

# Generate documentation
lumina docs --output README.md

# Interactive mode
lumina chat
\`\`\`

## Installation

\`\`\`bash
cargo install lumina-cli
\`\`\`

## Configuration

Set your API key:
\`\`\`bash
export LUMINA_API_KEY=your_key_here
\`\`\`

## Roadmap

See the [Roadmap](/roadmap) for upcoming features.
    `,
    techStack: ['Rust', 'Tokio', 'Clap', 'Reqwest', 'Serde'],
    links: {
      github: 'https://github.com/username/lumina-cli',
      docs: 'https://docs.lumina-cli.dev',
    },
    status: 'beta',
    featured: true,
    thumbnailImage: '/images/projects/lumina-cli-screenshot.png',
    roadmapItems: ['cli-plugin-system', 'cli-autocomplete'],
  },
  {
    slug: 'lumina-licensing',
    name: 'Lumina Licensing',
    tagline: 'Secure license management and webshop',
    shortDescription: 'A Next.js web application for purchasing, managing, and validating licenses for Lumina CLI.',
    longDescription: `
# Lumina Licensing Platform

A modern web application built with Next.js, TypeScript, and Tailwind CSS for managing software licenses. Users can browse pricing tiers, purchase licenses securely via Stripe, and manage their active licenses through a user-friendly dashboard.

## Architecture

- **Frontend**: React components with Tailwind styling, responsive design
- **Backend**: Next.js API routes for payment processing and license generation
- **Database**: PostgreSQL with Prisma ORM
- **Payment Processing**: Stripe integration with webhook handling
- **Security**: License keys generated server-side using cryptographic randomness, validated via API

## Key Features

- Tiered pricing (Individual, Team, Enterprise)
- Secure checkout flow with Stripe
- License key generation and email delivery
- User dashboard for managing active licenses
- API for license validation (used by Lumina CLI)
- Rate limiting and abuse prevention

## Tech Stack

- TypeScript
- React 18
- Next.js 14 (App Router)
- Tailwind CSS
- PostgreSQL
- Prisma
- Stripe API

## Deployment

Deployed on Vercel with automatic CI/CD from GitHub.
    `,
    techStack: ['TypeScript', 'React', 'Next.js', 'Tailwind CSS', 'PostgreSQL', 'Prisma', 'Stripe'],
    links: {
      demo: 'https://lumina-licenses.example.com',
      github: 'https://github.com/username/lumina-licensing',
    },
    status: 'active',
    featured: true,
    thumbnailImage: '/images/projects/lumina-licensing-screenshot.png',
    roadmapItems: ['webshop-team-management', 'webshop-analytics'],
  },
  // Add more projects here
];
```

---

### Roadmap Data Model

#### Interface Definition

```typescript
// data/types.ts
export interface RoadmapItem {
  id: string; // Unique identifier
  title: string; // Short title
  description: string; // Detailed explanation
  area: 'portfolio' | 'cli' | 'webshop' | 'other'; // Categorization
  status: 'planned' | 'in-progress' | 'completed';
  targetRelease?: string; // e.g., 'Q2 2025', 'v2.0', or null
  priority?: 'low' | 'medium' | 'high';
}
```

#### Data File

```typescript
// data/roadmap.ts
import { RoadmapItem } from './types';

export const roadmapItems: RoadmapItem[] = [
  {
    id: 'portfolio-blog',
    title: 'Add Blog Section',
    description: 'Create a blog for sharing photography stories, development insights, and tutorials. Support Markdown or MDX for rich content.',
    area: 'portfolio',
    status: 'planned',
    targetRelease: 'Q2 2025',
    priority: 'medium',
  },
  {
    id: 'portfolio-dark-mode',
    title: 'Dark Mode Toggle',
    description: 'Implement a dark/light mode toggle with user preference persistence.',
    area: 'portfolio',
    status: 'in-progress',
    targetRelease: 'Q1 2025',
    priority: 'high',
  },
  {
    id: 'cli-plugin-system',
    title: 'Plugin Architecture',
    description: 'Allow users to extend Lumina CLI with custom plugins written in Rust or WASM. Define a stable plugin API.',
    area: 'cli',
    status: 'in-progress',
    targetRelease: 'v2.0',
    priority: 'high',
  },
  {
    id: 'cli-autocomplete',
    title: 'Shell Autocomplete',
    description: 'Generate shell completion scripts for Bash, Zsh, Fish, and PowerShell.',
    area: 'cli',
    status: 'planned',
    targetRelease: 'v1.5',
    priority: 'medium',
  },
  {
    id: 'webshop-team-management',
    title: 'Team License Management',
    description: 'Enable team administrators to manage multiple user seats under a single license.',
    area: 'webshop',
    status: 'planned',
    targetRelease: 'Q3 2025',
    priority: 'high',
  },
  {
    id: 'webshop-analytics',
    title: 'Usage Analytics Dashboard',
    description: 'Provide users with insights into their CLI usage patterns (opt-in).',
    area: 'webshop',
    status: 'planned',
    priority: 'low',
  },
  // Add more items here
];
```

---

### Adding or Updating Content

#### Step-by-Step: Add a New Landscape Image

1. **Prepare the image file**:
   - Optimize the image (compress without significant quality loss)
   - Recommended format: JPEG or WebP
   - Place in `public/images/landscapes/` with a descriptive filename (e.g., `yosemite-el-capitan.jpg`)

2. **Open `data/landscapes.ts`**

3. **Add a new entry to the `landscapes` array**:

   ```typescript
   {
     id: 'yosemite-el-capitan',
     src: '/images/landscapes/yosemite-el-capitan.jpg',
     alt: 'El Capitan rock formation in Yosemite National Park at sunset',
     title: 'El Capitan at Sunset',
     location: 'Yosemite National Park, California',
     story: 'Captured this iconic granite monolith during golden hour...',
     technicalDetails: {
       camera: 'Nikon Z7 II',
       lens: 'Nikkor Z 70-200mm f/2.8',
       aperture: 'f/5.6',
       shutterSpeed: '1/250s',
       iso: 400,
       captureDate: '2024-09-10',
     },
     tags: ['mountains', 'sunset', 'yosemite', 'granite'],
   },
   ```

4. **Save the file**

5. **Test locally**: Run `npm run dev` and navigate to `/photos` to verify the new image appears

6. **Commit and deploy**:
   ```bash
   git add public/images/landscapes/yosemite-el-capitan.jpg data/landscapes.ts
   git commit -m "Add Yosemite El Capitan landscape image"
   git push
   ```

---

#### Step-by-Step: Add a New Project

1. **Open `data/projects.ts`**

2. **Add a new entry to the `projects` array**:

   ```typescript
   {
     slug: 'my-new-project',
     name: 'My New Project',
     tagline: 'A brief tagline describing the project',
     shortDescription: 'One or two sentences for preview cards.',
     longDescription: `
   # My New Project

   Full description goes here. Use Markdown for formatting.

   ## Features
   - Feature 1
   - Feature 2

   ## Installation
   \`\`\`bash
   npm install my-new-project
   \`\`\`
     `,
     techStack: ['TypeScript', 'Node.js'],
     links: {
       github: 'https://github.com/username/my-new-project',
     },
     status: 'active',
     featured: false,
   },
   ```

3. **Save the file**

4. **Test locally**: Navigate to `/projects` and verify the new project card appears. Click to navigate to `/projects/my-new-project` and verify content renders correctly.

5. **Commit and deploy**:
   ```bash
   git add data/projects.ts
   git commit -m "Add My New Project to portfolio"
   git push
   ```

---

#### Step-by-Step: Update Roadmap

1. **Open `data/roadmap.ts`**

2. **Modify an existing item or add a new one**:

   - To update status:
     ```typescript
     {
       id: 'portfolio-dark-mode',
       title: 'Dark Mode Toggle',
       description: '...',
       area: 'portfolio',
       status: 'completed', // Changed from 'in-progress'
       targetRelease: 'Q1 2025',
       priority: 'high',
     },
     ```

   - To add a new item:
     ```typescript
     {
       id: 'portfolio-contact-improvements',
       title: 'Improve Contact Form UX',
       description: 'Add real-time validation and better error messages.',
       area: 'portfolio',
       status: 'planned',
       targetRelease: 'Q2 2025',
       priority: 'medium',
     },
     ```

3. **Save the file**

4. **Test locally**: Navigate to `/roadmap` and verify changes

5. **Commit and deploy**

---

### Content Editing Best Practices

- **Consistency**: Use consistent formatting, naming conventions, and language style across all data files
- **Validation**: Ensure all required fields are provided; leverage TypeScript for type checking
- **Images**: Always include descriptive `alt` text for accessibility
- **Markdown**: Use proper Markdown syntax in `longDescription` fields; consider using MDX for richer content (e.g., embedded components)
- **Version control**: Commit logical changes with clear commit messages
- **Testing**: Always test changes locally before deploying

---

## Definition of Done

The portfolio website is considered **complete and ready for deployment** when all of the following criteria are satisfied:

### Functional Completeness

- [ ] All specified pages exist and are accessible:
  - [ ] Landing page with hero scroll/3D animation
  - [ ] `/photos` with landscape gallery
  - [ ] `/projects` with project listings
  - [ ] `/projects/:slug` with individual project details
  - [ ] `/roadmap` with roadmap timeline
  - [ ] `/contact` with feedback form
- [ ] Navigation header and footer are present on all pages and work correctly
- [ ] All internal links navigate correctly (no 404s for expected routes)

### Content

- [ ] At least **3 landscape images** with complete metadata in `data/landscapes.ts`
- [ ] At least **2 projects** (Rust CLI tool and webshop) with full descriptions in `data/projects.ts`
- [ ] At least **5 roadmap items** across multiple areas in `data/roadmap.ts`
- [ ] All images have descriptive `alt` text
- [ ] Content is free of placeholder text (e.g., "Lorem ipsum")

### Hero and Animations

- [ ] Hero 3D scroll animation is implemented and functions smoothly
- [ ] Hero layers are visually distinct and create a parallax effect
- [ ] Text overlays appear and animate based on scroll position
- [ ] `prefers-reduced-motion` is respected: animations disabled or minimized for sensitive users
- [ ] No visible jank or frame drops on mid-range devices

### Gallery

- [ ] Gallery displays all images in a responsive grid
- [ ] Images load with lazy loading (`next/image` or Intersection Observer)
- [ ] Clicking an image opens a detail modal with full metadata
- [ ] Modal can be closed via close button, backdrop click, or Escape key
- [ ] Hover states are visible and smooth

### Projects

- [ ] Project cards display correctly on `/projects` page
- [ ] Clicking a card navigates to `/projects/:slug`
- [ ] Project detail pages render all content (name, description, tech stack, links)
- [ ] Non-existent project slugs show a 404 or "Not Found" page
- [ ] Tech stack badges or icons are displayed

### Roadmap

- [ ] Roadmap items are displayed in a clear, scannable layout
- [ ] Status is visually indicated (color coding or badges)
- [ ] Items can be filtered by area or status (optional but recommended)

### Feedback Form

- [ ] Form is rendered and visually styled
- [ ] Client-side validation works:
  - [ ] Required fields show errors when empty
  - [ ] Email validation detects invalid formats
  - [ ] Message length is enforced
- [ ] Form submits to `/api/feedback` API route
- [ ] Server-side validation is implemented with `zod` or similar
- [ ] Success message is displayed on successful submission
- [ ] Error message is displayed on failure (server error or validation failure)
- [ ] Rate limiting is active (e.g., max 5 submissions per hour per IP)
- [ ] Email is sent successfully (or logged in development mode)

### Testing

- [ ] Unit tests are written for key components:
  - [ ] `FeedbackForm` (validation, submission)
  - [ ] `ProjectCard`
  - [ ] `ImageDetailModal`
- [ ] All unit tests pass (`npm run test`)
- [ ] At least 3 E2E tests cover critical user flows:
  - [ ] Landing page loads and scroll works
  - [ ] Gallery interaction (click image, view modal)
  - [ ] Project navigation (list to detail page)
  - [ ] Feedback form submission (valid and invalid data)
- [ ] All E2E tests pass (`npx playwright test`)

### Accessibility

- [ ] Lighthouse Accessibility score: **≥90**
- [ ] All images have `alt` attributes
- [ ] Form inputs have associated `<label>` elements
- [ ] Keyboard navigation works throughout the site (Tab, Enter, Escape)
- [ ] Focus indicators are visible on all interactive elements
- [ ] Headings follow logical hierarchy (h1, h2, h3, etc.)
- [ ] Color contrast meets WCAG AA standards (4.5:1 for text)
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Manual screen reader test completed (at least one page checked)

### Performance

- [ ] Lighthouse Performance score: **≥85**
- [ ] First Contentful Paint (FCP): **<1.8s**
- [ ] Largest Contentful Paint (LCP): **<2.5s**
- [ ] Cumulative Layout Shift (CLS): **<0.1**
- [ ] Images are optimized (WebP or JPEG, appropriate sizes)
- [ ] JavaScript bundle size is reasonable (<300 KB gzipped)
- [ ] No unnecessary re-renders or memory leaks in 3D scenes

### Code Quality

- [ ] ESLint passes with no errors (`npm run lint`)
- [ ] Prettier formatting is consistent (`npm run format`)
- [ ] No TypeScript errors (`npm run type-check` or build succeeds)
- [ ] Code follows Next.js and React best practices:
  - [ ] Server components used by default
  - [ ] Client components only where necessary
  - [ ] `next/image` used for all images
  - [ ] Environment variables used for sensitive config
- [ ] No hardcoded secrets (API keys, passwords) in code
- [ ] `.env.example` file documents required environment variables

### Security

- [ ] Input validation on all API routes
- [ ] No secrets exposed to the client (only `NEXT_PUBLIC_*` variables in frontend code)
- [ ] Rate limiting active on feedback form API route
- [ ] Content Security Policy headers configured (recommended)
- [ ] HTTPS enforced in production (automatic on Vercel)

### Documentation

- [ ] `README.md` includes:
  - [ ] Project description
  - [ ] Setup instructions (`npm install`, environment variables)
  - [ ] Development commands (`npm run dev`, `npm run build`, `npm run test`)
  - [ ] Deployment instructions
- [ ] `.env.example` lists all required environment variables with example values
- [ ] Code comments explain complex or non-obvious logic (especially 3D/animation code)

### Content Management

- [ ] No CMS or admin dashboard is present
- [ ] Content is managed via TypeScript files in `data/`
- [ ] Instructions for adding/updating content are documented (in README or this AGENT.md)

### Deployment

- [ ] Site builds successfully for production (`npm run build`)
- [ ] Site is deployed to Vercel or similar platform
- [ ] Production URL is accessible and all features work
- [ ] Environment variables are configured in deployment platform
- [ ] No errors in production console or server logs

---

When all of the above criteria are met, the portfolio website is **complete, production-ready, and maintainable**. Future updates can be made by editing data files and committing changes to version control.

