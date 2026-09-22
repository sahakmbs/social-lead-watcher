import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Btn, Card, Screen, Stat, Sub, Title } from "@/components/ui";
import { colors } from "@/lib/theme";
import { getDashboard, logout, setWatcherStatus } from "@/lib/store";
import type { ActivityRecord, Tenant, WatcherStatus } from "@/lib/types";

function statusColor(s: WatcherStatus) {
  if (s === "watching") return colors.ok;
  if (s === "needs_attention") return colors.warn;
  return colors.muted;
}

function statusLabel(s: WatcherStatus) {
  if (s === "watching") return "Watching";
  if (s === "needs_attention") return "Needs attention";
  return "Paused";
}

export default function Dashboard() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [email, setEmail] = useState("");
  const [today, setToday] = useState({ leadsFound: 0, commentsPosted: 0, dmsSent: 0, skipped: 0 });
  const [activity, setActivity] = useState<ActivityRecord[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await getDashboard();
      setTenant(data.tenant);
      setEmail(data.user.email);
      setToday(data.today);
      setActivity(data.activity);
      setError("");
    } catch {
      router.replace("/login");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function togglePause() {
    if (!tenant) return;
    const next = tenant.watcherStatus === "paused" ? "watching" : "paused";
    await setWatcherStatus(next);
    await load();
  }

  async function onLogout() {
    await logout();
    router.replace("/");
  }

  if (!tenant) {
    return (
      <Screen>
        <Sub>Loading dashboard…</Sub>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.top}>
          <View style={{ flex: 1 }}>
            <Title>Dashboard</Title>
            <Sub>{tenant.onboarding.business.businessName || "Your business"} · {email}</Sub>
          </View>
        </View>

        <Card style={{ marginTop: 12 }}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: statusColor(tenant.watcherStatus) }]} />
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 18 }}>
              {statusLabel(tenant.watcherStatus)}
            </Text>
          </View>
          <Text style={{ color: colors.muted, marginTop: 6, fontSize: 12 }}>
            Plan: {tenant.planActive ? tenant.plan : "none"} · DEMO_MODE local store
          </Text>
          <Btn
            title={tenant.watcherStatus === "paused" ? "Resume watcher" : "Pause watcher"}
            variant="secondary"
            onPress={togglePause}
          />
        </Card>

        <Text style={styles.section}>Today</Text>
        <View style={styles.stats}>
          <Stat label="Leads" value={today.leadsFound} />
          <Stat label="Comments" value={today.commentsPosted} />
          <Stat label="DMs" value={today.dmsSent} />
          <Stat label="Skipped" value={today.skipped} />
        </View>

        <Text style={styles.section}>Connected platforms</Text>
        <Card>
          {tenant.onboarding.connections.filter((c) => c.connected).length === 0 && (
            <Text style={{ color: colors.muted }}>No platforms connected yet.</Text>
          )}
          {tenant.onboarding.connections
            .filter((c) => c.connected)
            .map((c) => (
              <View key={c.type} style={styles.platRow}>
                <Text style={{ color: colors.text, fontWeight: "600" }}>{c.type}</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  {c.identityName} · {c.status}
                </Text>
                {!!c.note && (
                  <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>{c.note}</Text>
                )}
              </View>
            ))}
        </Card>

        <Text style={styles.section}>Recent activity</Text>
        <Card>
          {activity.length === 0 && (
            <Text style={{ color: colors.muted }}>No activity yet — go live from Setup.</Text>
          )}
          {activity.map((a) => (
            <View key={a.id} style={styles.actRow}>
              <Text style={{ color: colors.accent2, fontSize: 11 }}>
                {new Date(a.ts).toLocaleString()} · {a.platform} · {a.action}
              </Text>
              {!!a.postSnippet && (
                <Text style={{ color: colors.text, marginTop: 2 }} numberOfLines={2}>
                  {a.postSnippet}
                </Text>
              )}
              {!!a.detail && (
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{a.detail}</Text>
              )}
              {!!a.need && (
                <Text style={{ color: colors.ok, fontSize: 12, marginTop: 2 }}>need: {a.need}</Text>
              )}
            </View>
          ))}
        </Card>

        {!!error && <Text style={{ color: colors.danger }}>{error}</Text>}

        <View style={{ marginTop: 16 }}>
          <Btn title="Setup / onboarding" variant="secondary" onPress={() => router.push("/onboarding")} />
          <Btn title="Settings" variant="secondary" onPress={() => router.push("/settings")} />
          <Btn title="Billing" variant="secondary" onPress={() => router.push("/billing")} />
          <Btn title="Log out" variant="ghost" onPress={onLogout} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "flex-start" },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  section: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  stats: { flexDirection: "row" },
  platRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
