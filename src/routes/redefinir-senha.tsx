import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { translateAuthError } from "@/routes/login";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — RPG Fallen Gods" },
      { name: "description", content: "Escolha uma nova senha para a sua conta." },
      { property: "og:title", content: "Redefinir senha — RPG Fallen Gods" },
      { property: "og:description", content: "Escolha uma nova senha para a sua conta." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 6) {
      toast.error("A senha precisa ter ao menos 6 caracteres.");
      return;
    }
    if (password !== confirmation) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada. Você já pode entrar.");
      void navigate({ to: "/" });
    } catch (err) {
      toast.error(translateAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-4 py-10">
      <Card className="w-full p-6 sm:p-8">
        <CardHeader className="p-0">
          <CardTitle className="text-2xl">Nova senha</CardTitle>
          <CardDescription>
            Abra esta página pelo link enviado ao seu e-mail e escolha a nova senha.
          </CardDescription>
        </CardHeader>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-1.5">
            <Label htmlFor="new-password">Nova senha</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="confirm-password">Confirmar nova senha</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Salvar nova senha
          </Button>
        </form>
      </Card>
    </main>
  );
}
