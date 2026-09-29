import { useAppearance } from "@/lib/rpg/appearance";

const EMBERS = [4, 13, 22, 31, 39, 48, 57, 66, 74, 83, 91, 96];

export function AmbientLayer() {
  const { ambient } = useAppearance();
  if (ambient === "none") return null;

  return (
    <div className="ambient-layer" aria-hidden="true">
      {ambient === "mist" && (
        <>
          <span className="ambient-mist ambient-mist--a" />
          <span className="ambient-mist ambient-mist--b" />
        </>
      )}
      {ambient === "embers" && (
        <span className="ambient-embers">
          {EMBERS.map((left, i) => (
            <i
              key={left}
              style={{
                left: `${left}%`,
                animationDelay: `${(i * 1.7) % 12}s`,
                animationDuration: `${11 + (i % 5) * 2}s`,
              }}
            />
          ))}
        </span>
      )}
    </div>
  );
}
