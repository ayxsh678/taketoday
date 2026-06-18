import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError, captureApiError } from "@/lib/admin/api";
import { TipCategory } from "@prisma/client";

const tipSchema = z.object({
  title: z.string().min(5).max(200),
  summary: z.string().min(20).max(5000),
  category: z.nativeEnum(TipCategory),
  sourceType: z.string().max(100).optional(),
  anonymous: z.boolean().default(false),
  contactEmail: z.string().email().optional(),
  attachments: z.array(z.string().url()).max(10).default([]),
  evidenceLinks: z.array(z.string().url()).max(10).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = tipSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 422);
    }

    const data = parsed.data;

    // Strip email if anonymous
    const tip = await prisma.storyTip.create({
      data: {
        title: data.title,
        summary: data.summary,
        category: data.category,
        sourceType: data.sourceType,
        anonymous: data.anonymous,
        contactEmail: data.anonymous ? null : (data.contactEmail ?? null),
        attachments: data.attachments,
        evidenceLinks: data.evidenceLinks,
      },
    });

    return jsonOk({ tip }, { status: 201 });
  } catch (err) {
    return captureApiError(err);
  }
}
