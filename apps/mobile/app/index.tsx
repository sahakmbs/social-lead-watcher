import { router } from "expo-router";
import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Btn, Card, Chip, Screen, Sub, Title } from "@/components/ui";
import { colors } from "@/lib/theme";
import { getSession } from "@/lib/store";

export default function Landing() {
  useEffect(() => {
    getSession().then((s) => {
      if (!s) return;
      if (s.tenant.onboarding.completed) router.replace("/dashboard");
      else router.replace("/onboarding");
    });
  }, []);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingTop: 24 }}>
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>SL</Text>
          </View>
          <Text style={styles.brand}>Social Lead Watcher</Text>
        </View>
        <Chip label="Expo · DEMO_MODE · offline-first" active />
        <Title>Find homeowners asking for help — then land the lead.</Title>
        <Sub>
          Create an account, set business + scope, connect platforms, and run a watcher that
          comments, DMs, and summarizes activity on your dashboard.
        </Sub>
        <View style={{ marginTop: 20 }}>
          <Btn title="Sign up" onPress={() => router.push("/signup")} />
          <Btn title="Log in / demo account" variant="secondary" onPress={() => router.push("/login")} />
        </View>
        <Card style={{ marginTop: 24 }}>
          <Text style={styles.h2}>How it works</Text>
          {[
            "Create an account",
            "Business info + voice",
            "Lead scope (trades, geo, skip rules)",
            "Pick platforms & connect (Page + agent playbook for Facebook)",
            "Dashboard summarizes watching / outreach",
          ].map((s, i) => (
            <Text key={s} style={styles.step}>
              {i + 1}. {s}
            </Text>
          ))}
          <Text style={[styles.step, { color: colors.warn, marginTop: 12 }]}>
            Facebook = connected Page identity + agent/browser worker playbook — not marketed as
            official Meta unpaid group auto-comment API.
          </Text>
        </Card>
        <Text style={[styles.h2, { marginTop: 24 }]}>Pricing tease</Text>
        <View style={styles.plans}>
          {[
            ["Starter", "$49"],
            ["Growth", "$149"],
            ["Pro", "$349"],
          ].map(([n, p]) => (
            <Card key={n} style={styles.plan}>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{n}</Text>
              <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700" }}>{p}</Text>
            </Card>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 10 },
  logo: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accent,
    alignItems: "center", justifyContent: "center",
  },
  logoText: { color: "#fff", fontWeight: "800" },
  brand: { color: colors.text, fontWeight: "700", fontSize: 16 },
  h2: { color: colors.text, fontWeight: "700", fontSize: 16, marginBottom: 8 },
  step: { color: colors.text, fontSize: 14, marginTop: 8, lineHeight: 20 },
  plans: { flexDirection: "row", gap: 8 },
  plan: { flex: 1, padding: 12 },
});
