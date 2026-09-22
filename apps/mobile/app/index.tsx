import { router } from "expo-router";
import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Btn, Screen, Sub, Title } from "@/components/ui";
import { colors, space } from "@/lib/theme";
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
      <ScrollView contentContainerStyle={{ paddingBottom: 48, paddingTop: 48 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.brand}>Social Lead Watcher</Text>
        <Title>Calm Facebook lead watching for home services.</Title>
        <Sub>
          Set up your business in three steps. An agent watches groups, drafts unique comments, and
          summarizes your day — without the noise.
        </Sub>

        <View style={{ marginTop: space.xl }}>
          <Btn title="Get started" onPress={() => router.push("/signup")} />
          <Btn title="Log in" variant="secondary" onPress={() => router.push("/login")} />
        </View>

        <View style={styles.feats}>
          {[
            ["Facebook-first", "Smart matcher + unique comment crafts"],
            ["Agent execution", "Browser-as-Page playbook — not Meta group API"],
            ["iPhone ready", "Add to Home Screen from Safari"],
          ].map(([t, d]) => (
            <View key={t} style={styles.feat}>
              <Text style={styles.featTitle}>{t}</Text>
              <Text style={styles.featDesc}>{d}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: {
    color: colors.faint,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
    marginBottom: space.md,
  },
  feats: { marginTop: space.xxl, gap: space.lg },
  feat: { paddingTop: space.md, borderTopWidth: 1, borderTopColor: colors.border },
  featTitle: { color: colors.text, fontSize: 15, fontWeight: "600" },
  featDesc: { color: colors.muted, fontSize: 14, marginTop: 4, lineHeight: 20 },
});
