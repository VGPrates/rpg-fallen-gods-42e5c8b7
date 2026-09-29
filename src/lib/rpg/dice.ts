export type DiceTier = "crit-fail" | "fail" | "feijoada" | "close" | "good" | "great" | "crit";

export type DiceVerdict = {
  value: number;
  tier: DiceTier;
  title: string;
  flavor: string;
};

export function rollD20(): number {
  return 1 + Math.floor(Math.random() * 20);
}

export function verdictFor(value: number): DiceVerdict {
  if (value <= 1) {
    return {
      value,
      tier: "crit-fail",
      title: "Falha crítica",
      flavor: "Os deuses viraram o rosto. Até a feijoada azedou na panela.",
    };
  }
  if (value <= 4) {
    return {
      value,
      tier: "fail",
      title: "Desastre",
      flavor: "Tropeçou na própria capa. A taverna inteira viu.",
    };
  }
  if (value <= 8) {
    return {
      value,
      tier: "feijoada",
      title: "Feijoada",
      flavor: "Não foi o suficiente. O destino serviu o prato do dia — morno.",
    };
  }
  if (value <= 11) {
    return {
      value,
      tier: "close",
      title: "Raso",
      flavor: "Passou por um fio. A sorte ainda está indecisa.",
    };
  }
  if (value <= 15) {
    return {
      value,
      tier: "good",
      title: "Honroso",
      flavor: "O aço cantou. Não é lenda, mas também não é vergonha.",
    };
  }
  if (value <= 19) {
    return {
      value,
      tier: "great",
      title: "Deu bom",
      flavor: "A lâmina encontrou o alvo. Até o bardo vai lembrar.",
    };
  }
  return {
    value,
    tier: "crit",
    title: "Golpe lendário",
    flavor: "Os céus se abriram. Esta noite as crônicas ganham um capítulo.",
  };
}
