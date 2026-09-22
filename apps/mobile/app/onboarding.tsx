import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Btn, Card, Chip, Input, Label, Screen, Sub, Title } from "@/components/ui";
import { colors } from "@/lib/theme";
import { connectPlatform, getSession, goLive, saveOnboarding } from "@/lib/store";
import type { OnboardingDraft, PlatformType } from "@/lib/types";
import { scorePreview } from "@/lib/scorePreview";

const STEPS = ["Business", "Lead scope", "Platforms", "Connect", "Review"];

const META: Record<PlatformType, { label: string; blurb: string }> = {
  facebook: { label: "Facebook", blurb: "Page identity + agent/browser worker playbook" },
  nextdoor: { label: "Nextdoor", blurb: "OAuth stub + adapter hook" },
  craigslist: { label: "Craigslist", blurb: "Search/RSS adapter stub" },
  reddit: { label: "Reddit", blurb: "OAuth / PRAW adapter stub" },
};

function csvToList(s: string) {
  return s.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean);
}
function listToCsv(a: string[]) {
  return (a || []).join(", ");
}

export default function Onboarding() {
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewText, setPreviewText] = useState(
    "Looking for vinyl siding contractor in Seattle — need recommendations",
  );
  const [previewOut, setPreviewOut] = useState("");

  useEffect(() => {
    getSession().then((s) => {
      if (!s) router.replace("/signup");
      else setDraft(s.tenant.onboarding);
    });
  }, []);

  const step = draft?.step ?? 0;
  const connected = useMemo(
    () => new Set((draft?.connections || []).filter((c) => c.connected).map((c) => c.type)),
    [draft],
  );

  async function persist(next: OnboardingDraft) {
    setSaving(true);
    setMsg("");
    try {
      const t = await saveOnboarding(next);
      setDraft(t.onboarding);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function next() {
    if (!draft) return;
    await persist({ ...draft, step: Math.min(step + 1, STEPS.length - 1) });
  }

  async function back() {
    if (!draft) return;
    await persist({ ...draft, step: Math.max(step - 1, 0) });
  }

  async function onConnect(p: PlatformType) {
    setSaving(true);
    try {
      await connectPlatform(p, draft?.business.businessName || `${p} account`);
      const s = await getSession();
      if (s) setDraft(s.tenant.onboarding);
      setMsg(p === "facebook" ? "Facebook connected (Page + agent_mode)." : `${p} connected (OAuth stub).`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Connect failed");
    } finally {
      setSaving(false);
    }
  }

  async function onGoLive() {
    if (!draft) return;
    setSaving(true);
    try {
      await saveOnboarding({ ...draft, completed: true, step: 4 });
      await goLive();
      router.replace("/dashboard");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Go live failed");
    } finally {
      setSaving(false);
    }
  }

  if (!draft) {
    return (
      <Screen>
        <Sub>Loading setup…</Sub>
      </Screen>
    );
  }

  return (
    <Screen style={{ paddingTop: 8 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <Title>Onboarding</Title>
        <Sub>Draft persists locally as you move between steps.</Sub>
        <View style={styles.stepRow}>
          {STEPS.map((label, i) => (
            <Chip
              key={label}
              label={`${i + 1}. ${label}`}
              active={i === step}
              onPress={() => persist({ ...draft, step: i })}
            />
          ))}
        </View>

        <Card>
          {step === 0 && (
            <View>
              <Text style={styles.h}>Business info</Text>
              {(
                [
                  ["businessName", "Business name"],
                  ["website", "Website"],
                  ["phone", "Phone"],
                  ["email", "Lead email"],
                  ["voice", "Voice / tone"],
                  ["licenseNote", "License note"],
                ] as const
              ).map(([key, label]) => (
                <View key={key}>
                  <Label>{label}</Label>
                  <Input
                    value={draft.business[key]}
                    onChangeText={(v) =>
                      setDraft({ ...draft, business: { ...draft.business, [key]: v } })
                    }
                  />
                </View>
              ))}
            </View>
          )}

          {step === 1 && (
            <View>
              <Text style={styles.h}>Lead scope</Text>
              <Label>Service area</Label>
              <Input
                value={listToCsv(draft.scope.serviceArea)}
                onChangeText={(v) =>
                  setDraft({ ...draft, scope: { ...draft.scope, serviceArea: csvToList(v) } })
                }
                placeholder="Seattle, Bellevue, King County"
              />
              <Label>In scope trades</Label>
              <Input
                multiline
                value={listToCsv(draft.scope.inScope)}
                onChangeText={(v) =>
                  setDraft({ ...draft, scope: { ...draft.scope, inScope: csvToList(v) } })
                }
                placeholder="vinyl siding, roofing, deck"
              />
              <Label>Out of scope</Label>
              <Input
                value={listToCsv(draft.scope.outOfScope)}
                onChangeText={(v) =>
                  setDraft({ ...draft, scope: { ...draft.scope, outOfScope: csvToList(v) } })
                }
              />
              <Label>Skip patterns</Label>
              <Input
                multiline
                value={listToCsv(draft.scope.skipPatterns)}
                onChangeText={(v) =>
                  setDraft({ ...draft, scope: { ...draft.scope, skipPatterns: csvToList(v) } })
                }
              />
              <Label>Max outreach / run</Label>
              <Input
                keyboardType="number-pad"
                value={String(draft.scope.maxOutreach)}
                onChangeText={(v) =>
                  setDraft({
                    ...draft,
                    scope: { ...draft.scope, maxOutreach: Number(v) || 3 },
                  })
                }
              />
              <View style={styles.previewBox}>
                <Text style={styles.previewLabel}>Score preview (JS mirror of lead_watcher)</Text>
                <Input multiline value={previewText} onChangeText={setPreviewText} />
                <Btn
                  title="Score sample post"
                  variant="secondary"
                  onPress={() =>
                    setPreviewOut(
                      scorePreview(previewText, {
                        inScope: draft.scope.inScope,
                        outOfScope: draft.scope.outOfScope,
                        skipPatterns: draft.scope.skipPatterns,
                        serviceArea: draft.scope.serviceArea,
                      }),
                    )
                  }
                />
                {!!previewOut && <Text style={styles.previewOut}>{previewOut}</Text>}
              </View>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.h}>Platforms to target</Text>
              {(Object.keys(META) as PlatformType[]).map((p) => {
                const on = draft.platforms.includes(p);
                return (
                  <Pressable
                    key={p}
                    onPress={() => {
                      const platforms = on
                        ? draft.platforms.filter((x) => x !== p)
                        : Array.from(new Set([...draft.platforms, p]));
                      setDraft({ ...draft, platforms });
                    }}
                    style={[styles.plat, on && styles.platOn]}
                  >
                    <Text style={styles.platTitle}>
                      {on ? "✓ " : ""}
                      {META[p].label}
                    </Text>
                    <Text style={styles.platBlurb}>{META[p].blurb}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.h}>Connect accounts</Text>
              <Sub>DEMO_MODE mocks success. Real OAuth is a stub for later.</Sub>
              {draft.platforms.map((p) => {
                const isOn = connected.has(p);
                const conn = draft.connections.find((c) => c.type === p);
                return (
                  <View key={p} style={styles.connectRow}>
                    <View style={{ flex: 1, marginBottom: 8 }}>
                      <Text style={styles.platTitle}>{META[p].label}</Text>
                      <Text style={styles.platBlurb}>
                        {isOn ? `${conn?.identityName} · ${conn?.status}` : "Not connected"}
                      </Text>
                      {p === "facebook" && (
                        <Text style={{ color: colors.warn, fontSize: 11, marginTop: 4 }}>
                          Secure Page session / agent playbook — not unpaid Meta scraping API.
                        </Text>
                      )}
                    </View>
                    <Btn
                      title={isOn ? "Reconnect" : "Connect"}
                      variant={isOn ? "secondary" : "primary"}
                      onPress={() => onConnect(p)}
                      disabled={saving}
                    />
                  </View>
                );
              })}
            </View>
          )}

          {step === 4 && (
            <View>
              <Text style={styles.h}>Review & go live</Text>
              <Text style={styles.review}>Business: {draft.business.businessName || "—"}</Text>
              <Text style={styles.review}>
                Scope: {draft.scope.inScope.slice(0, 4).join(", ") || "—"}
              </Text>
              <Text style={styles.review}>
                Area: {draft.scope.serviceArea.join(", ") || "—"}
              </Text>
              <Text style={styles.review}>Platforms: {draft.platforms.join(", ") || "—"}</Text>
              <Text style={styles.review}>
                Connected: {draft.connections.filter((c) => c.connected).length}
              </Text>
              <Sub>
                Going live exports tenant config to the optional API (if running) and sets watcher
                → Watching.
              </Sub>
              <Btn
                title={saving ? "Going live…" : "Go live"}
                onPress={onGoLive}
                disabled={saving}
              />
            </View>
          )}

          {!!msg && <Text style={{ color: colors.accent2, marginTop: 12 }}>{msg}</Text>}
        </Card>

        <View style={styles.navRow}>
          <Btn title="Back" variant="ghost" onPress={back} disabled={step === 0 || saving} />
          {step < STEPS.length - 1 && (
            <Btn title="Save & continue" onPress={next} disabled={saving} />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepRow: { flexDirection: "row", flexWrap: "wrap", marginVertical: 12 },
  h: { color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 4 },
  plat: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  platOn: {
    borderColor: "rgba(59,130,246,0.5)",
    backgroundColor: "rgba(59,130,246,0.12)",
  },
  platTitle: { color: colors.text, fontWeight: "600" },
  platBlurb: { color: colors.muted, fontSize: 12, marginTop: 4 },
  connectRow: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  previewBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(2,6,23,0.45)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewLabel: {
    color: colors.muted,
    fontSize: 11,
    textTransform: "uppercase",
    marginBottom: 8,
    fontWeight: "600",
  },
  previewOut: { color: "#a5f3fc", fontSize: 12, marginTop: 10, fontFamily: "monospace" },
  review: { color: colors.text, marginTop: 8, fontSize: 14 },
  navRow: { marginTop: 8 },
});
