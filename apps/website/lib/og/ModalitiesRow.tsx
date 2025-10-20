import { OGIcon } from "@/lib/og/components";

export function ModalitiesRow({
  inputKeys,
  outputKeys,
  capabilityIcons,
  arrowRightUrl,
  size = "sm",
}: {
  inputKeys: Array<"text" | "image" | "pdf" | "audio" | "video">;
  outputKeys: Array<"text" | "image" | "audio" | "video">;
  capabilityIcons: Record<"text" | "image" | "pdf" | "audio" | "video", string>;
  arrowRightUrl: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div style={{ display: "flex", gap: "1rem" }} tw="flex items-center">
      <div style={{ display: "flex", gap: ".75rem" }} tw="flex items-center">
        {inputKeys.map((key, idx) => (
          <span
            key={`in-${key}-${idx}`}
            style={{ display: "flex" }}
            tw="p-2 bg-white/10 rounded-lg"
          >
            <OGIcon alt={key} bare size={size} src={capabilityIcons[key]} />
          </span>
        ))}
      </div>
      <div style={{ display: "flex" }}>
        <OGIcon alt="Arrow right" bare size={size} src={arrowRightUrl} />
      </div>
      <div style={{ display: "flex", gap: ".75rem" }} tw="flex items-center">
        {outputKeys.map((key, idx) => (
          <span
            key={`out-${key}-${idx}`}
            style={{ display: "flex" }}
            tw="p-2 bg-white/10 rounded-lg"
          >
            <OGIcon alt={key} bare size={size} src={capabilityIcons[key]} />
          </span>
        ))}
      </div>
    </div>
  );
}
