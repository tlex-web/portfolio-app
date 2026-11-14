describe('Jest globals', () => {
  it('the Jest globals are typed, not any (GUARD-10 canary)', () => {
    expect(() => {
      // @ts-expect-error -- canary: toBe needs an argument; if expect were any this directive would be unused (TS2578)
      expect(1).toBe();
    }).toThrow();
  });
});
