import { router } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { Btn, Card, Input, Label, Screen, Sub, Title } from "@/components/ui";
import { colors } from "@/lib/theme";
import { signup } from "@/lib/store";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true); setError("");
    try {
      if (!email || !password) throw new Error("Email and password required");
      if (password.length < 4) throw new Error("Password must be at least 4 characters");
      await signup(email, name, password);
      router.replace("/onboarding");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Signup failed");
    } finally { setLoading(false); }
  }

  return (
    <Screen>
      <Title>Create account</Title>
      <Sub>Local AsyncStorage demo store — no cloud keys needed.</Sub>
      <Card style={{ marginTop: 16 }}>
        <Label>Name</Label>
        <Input value={name} onChangeText={setName} placeholder="Fedok" />
        <Label>Email</Label>
        <Input autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="you@business.com" />
        <Label>Password</Label>
        <Input secureTextEntry value={password} onChangeText={setPassword} />
        {!!error && <Text style={{ color: colors.danger, marginTop: 10 }}>{error}</Text>}
        <Btn title={loading ? "Creating…" : "Create account & continue"} onPress={onSubmit} disabled={loading} />
        <Btn title="Already have an account" variant="ghost" onPress={() => router.push("/login")} />
      </Card>
    </Screen>
  );
}
