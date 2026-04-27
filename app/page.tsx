"use client";
import { useRef, useState, useEffect, useCallback } from "react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [results, setResults] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<any>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) videoRef.current.srcObject = stream;
  };

  const capture = useCallback(async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.videoWidth === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const form = new FormData();
      form.append("file", blob, "frame.jpg");
      try {
        const res = await fetch(`${BACKEND_URL}/predict`, {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        setResults(data.result);
      } catch (e) {
        console.error(e);
      }
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