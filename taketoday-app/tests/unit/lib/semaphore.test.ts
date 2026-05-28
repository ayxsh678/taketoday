import { describe, it, expect } from "vitest";
import { Semaphore } from "@/lib/content/generators/semaphore";

describe("Semaphore", () => {
  it("allows up to N concurrent runs", async () => {
    const sem = new Semaphore(2);
    const order: number[] = [];

    const task = async (id: number) => {
      await sem.run(async () => {
        order.push(id);
        await Promise.resolve();
      });
    };

    await Promise.all([task(1), task(2), task(3)]);
    expect(order).toHaveLength(3);
  });

  it("queues when all permits consumed", async () => {
    const sem = new Semaphore(1);
    const results: number[] = [];

    let resolve1!: () => void;
    void new Promise<void>((r) => (resolve1 = r));

    // Acquire manually to block
    await sem.acquire();

    // This will queue
    const task2 = sem.run(async () => {
      results.push(2);
    });

    // Release permit — task2 should run
    resolve1();
    sem.release();
    await task2;

    expect(results).toContain(2);
    expect(sem.available).toBe(1);
    expect(sem.queued).toBe(0);
  });

  it("releases permit on error", async () => {
    const sem = new Semaphore(1);
    await expect(
      sem.run(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(sem.available).toBe(1);
  });

  it("throws on invalid permit count", () => {
    expect(() => new Semaphore(0)).toThrow("permits must be >= 1");
  });
});
