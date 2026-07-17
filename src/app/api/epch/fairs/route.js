import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://epchonline.in/api/virtual/sendfairname', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`EPCH fairs API returned ${res.status}`);
    const data = await res.json();

    // Transform { "965": "61ST IHGF...", "970": "62ND IHGF..." } → sorted array (newest first)
    const fairs = Object.entries(data.fairdata || {})
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => Number(b.id) - Number(a.id));

      console.log("testing", fairs);
    return NextResponse.json({ fairs });
  } catch (err) {
    console.error('[GET /api/epch/fairs]', err);
    return NextResponse.json({ error: err.message, fairs: [] }, { status: 500 });
  }
}
