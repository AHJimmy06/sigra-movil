import type { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function HomeIcon({ size = 22, color = '#0F172A', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6.5h-5V21H4a1 1 0 0 1-1-1v-9.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function WalletIcon({ size = 22, color = '#0F172A', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Path
        d="M3 9.5h18M7 14h3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Circle cx="17" cy="14" r="1.5" fill={color} />
    </Svg>
  );
}

export function TicketIcon({ size = 22, color = '#0F172A', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function DirectoryIcon({ size = 22, color = '#0F172A', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 7h6M9 11h4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ProfileIcon({ size = 22, color = '#0F172A', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M5 20a7 7 0 0 1 14 0"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SyncIcon({ size = 18, color = '#0F766E', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12a9 9 0 0 0-15.5-6.36L3 8M3 3v5h5M3 12a9 9 0 0 0 15.5 6.36L21 16M21 21v-5h-5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CameraIcon({ size = 18, color = '#0F172A', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="3" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function ImageIcon({ size = 18, color = '#0F172A', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2.5"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
      <Path
        d="M21 15l-5-5L5 21"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PhoneIcon({ size = 18, color = '#FFFFFF', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 22 16.92Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ShieldIcon({ size = 20, color = '#0F766E', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CheckIcon({ size = 16, color = '#10B981', strokeWidth = 2.2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function AlertIcon({ size = 16, color = '#F59E0B', strokeWidth = 2.2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PlusIcon({ size = 18, color = '#FFFFFF', strokeWidth = 2.2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function TrashIcon({ size = 16, color = '#EF4444', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function Screen({
  children,
  scroll = true,
  refreshing = false,
  onRefresh,
}: PropsWithChildren<{
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}>) {
  const content = <View className="gap-4 px-5 pt-3 pb-10">{children}</View>;
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#0F766E"
              />
            ) : undefined
          }
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

export function SyncIsland({
  connected,
  syncing,
  lastSync,
  onPress,
}: {
  connected: boolean;
  syncing?: boolean;
  lastSync?: string | null;
  onPress?: () => void;
}) {
  const dotHex = syncing ? '#38BDF8' : connected ? '#34D399' : '#FBBF24';

  const statusLabel = syncing
    ? 'Sincronizando datos…'
    : connected
      ? 'En línea · Sincronizado'
      : 'Modo Offline · Datos en dispositivo';

  const formattedTime = lastSync
    ? new Date(lastSync).toLocaleTimeString('es-EC', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'summary'}
      accessibilityLabel={statusLabel}
      disabled={!onPress || !connected || syncing}
      onPress={onPress}
      className="self-center flex-row items-center gap-2.5 rounded-full bg-obsidian px-4 py-2 shadow-sm"
      style={{ minHeight: 36 }}
    >
      <View
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: dotHex }}
      />
      <Text className="text-xs font-semibold tracking-tight text-white">
        {statusLabel}
      </Text>
      {formattedTime ? (
        <Text
          className="text-xs text-slate-400"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          · {formattedTime}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function LargeTitle({
  children,
  subtitle,
  eyebrow,
  right,
}: PropsWithChildren<{
  subtitle?: string;
  eyebrow?: string;
  right?: ReactNode;
}>) {
  return (
    <View className="flex-row items-start justify-between gap-3 pt-1">
      <View className="flex-1 gap-1">
        {eyebrow ? (
          <Text className="text-xs font-bold tracking-wider text-brand uppercase">
            {eyebrow}
          </Text>
        ) : null}
        <Text
          accessibilityRole="header"
          className="text-3xl font-extrabold tracking-tight text-ink"
        >
          {children}
        </Text>
        {subtitle ? (
          <Text className="text-sm leading-5 text-slate-600">{subtitle}</Text>
        ) : null}
      </View>
      {right ? <View className="pt-1">{right}</View> : null}
    </View>
  );
}

export const Title = LargeTitle;

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between pt-2">
      <View className="flex-1">
        <Text
          accessibilityRole="header"
          className="text-lg font-bold tracking-tight text-ink"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-xs text-slate-500">{subtitle}</Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

export function Card({
  children,
  variant = 'elevated',
}: PropsWithChildren<{ variant?: 'elevated' | 'obsidian' | 'subtle' }>) {
  const surface =
    variant === 'obsidian'
      ? 'border-slate-800 bg-obsidian'
      : variant === 'subtle'
        ? 'border-slate-200/80 bg-slate-100/90'
        : 'border-slate-200/80 bg-white shadow-sm';
  return (
    <View className={`gap-3 rounded-3xl border p-4 ${surface}`}>{children}</View>
  );
}

export type BadgeTone =
  | 'neutral'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'dark';

export function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: BadgeTone;
}) {
  const styles: Record<BadgeTone, { bg: string; border: string; text: string }> = {
    neutral: { bg: '#F1F5F9', border: '#E2E8F0', text: '#334155' },
    brand: { bg: '#F0FDFA', border: '#99F6E4', text: '#115E59' },
    success: { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' },
    warning: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' },
    danger: { bg: '#FFF1F2', border: '#FECDD3', text: '#9F1239' },
    dark: { bg: '#1E293B', border: '#334155', text: '#F1F5F9' },
  };
  const current = styles[tone];
  return (
    <View
      className="self-start rounded-full border px-2.5 py-1"
      style={{ backgroundColor: current.bg, borderColor: current.border }}
    >
      <Text className="text-xs font-semibold" style={{ color: current.text }}>
        {label}
      </Text>
    </View>
  );
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T; count?: number }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <View className="flex-row rounded-2xl bg-slate-200/80 p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            className="flex-1 flex-row items-center justify-center gap-1 rounded-xl py-2.5 px-2"
            style={{
              minHeight: 40,
              backgroundColor: active ? '#FFFFFF' : 'transparent',
              borderWidth: active ? 1 : 0,
              borderColor: active ? '#CBD5E1' : 'transparent',
            }}
          >
            <Text
              numberOfLines={1}
              className="text-xs font-semibold"
              style={{ color: active ? '#0F172A' : '#475569' }}
            >
              {option.label}
            </Text>
            {option.count !== undefined ? (
              <Text
                className="text-[11px] font-bold"
                style={{
                  color: active ? '#0F766E' : '#64748B',
                  fontVariant: ['tabular-nums'],
                }}
              >
                {option.count}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function Button({
  title,
  onPress,
  disabled,
  tone = 'primary',
  icon,
  accessibilityLabel,
}: {
  title: string;
  onPress(): void;
  disabled?: boolean;
  tone?: 'primary' | 'danger' | 'secondary' | 'ghost';
  icon?: ReactNode;
  accessibilityLabel?: string;
}) {
  const bg =
    tone === 'danger'
      ? '#E11D48'
      : tone === 'secondary'
        ? '#E2E8F0'
        : tone === 'ghost'
          ? 'transparent'
          : '#0F766E';
  const textColor =
    tone === 'secondary' || tone === 'ghost' ? '#0F172A' : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      disabled={disabled}
      onPress={onPress}
      className="flex-row items-center justify-center gap-2 rounded-2xl px-4 py-3.5"
      style={{
        minHeight: 46,
        backgroundColor: bg,
        borderWidth: tone === 'ghost' ? 1 : 0,
        borderColor: '#CBD5E1',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {icon}
      <Text
        className="text-center text-sm font-semibold"
        style={{ color: textColor }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function Field(
  props: TextInputProps & { label: string; helperText?: string },
) {
  const { label, helperText, ...inputProps } = props;
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-semibold text-ink">{label}</Text>
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        placeholderTextColor="#64748B"
        className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-base text-ink"
      />
      {helperText ? (
        <Text className="text-xs text-slate-500">{helperText}</Text>
      ) : null}
    </View>
  );
}

export function Message({
  children,
  tone = 'info',
}: PropsWithChildren<{ tone?: 'info' | 'error' | 'success' | 'warning' }>) {
  const palette =
    tone === 'error'
      ? { bg: '#FFF1F2', border: '#FECDD3', text: '#881337' }
      : tone === 'success'
        ? { bg: '#ECFDF5', border: '#A7F3D0', text: '#064E3B' }
        : tone === 'warning'
          ? { bg: '#FFFBEB', border: '#FDE68A', text: '#78350F' }
          : { bg: '#F0FDFA', border: '#99F6E4', text: '#134E4A' };
  return (
    <View
      className="rounded-2xl border p-3.5"
      style={{ backgroundColor: palette.bg, borderColor: palette.border }}
    >
      <Text
        accessibilityRole={tone === 'error' ? 'alert' : undefined}
        className="text-xs font-medium leading-5"
        style={{ color: palette.text }}
      >
        {children}
      </Text>
    </View>
  );
}

export function Loading({ label = 'Cargando datos…' }: { label?: string }) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      className="items-center gap-2.5 py-10"
    >
      <ActivityIndicator color="#0F766E" />
      <Text className="text-sm font-medium text-slate-600">{label}</Text>
    </View>
  );
}

export function Empty({
  children,
  title,
  action,
}: {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <View className="items-center gap-2 rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-9">
      {title ? (
        <Text className="text-center text-base font-bold text-ink">{title}</Text>
      ) : null}
      <Text className="text-center text-sm leading-5 text-slate-600">
        {children}
      </Text>
      {action ? <View className="pt-2">{action}</View> : null}
    </View>
  );
}
