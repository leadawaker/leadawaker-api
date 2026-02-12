import type { Handler } from "@netlify/functions";

const NOCODB_BASE_URL = process.env.NOCODB_BASE_URL!;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN!;

export const handler: Handler = async (event) => {
  try {
    const tableId = event.queryStringParameters?.tableId;
    const recordId = event.queryStringParameters?.id;

    if (!tableId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing tableId" }),
      };
    }

    // Build correct NocoDB URL
    let targetUrl = `${NOCODB_BASE_URL}/tables/${tableId}/records`;
    if (recordId) {
      targetUrl += `/${recordId}`;
    }

    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers: {
        "Content-Type": "application/json",
        "xc-token": NOCODB_TOKEN,
      },
      body: ["POST", "PATCH"].includes(event.httpMethod)
        ? event.body
        : undefined,
    });

    const text = await response.text();

    return {
      statusCode: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: text,
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(err) }),
    };
  }
};
