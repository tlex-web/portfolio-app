// D-10 proof (plan 13-19): this test is deliberately red. It exists only on the
// throwaway branch ci/13-proof-red to show that the main ruleset refuses a PR
// whose CI OK failed. It must never merge.
describe('D-10 red proof', () => {
  it('fails on purpose so CI OK goes red', () => {
    expect(1).toBe(2);
  });
});
