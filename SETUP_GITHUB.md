# GitHub Setup Instructions

This guide will help you push this portfolio app to GitHub.

## Prerequisites

- A GitHub account ([sign up here](https://github.com/join))
- Git installed on your computer
- Terminal/Command Prompt access

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and log in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Enter repository details:
   - **Repository name**: `portfolio-app`
   - **Description**: "A modern portfolio website showcasing landscape photography and programming projects with 3D visualizations"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click "Create repository"

## Step 2: Add GitHub Remote

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add the GitHub repository as a remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/portfolio-app.git

# Verify the remote was added
git remote -v
```

## Step 3: Push to GitHub

```bash
# Push your code to GitHub
git push -u origin master
```

Or if your default branch is named 'main':

```bash
# Rename branch to main if needed
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 4: Update Repository URLs

After pushing, update these files with your actual GitHub username:

### `package.json`
Replace `YOUR_USERNAME` with your GitHub username in:
- `repository.url`
- `bugs.url`
- `homepage`

### `README.md`
Update the clone URL:
```bash
git clone https://github.com/YOUR_USERNAME/portfolio-app.git
```

Then commit and push the changes:

```bash
git add package.json README.md
git commit -m "Update repository URLs with actual GitHub username"
git push
```

## Step 5: Deploy to Vercel (Optional)

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your `portfolio-app` repository
5. Configure settings (Vercel auto-detects Next.js):
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: .next
6. Add environment variables if needed:
   - `FEEDBACK_EMAIL=your.email@example.com`
7. Click "Deploy"

Your site will be live at `https://your-project.vercel.app`

## Step 6: Enable GitHub Pages for Documentation (Optional)

1. Go to your repository settings
2. Navigate to "Pages" in the left sidebar
3. Select source: "Deploy from a branch"
4. Select branch: `main` or `master`
5. Select folder: `/(root)` or `/docs` if you create one
6. Click "Save"

## Ongoing Development

### Making Changes

```bash
# Make your changes to files

# Stage changes
git add .

# Commit with a descriptive message
git commit -m "Add new feature or fix bug"

# Push to GitHub
git push
```

### Working with Branches

```bash
# Create a new branch for a feature
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Implement new feature"

# Push branch to GitHub
git push -u origin feature/new-feature

# Create a Pull Request on GitHub
# Merge when ready
```

## Customization Checklist

Before making your repository public, update these personalization items:

- [ ] Update `package.json` author and repository URLs
- [ ] Update `README.md` with your name and links
- [ ] Update `LICENSE` with your name and year
- [ ] Update `app/contact/page.tsx` email address
- [ ] Update `data/landscapes.ts` with your photos
- [ ] Update `data/projects.ts` with your projects
- [ ] Update `data/roadmap.ts` with your roadmap
- [ ] Add your own images to `public/images/`
- [ ] Update social media links in `components/Footer.tsx`
- [ ] Update site metadata in `app/layout.tsx`

## Troubleshooting

### Authentication Issues

If you have trouble pushing:

1. **Use Personal Access Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate new token with `repo` scope
   - Use the token as your password when pushing

2. **Use SSH** (recommended):
   ```bash
   # Generate SSH key
   ssh-keygen -t ed25519 -C "your.email@example.com"
   
   # Add to SSH agent
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   
   # Copy public key and add to GitHub
   cat ~/.ssh/id_ed25519.pub
   
   # Update remote URL
   git remote set-url origin git@github.com:YOUR_USERNAME/portfolio-app.git
   ```

### Large Files Warning

If you get warnings about large image files:
- Consider using Git LFS for images over 50MB
- Or host images on a CDN (Cloudinary, Imgix, etc.)

## Resources

- [GitHub Documentation](https://docs.github.com)
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)
- [Vercel Deployment](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## Support

If you encounter issues:
1. Check the [GitHub documentation](https://docs.github.com)
2. Search for your issue on [Stack Overflow](https://stackoverflow.com)
3. Open an issue in this repository (after pushing to GitHub)

---

**Congratulations!** Your portfolio is now ready for GitHub! 🎉

