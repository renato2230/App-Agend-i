import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  try {
    // Verificar se há um cookie de sessão de teste
    const testSession = req.cookies.get("test_session")?.value === "admin"

    // Se for o usuário de teste e estiver tentando acessar o dashboard
    if (testSession && req.nextUrl.pathname.startsWith("/dashboard")) {
      return res
    }

    // Se estiver em modo de desenvolvimento ou preview, permitir acesso sem redirecionamento
    if (process.env.NODE_ENV === "development" || req.headers.get("x-vercel-deployment-url")) {
      return res
    }

    const supabase = createMiddlewareClient({ req, res })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Se o usuário não estiver autenticado e tentar acessar o dashboard, redireciona para a página de login
    if (!session && req.nextUrl.pathname.startsWith("/dashboard")) {
      const redirectUrl = new URL("/", req.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Se o usuário estiver autenticado e tentar acessar a página de login, redireciona para o dashboard
    if (session && req.nextUrl.pathname === "/") {
      const redirectUrl = new URL("/dashboard", req.url)
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error("Middleware error:", error)
    // Em caso de erro, permitir o acesso e deixar que o componente de página lide com a autenticação
    return res
  }
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
}
