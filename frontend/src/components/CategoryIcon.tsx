import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { ThemeTokens, Radii } from '@/constants/theme';

export interface CategoryIconProps {
  name?: string | null;
  color?: string | null;
  size?: number;
  iconSize?: number;
  borderRadius?: number;
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function getCategoryMeta(name?: string | null, customColor?: string | null) {
  const lower = (name || '').trim().toLowerCase();

  let color = customColor || ThemeTokens.categories.Otros || '#8B82B8';
  let icon = { ios: 'tag.fill', android: 'label', web: 'label' };

  if (
    lower.includes('aliment') ||
    lower.includes('café') ||
    lower.includes('cafe') ||
    lower.includes('comida') ||
    lower.includes('restaur') ||
    lower.includes('superama') ||
    lower.includes('despensa')
  ) {
    color = customColor || ThemeTokens.categories.Alimentación || '#FF9142';
    icon = { ios: 'fork.knife', android: 'restaurant', web: 'restaurant' };
  } else if (
    lower.includes('transp') ||
    lower.includes('uber') ||
    lower.includes('auto') ||
    lower.includes('gasolin') ||
    lower.includes('taxi') ||
    lower.includes('viaje')
  ) {
    color = customColor || ThemeTokens.categories.Transporte || '#4D9EFF';
    icon = { ios: 'car.fill', android: 'directions_car', web: 'directions_car' };
  } else if (
    lower.includes('servic') ||
    lower.includes('cfe') ||
    lower.includes('luz') ||
    lower.includes('agua') ||
    lower.includes('internet') ||
    lower.includes('gas') ||
    lower.includes('telmex')
  ) {
    color = customColor || ThemeTokens.categories.Servicios || '#FFD23F';
    icon = { ios: 'bolt.fill', android: 'bolt', web: 'bolt' };
  } else if (
    lower.includes('entreten') ||
    lower.includes('ocio') ||
    lower.includes('netflix') ||
    lower.includes('cinépolis') ||
    lower.includes('cine') ||
    lower.includes('spotify') ||
    lower.includes('cinepolis')
  ) {
    color = customColor || ThemeTokens.categories.Entretenimiento || '#E14FFF';
    icon = { ios: 'film.fill', android: 'movie', web: 'movie' };
  } else if (
    lower.includes('salud') ||
    lower.includes('farmacia') ||
    lower.includes('gym') ||
    lower.includes('gimnasio') ||
    lower.includes('smart fit') ||
    lower.includes('medic') ||
    lower.includes('doctor')
  ) {
    color = customColor || ThemeTokens.categories.Salud || '#FF6FB3';
    icon = { ios: 'heart.fill', android: 'favorite', web: 'favorite' };
  } else if (
    lower.includes('hogar') ||
    lower.includes('renta') ||
    lower.includes('casa') ||
    lower.includes('depto') ||
    lower.includes('mantenimiento')
  ) {
    color = customColor || ThemeTokens.categories.Hogar || '#2DE1C2';
    icon = { ios: 'house.fill', android: 'home', web: 'home' };
  } else if (
    lower.includes('compra') ||
    lower.includes('tienda') ||
    lower.includes('super') ||
    lower.includes('amazon')
  ) {
    color = customColor || ThemeTokens.categories.Compras || '#9B6BFF';
    icon = { ios: 'bag.fill', android: 'shopping_bag', web: 'shopping_bag' };
  } else if (
    lower.includes('nómin') ||
    lower.includes('nomin') ||
    lower.includes('sueldo') ||
    lower.includes('salario')
  ) {
    color = customColor || ThemeTokens.categories.Nómina || '#39FFC4';
    icon = { ios: 'briefcase.fill', android: 'work', web: 'work' };
  } else if (lower.includes('freelance')) {
    color = customColor || ThemeTokens.categories.Freelance || '#4D9EFF';
    icon = { ios: 'laptopcomputer', android: 'computer', web: 'laptop' };
  } else if (lower.includes('otro')) {
    color = customColor || ThemeTokens.categories.Otros || '#8B82B8';
    icon = { ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' };
  }

  return { color, icon };
}

export function CategoryIcon({
  name,
  color,
  size = 40,
  iconSize = 20,
  borderRadius = Radii.icon,
  iconColor = '#0D0B1A',
  style,
}: CategoryIconProps) {
  const meta = getCategoryMeta(name, color);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: meta.color,
        },
        style,
      ]}
    >
      <SymbolView
        name={meta.icon as any}
        size={iconSize}
        tintColor={iconColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
