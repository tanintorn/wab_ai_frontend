"use client";
import { useRef, useState, useCallback } from "react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [results, setResults] = useState<any[]>([]);
  const [running, setRunning] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  // เปิดกล้อง
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) videoRef.current.srcObject = stream;
  };

  // จับภาพ + ส่ง AI
  const capture = useCallback(async () => {
    const canvas = canvasRef.current!;
    const video = videoRef.current!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const form = new FormData();
      form.append("file", blob, "frame.jpg");

      const res = await fetch(`${BACKEND_URL}/predict`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      setResults(data.result);
    }, "image/jpeg");
  }, [BACKEND_URL]);

  // Loop อัตโนมัติ
  const toggleAuto = () => {
    if (running) {
      setRunning(false);
    } else {
      setRunning(true);
      const loop = setInterval(() => capture(), 1000); // ทุก 1 วิ
      // TODO: เก็บ interval id ไว้ clearInterval
    }
  };

  return (
    <main className="flex flex-col items-center gap-4 p-8">
      <h1 className="text-2xl font-bold">AI Camera Detection</h1>
      <video ref={videoRef} autoPlay className="rounded-lg w-full max-w-lg" />
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex gap-2">
        <button onClick={startCamera} className="px-4 py-2 bg-blue-500 text-white rounded">เปิดกล้อง</button>
        <button onClick={capture} className="px-4 py-2 bg-green-500 text-white rounded">จับภาพ</button>
      </div>
      <div className="w-full max-w-lg">
        {results.map((r, i) => (
          <div key={i} className="p-2 border rounded mb-1">
            <strong>{r.class}</strong> — {(r.confidence * 100).toFixed(1)}%
          </div>
        ))}
      </div>
    </main>
  );
}