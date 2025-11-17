import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

//const CREEM_ENDPOINT = "https://api.creem.io/v1/checkouts";

const CREEM_ENDPOINT = "https://test-api.creem.io/v1/checkouts";

const PLANS = {
  monthly: {
    productId: "prod_1l9cjsowPhSJlsfrTTXlKb",
    price: 9.9,
    label: "Monthly Plan"
  },
  quarterly: {
    productId: "prod_6MCeuAFjzFqFZduAn74Ew7",
    price: 19.9,
    label: "Quarterly Plan"
  },
  yearly: {
    productId: "prod_6LKkd6OJ8pLCesUdoVNV9I",
    price: 69.9,
    label: "Yearly Plan"
  }
} as const;

type PlanKey = keyof typeof PLANS;

type CheckoutRequest = {
  planId?: PlanKey;
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in first." },
      { status: 401 }
    );
  }

  let body: CheckoutRequest;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const { planId } = body;
  if (!planId || !(planId in PLANS)) {
    return NextResponse.json(
      { error: "Plan identifier is missing or unsupported." },
      { status: 400 }
    );
  }

  const apiKey = process.env.CREEM_API_KEY;
  const origin =
    req.headers.get("origin") ??
    process.env.APP_BASE_URL ??
    "https://qrcode.chdaoai.com";

  const selectedPlan = PLANS[planId];

  const payload = {
    product_id: selectedPlan.productId,
    metadata: {
      internal_customer_id: user.id,
      email: user.email ?? undefined
    }
  };

  if (!apiKey) {
    return NextResponse.json(
      { error: "CREEM_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(CREEM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return NextResponse.json(
        {
          error: "Creem API responded with an error.",
          status: response.status,
          details: errorBody
        },
        { status: 502 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred.";

    return NextResponse.json(
      {
        error: "Failed to communicate with Creem API.",
        details: message
      },
      { status: 500 }
    );
  }
}

