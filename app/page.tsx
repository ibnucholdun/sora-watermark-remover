"use client";

import { useState } from "react";

interface BatchResult {
  id: string;
  url: string;
  status: "loading" | "success" | "error";
  error?: string;
}

export default function SoraDownloader() {
  const [activeTab, setActiveTab] = useState<"single" | "batch">("single");
  const [url, setUrl] = useState("");
  const [urls, setUrls] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const extractId = (input: string) => {
    const match = input.match(/s_[a-zA-Z0-9]+/);
    return match ? match[0] : null;
  };

  const downloadVideo = async (videoUrl: string, filename: string) => {
    setDownloading(filename);
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlBlob;
      a.download = `${filename}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(urlBlob);
      document.body.removeChild(a);
    } catch (err) {
      alert("Gagal mengunduh video secara langsung.");
    } finally {
      setDownloading(null);
    }
  };

  const handleSingleProcess = async () => {
    setLoading(true);
    setError("");
    setVideoUrl(null);
    try {
      const soraId = extractId(url);
      if (!soraId) throw new Error("URL Sora tidak valid.");
      const response = await fetch(`/api/proxy?id=${soraId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal memproses.");
      if (data.mp4) setVideoUrl(data.mp4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchProcess = async () => {
    setLoading(true);
    const urlList = urls.split("\n").filter((line) => line.trim() !== "");
    const initialResults: BatchResult[] = urlList.map((u) => ({
      id: extractId(u) || "Invalid ID",
      url: "",
      status: "loading",
    }));
    setBatchResults(initialResults);

    const updatedResults = [...initialResults];
    for (let i = 0; i < urlList.length; i++) {
      const soraId = extractId(urlList[i]);
      if (!soraId) {
        updatedResults[i] = {
          ...updatedResults[i],
          status: "error",
          error: "Format salah",
        };
        continue;
      }
      try {
        const response = await fetch(`/api/proxy?id=${soraId}`);
        const data = await response.json();
        if (response.ok && data.mp4) {
          updatedResults[i] = {
            ...updatedResults[i],
            status: "success",
            url: data.mp4,
          };
        } else {
          updatedResults[i] = {
            ...updatedResults[i],
            status: "error",
            error: "Gagal",
          };
        }
      } catch {
        updatedResults[i] = {
          ...updatedResults[i],
          status: "error",
          error: "Timeout",
        };
      }
      setBatchResults([...updatedResults]);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-12 px-6 font-sans">
      <div className="max-w-3xl w-full space-y-6 bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-blue-400">
            Sora AI Downloader
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-700 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("single")}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${activeTab === "single" ? "bg-blue-600 text-white shadow" : "text-gray-400"}`}
          >
            Single
          </button>
          <button
            onClick={() => setActiveTab("batch")}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${activeTab === "batch" ? "bg-blue-600 text-white shadow" : "text-gray-400"}`}
          >
            Batch
          </button>
        </div>

        {/* --- UI SINGLE --- */}
        {activeTab === "single" && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Masukkan URL Sora..."
              className="w-full p-4 rounded-lg bg-gray-700 border border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              onClick={handleSingleProcess}
              disabled={loading || !url}
              className="w-full bg-blue-600 hover:bg-blue-500 p-4 rounded-lg font-bold disabled:opacity-50 transition-colors"
            >
              {loading ? "Memproses..." : "Hapus WM & Preview"}
            </button>
            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-500/50">
                {error}
              </div>
            )}
            {videoUrl && (
              <div className="mt-6 space-y-4 animate-in fade-in">
                <div className="aspect-video rounded-xl overflow-hidden border border-gray-600 bg-black">
                  <video
                    src={videoUrl}
                    controls
                    className="w-full h-full"
                    autoPlay
                  />
                </div>
                <button
                  onClick={() =>
                    downloadVideo(videoUrl, `Sora_${extractId(url)}`)
                  }
                  disabled={!!downloading}
                  className="w-full p-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold transition-all disabled:bg-gray-600"
                >
                  {downloading ? "Downloading..." : "Download Langsung (MP4)"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- UI BATCH --- */}
        {activeTab === "batch" && (
          <div className="space-y-4">
            <textarea
              placeholder="Masukkan banyak URL Sora (satu per baris)..."
              rows={6}
              className="w-full p-4 rounded-lg bg-gray-700 border border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
            />
            <button
              onClick={handleBatchProcess}
              disabled={loading || !urls}
              className="w-full bg-blue-600 hover:bg-blue-500 p-4 rounded-lg font-bold disabled:opacity-50 transition-colors"
            >
              {loading
                ? "Memproses Batch..."
                : `Proses ${urls.split("\n").filter((l) => l.trim()).length} URL`}
            </button>

            {/* List Hasil Batch dengan No Urut */}
            <div className="mt-6 space-y-2 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {batchResults.map((res, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl border border-gray-600 hover:border-gray-500 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Nomor Urut */}
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-600 text-xs font-bold text-gray-300 border border-gray-500">
                      {index + 1}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                        ID Video
                      </span>
                      <span className="text-blue-300 font-mono text-sm truncate max-w-[150px] md:max-w-xs">
                        {res.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {res.status === "loading" && (
                      <div className="text-blue-400 animate-pulse text-xs font-semibold">
                        Memproses...
                      </div>
                    )}
                    {res.status === "error" && (
                      <div className="text-red-400 text-xs font-medium bg-red-900/20 px-2 py-1 rounded border border-red-500/30">
                        {res.error}
                      </div>
                    )}
                    {res.status === "success" && (
                      <button
                        onClick={() => downloadVideo(res.url, `Sora_${res.id}`)}
                        disabled={downloading === `Sora_${res.id}`}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-bold transition-all disabled:bg-gray-600 shadow-lg"
                      >
                        {downloading === `Sora_${res.id}`
                          ? "DOWNLOADING..."
                          : "DOWNLOAD"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
