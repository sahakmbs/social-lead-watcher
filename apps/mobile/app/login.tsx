import { router } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { Btn, Card, Input, Label, Screen, Sub, Title } from "@/components/ui";
import { colors } from "@/lib/theme";
import { demoLogin, login } from "@/lib/store";
import { DEMO_CREDENTIALS } from "@/lib/seed";

export default function Login() {
  const [email, setEmail] = useState(DEMO_CREDENTIALS.email);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.password);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function finish(sess: Awaited<ReturnType<typeof login>>) {
    if (sess.tenant.onboarding.completed) router.replace("/dashboard");
    else router.replace("/onboarding");
  }

  async function onSubmit() {
    setLoading(true); setError("");
    try { await finish(await login(email.trim(), password)); }
    catch (e) { setError(e instanceof Error ? e.message : "Login failed"); }
    finally { setLoading(false); }
  }

  async function onDemo() {
    setLoading(true); setError("");
    try { await finish(await demoLogin()); }
    catch (e) { setError(e instanceof Error ? e.message : "Demo login failed"); }
    finally { setLoading(false); }
  }

  return (
    <Screen>
      <Title>Log in</Title>
      <Sub>AUTH_PROVIDER=stub · DEMO_MODE on by default</Sub>
      <Card style={{ marginTop: 16 }}>
        <Label>Email</Label>
        <Input autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Label>Password</Label>
        <Input secureTextEntry value={password} onChangeText={setPassword} />
        {!!error && <Text style={{ color: colors.danger, marginTop: 10 }}>{error}</Text>}
        <Btn title={loading ? "Signing in…" : "Sign in"} onPress={onSubmit} disabled={loading} />
        <Btn title="One-click demo account" variant="secondary" onPress={onDemo} disabled={loading} />
        <Btn title="Create account" variant="ghost" onPress={() => router.push("/signup")} />
      </Card>
    </Screen>
  );
}
