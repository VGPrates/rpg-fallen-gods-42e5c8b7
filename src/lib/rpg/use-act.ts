import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/** Small wrapper: run an action, toast errors/success, refresh the table state. */
export function useAct() {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: async ({ fn }: { fn: () => Promise<unknown>; ok?: string | undefined }) => fn(),
    onSuccess: async (_d, v) => {
      if (v.ok) toast.success(v.ok);
      await Promise.all([
        qc.refetchQueries({ queryKey: ["rpg-state"] }),
        qc.refetchQueries({ queryKey: ["rpg-library"] }),
      ]);
    },
    onError: (err: Error) => toast.error(err.message),
  });
  return {
    run: async (fn: () => Promise<unknown>, ok?: string) => {
      try {
        await m.mutateAsync({ fn, ok });
        return true;
      } catch {
        return false;
      }
    },
    pending: m.isPending,
  };
}
