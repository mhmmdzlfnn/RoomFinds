import { NextRequest, NextResponse } from 'next/server';
const roles: Record<string,string[]> = { '/user':['USER'], '/pemilik':['PEMILIK'], '/admin':['SUPERADMIN'] };
export async function middleware(request: NextRequest) {
  const pathname=request.nextUrl.pathname;
  if(process.env.NEXT_PUBLIC_USE_MOCK==='true') return NextResponse.next();
  const hasSession=request.cookies.has('JSESSIONID');
  const isPublicAuthPage=pathname==='/login'||pathname==='/daftar';
  const loginUrl=new URL('/login',request.url);
  if(pathname==='/user/booking/baru') loginUrl.searchParams.set('next',`${pathname}${request.nextUrl.search}`);
  if(!hasSession) return isPublicAuthPage ? NextResponse.next() : NextResponse.redirect(loginUrl);
  try {
    const response=await fetch(`${process.env.API_INTERNAL_URL??'http://localhost:8080'}/api/profil`,{headers:{cookie:request.headers.get('cookie')??''},cache:'no-store'});
    if(!response.ok) { const res=NextResponse.redirect(loginUrl); res.cookies.delete('JSESSIONID'); return res; }
    const profile=await response.json() as {peran:string};
    for(const [prefix,allowed] of Object.entries(roles)) if(pathname.startsWith(prefix)&&!allowed.includes(profile.peran)) return NextResponse.redirect(new URL(profile.peran==='PEMILIK'?'/pemilik':profile.peran==='SUPERADMIN'?'/admin':'/user/booking',request.url));
    if(isPublicAuthPage) return NextResponse.redirect(new URL(profile.peran==='PEMILIK'?'/pemilik':profile.peran==='SUPERADMIN'?'/admin':'/user/booking',request.url));
  } catch {
    if(isPublicAuthPage) return NextResponse.next();
    loginUrl.searchParams.set('status','api-unavailable');
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}
export const config={matcher:['/user/:path*','/pemilik/:path*','/admin/:path*','/login','/daftar']};
