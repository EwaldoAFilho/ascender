import { NextResponse, type NextRequest } from "next/server";

// Mantido como literal (em vez de importar de lib/auth/session) para não
// arrastar iron-session/next-headers para o bundle Edge do middleware.
const SESSION_COOKIE = "ascender_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas: tela de login, endpoint de login e healthcheck (liveness).
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth/login") ||
    pathname === "/api/health"
  ) {
    return NextResponse.next();
  }

  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }

  // Sem sessão: APIs respondem 401; páginas redirecionam para /login.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Aplica a tudo, exceto assets estáticos e os logos em /brand.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand).*)"],
};
