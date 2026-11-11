/** Pure keyboard policy shared by movement and its unit tests. */
export function shouldHandleMovementKey(key: string, options: {
  altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; inControl?: boolean;
} = {}): boolean {
  if(options.altKey || options.ctrlKey || options.metaKey || options.inControl)return false;
  return ['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key.toLowerCase());
}
export function shouldStopWalking(key: string, options: {
  altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; inControl?: boolean;
} = {}): boolean {
  return key === 'Escape' && !options.altKey && !options.ctrlKey && !options.metaKey && !options.inControl;
}
