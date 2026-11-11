import {describe,expect,it} from 'vitest';
import {shouldHandleMovementKey,shouldStopWalking} from '../src/navigation/keyboard';
describe('M0.8 keyboard navigation policy',()=>{
  it('accepts WASD and arrows case-insensitively',()=>{
    for(const key of ['w','A','s','D','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'])
      expect(shouldHandleMovementKey(key)).toBe(true);
  });
  it('ignores other keys and modified shortcuts',()=>{
    for(const key of ['Escape','Enter',' ','Tab'])expect(shouldHandleMovementKey(key)).toBe(false);
    for(const opts of [{altKey:true},{ctrlKey:true},{metaKey:true},{inControl:true}])
      expect(shouldHandleMovementKey('w',opts)).toBe(false);
  });
  it('Escape cancels walking outside form controls',()=>{
    expect(shouldStopWalking('Escape')).toBe(true);
    expect(shouldStopWalking('Esc')).toBe(false);
    expect(shouldStopWalking('Escape',{inControl:true})).toBe(false);
    expect(shouldStopWalking('Escape',{ctrlKey:true})).toBe(false);
  });
});
