import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getLibrary, getMyState } from "./api";
import { fetchCustomIcons } from "./icons";

export type SessionUser = {
  id: string;
  email: string;
  user_metadata: { name: string };
};

function toSessionUser(session: Session | null): SessionUser | null {
  const user = session?.user;
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as { name?: string; full_name?: string };
  return {
    id: user.id,
    email: user.email ?? "",
    user_metadata: { name: meta.name ?? meta.full_name ?? "" },
  };
}

/** Sessão do usuário logado, sincronizada com a autenticação do Lovable Cloud. */
export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(toSessionUser(session));
      setIsPending(false);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(toSessionUser(data.session));
      setIsPending(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, isPending };
}

export function useRpgState(enabled = true) {
  return useQuery({
    queryKey: ["rpg-state"],
    queryFn: getMyState,
    enabled,
    refetchInterval: 4000,
  });
}

export function useLibrary() {
  return useQuery({ queryKey: ["rpg-library"], queryFn: getLibrary });
}

export function useCustomIcons() {
  return useQuery({ queryKey: ["custom-icons"], queryFn: fetchCustomIcons });
}

export function useTableSync() {
  const qc = useQueryClient();
  useEffect(() => {
    const id = window.setInterval(() => {
      void qc.invalidateQueries({ queryKey: ["rpg-state"] });
    }, 8000);
    return () => window.clearInterval(id);
  }, [qc]);
}
