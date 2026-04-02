import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowLeft, X, Images } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { RootStackParamList } from '../types';

const { width, height } = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP = 10;
const PHOTO_SIZE = (width - GRID_PADDING * 2 - GRID_GAP) / 2;
const MAX_DOTS = 8;

type Route = RouteProp<RootStackParamList, 'PhotoGallery'>;

function CarouselDots({ count, activeIndex }: { count: number; activeIndex: number }) {
  if (count > MAX_DOTS) return null;
  return (
    <View style={dotsStyles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[dotsStyles.dot, i === activeIndex && dotsStyles.dotActive]} />
      ))}
    </View>
  );
}

export function PhotoGalleryScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { photos, label, sectionName } = route.params;

  const [viewerVisible, setViewerVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<FlatList>(null);

  const counterOpacity = useSharedValue(1);
  const counterStyle = useAnimatedStyle(() => ({ opacity: counterOpacity.value }));

  const openPhoto = useCallback((index: number) => {
    setActiveIndex(index);
    setViewerVisible(true);
    setTimeout(() => {
      carouselRef.current?.scrollToIndex({ index, animated: false });
    }, 60);
  }, []);

  const handleScrollEnd = useCallback((e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    counterOpacity.value = withTiming(0, { duration: 80 }, () => {
      counterOpacity.value = withTiming(1, { duration: 150 });
    });
    setActiveIndex(index);
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={COLORS.foreground} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{label} Photos</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{sectionName}</Text>
        </View>

        <View style={styles.countBadge}>
          <Images size={13} color={COLORS.primary} />
          <Text style={styles.countText}>{photos.length}</Text>
        </View>
      </View>

      {/* ── Photo grid ── */}
      <FlatList
        data={photos}
        numColumns={2}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => openPhoto(index)}
            activeOpacity={0.88}
            style={styles.photoWrap}
          >
            <Image source={{ uri: item }} style={styles.photo} resizeMode="cover" />
            <View style={styles.photoOverlay}>
              <Text style={styles.photoIndex}>{index + 1}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* ── Full-screen carousel viewer ── */}
      <Modal
        visible={viewerVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setViewerVisible(false)}
      >
        <View style={viewer.root}>
          <StatusBar backgroundColor="#000" barStyle="light-content" />

          <FlatList
            ref={carouselRef}
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            onMomentumScrollEnd={handleScrollEnd}
            renderItem={({ item }) => (
              <View style={viewer.page}>
                <Image
                  source={{ uri: item }}
                  style={viewer.image}
                  resizeMode="contain"
                />
              </View>
            )}
          />

          {/* Top bar */}
          <View style={[viewer.topBar, { paddingTop: insets.top + 8 }]}>
            <View style={viewer.topBarLabel}>
              <Text style={viewer.topBarTitle}>{label} Photos</Text>
              <Text style={viewer.topBarSub}>{sectionName}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setViewerVisible(false)}
              style={viewer.closeBtn}
              activeOpacity={0.8}
            >
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Bottom counter + dots */}
          <View style={[viewer.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
            <CarouselDots count={photos.length} activeIndex={activeIndex} />
            <Animated.Text style={[viewer.counter, counterStyle]}>
              {activeIndex + 1} / {photos.length}
            </Animated.Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: FONTS.semibold,
    fontSize: 16,
    color: COLORS.foreground,
    lineHeight: 20,
  },
  headerSub: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.mutedForeground,
    marginTop: 1,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primaryContainer,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  countText: {
    fontFamily: FONTS.semibold,
    fontSize: 13,
    color: COLORS.primary,
  },
  grid: {
    padding: GRID_PADDING,
    gap: GRID_GAP,
  },
  gridRow: {
    gap: GRID_GAP,
  },
  photoWrap: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 7,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIndex: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: '#fff',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 14,
  },
});

const viewer = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  page: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width,
    height: height * 0.78,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  topBarLabel: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  topBarTitle: {
    fontFamily: FONTS.semibold,
    fontSize: 15,
    color: '#fff',
  },
  topBarSub: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingTop: SPACING.lg,
  },
  counter: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
  },
});

const dotsStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#fff',
  },
});
