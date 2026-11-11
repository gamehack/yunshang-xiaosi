/** Lightweight rolling frame-time telemetry, independent of rendering APIs. */
export class FrameStats {
  private samples: number[] = [];
  constructor(private readonly capacity = 180) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new Error('Invalid frame sample capacity');
  }
  record(frameMs: number): void {
    if (!Number.isFinite(frameMs) || frameMs <= 0) return;
    this.samples.push(frameMs);
    if (this.samples.length > this.capacity) this.samples.shift();
  }
  snapshot(): { count: number; averageMs: number; p95Ms: number } {
    if (!this.samples.length) return {count:0,averageMs:0,p95Ms:0};
    const sorted=[...this.samples].sort((a,b)=>a-b);
    const averageMs=this.samples.reduce((a,b)=>a+b,0)/this.samples.length;
    return {count:this.samples.length,averageMs,p95Ms:sorted[Math.ceil(sorted.length*.95)-1]};
  }
}
