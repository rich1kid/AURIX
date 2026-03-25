export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  const startTime = Date.now();

  // 🔒 timeout protection
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    // 🔥 PRIMARY: OpenAI
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: message }]
      })
    });

    clearTimeout(timeout);

    if (!openaiRes.ok) throw new Error("OpenAI failed");

    const data = await openaiRes.json();

    console.log("✅ OpenAI used", Date.now() - startTime, "ms");

    return res.status(200).json({
      reply: data.choices[0].message.content,
      provider: "openai"
    });

  } catch (err) {
    console.error("❌ OpenAI failed → switching", err.message);

    try {
      // 🧠 FALLBACK: Hugging Face
      const hfRes = await fetch(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.HF_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ inputs: message })
        }
      );

      if (!hfRes.ok) throw new Error("HF failed");

      const hfData = await hfRes.json();

      console.log("⚠️ HuggingFace fallback used");

      return res.status(200).json({
        reply: hfData[0]?.generated_text || "Fallback response",
        provider: "huggingface"
      });

    } catch (hfErr) {
      console.error("💀 BOTH FAILED", hfErr.message);

      return res.status(500).json({
        error: "AI system unavailable"
      });
    }
  }
  }
