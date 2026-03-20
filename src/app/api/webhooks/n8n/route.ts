import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifySignature } from "@/lib/security/hmac";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-webhook-signature");

    if (signature) {
      const webhookSecret = process.env.N8N_WEBHOOK_SECRET;
      if (webhookSecret) {
        try {
          const isValid = verifySignature(body, signature);
          if (!isValid) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
          }
        } catch {
          // Signature verification failed
        }
      }
    }

    const data = JSON.parse(body);
    const { registryId, status, executionId } = data;

    if (!registryId || !status) {
      return NextResponse.json(
        { error: "registryId and status are required" },
        { status: 400 }
      );
    }

    const validStatuses = ["PENDING", "IN_PROGRESS", "APPROVED", "REJECTED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await prisma.requestRegistry.update({
      where: { id: registryId },
      data: {
        status,
        n8nExecutionId: executionId || undefined,
        processedAt: ["APPROVED", "REJECTED", "CANCELLED"].includes(status)
          ? new Date()
          : undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
