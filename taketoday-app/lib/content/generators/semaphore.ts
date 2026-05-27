// ─── Module-level semaphore for concurrency control ───────────────────────────
// No external dependencies. Fair-queuing FIFO order.

export class Semaphore {
  private _permits: number;
  private _queue: Array<() => void> = [];

  constructor(permits: number) {
    if (permits < 1) throw new RangeError("Semaphore permits must be >= 1");
    this._permits = permits;
  }

  /** Acquire one permit, waiting if none available. */
  acquire(): Promise<void> {
    if (this._permits > 0) {
      this._permits--;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this._queue.push(resolve);
    });
  }

  /** Release one permit, waking next waiter. */
  release(): void {
    const next = this._queue.shift();
    if (next) {
      next();
    } else {
      this._permits++;
    }
  }

  /**
   * Run `fn` under the semaphore — acquires before, releases after
   * (even on error). Preferred over manual acquire/release.
   */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  get available(): number {
    return this._permits;
  }

  get queued(): number {
    return this._queue.length;
  }
}

/**
 * Shared pipeline semaphore — limits total concurrent generator calls
 * across all formats. 3 permits = at most 3 Claude/Python calls at once.
 */
export const pipelineSemaphore = new Semaphore(3);
