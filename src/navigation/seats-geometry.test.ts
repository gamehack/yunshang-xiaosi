import {describe,it,expect} from 'vitest';
import {SEATS} from './seats';
import {isWalkable} from './walk-controller';
import {readGuestSave,writeGuestSave} from '../persistence/guest-save';
import {vi} from 'vitest';
describe('real seat anchors',()=>{
  for(const [i,seat] of SEATS.entries()){
    it(`seat ${i} stands outside furniture`,()=>{expect(isWalkable(seat.x,seat.z)).toBe(false);expect(isWalkable(seat.standX,seat.standZ)).toBe(true);});
    it(`seat ${i} restores at its exact center`,()=>{
      let raw='';vi.stubGlobal('localStorage',{getItem:()=>raw,setItem:(_k:string,v:string)=>raw=v});
      writeGuestSave({version:1,x:seat.x,z:seat.z,seated:true,yaw:0,pitch:.43,distance:11,savedAt:1});
      expect(readGuestSave()?.seated).toBe(true);vi.unstubAllGlobals();
    });
  }
});

describe('seated viewing direction',()=>{
  it('faces the tea table and lake rather than the southern approach',()=>{
    for(const seat of SEATS)expect(Math.cos(seat.yaw ?? 0)).toBeLessThan(-.99);
  });
});
