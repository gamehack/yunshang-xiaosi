import {it,expect,vi} from 'vitest';
import {AmbientSound} from './ambient';
it('defaults to silent and disposes safely more than once without creating audio',async()=>{
 const ctor=vi.fn();vi.stubGlobal('AudioContext',ctor);
 const ambient=new AmbientSound();expect(ambient.playing).toBe(false);await ambient.pause();await ambient.dispose();await ambient.dispose();expect(ctor).not.toHaveBeenCalled();vi.unstubAllGlobals();
});
it('rejects non-finite volume rather than poisoning the gain node',()=>{
 const ambient=new AmbientSound();
 expect(()=>ambient.setVolume(NaN)).not.toThrow();
 // A rejected AudioParam value would break playback on the next user gesture.
 let received;
 const node={gain:{set value(v:number){received=v;if(!Number.isFinite(v))throw new Error('non-finite gain');}}};
 Object.assign(ambient,{gain:node});ambient.setVolume(NaN);expect(Number.isFinite(received)).toBe(true);
});
