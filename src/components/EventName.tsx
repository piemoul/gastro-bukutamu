export function shortEventName(code: string, name: string) {
  const legacy: Record<string, string> = {
    ALL: "Semua",
    NFH: "NFH",
    FHI: "FHI",
    BALI: "Bali",
  };
  if (legacy[code]) return legacy[code];
  if (name.length <= 16) return name;
  const words = name.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return words.length > 1
    ? words
        .slice(0, 4)
        .map((word) => word[0])
        .join("")
        .toUpperCase()
    : name.slice(0, 13) + "…";
}

export function EventName({ code, name }: { code: string; name: string }) {
  return (
    <span className="event-name" title={name}>
      <span className="sr-only">{name}</span>
      <span className="event-name-desktop" aria-hidden="true">
        {name}
      </span>
      <span className="event-name-mobile" aria-hidden="true">
        {shortEventName(code, name)}
      </span>
    </span>
  );
}
