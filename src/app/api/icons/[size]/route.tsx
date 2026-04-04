import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeParam } = await params;
  const size = parseInt(sizeParam, 10);

  if (!size || size < 16 || size > 1024) {
    return new Response('Invalid size', { status: 400 });
  }

  const s = (n: number) => Math.round(n * (size / 512));
  const r = (n: number) => Math.round(n * (size / 512));

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: '#0A0A0A',
          borderRadius: r(96),
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Left outer plate */}
        <div style={{ position: 'absolute', left: s(36), top: s(184), width: s(52), height: s(144), background: '#FF5722', borderRadius: r(14) }} />
        {/* Left inner plate */}
        <div style={{ position: 'absolute', left: s(96), top: s(210), width: s(36), height: s(92), background: '#FF5722', borderRadius: r(10) }} />
        {/* Left collar */}
        <div style={{ position: 'absolute', left: s(140), top: s(226), width: s(18), height: s(60), background: '#666', borderRadius: r(6) }} />
        {/* Bar */}
        <div style={{ position: 'absolute', left: s(158), top: s(238), width: s(196), height: s(36), background: '#999', borderRadius: r(8) }} />
        {/* Right collar */}
        <div style={{ position: 'absolute', left: s(354), top: s(226), width: s(18), height: s(60), background: '#666', borderRadius: r(6) }} />
        {/* Right inner plate */}
        <div style={{ position: 'absolute', left: s(380), top: s(210), width: s(36), height: s(92), background: '#FF5722', borderRadius: r(10) }} />
        {/* Right outer plate */}
        <div style={{ position: 'absolute', left: s(424), top: s(184), width: s(52), height: s(144), background: '#FF5722', borderRadius: r(14) }} />
      </div>
    ),
    { width: size, height: size }
  );
}
