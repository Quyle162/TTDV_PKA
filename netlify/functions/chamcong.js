const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbydnJPWq0gqhA2m1OJM6NgcyxMSHktAVTBxTUZqs_0cKBRa20PjA8JpTj0W4o0-DRd-RA/exec"
exports.handler = async function (event) {
  // Cho phép preflight nếu cần
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        status: "error",
        message: "Method not allowed",
      }),
    };
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: event.body,
    });

    const text = await response.text();

    return {
      statusCode: response.ok ? 200 : response.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
      body: text,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        status: "error",
        message: error.message,
      }),
    };
  }
};