import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type RecipeImageProps = {
  uri: string | null;
  title: string;
  subtitle?: string | null;
  variant: 'thumbnail' | 'hero';
};

function getInitials(title: string) {
  const words = title
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (words.length === 0) return 'RF';

  return words.map((word) => word[0]?.toUpperCase()).join('');
}

export function RecipeImage({ uri, title, subtitle, variant }: RecipeImageProps) {
  const [failed, setFailed] = useState(false);
  const isHero = variant === 'hero';

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={isHero ? styles.heroImage : styles.thumbnail}
        contentFit="cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View style={[styles.fallback, isHero ? styles.heroImage : styles.thumbnail]}>
      <ThemedText type={isHero ? 'title' : 'smallBold'} style={isHero ? styles.heroInitials : styles.thumbnailInitials}>
        {getInitials(title)}
      </ThemedText>
      {isHero ? (
        <ThemedText themeColor="textSecondary" style={styles.fallbackSubtitle}>
          {subtitle || 'Sem imagem disponível'}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 10,
  },
  heroImage: {
    width: '100%',
    height: 220,
    borderRadius: 14,
  },
  fallback: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: 'rgba(120, 120, 128, 0.16)',
  },
  thumbnailInitials: {
    color: '#007AFF',
    textAlign: 'center',
  },
  heroInitials: {
    color: '#007AFF',
    textAlign: 'center',
  },
  fallbackSubtitle: {
    textAlign: 'center',
    lineHeight: 19,
  },
});
