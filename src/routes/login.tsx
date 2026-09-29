import { useState } from "react";
import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { KeyRound, Loader2, LogIn, Mail, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/lib/rpg/hooks";
import { LoadingScreen } from "@/components/app-chrome";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { mode?: Mode } =>
    search["mode"] === "signup" ? { mode: "signup" } : {},
  head: () => ({
    meta: [
      { title: "Entrar na mesa — RPG Fallen Gods" },
      { name: "description", content: "Acesse sua conta ou crie uma nova para entrar na mesa." },
      { property: "og:title", content: "Entrar na mesa — RPG Fallen Gods" },
      {
        property: "og:description",
        content: "Acesse sua conta ou crie uma nova para entrar na mesa.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { mode: initialMode } = Route.useSearch();
  const { user, isPending } = useSession();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>(initialMode ?? "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentConfirmation, setSentConfirmation] = useState(false);

  if (isPending) return <LoadingScreen label="Conferindo sua sessão..." />;
  if (user) return <Navigate to="/" />;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const address = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha precisa ter ao menos 6 caracteres.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: address,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name: name.trim() || address.split("@")[0] },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSentConfirmation(true);
          toast.success("Conta criada! Confirme o e-mail que acabamos de enviar.");
          return;
        }
        toast.success("Conta criada.");
        void navigate({ to: "/" });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: address,
        password,
      });
      if (error) throw error;
      void navigate({ to: "/" });
    } catch (err) {
      toast.error(translateAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Não foi possível entrar com o Google.");
        return;
      }
      if (result.redirected) return;
      void navigate({ to: "/" });
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    const address = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      toast.error("Digite seu e-mail no campo acima para receber o link.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(address, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      if (error) throw error;
      toast.success("Enviamos um link para redefinir sua senha.");
    } catch (err) {
      toast.error(translateAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  if (sentConfirmation) {
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-4">
        <Card className="w-full p-6 text-center sm:p-8">
          <Mail className="mx-auto size-8 text-muted" />
          <CardTitle className="mt-4 text-xl">Confirme seu e-mail</CardTitle>
          <CardDescription className="mt-2">
            Enviamos um link de confirmação para <strong>{email}</strong>. Depois de confirmar,
            volte aqui e entre normalmente.
          </CardDescription>
          <Button className="mt-6 w-full" onClick={() => setSentConfirmation(false)}>
            Voltar para o login
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-4 py-10">
      <Card className="w-full p-6 sm:p-8">
        <CardHeader className="p-0">
          <p className="text-xs tracking-[0.24em] text-muted uppercase">RPG Fallen Gods</p>
          <CardTitle className="text-2xl">
            {mode === "signin" ? "Entrar na mesa" : "Criar sua conta"}
          </CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "Use seu e-mail e senha para retomar a campanha."
              : "Crie sua conta e escolha seu papel na mesa em seguida."}
          </CardDescription>
        </CardHeader>

        <div className="mt-6 flex gap-1 rounded-xl bg-surface p-1 shadow-border">
          {(["signin", "signup"] as Mode[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={cn(
                "min-h-10 flex-1 rounded-lg px-3 text-sm transition-colors duration-150",
                mode === value ? "bg-elevated text-fg" : "text-muted hover:text-fg",
              )}
            >
              {value === "signin" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          {mode === "signup" ? (
            <div className="grid gap-1.5">
              <Label htmlFor="name">Nome de aventureiro</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como a mesa vai te chamar"
                maxLength={40}
                autoComplete="name"
              />
            </div>
          ) : null}

          <div className="grid gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="No mínimo 6 caracteres"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
            />
          </div>

          <Button type="submit" disabled={busy}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : mode === "signin" ? (
              <LogIn className="size-4" />
            ) : (
              <UserPlus className="size-4" />
            )}
            {mode === "signin" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <div className="mt-4 grid gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={() => void handleGoogle()}>
            Continuar com Google
          </Button>
          {mode === "signin" ? (
            <button
              type="button"
              onClick={() => void handleForgotPassword()}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md text-sm text-muted hover:text-fg"
            >
              <KeyRound className="size-4" />
              Esqueci minha senha
            </button>
          ) : null}
        </div>

        <p className="mt-6 text-center text-xs text-subtle">
          <Link to="/" className="hover:text-fg">
            Voltar para a página inicial
          </Link>
        </p>
      </Card>
    </main>
  );
}

export function translateAuthError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err ?? "");
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (lower.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "Já existe uma conta com este e-mail.";
  }
  if (lower.includes("email address") && lower.includes("invalid")) return "E-mail inválido.";
  if (lower.includes("password should be at least")) {
    return "A senha precisa ter ao menos 6 caracteres.";
  }
  if (lower.includes("current password") || lower.includes("incorrect password")) {
    return "A senha atual está incorreta.";
  }
  if (lower.includes("same password")) return "A nova senha precisa ser diferente da atual.";
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Muitas tentativas. Aguarde um instante e tente de novo.";
  }
  return message || "Não foi possível concluir. Tente novamente.";
}
