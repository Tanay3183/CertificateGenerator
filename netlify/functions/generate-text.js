// netlify/functions/generate-text.js

export const handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // 1. Parse the data sent from the frontend
    const data = JSON.parse(event.body);

    // 2. Access the API Key securely from the Server Environment
    // (We will set this variable in the Netlify Dashboard later)
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "Server missing API Key" }) };
    }

    // 3. Prepare the request for Google Gemini
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const prompt = `
      Write a formal, professional, and unique single-paragraph certificate recognition statement (approx 30-40 words) for a student named "${data.name}".
      They are currently studying "${data.instCourse}" at "${data.instName}".
      They have successfully completed the course "${data.webCourse}" on our platform.
      Do not start with "This certifies that". Make it sound appreciative. 
      Only return the paragraph text, nothing else.
    `;

    // 4. Call Google Gemini
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const result = await response.json();
    
    // 5. Send the AI text back to your frontend
    // We check if the AI gave a valid response
    const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text || "Certificate of completion.";

    return {
      statusCode: 200,
      body: JSON.stringify({ text: aiText }),
    };

  } catch (error) {
    console.error("Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate text" }),
    };
  }
};