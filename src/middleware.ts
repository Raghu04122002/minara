
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
        user = { id: 'local-admin', email: 'admin@local.dev', user_metadata: { role: 'admin' } };
    } else {
        try {
            const { data } = await supabase.auth.getUser();
            user = data.user;
        } catch (e) {
            console.error('[MIDDLEWARE] Supabase Auth Error:', e);
        }
    }

    const pathname = request.nextUrl.pathname;

    const isAdminRoute = pathname.startsWith('/admin');
    const isOrganizerRoute = pathname.startsWith('/organizer') && !pathname.startsWith('/organizer/login') && !pathname.startsWith('/organizer/register');

    if (isAdminRoute) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        // If they have a role, and it's 'organizer', block them from admin!
        if (user.user_metadata && user.user_metadata.role === 'organizer') {
            return NextResponse.redirect(new URL('/organizer/events', request.url));
        }
    }

    if (isOrganizerRoute) {
        if (!user) {
            return NextResponse.redirect(new URL('/organizer/login', request.url));
        }
        // Admin or organizer are both allowed into organizer routes if we want,
        // but typically organizers go here. If we strictly restrict:
        if (user.user_metadata && user.user_metadata.role !== 'organizer' && user.user_metadata.role !== 'admin') {
            // For older admin users without a role, we'll let them in or not. 
            // In a strict setup, we require 'organizer'. Let's let admins access organizer routes too by assuming no role = admin.
        }
    }

    // Redirect logged-in users away from login pages
    if (user && pathname === '/login') {
        const isOrg = user.user_metadata?.role === 'organizer';
        return NextResponse.redirect(new URL(isOrg ? '/organizer/events' : '/admin', request.url));
    }

    if (user && (pathname === '/organizer/login' || pathname === '/organizer/register')) {
        return NextResponse.redirect(new URL('/organizer/events', request.url));
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
