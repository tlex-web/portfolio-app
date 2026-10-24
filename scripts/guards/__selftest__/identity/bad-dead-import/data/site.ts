// Fixture: a real identity record (SHELL-03); the email uses the reserved .test TLD
export const site = {
  name: 'Tim Lui',
  role: 'Developer & photographer',
  email: 'tim@fixture.test',
  links: {
    github: 'https://github.com/tlex-web',
    linkedin: 'https://www.linkedin.com/in/fixture-handle/',
  },
  nav: [{ label: 'Home', href: '/' }],
} as const;
