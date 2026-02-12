import type { Handler } from "@netlify/functions";

const NOCODB_BASE_URL = process.env.NOCODB_BASE_URL!;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN!;

export const handler: Handler = async (event) => {
  try {
    const path = event.path.replace("/.netlify/functions/api", "");
    const url = `${NOCODB_BASE_URL}${path}${event.rawQuery ? `?${event.rawQuery}` : ""}`;

    const response = await fetch(url, {
      method: event.httpMethod,
      headers: {
        "Content-Type": "application/json",
        "xc-token": NOCODB_TOKEN,
      },
      body: ["POST", "PATCH", "PUT"].includes(event.httpMethod)
        ? event.body
        : undefined,
    });

    const text = await response.text();

    return {
      statusCode: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
      },
      body: text,
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: String(err) }),
    };
  }
};
