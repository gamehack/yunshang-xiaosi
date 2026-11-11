import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readGuestSave, writeGuestSave } from '../src/persistence/guest-save';

const data=new Map<string,string>();
beforeEach(()=>{
  data.clear();
  vi.stubGlobal('localStorage',{
    getItem:(k:string)=>data.get(k)??null,
    setItem:(k:string,v:string)=>{data.set(k,v);},
  });
});
const base={version:1 as const,x:0,z:8,seated:false,yaw:0,pitch:.43,distance:11,savedAt:1};
describe('guest resume',()=>{
  it('round trips a valid location and view',()=>{
    writeGuestSave(base);
    expect(readGuestSave()).toEqual(base);
  });
  it('rejects malformed or inaccessible positions',()=>{
    data.set('banrixian.guest.v1','not-json');
    expect(readGuestSave()).toBeNull();
    writeGuestSave({...base,x:9,z:0});
    expect(readGuestSave()).toBeNull();
  });
  it('rejects invalid numeric camera values',()=>{
    writeGuestSave({...base,yaw:Infinity});
    expect(readGuestSave()).toBeNull();
  });
  it('restores seated only beside a known seat',()=>{
    writeGuestSave({...base,seated:true});
    expect(readGuestSave()?.seated).toBe(false);
    writeGuestSave({...base,x:0,z:-94,seated:true});
    expect(readGuestSave()?.seated).toBe(true);
  });
  it('continues when browser storage is disabled',()=>{
    vi.stubGlobal('localStorage',{getItem:()=>{throw new Error('blocked')},setItem:()=>{throw new Error('blocked')}});
    expect(readGuestSave()).toBeNull();
    expect(()=>writeGuestSave(base)).not.toThrow();
  });
});
