/** User-gesture-only, synthesized ambient breeze. No external media or autoplay. */
export class AmbientSound {
  private context: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private volume = 0.18;
  get playing(): boolean { return this.context?.state === 'running'; }
  async toggle(): Promise<boolean> {
    if(this.playing) { await this.context!.suspend(); return false; }
    if(!this.context) {
      const context=new AudioContext();
      const buffer=context.createBuffer(1,context.sampleRate*3,context.sampleRate);
      const data=buffer.getChannelData(0);
      // Deterministic low-level noise, smoothed by a lowpass filter to mimic wind.
      let seed=1234567;
      for(let i=0;i<data.length;i++){
        seed=(Math.imul(seed,1664525)+1013904223)|0;
        data[i]=((seed>>>0)/2147483648-1)*.55;
      }
      const source=context.createBufferSource();
      source.buffer=buffer;source.loop=true;
      const filter=context.createBiquadFilter();
      filter.type='lowpass';filter.frequency.value=350;
      const gain=context.createGain();
      gain.gain.value=this.volume;
      source.connect(filter).connect(gain).connect(context.destination);
      source.start();
      this.context=context;this.source=source;this.gain=gain;
    }
    await this.context.resume();
    return true;
  }
  setVolume(volume:number):void {
    this.volume=Math.min(1,Math.max(0,volume));
    if(this.gain)this.gain.gain.value=this.volume;
  }
  async pause():Promise<void> {
    if(this.context?.state==='running')await this.context.suspend();
  }
  async dispose():Promise<void> {
    this.source?.stop();
    this.source?.disconnect();
    await this.context?.close();
    this.source=null;this.gain=null;this.context=null;
  }
}
