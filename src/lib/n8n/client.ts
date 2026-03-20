import { signPayload } from "@/lib/security/hmac";

interface N8nWebhookPayload {
  registryId: string;
  formId: string;
  formVersion: number;
  data: Record<string, unknown>;
  submittedBy: {
    id?: string;
    name?: string;
    email?: string;
  };
  callbackUrl: string;
}

export async function triggerN8nWebhook(
  webhookUrl: string,
  payload: N8nWebhookPayload
): Promise<{ success: boolean; executionId?: string; error?: string }> {
  try {
    const body = JSON.stringify(payload);
    const signature = signPayload(body);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Source": "nadro-portal",
      },
      body,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `n8n responded with status ${response.status}`,
      };
    }

    const result = await response.json().catch(() => ({}));

    return {
      success: true,
      executionId: result.executionId || result.id || undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "n8n webhook failed",
    };
  }
}
