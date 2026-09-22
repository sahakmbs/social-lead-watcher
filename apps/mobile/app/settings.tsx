import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Btn, Card, Input, Label, Row, Screen, Sub, Title } from "@/components/ui";
import { colors, space } from "@/lib/theme";
import {
  exportLocalFiles,
  getGithubPat,
  getGithubRepo,
  saveConfigToGithub,
  setGithubPat,
  setGithubRepo,
} from "@/lib/exportSync";
import {
  connectPlatform,
  getDashboard,
  getSession,
  resetDemoStore,
  saveOnboarding,
  setWatcherStatus,
} from "@/lib/store";
import type { OnboardingDraft, Tenant } from "@/lib/types";
import type { ActivityRecord } from "@/lib/types";

export default function Settings() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [activity, setActivity] = useState<ActivityRecord[]>([]);
  const [msg, setMsg] = useState("");
  const [pat, setPat] = useState("");
  const [repo, setRepo] = useState("sahakmbs/social-lead-watcher");
  const [editing, setEditing] = useState<"business" | "sync" | null>(null);

  useEffect(() => {
    (async () => {
      const s = await getSession();
      if (!s) {
        router.replace("/login");
        return;
      }
      setTenant(s.tenant);
      setDraft(s.tenant.onboarding);
      setPat(await getGithubPat());
      setRepo(await getGithubRepo());
      try {
        const d = await getDashboard();
        setActivity(d.activity);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  async function saveBusiness() {
    if (!draft) return;
    const t = await saveOnboarding(draft);
    setTenant(t);
    setDraft(t.onboarding);
    setEditing(null);
    setMsg("Saved.");
  }

  async function onExport() {
    if (!tenant) return;
    const r = exportLocalFiles(tenant, activity);
    setMsg(r.message);
  }

  async function onGithubSync() {
    if (!tenant) return;
    await setGithubPat(pat.trim());
    await setGithubRepo(repo.trim());
    const r = await saveConfigToGithub(tenant);
    setMsg(r.message);
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
      <ScrollView contentContainerStyle={{ paddingBottom: 56 }} showsVerticalScrollIndicator={false}>
        <Title>Settings</Title>
        <Sub>Keep it light — change only what you need.</Sub>

        <Card style={{ marginTop: space.lg, paddingVertical: 4, paddingHorizontal: 16 }}>
          <Row
            title="Business"
            subtitle={draft.business.businessName || "Name, phone, website"}
            right="Edit"
            onPress={() => setEditing(editing === "business" ? null : "business")}
          />
          {editing === "business" && (
            <View style={{ paddingBottom: 12 }}>
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
              <Label>Trades</Label>
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
              <Btn title="Save" onPress={saveBusiness} />
            </View>
          )}

          <Row
            title="Facebook"
            subtitle={
              draft.connections.find((c) => c.type === "facebook" && c.connected)
                ? "Connected · agent mode"
                : "Not connected"
            }
            right="Reconnect"
            onPress={async () => {
              await connectPlatform("facebook", draft.business.businessName || "Page");
              const s = await getSession();
              if (s) {
                setTenant(s.tenant);
                setDraft(s.tenant.onboarding);
              }
              setMsg("Facebook reconnected.");
            }}
          />

          <Row
            title="Watcher"
            subtitle={tenant.watcherStatus}
            right={tenant.watcherStatus === "paused" ? "Resume" : "Pause"}
            onPress={async () => {
              const next = tenant.watcherStatus === "paused" ? "watching" : "paused";
              const t = await setWatcherStatus(next);
              setTenant(t);
              setMsg(`Watcher ${next}.`);
            }}
          />

          <Row
            title="Export / Sync"
            subtitle="Download YAML · optional GitHub save"
            right="Open"
            onPress={() => setEditing(editing === "sync" ? null : "sync")}
          />
          {editing === "sync" && (
            <View style={{ paddingBottom: 12 }}>
              <Sub>
                Downloads stay on your device. GitHub save uses your PAT (AsyncStorage only — never
                committed). Public repo should only hold demo tenant data.
              </Sub>
              <Btn title="Download business.yaml + activity" variant="secondary" onPress={onExport} />
              <Label>GitHub repo (owner/name)</Label>
              <Input value={repo} onChangeText={setRepo} autoCapitalize="none" />
              <Label>Personal access token</Label>
              <Input
                value={pat}
                onChangeText={setPat}
                autoCapitalize="none"
                secureTextEntry
                placeholder="ghp_…"
              />
              <Btn title="Save config to GitHub" onPress={onGithubSync} />
            </View>
          )}

          <Row
            title="Billing"
            subtitle={tenant.planActive ? `Plan · ${tenant.plan}` : "No plan"}
            right="View"
            onPress={() => router.push("/billing")}
          />

          <Row
            title="Setup wizard"
            subtitle="Business · who you help · Facebook"
            onPress={() => router.push("/onboarding")}
          />

          <Row
            title="Reset demo"
            subtitle="Clear local store"
            onPress={async () => {
              await resetDemoStore();
              router.replace("/login");
            }}
          />
        </Card>

        {!!msg && <Text style={styles.msg}>{msg}</Text>}
        <Btn title="Back" variant="ghost" onPress={() => router.push("/dashboard")} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  msg: { color: colors.ok, marginTop: 16, fontSize: 13 },
});
