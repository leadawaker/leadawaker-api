import type { Handler } from "@netlify/functions";

const NOCODB_BASE_URL = process.env.NOCODB_BASE_URL!;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN!;

export const handler: Handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  const tableId = event.queryStringParameters?.tableId;
  const recordId = event.queryStringParameters?.id;

  if (!tableId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing tableId" }),
    };
  }

  // ✅ Always use v2 endpoint (no /records/{id})
  const url = `${NOCODB_BASE_URL}/tables/${tableId}/records`;

  try {
    const headers = {
      "xc-token": NOCODB_TOKEN,
      "Content-Type": "application/json",
    };

    let body: string | undefined = undefined;

    // POST (create)
    if (event.httpMethod === "POST") {
      body = event.body || "{}";
    }

    // PATCH (update)
    if (event.httpMethod === "PATCH") {
      const parsed = JSON.parse(event.body || "{}");
      body = JSON.stringify({
        Id: Number(recordId),
        ...parsed,
      });
    }

    // DELETE
    if (event.httpMethod === "DELETE") {
      body = JSON.stringify({
        Id: Number(recordId),
      });
    }

    const response = await fetch(url, {
      method: event.httpMethod,
      headers,
      body,
    });

    const text = await response.text();

    return {
      statusCode: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: text,
    };
  } catch (err) {
    console.error("Function error:", err);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Failed to process request" }),
    };
  }
};
