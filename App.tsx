import { useState } from "react";

function App() {
  const [hasil, setHasil] = useState("");
  const [loading, setLoading] = useState(false);

  const generateSoal = async () => {
    setLoading(true);

    const res = await fetch("/api/generate", {
      method: "POST",
    });

    const data = await res.json();
    setHasil(data.result);
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Generate Soal Ujian</h1>

      <button onClick={generateSoal}>
        {loading ? "Memproses..." : "Generate Soal"}
      </button>

      <pre style={{ marginTop: 20, whiteSpace: "pre-wrap" }}>
        {hasil}
      </pre>
    </div>
  );
}

export default App;
