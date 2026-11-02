// RED stub (12-08 Task 2): signatures only, replaced by the implementation.
export const SW_RELOAD_KEY = '';

export function shouldReloadOnControllerChange(_state: {
  hadController: boolean;
  alreadyReloaded: boolean;
  dirty: boolean;
}): boolean {
  return false;
}

export function hasDirtyField(_root: ParentNode): boolean {
  return false;
}
