// Data types for the portfolio application

export interface LandscapeImage {
  id: string; // Unique identifier
  src: string; // Path to image file
  thumbnail?: string; // Optional optimized thumbnail
  alt: string; // Accessibility description
  title: string; // Display title
  location: string; // Where the photo was taken
  story: string; // Narrative description
  technicalDetails: {
    camera?: string;
    lens?: string;
    aperture?: string;
    shutterSpeed?: string;
    iso?: number;
    captureDate?: string; // ISO 8601 format (YYYY-MM-DD)
  };
  tags: string[]; // e.g., ['mountains', 'sunrise', 'long-exposure']
  annotations?: ImageAnnotation[]; // Optional interactive hotspots
}

export interface Project {
  slug: string; // URL-friendly identifier
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
  version?: string; // Current version
  features?: string[]; // Key features list
  highlights?: Record<string, any>; // Performance metrics, stats, etc.
  demoCommands?: DemoCommand[]; // For CLI tools - example commands
}

export interface DemoCommand {
  input: string; // Natural language input
  output: string; // Generated command
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  warning?: string; // Optional warning message
  explanation?: string; // Optional explanation
}

export interface RoadmapItem {
  id: string; // Unique identifier
  title: string; // Short title
  description: string; // Detailed explanation
  area: 'portfolio' | 'cli' | 'webshop' | 'other'; // Categorization
  status: 'planned' | 'in-progress' | 'completed';
  targetRelease?: string; // e.g., 'Q2 2025', 'v2.0'
  priority?: 'low' | 'medium' | 'high';
}

export interface ImageAnnotation {
  id: string; // Unique identifier
  title: string; // Feature name
  description: string; // Detailed information
  position: { x: number; y: number }; // Percentage-based positioning (0-100)
  icon: 'mountain' | 'water' | 'glacier' | 'trail' | 'lake' | 'peak'; // Icon type
  details?: {
    elevation?: string; // e.g., "4,478m"
    temperature?: string; // e.g., "2-4°C"
    distance?: string; // e.g., "5.2 km"
    facts?: string[]; // Additional interesting facts
  };
}

