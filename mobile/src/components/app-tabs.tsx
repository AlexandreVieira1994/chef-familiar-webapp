import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

const iconHome = require('@/assets/images/tabIcons/home.png');
const iconExplore = require('@/assets/images/tabIcons/explore.png');

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={iconHome} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="inventory">
        <NativeTabs.Trigger.Label>Inventario</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={iconExplore} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="recipes">
        <NativeTabs.Trigger.Label>Receitas</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={iconExplore} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="planner">
        <NativeTabs.Trigger.Label>Plano</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={iconExplore} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="rules">
        <NativeTabs.Trigger.Label>Regras</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={iconExplore} renderingMode="template" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
