"use client";
import { useRef, useState, useEffect, useCallback } from "react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const capture = useCallback(async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.videoWidth === 0) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const form = new FormData();
      form.append("file", blob, "frame.jpg");
      try {
        const res = await fetch(BACKEND_URL + "/predict", { method: "POST", body: form });
        const data = await res.json();
        setResults(data.result);
      } catch (e) { console.error(e); }
    }, "image/jpeg");
  }, [BACKEND_URL]);

  const toggleDetection = () => {
    if (running) {
      clearInterval(intervalRef.current);
      setRunning(false);
      setResults([]);
    } else {
      setRunning(true);
      intervalRef.current = setInterval(capture, 1000);
    }
  };

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    });
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1>AI Camera Detection</h1>
      <video ref={videoRef} autoPlay playsInline style={{ width: "100%", maxWidth: 640, borderRadius: 8 }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <br />
      <button onClick={toggleDetection} style={{ marginTop: 10, padding: "10px 24px", fontSize: 16, background: running ? "#e53e3e" : "#38a169", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
        {running ? "หยุด" : "เริ่มตรวจจับ"}
      </button>
      <div style={{ marginTop: 16 }}>
        {results.map((r, i) => (
          <div key={i} style={{ padding: 10, marginBottom: 8, background: "#f0fff4", border: "1px solid #68d391", borderRadius: 8 }}>
            <strong>{r.class}</strong> - {(r.confidence * 100).toFixed(1)}%
          </div>
        ))}
      </div>
    </main>
  );
}