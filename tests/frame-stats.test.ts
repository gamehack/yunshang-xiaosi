import {describe,expect,it} from 'vitest';
import {FrameStats} from '../src/performance/frame-stats';
describe('M0.7 frame-time telemetry',()=>{
  it('returns zero for empty samples',()=>expect(new FrameStats().snapshot()).toEqual({count:0,averageMs:0,p95Ms:0}));
  it('calculates average and nearest-rank p95',()=>{
    const stats=new FrameStats();
    for(let i=1;i<=20;i++)stats.record(i);
    expect(stats.snapshot()).toEqual({count:20,averageMs:10.5,p95Ms:19});
  });
  it('keeps the newest samples within capacity',()=>{
    const stats=new FrameStats(3);
    [10,20,30,40].forEach(n=>stats.record(n));
    expect(stats.snapshot()).toEqual({count:3,averageMs:30,p95Ms:40});
  });
  it('ignores invalid frame times',()=>{
    const stats=new FrameStats();
    [0,-1,NaN,Infinity,16].forEach(n=>stats.record(n));
    expect(stats.snapshot()).toEqual({count:1,averageMs:16,p95Ms:16});
  });
  it('resets stale samples after suspension',()=>{
    const stats=new FrameStats();
    stats.record(500);
    stats.clear();
    stats.record(16);
    expect(stats.snapshot()).toEqual({count:1,averageMs:16,p95Ms:16});
  });
  it('rejects invalid capacity',()=>{
    expect(()=>new FrameStats(0)).toThrow();
    expect(()=>new FrameStats(1.5)).toThrow();
  });
});
