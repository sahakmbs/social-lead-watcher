import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Btn, Card, Screen, Sub, Title } from "@/components/ui";
import { colors } from "@/lib/theme";
import { activatePlan, getSession } from "@/lib/store";
import type { PlanTier, Tenant } from "@/lib/types";

const PLANS: { id: PlanTier; name: string; price: string; blurb: string }[] = [
  { id: "starter", name: "Starter", price: "$49/mo", blurb: "1 platform, light outreach cap" },
  { id: "growth", name: "Growth", price: "$149/mo", blurb: "Multi-platform + higher caps" },
  { id: "pro", name: "Pro", price: "$349/mo", blurb: "Priority autonomy + multi-tenant ready" },
];

export default function Billing() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getSession().then((s) => {
      if (!s) {
        // Allow browsing pricing while logged out
        return;
      }
      setTenant(s.tenant);
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
    setMsg(`Demo subscribe: ${plan} marked active locally (no Stripe charge). STRIPE_* placeholders for later.`);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Title>Billing</Title>
        <Sub>
          Stripe Checkout stub. In DEMO_MODE, Subscribe activates the plan locally.
          {"\n"}Env placeholders: STRIPE_SECRET_KEY, STRIPE_PRICE_STARTER, STRIPE_PRICE_GROWTH, STRIPE_PRICE_PRO
        </Sub>

        {tenant && (
          <Card style={{ marginTop: 12 }}>
            <Text style={{ color: colors.text }}>
              Current plan: {tenant.planActive ? tenant.plan : "none"}
            </Text>
          </Card>
        )}

        <View style={{ marginTop: 16, gap: 12 }}>
          {PLANS.map((p) => (
            <Card key={p.id} style={tenant?.plan === p.id && tenant.planActive ? styles.active : undefined}>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{p.name}</Text>
              <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700" }}>{p.price}</Text>
              <Text style={{ color: colors.muted, marginTop: 6 }}>{p.blurb}</Text>
              <Btn title="Subscribe" onPress={() => subscribe(p.id)} />
            </Card>
          ))}
        </View>

        {!!msg && <Text style={{ color: colors.accent2, marginTop: 16 }}>{msg}</Text>}
        <Btn title="Back" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  active: { borderColor: "rgba(59,130,246,0.6)", borderWidth: 2 },
});
