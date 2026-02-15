import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with environment variables
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export const handler: Handler = async (event) => {
  // Handle CORS preflight requests
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

    // Safely parse JSON body if present
    const body = event.body ? JSON.parse(event.body) : {};

    // ✅ GET - list or single record
    if (event.httpMethod === "GET") {
      if (recordId) {
        response = await supabase
          .from(tableId)
          .select("*")
          .eq("id", Number(recordId))
          .single();
      } else {
        response = await supabase.from(tableId).select("*");
      }
    }

    // ✅ POST - create new record
    if (event.httpMethod === "POST") {
      response = await supabase
        .from(tableId)
        .insert(body)
        .select()
        .single();
    }

    // ✅ PATCH - update existing record
    if (event.httpMethod === "PATCH") {
      if (!recordId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Missing id for PATCH" }),
        };
      }
      response = await supabase
        .from(tableId)
        .update(body)
        .eq("id", Number(recordId))
        .select()
        .single();
    }

    // ✅ DELETE - remove a record
    if (event.httpMethod === "DELETE") {
      if (!recordId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Missing id for DELETE" }),
        };
      }
      response = await supabase
        .from(tableId)
        .delete()
        .eq("id", Number(recordId));
    }

    // If method is not handled
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
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Failed to process request" }),
    };
  }
};
