import type { PropsWithChildren, ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, type TextInputProps, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  const content = <View className="gap-4 p-5">{children}</View>;
  return <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>{scroll ? <ScrollView keyboardShouldPersistTaps="handled">{content}</ScrollView> : content}</SafeAreaView>;
}

export function Title({ children, subtitle }: PropsWithChildren<{ subtitle?: string }>) {
  return <View className="gap-1"><Text accessibilityRole="header" className="text-3xl font-bold text-ink">{children}</Text>{subtitle ? <Text className="text-base text-slate-600">{subtitle}</Text> : null}</View>;
}

export function Card({ children }: PropsWithChildren) {
  return <View className="gap-3 rounded-2xl border border-slate-200 bg-white p-4">{children}</View>;
}

export function Button({ title, onPress, disabled, tone = 'primary', accessibilityLabel }: { title: string; onPress(): void; disabled?: boolean; tone?: 'primary' | 'danger' | 'secondary'; accessibilityLabel?: string }) {
  const color = tone === 'danger' ? 'bg-red-700' : tone === 'secondary' ? 'bg-slate-200' : 'bg-brand';
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} disabled={disabled} onPress={onPress} className={`rounded-xl px-4 py-3 ${color} ${disabled ? 'opacity-40' : ''}`}><Text className={`text-center font-semibold ${tone === 'secondary' ? 'text-ink' : 'text-white'}`}>{title}</Text></Pressable>;
}

export function Field(props: TextInputProps & { label: string }) {
  return <View className="gap-2"><Text className="font-semibold text-ink">{props.label}</Text><TextInput {...props} accessibilityLabel={props.label} placeholderTextColor="#64748B" className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-ink" /></View>;
}

export function Message({ children, tone = 'info' }: PropsWithChildren<{ tone?: 'info' | 'error' | 'success' }>) {
  const classes = tone === 'error' ? 'bg-red-50 text-red-800' : tone === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-cyan-50 text-cyan-900';
  return <Text accessibilityRole={tone === 'error' ? 'alert' : undefined} className={`rounded-xl p-3 ${classes}`}>{children}</Text>;
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return <View accessibilityRole="progressbar" accessibilityLabel={label} className="items-center gap-2 py-8"><ActivityIndicator color="#155E75" /><Text className="text-slate-600">{label}</Text></View>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <Text className="py-8 text-center text-slate-600">{children}</Text>;
}
