import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const soraId = searchParams.get("id");

  if (!soraId) {
    return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });
  }

  try {
    const response = await fetch(`${process.env.API_URL}/${soraId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Gagal mengambil data dari API pusat" },
        { status: 500 },
      );
    }

    const data = await response.json();

    return NextResponse.json({
      mp4: data.links?.mp4 || null,
      title: data.post_info?.title || "Sora Video",
    });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
