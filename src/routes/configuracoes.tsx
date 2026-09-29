import { useRef, useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { translateAuthError } from "@/routes/login";
import { LoadingScreen } from "@/components/app-chrome";
import { ProfileAvatar, fileToAvatarDataUrl, AVATAR_ACCEPTED, AVATAR_MAX_BYTES } from "@/components/avatar-editor";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMyAvatar } from "@/lib/rpg/api";
import { useRpgState, useSession } from "@/lib/rpg/hooks";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações da conta — RPG Fallen Gods" },
      {
        name: "description",
        content: "Altere sua foto de perfil, sua senha e o e-mail da sua conta.",
      },
      { property: "og:title", content: "Configurações da conta — RPG Fallen Gods" },
      {
        property: "og:description",
        content: "Altere sua foto de perfil, sua senha e o e-mail da sua conta.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, isPending: authPending } = useSession();
  const { data, isPending } = useRpgState(!!user);

  if (authPending || (user && isPending)) return <LoadingScreen label="Abrindo suas configurações..." />;
  if (!user) return <Navigate to="/login" />;

  return (
    <main className="mx-auto grid w-full max-w-2xl gap-5 px-4 py-8 pb-24">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          aria-label="Voltar"
          className="grid size-10 place-items-center rounded-md text-muted hover:bg-elevated hover:text-fg"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <p className="text-xs tracking-[0.24em] text-muted uppercase">Sua conta</p>
          <h1 className="font-display text-2xl">Configurações</h1>
        </div>
      </div>

      <AvatarSection
        displayName={data?.profile?.displayName ?? user.user_metadata.name ?? user.email}
        avatarUrl={data?.profile?.avatarUrl ?? null}
        hasProfile={!!data?.profile}
      />
      <PasswordSection />
      <EmailSection currentEmail={user.email} />
    </main>
  );
}

function AvatarSection({
  displayName,
  avatarUrl,
  hasProfile,
}: {
  displayName: string;
  avatarUrl: string | null;
  hasProfile: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const mut = useMutation({
    mutationFn: (avatar: string | null) => updateMyAvatar(avatar),
    onSuccess: (_res, avatar) => {
      toast.success(avatar ? "Foto de perfil atualizada." : "Foto de perfil removida.");
      void queryClient.invalidateQueries({ queryKey: ["rpg-state"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!AVATAR_ACCEPTED.includes(file.type)) {
      toast.error("Formato não suportado. Use PNG, JPG ou WEBP.");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error("A imagem deve ter no máximo 5 MB.");
      return;
    }
    try {
      mut.mutate(await fileToAvatarDataUrl(file));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao processar a imagem.");
    }
  }

  return (
    <Card className="p-6">
      <CardHeader className="p-0">
        <CardTitle className="text-lg">Foto de perfil</CardTitle>
        <CardDescription>PNG, JPG ou WEBP · até 5 MB. A imagem é recortada em quadrado.</CardDescription>
      </CardHeader>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <ProfileAvatar
          profile={{ avatarUrl, displayName }}
          size="lg"
          className={mut.isPending ? "animate-pulse" : ""}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={mut.isPending || !hasProfile}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-4" />
            {avatarUrl ? "Trocar foto" : "Adicionar foto"}
          </Button>
          {avatarUrl ? (
            <Button
              type="button"
              variant="ghost"
              disabled={mut.isPending}
              onClick={() => mut.mutate(null)}
            >
              <Trash2 className="size-4" />
              Remover
            </Button>
          ) : null}
        </div>
      </div>
      {!hasProfile ? (
        <p className="mt-3 text-xs text-subtle">
          Escolha seu papel na mesa para poder definir a foto de perfil.
        </p>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </Card>
  );
}

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!currentPassword) {
      toast.error("Informe a senha atual.");
      return;
    }
    if (password.length < 6) {
      toast.error("A nova senha precisa ter ao menos 6 caracteres.");
      return;
    }
    if (password !== confirmation) {
      toast.error("A nova senha e a confirmação não são iguais.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
        current_password: currentPassword,
      } as { password: string; current_password: string });
      if (error) throw error;
      toast.success("Senha alterada com sucesso.");
      setCurrentPassword("");
      setPassword("");
      setConfirmation("");
    } catch (err) {
      toast.error(translateAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-6">
      <CardHeader className="p-0">
        <CardTitle className="text-lg">Alterar senha</CardTitle>
        <CardDescription>
          Confirme a senha atual e escolha a nova. Nada é guardado no navegador.
        </CardDescription>
      </CardHeader>
      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-1.5">
          <Label htmlFor="current-password">Senha atual</Label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Nova senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="confirmation">Confirmar nova senha</Label>
          <Input
            id="confirmation"
            type="password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div>
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Salvar nova senha
          </Button>
        </div>
      </form>
    </Card>
  );
}

function EmailSection({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const address = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    if (address === currentEmail.toLowerCase()) {
      toast.error("Este já é o e-mail da sua conta.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser(
        { email: address },
        { emailRedirectTo: window.location.origin },
      );
      if (error) throw error;
      toast.success(
        "Enviamos um link de confirmação para o novo e-mail. A troca vale após a confirmação.",
      );
      setEmail("");
    } catch (err) {
      const message = translateAuthError(err);
      toast.error(
        /já existe|already/i.test(message)
          ? "Este e-mail já está sendo usado por outra conta."
          : message,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-6">
      <CardHeader className="p-0">
        <CardTitle className="text-lg">Alterar e-mail</CardTitle>
        <CardDescription>
          E-mail atual: <strong>{currentEmail}</strong>
        </CardDescription>
      </CardHeader>
      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-1.5">
          <Label htmlFor="new-email">Novo e-mail</Label>
          <Input
            id="new-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            autoComplete="email"
          />
        </div>
        <div>
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Salvar novo e-mail
          </Button>
        </div>
      </form>
    </Card>
  );
}
