<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Arquitetura

- Dados: SQL puro em `src/lib/rpg/store.server.ts` via `src/lib/db.server.ts`, que executa através da função `public.exec_sql` (service role) — a Data API do Cloud não expõe SQL bruto e o restante do app já era escrito em SQL.
- Autenticação: Lovable Cloud (e-mail/senha + Google). Sessão no cliente por `useSession` (`src/lib/rpg/hooks.ts`); server functions protegidas por `requireSupabaseAuth`.
