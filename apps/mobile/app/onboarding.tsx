import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Btn, Card, Input, Label, Screen, Sub, Title } from "@/components/ui";
import { colors, space } from "@/lib/theme";
import { connectPlatform, getSession, goLive, saveOnboarding } from "@/lib/store";
import type { OnboardingDraft, PlatformType } from "@/lib/types";

const STEPS = ["Business", "Who you help", "Facebook"];

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
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    getSession().then((s) => {
      if (!s) router.replace("/signup");
      else {
        const ob = { ...s.tenant.onboarding };
        // Clamp legacy 5-step drafts into 3-step flow
        if (ob.step > 2) ob.step = 2;
        setDraft(ob);
      }
    });
  }, []);

  const step = draft?.step ?? 0;
  const fbConnected = (draft?.connections || []).some((c) => c.type === "facebook" && c.connected);

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

  async function onConnectFb() {
    setSaving(true);
    try {
      await connectPlatform("facebook", draft?.business.businessName || "Business Page");
      // Ensure other platforms stay listed but not required
      const s = await getSession();
      if (s) {
        const ob = s.tenant.onboarding;
        const listed: PlatformType[] = ["facebook", "nextdoor", "craigslist", "reddit"];
        setDraft({ ...ob, platforms: listed });
      }
      setMsg("Facebook ready — Page + agent worker.");
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
      const listed: PlatformType[] = ["facebook", "nextdoor", "craigslist", "reddit"];
      await saveOnboarding({ ...draft, platforms: listed, completed: true, step: 2 });
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
        <Sub>Loading…</Sub>
      </Screen>
    );
  }

  return (
    <Screen style={{ paddingTop: 8 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 56 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepMeta}>
          Step {step + 1} of {STEPS.length}
        </Text>
        <Title>{STEPS[step]}</Title>
        <Sub>
          {step === 0 && "A few basics so comments sound like you."}
          {step === 1 && "Trades and areas you want to catch."}
          {step === 2 && "Facebook is smart today. Other platforms stay listed for later."}
        </Sub>

        <View style={styles.progress}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.bar, i <= step && styles.barOn]} />
          ))}
        </View>

        <Card style={{ marginTop: space.md }}>
          {step === 0 && (
            <View>
              <Label>Business name</Label>
              <Input
                value={draft.business.businessName}
                onChangeText={(v) =>
                  setDraft({ ...draft, business: { ...draft.business, businessName: v } })
                }
                placeholder="Cascade Home Pros"
              />
              <Label>Phone</Label>
              <Input
                value={draft.business.phone}
                onChangeText={(v) =>
                  setDraft({ ...draft, business: { ...draft.business, phone: v } })
                }
                placeholder="(555) 123-4567"
                keyboardType="phone-pad"
              />
              <Label>Website</Label>
              <Input
                value={draft.business.website}
                onChangeText={(v) =>
                  setDraft({ ...draft, business: { ...draft.business, website: v } })
                }
                placeholder="https://"
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowAdvanced((x) => !x)} style={{ marginTop: 16 }}>
                <Text style={styles.advToggle}>{showAdvanced ? "Hide advanced" : "Advanced"}</Text>
              </Pressable>
              {showAdvanced && (
                <View>
                  <Label>Email</Label>
                  <Input
                    value={draft.business.email}
                    onChangeText={(v) =>
                      setDraft({ ...draft, business: { ...draft.business, email: v } })
                    }
                    autoCapitalize="none"
                  />
                  <Label>Voice</Label>
                  <Input
                    value={draft.business.voice}
                    onChangeText={(v) =>
                      setDraft({ ...draft, business: { ...draft.business, voice: v } })
                    }
                  />
                  <Label>License note</Label>
                  <Input
                    value={draft.business.licenseNote}
                    onChangeText={(v) =>
                      setDraft({ ...draft, business: { ...draft.business, licenseNote: v } })
                    }
                  />
                </View>
              )}
            </View>
          )}

          {step === 1 && (
            <View>
              <Label>Who you help (trades)</Label>
              <Input
                multiline
                value={listToCsv(draft.scope.inScope)}
                onChangeText={(v) =>
                  setDraft({ ...draft, scope: { ...draft.scope, inScope: csvToList(v) } })
                }
                placeholder="vinyl siding, roofing, deck"
              />
              <Label>Where (cities / counties)</Label>
              <Input
                value={listToCsv(draft.scope.serviceArea)}
                onChangeText={(v) =>
                  setDraft({ ...draft, scope: { ...draft.scope, serviceArea: csvToList(v) } })
                }
                placeholder="Seattle, Bellevue, King County"
              />
              <Pressable onPress={() => setShowAdvanced((x) => !x)} style={{ marginTop: 16 }}>
                <Text style={styles.advToggle}>{showAdvanced ? "Hide advanced" : "Advanced"}</Text>
              </Pressable>
              {showAdvanced && (
                <View>
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
                </View>
              )}
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.platTitle}>Facebook</Text>
              <Text style={styles.platBlurb}>
                Connect your Page. An agent worker watches groups and drafts unique comments — not
                Meta’s unpaid group API.
              </Text>
              <Btn
                title={fbConnected ? "Connected · Continue" : "Connect Facebook"}
                onPress={fbConnected ? onGoLive : onConnectFb}
                disabled={saving}
              />
              {fbConnected && (
                <Btn title="Reconnect" variant="ghost" onPress={onConnectFb} disabled={saving} />
              )}

              <Text style={[styles.platTitle, { marginTop: 28 }]}>Later</Text>
              {(["nextdoor", "craigslist", "reddit"] as const).map((p) => (
                <View key={p} style={styles.laterRow}>
                  <Text style={{ color: colors.muted, textTransform: "capitalize" }}>{p}</Text>
                  <Text style={{ color: colors.faint, fontSize: 12 }}>Not smart yet</Text>
                </View>
              ))}

              {fbConnected && (
                <Btn
                  title={saving ? "Going live…" : "Go live"}
                  onPress={onGoLive}
                  disabled={saving}
                />
              )}
            </View>
          )}

          {!!msg && <Text style={{ color: colors.ok, marginTop: 12, fontSize: 13 }}>{msg}</Text>}
        </Card>

        <View style={styles.navRow}>
          {step > 0 && (
            <Btn title="Back" variant="ghost" onPress={back} disabled={saving} />
          )}
          {step < STEPS.length - 1 && (
            <Btn title="Continue" onPress={next} disabled={saving} />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepMeta: { color: colors.faint, fontSize: 12, fontWeight: "500", marginBottom: 8 },
  progress: { flexDirection: "row", gap: 6, marginTop: space.md },
  bar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.border },
  barOn: { backgroundColor: colors.accent },
  advToggle: { color: colors.accent, fontSize: 13, fontWeight: "500" },
  platTitle: { color: colors.text, fontSize: 16, fontWeight: "600" },
  platBlurb: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 8 },
  laterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navRow: { marginTop: space.md },
});
