import fetch from "node-fetch";

export default async function handler(req, res) {
  // 1. Ambil API KEY dari Vercel
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "API_KEY tidak ditemukan di server",
    });
  }

  try {
    // 2. Panggil Google Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Buatkan 5 soal pilihan ganda IPA kelas 5 tentang sistem peredaran darah",
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    // 3. Kirim hasil ke frontend
    res.status(200).json({
      result: data.candidates?.[0]?.content?.parts?.[0]?.text || "Tidak ada hasil",
    });
  } catch (error) {
    res.status(500).json({
      error: "Gagal memanggil Google Gemini",
    });
  }
}
