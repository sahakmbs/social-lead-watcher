/** Offline JS mirror of lead_watcher.matcher for DEMO previews. */
export function scorePreview(
  text: string,
  opts: {
    inScope: string[];
    outOfScope: string[];
    skipPatterns: string[];
    serviceArea: string[];
  },
): string {
  const t = (text || "").toLowerCase().replace(/\s+/g, " ");
  const find = (needles: string[]) =>
    needles.filter((n) => n && t.includes(n.toLowerCase()));

  const matchedSkip = find(opts.skipPatterns);
  if (matchedSkip.length) {
    return `classification: skip\nscore: 0\nreason: skip_patterns: ${matchedSkip.join(", ")}`;
  }
  const matchedIn = find(opts.inScope);
  const matchedOut = find(opts.outOfScope);
  const matchedGeo = find(opts.serviceArea);
  if (matchedOut.length && !matchedIn.length) {
    return `classification: skip\nscore: 0\nreason: out_of_scope: ${matchedOut.join(", ")}`;
  }
  let score = 0;
  const reasons: string[] = [];
  if (matchedIn.length) {
    score += 2 + Math.min(matchedIn.length, 2);
    reasons.push(`in_scope: ${matchedIn.join(", ")}`);
  }
  const signals = [
    "looking for",
    "need",
    "recommend",
    "anyone know",
    "quote",
    "estimate",
    "contractor",
    "help with",
  ];
  const req = Math.min(signals.filter((s) => t.includes(s)).length, 3);
  if (req) {
    score += req;
    reasons.push(`request_signals=${req}`);
  }
  if (matchedGeo.length) {
    score += 1;
    reasons.push(`service_area: ${matchedGeo.join(", ")}`);
  }
  let cls = "skip";
  if (score >= 4 && matchedIn.length) cls = "strong";
  else if (score >= 2 && (matchedIn.length || req >= 2)) cls = "maybe";
  const need = matchedIn.sort((a, b) => b.length - a.length)[0] || "your project";
  return [
    `classification: ${cls}`,
    `score: ${score}`,
    `need: ${cls === "skip" ? "" : need}`,
    `reason: ${reasons.join("; ") || "below threshold"}`,
  ].join("\n");
}
