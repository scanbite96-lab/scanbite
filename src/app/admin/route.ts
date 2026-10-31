import { NextResponse } from 'next/server';

export function GET() {
  return new NextResponse('404 Not Found', { status: 404 });
}
