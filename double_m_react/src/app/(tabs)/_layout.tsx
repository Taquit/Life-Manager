import { Tabs } from 'expo-router';
import { useColorScheme, Image } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.backgroundElement },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Image 
              source={require('@/assets/images/tabIcons/home.png')} 
              style={{ width: 24, height: 24, tintColor: color }} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: 'Tarjetas',
          tabBarIcon: ({ color }) => <SymbolView name={{ ios: 'creditcard', android: 'credit_card', web: 'credit_card' }} size={24} tintColor={color} />,
        }}
      />
      <Tabs.Screen
        name="transaccion"
        options={{
          title: 'Transacciones',
          tabBarIcon: ({ color }) => <SymbolView name={{ ios: 'list.bullet', android: 'list', web: 'list' }} size={24} tintColor={color} />,
        }}
      />
      <Tabs.Screen
        name="categoria"
        options={{
          title: 'Categorías',
          tabBarIcon: ({ color }) => <SymbolView name={{ ios: 'folder', android: 'folder', web: 'folder' }} size={24} tintColor={color} />,
        }}
      />
      <Tabs.Screen
        name="debug-notifications"
        options={{
          title: 'Debug',
          tabBarIcon: ({ color }) => <SymbolView name={{ ios: 'ladybug', android: 'bug_report', web: 'bug_report' }} size={24} tintColor={color} />,
        }}
      />
    </Tabs>
  );
}
