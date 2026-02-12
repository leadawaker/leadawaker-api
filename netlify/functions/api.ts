import type { Handler } from "@netlify/functions";

const NOCODB_BASE_URL = process.env.NOCODB_BASE_URL!;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN!;

export const handler: Handler = async (event) => {
  try {
    console.log("RAW URL:", event.rawUrl);
    console.log("PATH:", event.path);
    console.log("METHOD:", event.httpMethod);

    const urlObj = new URL(event.rawUrl);

    const proxyPath = urlObj.pathname.replace("/.netlify/functions/api", "");
    const targetUrl = `${NOCODB_BASE_URL}${proxyPath}${urlObj.search}`;

    console.log("TARGET URL TO NOCODB:", targetUrl);

    const response = await fetch(targetUrl, {
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

    console.log("NOCODB STATUS:", response.status);
    console.log("NOCODB RESPONSE:", text);

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
    console.error("FUNCTION ERROR:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: String(err) }),
    };
  }
};
