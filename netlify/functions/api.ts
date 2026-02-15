import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

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

  try {
    let response;

    // ✅ GET (list or single record)
    if (event.httpMethod === "GET") {
      if (recordId) {
        response = await supabase
          .from(tableId)
          .select("*")
          .eq("id", recordId)
          .single();
      } else {
        response = await supabase
          .from(tableId)
          .select("*");
      }
    }

    // ✅ POST (create)
    if (event.httpMethod === "POST") {
      response = await supabase
        .from(tableId)
        .insert(JSON.parse(event.body || "{}"))
        .select()
        .single();
    }

    // ✅ PATCH (update)
    if (event.httpMethod === "PATCH") {
      response = await supabase
        .from(tableId)
        .update(JSON.parse(event.body || "{}"))
        .eq("id", recordId)
        .select()
        .single();
    }

    // ✅ DELETE
    if (event.httpMethod === "DELETE") {
      response = await supabase
        .from(tableId)
        .delete()
        .eq("id", recordId);
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
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: error.message }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
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
