import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { canTransition, transitionWorkflow } from "@/lib/contributor/workflow";
import type { WorkflowStage } from "@prisma/client";

describe("canTransition — state machine rules", () => {
  it("allows DRAFT → SUBMITTED", () => {
    expect(canTransition("DRAFT", "SUBMITTED")).toBe(true);
  });

  it("allows SUBMITTED → UNDER_RESEARCH", () => {
    expect(canTransition("SUBMITTED", "UNDER_RESEARCH")).toBe(true);
  });

  it("allows UNDER_RESEARCH → FACT_CHECK_PENDING", () => {
    expect(canTransition("UNDER_RESEARCH", "FACT_CHECK_PENDING")).toBe(true);
  });

  it("allows FACT_CHECK_PENDING → VERIFIED", () => {
    expect(canTransition("FACT_CHECK_PENDING", "VERIFIED")).toBe(true);
  });

  it("allows VERIFIED → EDITOR_REVIEW", () => {
    expect(canTransition("VERIFIED", "EDITOR_REVIEW")).toBe(true);
  });

  it("allows EDITOR_REVIEW → APPROVED", () => {
    expect(canTransition("EDITOR_REVIEW", "APPROVED")).toBe(true);
  });

  it("allows APPROVED → PUBLISHED", () => {
    expect(canTransition("APPROVED", "PUBLISHED")).toBe(true);
  });

  it("allows PUBLISHED → ARCHIVED", () => {
    expect(canTransition("PUBLISHED", "ARCHIVED")).toBe(true);
  });

  it("blocks PUBLISHED → DRAFT (invalid regression)", () => {
    expect(canTransition("PUBLISHED", "DRAFT")).toBe(false);
  });

  it("blocks DRAFT → PUBLISHED (skipping stages)", () => {
    expect(canTransition("DRAFT", "PUBLISHED")).toBe(false);
  });

  it("blocks ARCHIVED → DRAFT (terminal state)", () => {
    expect(canTransition("ARCHIVED", "DRAFT")).toBe(false);
  });

  it("blocks ARCHIVED → PUBLISHED (terminal state)", () => {
    expect(canTransition("ARCHIVED", "PUBLISHED")).toBe(false);
  });

  it("blocks REJECTED → DRAFT (terminal state)", () => {
    expect(canTransition("REJECTED", "DRAFT")).toBe(false);
  });

  it("allows DISPUTED → UNDER_RESEARCH", () => {
    expect(canTransition("DISPUTED", "UNDER_RESEARCH")).toBe(true);
  });
});

describe("transitionWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}]);
  });

  it("returns ok:true for valid transition", async () => {
    const result = await transitionWorkflow({
      contributionId: "contrib-1",
      from: "DRAFT",
      to: "SUBMITTED",
      actorId: "user-1",
      actorType: "PublicUser",
    });
    expect(result).toEqual({ ok: true });
  });

  it("returns ok:false for invalid transition without calling DB", async () => {
    const result = await transitionWorkflow({
      contributionId: "contrib-1",
      from: "PUBLISHED",
      to: "DRAFT",
      actorId: "user-1",
      actorType: "PublicUser",
    });
    expect(result).toEqual({ ok: false, error: "Invalid transition: PUBLISHED → DRAFT" });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("calls $transaction with contribution update + transparency log", async () => {
    await transitionWorkflow({
      contributionId: "contrib-2",
      from: "APPROVED",
      to: "PUBLISHED",
      actorId: "editor-1",
      actorType: "AdminUser",
      reason: "Approved for publication",
    });

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    const ops = (vi.mocked(prisma.$transaction).mock.calls[0] as unknown as [unknown[]])[0];
    expect(ops).toHaveLength(2);
  });

  it("sets publishedAt when transitioning to PUBLISHED", async () => {
    await transitionWorkflow({
      contributionId: "contrib-3",
      from: "APPROVED",
      to: "PUBLISHED",
      actorId: "editor-1",
      actorType: "AdminUser",
    });

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    // Verify contribution.update was called with publishedAt
    expect(prisma.contribution.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workflowStage: "PUBLISHED",
          publishedAt: expect.any(Date),
        }),
      }),
    );
  });

  it("does NOT set publishedAt on non-PUBLISHED transitions", async () => {
    await transitionWorkflow({
      contributionId: "contrib-4",
      from: "DRAFT",
      to: "SUBMITTED",
      actorId: "user-1",
      actorType: "PublicUser",
    });

    expect(prisma.contribution.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ publishedAt: expect.anything() }),
      }),
    );
  });

  it("creates a TransparencyLog entry on every transition", async () => {
    await transitionWorkflow({
      contributionId: "contrib-5",
      from: "SUBMITTED",
      to: "UNDER_RESEARCH",
      actorId: "researcher-1",
      actorType: "PublicUser",
      reason: "Starting research phase",
    });

    expect(prisma.transparencyLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contributionId: "contrib-5",
          actorId: "researcher-1",
          actorType: "PublicUser",
          description: "Starting research phase",
        }),
      }),
    );
  });
});
