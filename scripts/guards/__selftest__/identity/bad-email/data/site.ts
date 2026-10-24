// Fixture: an example.com address (not in the exact forbidden list) must still fail the shape check
export const site = {
  name: 'Tim Lui',
  role: 'Developer & photographer',
  email: 'hello@example.com',
  links: {
    github: 'https://github.com/tlex-web',
    linkedin: 'https://www.linkedin.com/in/fixture-handle/',
  },
  nav: [{ label: 'Home', href: '/' }],
} as const;
