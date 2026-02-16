# Testing Patterns

**Analysis Date:** 2026-02-16

## Test Framework

**Runner:**
- Jest 30.2.0
- Config: `jest.config.js`

**Assertion Library:**
- @testing-library/jest-dom 6.9.1
- Built-in Jest matchers

**Run Commands:**
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
npm run test:e2e        # E2E tests (Playwright)
npm run test:e2e:ui     # Playwright UI mode
npm run test:e2e:headed # Playwright headed mode
```

## Test File Organization

**Location:**
- Co-located with source in `__tests__` directories
- Unit tests: `components/__tests__/ComponentName.test.tsx`
- API tests: `app/api/__tests__/route.test.ts`
- Hook tests: `lib/__tests__/hookName.test.tsx`
- E2E tests: Separate `e2e/` directory

**Naming:**
- Unit/integration tests: `*.test.ts` or `*.test.tsx`
- E2E tests: `*.spec.ts`

**Structure:**
```
components/
├── ProjectCard.tsx
├── FeedbackForm.tsx
└── __tests__/
    ├── ProjectCard.test.tsx
    ├── FeedbackForm.test.tsx
    └── RoadmapTimeline.test.tsx

e2e/
├── homepage.spec.ts
├── contact-form.spec.ts
├── photos.spec.ts
└── projects.spec.ts
```

## Test Structure

**Suite Organization:**
```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  });

  it('should render correctly', () => {
    // Test
  });

  it('should handle user interaction', async () => {
    // Async test
  });
});
```

**Patterns:**
- Top-level `describe()` for component/module name
- Nested `describe()` for feature groups (e.g., 'Validation', 'Rate Limiting')
- `it()` or `test()` for individual test cases (both used, `it()` more common)
- `beforeEach()` for setup, `afterAll()` for cleanup
- Test descriptions start with verb: "renders", "shows", "handles", "validates"

## Mocking

**Framework:** Jest built-in mocking

**Patterns:**
```typescript
// Mock entire module
jest.mock('@/lib/email', () => ({
  sendFeedbackEmail: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn();

// Mock console methods
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

// Clear mocks between tests
beforeEach(() => {
  (fetch as jest.Mock).mockClear();
  (sendFeedbackEmail as jest.Mock).mockResolvedValue(undefined);
});

// Mock return values
(fetch as jest.Mock).mockResolvedValueOnce({
  ok: true,
  json: async () => ({ success: true }),
});
```

**What to Mock:**
- External API calls (`fetch`, email services)
- Browser APIs not available in test environment
- Next.js modules when needed
- Console methods to verify logging
- Expensive operations (file I/O, network)

**What NOT to Mock:**
- Components under test
- Simple utility functions
- React hooks (test real behavior)
- Testing Library helpers

## Fixtures and Factories

**Test Data:**
```typescript
// Inline mock objects
const mockProject: Project = {
  slug: 'test-project',
  name: 'Test Project',
  tagline: 'A test project tagline',
  shortDescription: 'This is a short description of the test project.',
  longDescription: 'Full description',
  techStack: ['TypeScript', 'React', 'Next.js'],
  links: {
    github: 'https://github.com/test/project',
    demo: 'https://demo.example.com',
  },
  status: 'active',
  featured: true,
};

// Mock request factory
const createMockRequest = (body: any, headers: Record<string, string> = {}) => {
  return {
    json: async () => body,
    headers: new Map(Object.entries({ 'x-forwarded-for': `192.168.1.${testCounter}`, ...headers })),
  } as unknown as NextRequest;
};
```

**Location:**
- Defined inline at top of test files
- No separate fixtures directory currently
- Factory functions for complex test data

## Coverage

**Requirements:** No enforced minimum

**Configuration:**
- Collect from: `components/**`, `app/**`, `lib/**`
- Exclude: `**/*.d.ts`, `node_modules`, `.next`, test files

**View Coverage:**
```bash
npm run test:coverage
```

## Test Types

**Unit Tests:**
- Scope: Individual components and functions
- Approach: Render component, verify output, test interactions
- Example: `components/__tests__/ProjectCard.test.tsx` - Tests rendering, props, accessibility
- Uses: `@testing-library/react`, `@testing-library/jest-dom`

**Integration Tests:**
- Scope: API routes with dependencies
- Approach: Test full request/response cycle with mocked external services
- Example: `app/api/__tests__/feedback.test.ts` - Tests validation, rate limiting, email integration
- Environment: Node environment (`/** @jest-environment node */`)

**E2E Tests:**
- Framework: Playwright 1.58.2
- Scope: Full user flows across multiple pages
- Approach: Real browser automation
- Config: `playwright.config.ts`
- Runs against local dev server (`http://localhost:3000`)
- Cross-browser: Chromium, Firefox, WebKit
- Retry: 2 retries in CI, 0 locally
- Timeout: 30 seconds per test
- Artifacts: Screenshots/videos on failure

## Common Patterns

**Async Testing:**
```typescript
// React Testing Library with async
it('submits form successfully', async () => {
  const user = userEvent.setup();
  render(<FeedbackForm />);

  await user.type(screen.getByLabelText(/name/i), 'John Doe');
  await user.click(screen.getByRole('button', { name: /send/i }));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalled();
  });

  expect(await screen.findByText(/thank you/i)).toBeInTheDocument();
});

// Playwright E2E
test('should submit form successfully', async ({ page }) => {
  await page.goto('/contact');
  await page.waitForLoadState('networkidle');

  await page.getByLabel(/Name/i).fill('John Doe');
  await page.getByRole('button', { name: /Send Message/i }).click();

  await expect(page.getByText(/thank you/i)).toBeVisible({ timeout: 10000 });
});
```

**Error Testing:**
```typescript
// Validation errors
it('rejects invalid email', async () => {
  const request = createMockRequest({
    name: 'John Doe',
    email: 'not-an-email',
    message: 'This is a test message.',
  });

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(400);
  expect(data.error).toBe('Validation failed');
});

// User-facing validation
it('shows validation error for invalid email', async () => {
  const user = userEvent.setup();
  render(<FeedbackForm />);

  await user.type(screen.getByLabelText(/email/i), 'notanemail');
  await user.click(screen.getByRole('button', { name: /send/i }));

  const errorMessage = await screen.findByText('Invalid email address');
  expect(errorMessage).toBeInTheDocument();
  expect(errorMessage).toHaveAttribute('role', 'alert');
});
```

**Accessibility Testing:**
```typescript
it('has accessible label', () => {
  render(<ProjectCard project={mockProject} />);

  const link = screen.getByRole('link');
  expect(link).toHaveAttribute('aria-label', 'View details for Test Project');
});

it('shows error with alert role', async () => {
  // ... trigger error
  const errorMessage = await screen.findByText('Invalid email address');
  expect(errorMessage).toHaveAttribute('role', 'alert');
});
```

**Matchers:**
- React Testing Library: `.toBeInTheDocument()`, `.toBeVisible()`, `.toHaveAttribute()`
- Jest: `.toBe()`, `.toEqual()`, `.toBeDefined()`, `.toHaveLength()`
- Playwright: `.toBeVisible()`, `.toHaveValue()`, `.toBeChecked()`, `.toHaveAttribute()`
- Custom: `.toHaveBeenCalledWith(expect.objectContaining({ ... }))`

## Setup and Teardown

**Global Setup:**
- `jest.setup.js` imports `@testing-library/jest-dom`
- Playwright setup: Dev server auto-starts via `webServer` config

**Per-Test Setup:**
```typescript
beforeEach(() => {
  // Clear mocks
  (fetch as jest.Mock).mockClear();
  (sendFeedbackEmail as jest.Mock).mockClear();

  // Reset spy state
  consoleLogSpy.mockClear();
});

afterAll(() => {
  // Restore spies
  consoleLogSpy.mockRestore();
  consoleErrorSpy.mockRestore();
});
```

## Environment Configuration

**Jest Environment:**
- Default: `jsdom` for component tests
- Node: Use `/** @jest-environment node */` comment for API route tests
- Setup: `setupFilesAfterEnv: ['<rootDir>/jest.setup.js']`

**Module Resolution:**
- Path mapping: `@/*` resolved via `moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' }`
- Matches TypeScript paths in `tsconfig.json`

## Test Utilities

**React Testing Library:**
- `render()` - Render components
- `screen` - Query rendered output
- `waitFor()` - Wait for async changes
- `userEvent` - Simulate user interactions (preferred over `fireEvent`)

**Playwright:**
- `page.goto()` - Navigate to page
- `page.getByRole()` - Query by ARIA role
- `page.getByLabel()` - Query by label text
- `page.getByText()` - Query by text content
- `page.waitForLoadState()` - Wait for page load

---

*Testing analysis: 2026-02-16*
