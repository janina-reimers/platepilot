import { Camera, ClipboardList, House, UserRound } from 'lucide-react-native';
import { Redirect, Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useThemeColor } from 'heroui-native';
import { useUniwind } from 'uniwind';
import { useProfileStore } from '@/lib/store/profile';

export default function TabLayout() {
  const { theme } = useUniwind();
  const [background, foreground, border, accent, muted] = useThemeColor([
    'background',
    'foreground',
    'border',
    'accent',
    'muted',
  ]);

  const hydrated = useProfileStore((state) => state.hydrated);
  const onboarded = useProfileStore((state) => state.profile.onboarded);

  // Wait for the saved profile before deciding where to send the user.
  if (!hydrated) return null;
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: background },
          headerTintColor: foreground,
          headerTitleStyle: { color: foreground },
          headerShadowVisible: false,
          sceneStyle: { backgroundColor: background },
          tabBarStyle: {
            backgroundColor: background,
            borderTopColor: border,
          },
          tabBarActiveTintColor: accent,
          tabBarInactiveTintColor: muted,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'PlatePilot',
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size }) => <House color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            title: 'Scan a menu',
            tabBarLabel: 'Scan',
            tabBarIcon: ({ color, size }) => <Camera color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'Past menus',
            tabBarLabel: 'History',
            tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Your profile',
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color, size }) => <UserRound color={color} size={size ?? 24} />,
          }}
        />
      </Tabs>
    </>
  );
}
