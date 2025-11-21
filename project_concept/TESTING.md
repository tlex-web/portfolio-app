# Testing & Performance Guide

## Testing Infrastructure

The portfolio application uses Jest and React Testing Library for unit and component testing.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- ProjectCard.test
```

### Test Coverage

Current test coverage includes:

#### ProjectCard Component ✅
- Renders project information correctly
- Displays tech stack badges
- Shows status badges (active, beta, complete, archived)
- Renders link indicators
- Has correct routing href
- Includes accessible labels

#### FeedbackForm Component (Partial)
- Renders all form fields
- Validates empty name
- Validates short messages
- Handles successful submission
- Handles server errors
- Manages collaboration checkbox
- Clears form after successful submission

### Writing New Tests

Follow these guidelines when writing tests:

1. **Use descriptive test names**: `it('displays tech stack badges', ...)`
2. **Test user behavior, not implementation**: Use `getByRole`, `getByLabelText`
3. **Mock external dependencies**: Use `jest.fn()` for fetch, APIs
4. **Test accessibility**: Verify ARIA labels, keyboard navigation
5. **Test error states**: Both client-side and server-side errors

### Example Test

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);
    
    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });
});
```

## Accessibility Testing

### Automated Testing

The application follows WCAG 2.1 Level AA guidelines:

- ✅ Semantic HTML structure
- ✅ ARIA labels and roles
- ✅ Keyboard navigation support
- ✅ Focus indicators
- ✅ Alt text for images
- ✅ Form labels and error messages
- ✅ Color contrast ratios
- ✅ Respects `prefers-reduced-motion`

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Enter/Space activates buttons and links
- [ ] Escape closes modals
- [ ] Arrow keys work in appropriate contexts
- [ ] No keyboard traps

#### Screen Reader Testing
- [ ] Test with NVDA (Windows) or VoiceOver (Mac)
- [ ] All images have alt text
- [ ] Form fields are properly announced
- [ ] Error messages are announced
- [ ] Status updates are announced (aria-live)

#### Visual Testing
- [ ] Text zoom to 200% without horizontal scrolling
- [ ] Color contrast meets 4.5:1 for normal text
- [ ] Focus indicators are visible
- [ ] Content is readable in dark mode

### Tools

- **axe DevTools**: Browser extension for automated accessibility scanning
- **Lighthouse**: Chrome DevTools accessibility audit
- **eslint-plugin-jsx-a11y**: Catches accessibility issues during development

## Performance Optimization

### Current Optimizations

#### Images
- ✅ Next.js Image component with automatic optimization
- ✅ WebP/AVIF format support
- ✅ Lazy loading below the fold
- ✅ Responsive image sizes
- ✅ Priority loading for hero images

#### JavaScript
- ✅ Server components by default
- ✅ Client components only where needed
- ✅ Code splitting by route (automatic)
- ✅ Tree shaking enabled
- ✅ Production build minification

#### CSS
- ✅ Tailwind CSS with purging
- ✅ Critical CSS inlined
- ✅ No unused styles in production

#### Animations
- ✅ Respects `prefers-reduced-motion`
- ✅ CSS transforms for smooth animations
- ✅ RequestAnimationFrame for scroll effects
- ✅ Throttled scroll listeners

### Performance Targets

Aim for these Lighthouse scores:

- **Performance**: >85
- **Accessibility**: >90
- **Best Practices**: >90
- **SEO**: >90

### Core Web Vitals

Target metrics:

- **First Contentful Paint (FCP)**: <1.8s
- **Largest Contentful Paint (LCP)**: <2.5s
- **Cumulative Layout Shift (CLS)**: <0.1
- **Time to Interactive (TTI)**: <3.8s
- **Total Blocking Time (TBT)**: <200ms

### Optimization Checklist

#### Before Deployment
- [ ] Run Lighthouse audit
- [ ] Check bundle size with `npm run build`
- [ ] Verify images are optimized
- [ ] Test on slow 3G connection
- [ ] Test on mobile devices
- [ ] Enable compression (gzip/brotli)
- [ ] Set up CDN for static assets
- [ ] Configure caching headers

#### Ongoing
- [ ] Monitor Core Web Vitals
- [ ] Update dependencies regularly
- [ ] Profile performance with Chrome DevTools
- [ ] Remove unused dependencies
- [ ] Optimize expensive renders

## Error Handling

### Error Boundary

The application includes a global error boundary (`app/error.tsx`) that:

- Catches React component errors
- Logs errors to console (can be extended to error tracking service)
- Displays user-friendly error message
- Provides "Try again" and "Go home" options

### API Error Handling

All API routes follow this pattern:

```typescript
export async function POST(request: NextRequest) {
  try {
    // Validate input with Zod
    const data = schema.parse(await request.json());
    
    // Process request
    // ...
    
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Client Error Handling

Forms include comprehensive error handling:

- Client-side validation before submission
- Server-side validation with error display
- Network error handling
- Loading states
- Success/error messages

## Continuous Integration

### Recommended CI/CD Pipeline

```yaml
# Example GitHub Actions workflow
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
      - run: npm run build
```

### Pre-commit Hooks

Consider setting up Husky for pre-commit checks:

```bash
npm install --save-dev husky lint-staged
npx husky install
```

```json
// package.json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

## Browser Support

Tested and supported browsers:

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile Safari (iOS 12+)
- Chrome Mobile (Android 8+)

## Monitoring

### Recommended Tools

- **Vercel Analytics**: Real user monitoring for Core Web Vitals
- **Sentry**: Error tracking and performance monitoring
- **Google Analytics**: User behavior and page views
- **LogRocket**: Session replay for debugging issues

### Key Metrics to Monitor

- Page load times
- Error rates
- Form submission success rates
- User engagement (time on page, bounce rate)
- Core Web Vitals
- API response times

## Troubleshooting

### Common Issues

**Tests failing with module resolution errors:**
- Check `moduleNameMapper` in `jest.config.js`
- Ensure `@/` alias matches `tsconfig.json`

**Lighthouse scores low on local development:**
- Run production build: `npm run build && npm start`
- Test on actual device, not emulated

**Images not optimizing:**
- Verify images are in `public/` directory
- Check Next.js Image component configuration
- Ensure proper `sizes` prop is set

**Animations causing jank:**
- Use CSS transforms instead of layout properties
- Throttle scroll listeners
- Check for unnecessary re-renders
- Profile with Chrome DevTools Performance tab

## Resources

- [Next.js Testing Documentation](https://nextjs.org/docs/testing)
- [React Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web.dev Performance](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)

