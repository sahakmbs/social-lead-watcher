import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Btn, Card, Screen, Sub, Title } from "@/components/ui";
import { colors, space } from "@/lib/theme";
import { activatePlan, getSession } from "@/lib/store";
import type { PlanTier, Tenant } from "@/lib/types";

export default function Billing() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getSession().then((s) => {
      if (s) setTenant(s.tenant);
    });
  }, []);

  async function subscribe(plan: PlanTier) {
    const s = await getSession();
    if (!s) {
      router.push("/login");
      return;
    }
    const t = await activatePlan(plan);
    setTenant(t);
    setMsg(`Growth marked active locally (demo — no charge).`);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Title>Billing</Title>
        <Sub>One simple plan while we keep the product calm.</Sub>

        <Card style={{ marginTop: space.lg }}>
          <Text style={styles.planName}>Growth</Text>
          <Text style={styles.price}>$149/mo</Text>
          <Text style={styles.blurb}>
            Facebook lead watch · smart drafts · dashboard summaries. Other platforms listed as they
            come online.
          </Text>
          <Btn
            title={tenant?.planActive ? "Active (demo)" : "Subscribe (demo)"}
            onPress={() => subscribe("growth")}
            disabled={!!tenant?.planActive}
          />
          {!!msg && <Text style={{ color: colors.ok, marginTop: 12, fontSize: 13 }}>{msg}</Text>}
        </Card>

        <Btn title="Back" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  planName: { color: colors.muted, fontSize: 13, fontWeight: "500" },
  price: { color: colors.text, fontSize: 36, fontWeight: "600", marginTop: 4, letterSpacing: -1 },
  blurb: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 12, marginBottom: 8 },
});
