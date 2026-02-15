import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client using environment variables
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export const handler: Handler = async (event) => {
  // Handle CORS preflight
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

  try {
    let response;

    // GET: fetch one record by ID or all records
    if (event.httpMethod === "GET") {
      if (recordId) {
        response = await supabase
          .from(tableId)
          .select("*")
          .eq("Id", Number(recordId)) // convert ID to number
          .single();
      } else {
        response = await supabase.from(tableId).select("*");
      }
    }

    // POST: create a new record
    if (event.httpMethod === "POST") {
      const parsedBody = JSON.parse(event.body || "{}");
      response = await supabase
        .from(tableId)
        .insert(parsedBody)
        .select()
        .single();
    }

    // PATCH: update an existing record
    if (event.httpMethod === "PATCH") {
      if (!recordId) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing record ID" }) };
      }
      const parsedBody = JSON.parse(event.body || "{}");
      response = await supabase
        .from(tableId)
        .update(parsedBody)
        .eq("Id", Number(recordId)) // convert ID to number
        .select()
        .single();
    }

    // DELETE: delete a record by ID
    if (event.httpMethod === "DELETE") {
      if (!recordId) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing record ID" }) };
      }
      response = await supabase
        .from(tableId)
        .delete()
        .eq("Id", Number(recordId)); // convert ID to number
    }

    if (!response) {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const { data, error } = response;

    if (error) {
      console.error("Supabase error:", error);
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ error: error.message }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Failed to process request" }),
    };
  }
};
