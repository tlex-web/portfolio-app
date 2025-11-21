# Deployment Guide - Vercel

This guide will help you deploy your portfolio app to Vercel.

## Prerequisites

- A [Vercel account](https://vercel.com/signup) (free tier works great)
- Your GitHub repository pushed to GitHub
- Node.js 20+ installed locally (for testing)

## Quick Deploy

The fastest way to deploy is using Vercel's GitHub integration:

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js and configure everything

3. **Configure Project (if needed)**
   - Framework Preset: `Next.js` (auto-detected)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)
   - Node Version: `20.x` (recommended)

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for the build
   - Your site will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

   For production deployment:
   ```bash
   vercel --prod
   ```

## Environment Variables (Optional)

If you want to add email integration or analytics:

1. Go to your project settings on Vercel
2. Navigate to "Settings" → "Environment Variables"
3. Add your variables:
   - `RESEND_API_KEY` - If using Resend for email
   - `SENDGRID_API_KEY` - If using SendGrid for email
   - `FEEDBACK_EMAIL` - Email to receive contact form submissions
   - `NEXT_PUBLIC_GA_ID` - Google Analytics ID (if using)

**Note**: Environment variables starting with `NEXT_PUBLIC_` are exposed to the browser.

## Custom Domain (Optional)

To use your own domain:

1. Go to project "Settings" → "Domains"
2. Add your domain (e.g., `yourname.com`)
3. Update your DNS records as instructed by Vercel
4. Vercel will automatically provision SSL certificates

## Build Configuration

The project is configured with:

- **Node.js Version**: 20.x (specified in `.node-version`)
- **Package Manager**: npm (using `package-lock.json`)
- **Build Command**: `npm run build`
- **Output**: Static and dynamic pages via App Router

### What Gets Deployed

- ✅ **Static pages**: Home, Photos, Projects, Contact, Roadmap
- ✅ **Dynamic routes**: Individual project pages (`/projects/[slug]`)
- ✅ **API routes**: Feedback form endpoint (`/api/feedback`)
- ✅ **Assets**: Images, fonts, 3D models (optimized automatically)
- ✅ **Client bundles**: JavaScript split by route for optimal loading

### What Doesn't Get Deployed

- ❌ Test files (`__tests__/`, `e2e/`)
- ❌ Development files (`.env.local`, `node_modules/`)
- ❌ Build artifacts (`.next/`, `.turbo/`)
- ❌ CI/CD configs (`.github/workflows/`)

## Performance Optimizations

Vercel automatically applies:

- **Edge Network**: Global CDN with 300+ edge locations
- **Image Optimization**: Next.js Image component optimized via Vercel
- **Code Splitting**: Automatic route-based chunking
- **Compression**: Brotli and Gzip compression
- **Caching**: Intelligent caching with `Cache-Control` headers

### Expected Performance

- **First Load**: ~1-2s (depends on 3D asset loading)
- **Route Transitions**: <100ms (instant with prefetching)
- **Lighthouse Score**: 90+ (Performance, Accessibility, Best Practices, SEO)

## Monitoring & Analytics

### Vercel Analytics (Recommended)

Enable Vercel's built-in analytics:

1. Go to project "Analytics" tab
2. Click "Enable Analytics"
3. Free tier includes: Web Vitals, page views, top pages

### Error Tracking

Vercel automatically tracks:
- Build errors (in deployment logs)
- Runtime errors (in Functions logs)
- Edge function errors

Access logs: Project → "Logs" tab

## Troubleshooting

### Build Fails

**Error**: "Dependencies lock file is not found"
- **Solution**: Ensure `package-lock.json` is committed to git

**Error**: "Node version mismatch"
- **Solution**: `.node-version` file with `20` should be in repo root

**Error**: ESLint warnings causing build failure
- **Current Status**: Build succeeds with 39 warnings (warnings don't fail builds)
- **Solution**: Warnings are acceptable; errors would fail the build

### Runtime Errors

**Three.js not loading**
- **Check**: Browser console for WebGL errors
- **Solution**: Ensure browser supports WebGL 2.0

**Images not loading**
- **Check**: Image paths are correct (`/images/...`)
- **Solution**: Verify images are in `public/` folder

**API routes return 500**
- **Check**: Vercel Functions logs
- **Solution**: Review error details, ensure Zod validation passes

### Performance Issues

**Slow initial load**
- **Cause**: Three.js and 3D assets are large
- **Solution**: Consider lazy loading 3D components with `next/dynamic`

**High bandwidth usage**
- **Cause**: Large unoptimized images
- **Solution**: Use Next.js `<Image>` component (already implemented)

## Rollback

If a deployment has issues:

1. Go to Vercel Dashboard → Project → "Deployments"
2. Find the last working deployment
3. Click "..." → "Promote to Production"
4. Traffic immediately switches to the previous version

## CI/CD Integration

The project includes GitHub Actions CI:

- **Triggers**: Pull requests and pushes to `main`
- **Checks**: Lint, type-check, tests, build
- **Deployment**: Vercel auto-deploys after CI passes

### Deployment Flow

```
Push to GitHub → GitHub Actions CI → Tests Pass → Vercel Builds → Deploy to Production
                                   → Tests Fail → ❌ No deployment
```

## Cost Estimates

**Vercel Hobby (Free)**
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Serverless function executions: 100 GB-hours
- ✅ 1000 image optimizations/month
- ✅ HTTPS included
- **Best for**: Personal portfolios (this project fits perfectly)

**Vercel Pro ($20/month)**
- For commercial projects
- More bandwidth, functions, images
- Team collaboration features

## Post-Deployment Checklist

After your first deployment:

- [ ] Visit your site and test all pages
- [ ] Test contact form submission
- [ ] Verify images load correctly
- [ ] Check 3D visualizations work
- [ ] Test on mobile device
- [ ] Run Lighthouse audit
- [ ] Check Vercel Analytics dashboard
- [ ] (Optional) Add custom domain
- [ ] (Optional) Set up email service integration
- [ ] Share your portfolio! 🎉

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Support**: https://vercel.com/support
- **Project Issues**: Open an issue in your GitHub repo

## Continuous Deployment

Every push to `main` automatically:
1. Triggers GitHub Actions CI
2. Runs tests and checks
3. If all pass, Vercel deploys
4. Preview deployments for PRs

**Preview Deployments**: Every PR gets a unique URL to test changes before merging.

---

**Ready to deploy?** Push to GitHub and import to Vercel - it takes less than 5 minutes! 🚀
