// Fixture: a bare LinkedIn root instead of a profile URL must fail
export const site = {
  name: 'Tim Lui',
  role: 'Developer & photographer',
  email: 'tim@fixture.test',
  links: {
    github: 'https://github.com/tlex-web',
    linkedin: 'https://linkedin.com',
  },
  nav: [{ label: 'Home', href: '/' }],
} as const;
