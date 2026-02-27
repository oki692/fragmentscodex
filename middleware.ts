import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const response = NextResponse.next()
  
  // Remove CORS restrictions
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', '*')
  response.headers.set('Access-Control-Allow-Headers', '*')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  
  // Remove iframe restrictions
  response.headers.delete('X-Frame-Options')
  response.headers.delete('Content-Security-Policy')
  
  return response
}

export const config = {
  matcher: '/s/:path*',
}
