import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const GEMINI_API_KEY = "AIzaSyCTyytB6bRxvG0Y9UDQeUyNU2KSpsN6-98";

// Endpoint para gerar perguntas
app.post("/generate-questions", async (req, res) => {
  try {
    const { userPrompt } = req.body;

    const systemPrompt = `
      Você é um especialista em pedagogia e criação de atividades para o ensino fundamental.
      Crie 10 questões baseadas no prompt do usuário.
      Cada item deve conter:
      - question_text
      - image_prompt (descrição em inglês para gerar imagem)
      - question_type: 'alternativas', 'ligue', 'escrever', 'marcar x'
      - options (array)
      Retorne APENAS JSON válido.
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    const data = await response.json();
    const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    res.json(JSON.parse(jsonText));
  } catch (err) {
    console.error("Erro ao gerar questões:", err);
    res.status(500).json({ error: "Erro ao gerar questões", details: err.message });
  }
});

// Endpoint para gerar imagem
app.post("/generate-image", async (req, res) => {
  try {
    const { imagePrompt } = req.body;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-2.0:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${imagePrompt}, cute cartoon for kids, colorful, simple background`
            }]
          }]
        }),
      }
    );

    const result = await response.json();
    console.log("Image API Response:", JSON.stringify(result, null, 2));
    
    const base64 = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64) {
      console.log("Erro: Sem base64 na resposta");
      return res.status(500).json({ error: "Falha ao gerar imagem", details: result });
    }

    res.json({ imageUrl: `data:image/png;base64,${base64}` });
  } catch (err) {
    console.error("Erro ao gerar imagem:", err);
    res.status(500).json({ error: "Erro ao gerar imagem", details: err.message });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Inicia servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));