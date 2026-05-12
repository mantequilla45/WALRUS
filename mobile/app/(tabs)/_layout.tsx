import {
  createMaterialTopTabNavigator,
  type MaterialTopTabBarProps,
} from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';

import { IconSymbol } from '@/components/ui/icon-symbol';

const ACTIVE_COLOR = '#007AFF';
const INACTIVE_COLOR = '#8E8E93';

const { Navigator } = createMaterialTopTabNavigator();
const MaterialTopTabs: any = withLayoutContext(Navigator);

const ICONS: Record<string, React.ComponentProps<typeof IconSymbol>['name']> = {
  index: 'house.fill',
  controls: 'slider.horizontal.3',
  analytics: 'chart.bar.fill',
  explore: 'gearshape.fill',
};

function BottomTabBar({ state, descriptors, navigation, position }: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);

  const tabCount = state.routes.length;
  const tabWidth = barWidth / tabCount;
  const inputRange = state.routes.map((_, i) => i);

  // Indicator pill slides smoothly with the swipe gesture
  const indicatorTranslateX = position.interpolate({
    inputRange,
    outputRange: inputRange.map((i) => i * tabWidth),
  });

  return (
    <View
      style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 6) }]}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
    >
      {/* Sliding pill behind active tab */}
      {barWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              width: tabWidth - 24,
              transform: [{ translateX: Animated.add(indicatorTranslateX, 12) }],
            },
          ]}
        />
      )}

      {state.routes.map((route, idx) => {
        const focused = state.index === idx;
        const { options } = descriptors[route.key];
        const label = (options.title as string) ?? route.name;
        const iconName = ICONS[route.name];

        // Label color is binary (active/inactive). Avoids a subtle Animated.Text bug
        // on iOS where outputRange with duplicate values can yield the wrong color.
        const labelColor = focused ? ACTIVE_COLOR : INACTIVE_COLOR;

        // Active tab scales up subtly
        const scale = position.interpolate({
          inputRange,
          outputRange: inputRange.map((i) => (i === idx ? 1.06 : 1)),
        });

        const onPress = () => {
          if (process.env.EXPO_OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // We can't pass Animated color into IconSymbol (uses MaterialIcons internally),
        // so we layer two icons at different opacities and crossfade them.
        const activeIconOpacity = position.interpolate({
          inputRange,
          outputRange: inputRange.map((i) => (i === idx ? 1 : 0)),
        });

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tab}
            android_ripple={{ borderless: true, radius: 36 }}
          >
            <Animated.View style={{ transform: [{ scale }] }}>
              <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
                {/* Inactive icon (gray) */}
                <IconSymbol name={iconName} size={26} color={INACTIVE_COLOR} />
                {/* Active icon (blue) crossfaded on top */}
                <Animated.View
                  pointerEvents="none"
                  style={{ position: 'absolute', opacity: activeIconOpacity }}
                >
                  <IconSymbol name={iconName} size={26} color={ACTIVE_COLOR} />
                </Animated.View>
              </View>
            </Animated.View>
            <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <MaterialTopTabs
      tabBarPosition="bottom"
      tabBar={(props: MaterialTopTabBarProps) => <BottomTabBar {...props} />}
      sceneContainerStyle={{ backgroundColor: '#F5F6FA' }}
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: true,
      }}
    >
      <MaterialTopTabs.Screen name="index" options={{ title: 'Home' }} />
      <MaterialTopTabs.Screen name="controls" options={{ title: 'Controls' }} />
      <MaterialTopTabs.Screen name="analytics" options={{ title: 'Analytics' }} />
      <MaterialTopTabs.Screen name="explore" options={{ title: 'Settings' }} />
    </MaterialTopTabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D1D1D6',
    paddingTop: 6,
    position: 'relative',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
  indicator: {
    position: 'absolute',
    top: 6,
    left: 0,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EBF5FF',
  },
});
