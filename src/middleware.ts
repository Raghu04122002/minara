
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabase = (supabaseUrl && supabaseAnonKey) ? createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    ) : null;

    let user = null;

    // Auth Bypass for Local Development without Supabase
    if (!supabase) {
        console.warn('[MIDDLEWARE] Supabase URL missing. Engaging local auth bypass.');
        user = { id: 'local-admin', email: 'admin@local.dev' };
    } else {
        try {
            const { data } = await supabase.auth.getUser();
            user = data.user;
        } catch (e) {
            console.error('[MIDDLEWARE] Supabase Auth Error:', e);
        }
    }

    const pathname = request.nextUrl.pathname

    // ─── Public routes (no auth required) ───
    const isPublicRoute =
        pathname.startsWith('/org/') ||
        pathname.startsWith('/e/') ||
        pathname.startsWith('/api/webhooks/') ||
        pathname === '/login' ||
        pathname.startsWith('/_next') ||
        pathname === '/favicon.ico'

    // ─── Admin routes (auth required) ───
    const isAdminRoute = pathname.startsWith('/admin')

    // If user is NOT logged in and trying to access admin
    if (!user && isAdminRoute) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // If user IS logged in and trying to access login, go to admin
    if (user && pathname === '/login') {
        return NextResponse.redirect(new URL('/admin', request.url))
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
