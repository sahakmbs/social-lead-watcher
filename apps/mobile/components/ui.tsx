import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { colors, space } from "@/lib/theme";

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
      placeholderTextColor={colors.faint}
      {...props}
      style={[styles.input, props.multiline && { minHeight: 80, textAlignVertical: "top" }, props.style]}
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
    variant === "primary" ? colors.accent : variant === "secondary" ? colors.cardHover : "transparent";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          borderWidth: variant === "ghost" ? 0 : variant === "secondary" ? 1 : 0,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.btnText, variant === "ghost" && { color: colors.muted }]}>{title}</Text>
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
      style={[styles.chip, active && { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}
    >
      <Text style={[styles.chipText, active && { color: colors.text }]}>{label}</Text>
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
export function Row({
  title,
  subtitle,
  onPress,
  right,
}: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: string;
}) {
  const Comp = onPress ? Pressable : View;
  return (
    <Comp onPress={onPress} style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
      </View>
      {!!right && <Text style={styles.rowRight}>{right}</Text>}
    </Comp>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg, paddingTop: space.md },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
  },
  title: { color: colors.text, fontSize: 28, fontWeight: "600", letterSpacing: -0.5 },
  sub: { color: colors.muted, fontSize: 15, marginTop: 6, lineHeight: 22 },
  label: {
    color: colors.faint,
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 6,
    marginTop: space.md,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  btn: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: { color: colors.muted, fontSize: 12 },
  stat: { flex: 1, minWidth: 64 },
  statValue: { color: colors.text, fontSize: 20, fontWeight: "600" },
  statLabel: { color: colors.faint, fontSize: 12, marginTop: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: "500" },
  rowSub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  rowRight: { color: colors.faint, fontSize: 13, marginLeft: 12 },
});
