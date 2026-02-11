import type { Handler } from "@netlify/functions";

const NOCODB_BASE_URL = process.env.NOCODB_BASE_URL!;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN!;

export const handler: Handler = async (event) => {
  const tableId = event.queryStringParameters?.tableId;

  if (!tableId) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Missing tableId" }),
    };
  }

  try {
    const response = await fetch(
      `${NOCODB_BASE_URL}/tables/${tableId}/records`,
      {
        headers: { "xc-token": NOCODB_TOKEN },
      }
    );

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // <--- allow your frontend to fetch
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: String(err) }),
    };
  }
};
