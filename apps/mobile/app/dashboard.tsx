import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Btn, Card, Screen, Stat, Sub, Title } from "@/components/ui";
import { colors, space } from "@/lib/theme";
import { dailyRollup, displayLine, formatTime } from "@/lib/activity";
import { getDashboard, logout, setWatcherStatus } from "@/lib/store";
import type { ActivityRecord, Tenant, WatcherStatus } from "@/lib/types";

function statusColor(s: WatcherStatus) {
  if (s === "watching") return colors.ok;
  if (s === "needs_attention") return colors.warn;
  return colors.faint;
}

function statusLabel(s: WatcherStatus) {
  if (s === "watching") return "Watching";
  if (s === "needs_attention") return "Needs attention";
  return "Paused";
}

export default function Dashboard() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [today, setToday] = useState({ leadsFound: 0, commentsPosted: 0, dmsSent: 0, skipped: 0 });
  const [activity, setActivity] = useState<ActivityRecord[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getDashboard();
      setTenant(data.tenant);
      setToday(data.today);
      setActivity(data.activity);
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
        <Sub>Loading…</Sub>
      </Screen>
    );
  }

  const heroValue =
    tenant.watcherStatus === "watching"
      ? today.commentsPosted + today.dmsSent || today.leadsFound
      : statusLabel(tenant.watcherStatus);
  const heroLabel =
    tenant.watcherStatus === "watching"
      ? today.commentsPosted + today.dmsSent > 0
        ? "Leads reached today"
        : today.leadsFound > 0
          ? "Leads found today"
          : "Watching"
      : "Status";
  const rollup = dailyRollup(activity);
  const fb = tenant.onboarding.connections.find((c) => c.type === "facebook" && c.connected);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 56 }} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <View style={{ flex: 1 }}>
            <Text style={styles.biz}>{tenant.onboarding.business.businessName || "Your business"}</Text>
            <View style={styles.statusPill}>
              <View style={[styles.dot, { backgroundColor: statusColor(tenant.watcherStatus) }]} />
              <Text style={styles.statusText}>{statusLabel(tenant.watcherStatus)}</Text>
              {!!fb && <Text style={styles.statusMeta}> · Facebook</Text>}
            </View>
          </View>
          <Pressable onPress={() => router.push("/settings")} hitSlop={12}>
            <Text style={styles.gear}>Settings</Text>
          </Pressable>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroValue}>{heroValue}</Text>
          <Text style={styles.heroLabel}>{heroLabel}</Text>
          <Text style={styles.rollup}>{rollup}</Text>
        </View>

        {/* Supporting stats */}
        <View style={styles.stats}>
          <Stat label="Leads" value={today.leadsFound} />
          <Stat label="Comments" value={today.commentsPosted} />
          <Stat label="DMs" value={today.dmsSent} />
        </View>

        {/* Activity */}
        <Text style={styles.section}>Activity</Text>
        {activity.length === 0 ? (
          <Card style={{ marginTop: 8 }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "500" }}>Nothing yet</Text>
            <Sub>Connect Facebook and go live to start watching groups.</Sub>
            <Btn title="Finish setup" onPress={() => router.push("/onboarding")} />
          </Card>
        ) : (
          <Card style={{ marginTop: 8, paddingVertical: 4, paddingHorizontal: 16 }}>
            {activity.slice(0, 20).map((a) => {
              const open = expanded === a.id;
              return (
                <Pressable
                  key={a.id}
                  onPress={() => setExpanded(open ? null : a.id)}
                  style={styles.actRow}
                >
                  <Text style={styles.actTime}>{formatTime(a.ts)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actLine}>{displayLine(a)}</Text>
                    {open && (
                      <View style={{ marginTop: 6 }}>
                        {!!a.need && (
                          <Text style={styles.actMeta}>Need · {a.need}</Text>
                        )}
                        {!!a.classification && (
                          <Text style={styles.actMeta}>Class · {a.classification}</Text>
                        )}
                        {!!a.postUrl && (
                          <Text
                            style={[styles.actMeta, { color: colors.accent }]}
                            onPress={() => Linking.openURL(a.postUrl!)}
                          >
                            Open post
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </Card>
        )}

        <View style={{ marginTop: space.lg }}>
          <Btn
            title={tenant.watcherStatus === "paused" ? "Resume" : "Pause"}
            variant="secondary"
            onPress={togglePause}
          />
          <Btn title="Log out" variant="ghost" onPress={onLogout} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "flex-start", marginTop: 8 },
  biz: { color: colors.text, fontSize: 15, fontWeight: "500" },
  statusPill: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  statusText: { color: colors.muted, fontSize: 13 },
  statusMeta: { color: colors.faint, fontSize: 13 },
  gear: { color: colors.faint, fontSize: 13, fontWeight: "500" },
  hero: { marginTop: space.xl, marginBottom: space.lg },
  heroValue: { color: colors.text, fontSize: 48, fontWeight: "600", letterSpacing: -1.5 },
  heroLabel: { color: colors.muted, fontSize: 15, marginTop: 4 },
  rollup: { color: colors.faint, fontSize: 13, marginTop: 8, lineHeight: 18 },
  stats: { flexDirection: "row", gap: 8, marginBottom: 8 },
  section: {
    color: colors.faint,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginTop: space.lg,
    marginBottom: 4,
  },
  actRow: {
    flexDirection: "row",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  actTime: { color: colors.faint, fontSize: 12, width: 56, marginTop: 2 },
  actLine: { color: colors.text, fontSize: 14, lineHeight: 20 },
  actMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
