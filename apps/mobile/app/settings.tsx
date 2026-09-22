import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import { Btn, Card, Input, Label, Screen, Sub, Title } from "@/components/ui";
import { colors } from "@/lib/theme";
import {
  connectPlatform,
  getSession,
  resetDemoStore,
  saveOnboarding,
  setWatcherStatus,
} from "@/lib/store";
import type { OnboardingDraft, PlatformType, Tenant } from "@/lib/types";

export default function Settings() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getSession().then((s) => {
      if (!s) {
        router.replace("/login");
        return;
      }
      setTenant(s.tenant);
      setDraft(s.tenant.onboarding);
    });
  }, []);

  async function save() {
    if (!draft) return;
    const t = await saveOnboarding(draft);
    setTenant(t);
    setDraft(t.onboarding);
    setMsg("Saved.");
  }

  async function reconnect(p: PlatformType) {
    await connectPlatform(p, draft?.business.businessName || p);
    const s = await getSession();
    if (s) {
      setTenant(s.tenant);
      setDraft(s.tenant.onboarding);
    }
    setMsg(`${p} reconnected.`);
  }

  async function pause() {
    const t = await setWatcherStatus("paused");
    setTenant(t);
    setMsg("Watcher paused.");
  }

  async function resume() {
    const t = await setWatcherStatus("watching");
    setTenant(t);
    setMsg("Watcher resumed.");
  }

  async function reset() {
    await resetDemoStore();
    setMsg("Demo store reset. Log in again.");
    router.replace("/login");
  }

  if (!draft || !tenant) {
    return (
      <Screen>
        <Sub>Loading…</Sub>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Title>Settings</Title>
        <Sub>Edit business/scope, reconnect platforms, pause watcher.</Sub>

        <Card style={{ marginTop: 16 }}>
          <Text style={{ color: colors.text, fontWeight: "700" }}>Business</Text>
          <Label>Name</Label>
          <Input
            value={draft.business.businessName}
            onChangeText={(v) =>
              setDraft({ ...draft, business: { ...draft.business, businessName: v } })
            }
          />
          <Label>Phone</Label>
          <Input
            value={draft.business.phone}
            onChangeText={(v) =>
              setDraft({ ...draft, business: { ...draft.business, phone: v } })
            }
          />
          <Label>Website</Label>
          <Input
            value={draft.business.website}
            onChangeText={(v) =>
              setDraft({ ...draft, business: { ...draft.business, website: v } })
            }
          />
          <Label>In-scope trades (comma-separated)</Label>
          <Input
            value={draft.scope.inScope.join(", ")}
            onChangeText={(v) =>
              setDraft({
                ...draft,
                scope: {
                  ...draft.scope,
                  inScope: v.split(",").map((x) => x.trim()).filter(Boolean),
                },
              })
            }
          />
          <Btn title="Save changes" onPress={save} />
        </Card>

        <Card style={{ marginTop: 16 }}>
          <Text style={{ color: colors.text, fontWeight: "700" }}>Platforms</Text>
          {draft.platforms.map((p) => (
            <Btn key={p} title={`Reconnect ${p}`} variant="secondary" onPress={() => reconnect(p)} />
          ))}
        </Card>

        <Card style={{ marginTop: 16 }}>
          <Text style={{ color: colors.text, fontWeight: "700" }}>Watcher</Text>
          <Sub>Current: {tenant.watcherStatus}</Sub>
          <Btn title="Pause" variant="secondary" onPress={pause} />
          <Btn title="Resume" variant="secondary" onPress={resume} />
        </Card>

        <Card style={{ marginTop: 16 }}>
          <Text style={{ color: colors.warn, fontWeight: "700" }}>Demo</Text>
          <Btn title="Reset demo store" variant="ghost" onPress={reset} />
        </Card>

        {!!msg && <Text style={{ color: colors.accent2, marginTop: 12 }}>{msg}</Text>}
        <Btn title="Back to dashboard" variant="ghost" onPress={() => router.push("/dashboard")} />
      </ScrollView>
    </Screen>
  );
}
