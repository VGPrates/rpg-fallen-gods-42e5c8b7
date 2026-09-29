import { supabase } from "@/integrations/supabase/client";

/**
 * Encerra a sessão. O redirecionamento fica a cargo de quem chama
 * (o menu do perfil leva para /login).
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export { supabase };
