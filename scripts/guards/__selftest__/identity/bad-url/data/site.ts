// Fixture: a placeholder http base URL with a trailing slash must fail the url rule (D-13)
export const site = {
  name: 'Tim Lui',
  role: 'Developer & photographer',
  url: 'http://example.com/',
  email: 'tim@fixture.test',
  links: {
    github: 'https://github.com/tlex-web',
    linkedin: 'https://www.linkedin.com/in/fixture-handle/',
  },
  nav: [{ label: 'Home', href: '/' }],
} as const;
