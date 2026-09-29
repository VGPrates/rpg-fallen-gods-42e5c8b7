import { useMemo, useRef, useState } from "react";
import { Loader2, Settings2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { GameIcon, useIconRegistry } from "@/components/game-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ICON_CATEGORIES,
  ICON_CATEGORY_LABEL,
  createCustomIcon,
  deleteCustomIcon,
  normalizeIconFile,
  type IconCategory,
} from "@/lib/rpg/icons";
import { cn } from "@/lib/utils";

/**
 * Icon picker split in shelves (gear / buffs & debuffs / conditions).
 * The GM can import new art: it is centre-cropped to the standard square
 * canvas so every icon keeps the same weight on screen.
 */
export function IconPicker({
  value,
  onChange,
  defaultCategory = "equipment",
  canImport = true,
}: {
  value: string;
  onChange: (key: string) => void;
  defaultCategory?: IconCategory;
  canImport?: boolean;
}) {
  const icons = useIconRegistry();
  const [tab, setTab] = useState<IconCategory>(defaultCategory);
  const [importing, setImporting] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ key: string; label: string } | null>(null);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<IconCategory>(defaultCategory);
  const fileRef = useRef<HTMLInputElement>(null);

  const shelf = useMemo(() => icons.filter((i) => i.category === tab), [icons, tab]);
  const managedIcons = icons;

  async function importIcon() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Escolha uma imagem.");
      return;
    }
    if (!label.trim()) {
      toast.error("Dê um nome ao ícone.");
      return;
    }
    setImportBusy(true);
    try {
      const dataUrl = await normalizeIconFile(file);
      const key = await createCustomIcon({ label: label.trim(), category, dataUrl });
      setTab(category);
      onChange(key);
      setLabel("");
      if (fileRef.current) fileRef.current.value = "";
      setImporting(false);
      toast.success("Ícone importado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao importar o ícone.");
    } finally {
      setImportBusy(false);
    }
  }

  async function removeIcon(key: string) {
    setDeletingKey(key);
    try {
      await deleteCustomIcon(key);
      if (value === key) {
        const remaining = icons.filter((icon) => icon.key !== key);
        onChange(remaining[0]?.key ?? "");
      }
      setPendingDelete(null);
      toast.success("Ícone removido.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao remover o ícone.");
    } finally {
      setDeletingKey(null);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label>Ícone</Label>
        {canImport ? (
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setManageOpen(true)}>
              <Settings2 className="size-3.5" />
              Gerenciar ícones
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setImporting((v) => !v)}>
              <Upload className="size-3.5" />
              Importar
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg bg-surface p-1 shadow-border">
        {ICON_CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setTab(c.key)}
            className={cn(
              "min-h-9 flex-1 rounded-md px-2 text-xs transition-colors duration-150",
              tab === c.key ? "bg-elevated text-fg" : "text-muted hover:text-fg",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex items-start gap-2">
        <span className="grid size-14 shrink-0 place-items-center rounded-md bg-bg/50 text-fg ring-1 ring-ring/40">
          <GameIcon name={value} className="size-11" />
        </span>
        <div className="flex flex-1 flex-wrap gap-1.5 rounded-lg bg-bg/30 p-2">
          {shelf.length === 0 ? (
            <p className="px-1 py-2 text-xs text-subtle">Nenhum ícone nesta categoria.</p>
          ) : null}
          {shelf.map((i) => {
            const selected = value === i.key;
            return (
              <span key={i.key} className="relative">
                <button
                  type="button"
                  title={i.label}
                  aria-label={i.label}
                  aria-pressed={selected}
                  onClick={() => onChange(i.key)}
                  className={cn(
                    "grid size-11 place-items-center rounded-md text-muted transition-colors duration-150",
                    selected
                      ? "bg-elevated text-fg ring-2 ring-primary shadow-[0_0_12px_-4px_var(--color-primary)]"
                      : "ring-1 ring-border/60 hover:bg-surface hover:text-fg",
                  )}
                >
                  <GameIcon name={i.key} className="size-8" />
                </button>
              </span>
            );
          })}
        </div>
      </div>

      {importing && canImport ? (
        <div className="grid gap-2 rounded-lg bg-surface p-3 shadow-border">
          <p className="text-xs text-subtle">
            A imagem é recortada no centro e ajustada ao tamanho padrão dos ícones, sem deformar.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="icon-import-label">Nome do ícone</Label>
              <Input
                id="icon-import-label"
                value={label}
                maxLength={40}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex.: Lança élfica"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="icon-import-cat">Categoria</Label>
              <Select
                id="icon-import-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as IconCategory)}
              >
                {ICON_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {ICON_CATEGORY_LABEL[c.key]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-elevated file:px-3 file:py-2 file:text-xs file:text-fg"
          />
          <div className="flex gap-2">
            <Button type="button" onClick={() => void importIcon()} disabled={importBusy}>
              {importBusy ? <Loader2 className="size-4 animate-spin" /> : null}
              Importar
            </Button>
            <Button type="button" variant="ghost" onClick={() => setImporting(false)} disabled={importBusy}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto border-border bg-surface text-fg">
          <DialogHeader>
            <DialogTitle className="font-display">Gerenciar ícones</DialogTitle>
            <DialogDescription className="text-muted">Exclua os ícones que não deseja mais usar, importados ou originais.</DialogDescription>
          </DialogHeader>
          {managedIcons.length === 0 ? (
            <p className="rounded-md bg-bg/40 px-3 py-6 text-center text-sm text-subtle">Nenhum ícone disponível.</p>
          ) : (
            <div className="grid gap-4">
              {ICON_CATEGORIES.map((iconCategory) => {
                const items = managedIcons.filter((icon) => icon.category === iconCategory.key);
                if (items.length === 0) return null;
                return (
                  <section key={iconCategory.key} className="grid gap-2">
                    <h3 className="text-xs tracking-[0.14em] text-subtle uppercase">{iconCategory.label}</h3>
                    <ul className="grid gap-1.5">
                      {items.map((icon) => (
                        <li key={icon.key} className="flex min-h-14 items-center gap-3 rounded-md bg-bg/40 px-2.5 py-2 shadow-border">
                          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-elevated">
                            <GameIcon name={icon.key} className="size-8" />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm">{icon.label}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={deletingKey === icon.key}
                            onClick={() => setPendingDelete({ key: icon.key, label: icon.label })}
                            className="text-muted hover:text-hp-bright"
                          >
                            {deletingKey === icon.key ? <Loader2 className="animate-spin" /> : <Trash2 />}
                            Excluir
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => { if (!open && !deletingKey) setPendingDelete(null); }}>
        <AlertDialogContent className="border-border bg-surface text-fg">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Excluir {pendingDelete?.label}?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted">
              Este ícone deixará de aparecer na seleção. Itens que já o utilizam mostrarão o ícone padrão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingKey !== null}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={!pendingDelete || deletingKey !== null}
              onClick={(event) => {
                event.preventDefault();
                if (pendingDelete) void removeIcon(pendingDelete.key);
              }}
              className="bg-hp text-fg hover:bg-hp/90"
            >
              {deletingKey ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
