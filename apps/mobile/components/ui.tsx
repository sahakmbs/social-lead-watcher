import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { colors } from "@/lib/theme";

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}
export function Sub({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sub}>{children}</Text>;
}
export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}
export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      {...props}
      style={[styles.input, props.multiline && { minHeight: 72, textAlignVertical: "top" }, props.style]}
    />
  );
}
export function Btn({
  title,
  onPress,
  variant = "primary",
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
}) {
  const bg =
    variant === "primary" ? colors.accent : variant === "secondary" ? "#1e293b" : "transparent";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          borderWidth: variant === "secondary" ? 1 : 0,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={styles.btnText}>{title}</Text>
    </Pressable>
  );
}
export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active && {
          backgroundColor: "rgba(59,130,246,0.25)",
          borderColor: "rgba(59,130,246,0.5)",
        },
      ]}
    >
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}
export function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  title: { color: colors.text, fontSize: 24, fontWeight: "700" },
  sub: { color: colors.muted, fontSize: 14, marginTop: 4, lineHeight: 20 },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "rgba(2,6,23,0.45)",
    borderWidth: 1,
    borderColor: "rgba(100,116,139,0.5)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#1e293b",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: { color: colors.text, fontSize: 12 },
  stat: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.4)",
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
    minWidth: 70,
  },
  statValue: { color: colors.text, fontSize: 22, fontWeight: "700" },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },
});
