import {describe,expect,it} from 'vitest';
import {SEATS,findNearbySeat} from './seats';
describe('seat matching',()=>{
  it('finds a seat from its walkable approach',()=>{
    expect(findNearbySeat(SEATS,-8,-6.5)).toBe(SEATS[0]);
  });
  it('restores a seat from the seated position',()=>{
    expect(findNearbySeat(SEATS,0,-97)).toBe(SEATS[1]);
  });
  it('returns null for invalid distant seated saves',()=>{
    expect(findNearbySeat(SEATS,0,8,4)).toBeNull();
  });
  it('selects the closest seat rather than the first matching one',()=>{
    const seats=[{x:0,z:0,standX:0,standZ:1},{x:2,z:0,standX:2,standZ:1}];
    expect(findNearbySeat(seats,1.9,.1,3)).toBe(seats[1]);
  });
});
