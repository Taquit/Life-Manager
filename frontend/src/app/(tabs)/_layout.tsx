import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ThemeTokens } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0D0B1A',
          borderTopColor: '#2E2757',
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 16,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#B84FFF',
        tabBarInactiveTintColor: '#8A7FBD',
        tabBarLabelStyle: {
          fontSize: 11.5,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'house.fill', android: 'home', web: 'home' }}
              size={24}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transaccion"
        options={{
          title: 'Movimientos',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'doc.text.fill', android: 'receipt_long', web: 'receipt' }}
              size={24}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: 'Tarjetas',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'creditcard.fill', android: 'credit_card', web: 'credit_card' }}
              size={24}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="servicios"
        options={{
          title: 'Servicios',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'bolt.fill', android: 'bolt', web: 'bolt' }}
              size={24}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reportes"
        options={{
          title: 'Reportes',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'clock.fill', android: 'schedule', web: 'schedule' }}
              size={24}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="categoria"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="debug-notifications"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
