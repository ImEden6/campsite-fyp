/**
 * Frame Rate Monitor
 * Monitors and reports frame rates for performance testing
 */

export interface FrameRateStats {
  currentFPS: number;
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  frameCount: number;
  totalTime: number;
  droppedFrames: number;
}

export class FrameRateMonitor {
  private frameCount = 0;
  private startTime = 0;
  private lastFrameTime = 0;
  private frameTimes: number[] = [];
  private droppedFrames = 0;
  private isRunning = false;
  private animationFrameId: number | null = null;
  private onUpdateCallback?: (stats: FrameRateStats) => void;
  private readonly targetFPS = 60;
  private readonly frameTimeTarget = 1000 / this.targetFPS; // ~16.67ms

  /**
   * Start monitoring frame rate
   */
  start(onUpdate?: (stats: FrameRateStats) => void): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.frameCount = 0;
    this.droppedFrames = 0;
    this.frameTimes = [];
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.onUpdateCallback = onUpdate;

    this.measureFrame();
  }

  /**
   * Stop monitoring frame rate
   */
  stop(): FrameRateStats {
    if (!this.isRunning) {
      return this.getStats();
    }

    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    return this.getStats();
  }

  /**
   * Reset all statistics
   */
  reset(): void {
    this.frameCount = 0;
    this.droppedFrames = 0;
    this.frameTimes = [];
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
  }

  /**
   * Get current statistics
   */
  getStats(): FrameRateStats {
    const now = performance.now();
    const totalTime = now - this.startTime;
    const currentFPS = this.frameCount > 0 && totalTime > 0 
      ? (this.frameCount / totalTime) * 1000 
      : 0;

    let averageFPS = 0;
    let minFPS = Infinity;
    let maxFPS = 0;

    if (this.frameTimes.length > 0) {
      const averageFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
      averageFPS = averageFrameTime > 0 ? 1000 / averageFrameTime : 0;
      
      const fpsValues = this.frameTimes.map(ft => 1000 / ft);
      minFPS = Math.min(...fpsValues);
      maxFPS = Math.max(...fpsValues);
    }

    return {
      currentFPS: Math.round(currentFPS * 10) / 10,
      averageFPS: Math.round(averageFPS * 10) / 10,
      minFPS: Math.round(minFPS * 10) / 10,
      maxFPS: Math.round(maxFPS * 10) / 10,
      frameCount: this.frameCount,
      totalTime: Math.round(totalTime),
      droppedFrames: this.droppedFrames,
    };
  }

  /**
   * Measure a single frame
   */
  private measureFrame = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    const frameTime = now - this.lastFrameTime;

    // Track frame time
    this.frameTimes.push(frameTime);
    
    // Keep only last 60 frame times for rolling average
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }

    // Detect dropped frames (frame time > 2x target)
    if (frameTime > this.frameTimeTarget * 2) {
      this.droppedFrames++;
    }

    this.frameCount++;
    this.lastFrameTime = now;

    // Call update callback if provided
    if (this.onUpdateCallback) {
      this.onUpdateCallback(this.getStats());
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.measureFrame);
  };
}

/**
 * Measure frame rate for a specific duration
 */
export async function measureFrameRate(
  durationMs: number,
  onUpdate?: (stats: FrameRateStats) => void
): Promise<FrameRateStats> {
  const monitor = new FrameRateMonitor();
  monitor.start(onUpdate);

  return new Promise((resolve) => {
    setTimeout(() => {
      const stats = monitor.stop();
      resolve(stats);
    }, durationMs);
  });
}

