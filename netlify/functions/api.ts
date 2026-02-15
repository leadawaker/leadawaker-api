import type { Handler } from "@netlify/functions";
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;  // service_role key

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    };
  }

  const tableId = event.queryStringParameters?.tableId;  // 'leads', 'accounts'
  const recordId = event.queryStringParameters?.id;

  if (!tableId) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing tableId" }) };
  }

  try {
    switch (event.httpMethod) {
      case 'GET':
        if (recordId) {
          const { data, error } = await supabase.from(tableId).select('*').eq('id', recordId).single();
          if (error) throw error;
          return { statusCode: 200, body: JSON.stringify(data) };
        }
        const { data, error } = await supabase.from(tableId).select('*');
        if (error) throw error;
        return { statusCode: 200, body: JSON.stringify(data) };

      case 'POST':
        const { data: insertData, error: insertError } = await supabase
          .from(tableId)
          .insert(JSON.parse(event.body || '{}'));
        if (insertError) throw insertError;
        return { statusCode: 201, body: JSON.stringify(insertData) };

      case 'PATCH':
        if (!recordId) return { statusCode: 400, body: JSON.stringify({ error: "Missing id" }) };
        const { data: updateData, error: updateError } = await supabase
          .from(tableId)
          .update(JSON.parse(event.body || '{}'))
          .eq('id', recordId);
        if (updateError) throw updateError;
        return { statusCode: 200, body: JSON.stringify(updateData) };

      case 'DELETE':
        if (!recordId) return { statusCode: 400, body: JSON.stringify({ error: "Missing id" }) };
        const { error: deleteError } = await supabase
          .from(tableId)
          .delete()
          .eq('id', recordId);
        if (deleteError) throw deleteError;
        return { statusCode: 204 };

      default:
        return { statusCode: 405 };
    }
  } catch (err: any) {
    console.error("Supabase error:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
