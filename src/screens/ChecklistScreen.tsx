import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Image,
  Alert,
  Modal,
  Linking,
  TextInput as RNTextInput,
} from 'react-native';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ChevronsRight,
  Circle,
  Camera,
  X,
  Ban,
  Clock,
  MapPin,
  CalendarDays,
  AlarmClock,
  Timer,
  Info,
  Phone,
  Key,
  User,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { Section, AddOn } from '../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { RootStackParamList } from '../types';

type Route = RouteProp<RootStackParamList, 'Checklist'>;
type TabFilter = 'pending' | 'in-progress' | 'completed';

interface SkipModalProps {
  visible: boolean;
  sectionName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

function SkipModal({ visible, sectionName, onConfirm, onCancel }: SkipModalProps) {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');
  const reasons = [t('clientRequest'), t('alreadyClean'), t('noAccess'), t('outOfTime'), t('other')];

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <Text style={modalStyles.title}>{t('skip')} "{sectionName}"?</Text>
          <Text style={modalStyles.sub}>{t('selectOrTypeReason')}</Text>
          <View style={modalStyles.chips}>
            {reasons.map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setReason(r)}
                style={[modalStyles.chip, reason === r && modalStyles.chipActive]}
              >
                <Text style={[modalStyles.chipText, reason === r && modalStyles.chipTextActive]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <RNTextInput
            placeholder={t('orTypeCustomReason')}
            value={reason}
            onChangeText={setReason}
            style={modalStyles.input}
            placeholderTextColor={COLORS.gray400}
          />
          <View style={modalStyles.actions}>
            <TouchableOpacity onPress={onCancel} style={modalStyles.cancelBtn}>
              <Text style={modalStyles.cancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (reason.trim()) {
                  onConfirm(reason.trim());
                  setReason('');
                }
              }}
              style={[modalStyles.confirmBtn, !reason.trim() && { opacity: 0.4 }]}
              disabled={!reason.trim()}
            >
              <Text style={modalStyles.confirmText}>{t('skipSection')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface TodoRowProps {
  todo: { id: string; text: string; completed: boolean };
  jobId: string;
  sectionId: string;
}

function TodoRow({ todo, jobId, sectionId }: TodoRowProps) {
  const { toggleTodo } = useApp();
  const scale = useSharedValue(1);
  const prevCompleted = useRef(todo.completed);

  useEffect(() => {
    if (todo.completed && !prevCompleted.current) {
      scale.value = withSequence(
        withTiming(1.35, { duration: 140, easing: Easing.out(Easing.quad) }),
        withTiming(0.9,  { duration: 110, easing: Easing.in(Easing.quad) }),
        withTiming(1.2,  { duration: 120, easing: Easing.out(Easing.quad) }),
        withTiming(1,    { duration: 100, easing: Easing.in(Easing.quad) }),
      );
    }
    prevCompleted.current = todo.completed;
  }, [todo.completed]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <TouchableOpacity
      onPress={() => toggleTodo(jobId, sectionId, todo.id)}
      style={sectionStyles.todoRow}
      activeOpacity={0.7}
    >
      <Animated.View style={iconStyle}>
        {todo.completed ? (
          <CheckCircle2 size={22} color={COLORS.primary} />
        ) : (
          <Circle size={22} color={COLORS.gray300} />
        )}
      </Animated.View>
      <Text style={[sectionStyles.todoText, todo.completed && sectionStyles.todoTextDone]}>
        {todo.text}
      </Text>
    </TouchableOpacity>
  );
}

function getSectionStatus(section: Section): TabFilter {
  if (section.skipReason) return 'completed';
  const done = section.todos.filter((t) => t.completed).length;
  if (done === 0) return 'pending';
  if (done === section.todos.length) return 'completed';
  return 'in-progress';
}

interface SectionCardProps {
  section: Section;
  jobId: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

type SectionNav = NativeStackNavigationProp<RootStackParamList>;

function SectionCard({ section, jobId, isExpanded, onToggleExpand }: SectionCardProps) {
  const { t } = useLanguage();
  const { markAllDone, photosChange, updateSkipReason, clearSkipReason } = useApp();
  const navigation = useNavigation<SectionNav>();
  const [photoType, setPhotoType] = useState<'before' | 'after'>('before');
  const [skipModalVisible, setSkipModalVisible] = useState(false);

  const completedCount = section.todos.filter((t) => t.completed).length;
  const totalCount = section.todos.length;
  const allDone = completedCount === totalCount;

  const glowAnim = useSharedValue(0);
  const prevAllDone = useRef(allDone);

  useEffect(() => {
    if (allDone && !prevAllDone.current && !section.skipReason) {
      glowAnim.value = withSequence(
        withTiming(1, { duration: 220 }),
        withTiming(0, { duration: 220 }),
        withTiming(1, { duration: 220 }),
        withTiming(0, { duration: 220 }),
      );
    }
    prevAllDone.current = allDone;
  }, [allDone]);

  const glowStyle = useAnimatedStyle(() => ({
    borderWidth: 2,
    borderColor: interpolateColor(glowAnim.value, [0, 1], [COLORS.gray200, COLORS.primary]),
  }));

  const pickPhoto = async (type: 'before' | 'after') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      const libraryStatus = (await ImagePicker.requestMediaLibraryPermissionsAsync()).status;
      if (libraryStatus !== 'granted') {
        Alert.alert(t('permissionNeeded'), t('permissionNeededCamera'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (!result.canceled) {
        const current = type === 'before' ? section.beforePhotos : section.afterPhotos;
        photosChange(jobId, section.id, type, [...current, result.assets[0].uri]);
      }
      return;
    }
    Alert.alert(t('addPhoto'), t('chooseSource'), [
      {
        text: t('camera'),
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
          if (!result.canceled) {
            const current = type === 'before' ? section.beforePhotos : section.afterPhotos;
            photosChange(jobId, section.id, type, [...current, result.assets[0].uri]);
          }
        },
      },
      {
        text: t('gallery'),
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
          });
          if (!result.canceled) {
            const current = type === 'before' ? section.beforePhotos : section.afterPhotos;
            photosChange(jobId, section.id, type, [...current, result.assets[0].uri]);
          }
        },
      },
      { text: t('cancel'), style: 'cancel' },
    ]);
  };

  const removePhoto = (type: 'before' | 'after', index: number) => {
    const current = type === 'before' ? section.beforePhotos : section.afterPhotos;
    photosChange(jobId, section.id, type, current.filter((_, i) => i !== index));
  };

  return (
    <Animated.View style={[sectionStyles.card, section.skipReason ? sectionStyles.cardSkipped : null, glowStyle]}>
      {/* Card header */}
      <TouchableOpacity onPress={onToggleExpand} style={sectionStyles.header} activeOpacity={0.75}>
        {/* Round check button */}
        <TouchableOpacity
          onPress={() => markAllDone(jobId, section.id)}
          style={[sectionStyles.checkBtn, allDone && sectionStyles.checkBtnDone]}
          activeOpacity={0.7}
          disabled={!!section.skipReason}
        >
          {allDone ? (
            <CheckCircle2 size={22} color={COLORS.white} />
          ) : (
            <Circle size={22} color={allDone ? COLORS.white : COLORS.gray300} />
          )}
        </TouchableOpacity>

        <View style={sectionStyles.headerInfo}>
          <Text style={sectionStyles.name}>{section.name}</Text>
          <Text style={sectionStyles.count}>
            {section.skipReason ? t('skipped') : `${completedCount}/${totalCount} ${t('tasks')}`}
          </Text>
        </View>

        {isExpanded ? (
          <ChevronUp size={18} color={COLORS.mutedForeground} />
        ) : (
          <ChevronDown size={18} color={COLORS.mutedForeground} />
        )}
      </TouchableOpacity>

      {section.skipReason && (
        <View style={sectionStyles.skipBadge}>
          <Ban size={12} color={COLORS.warning} />
          <Text style={sectionStyles.skipText} numberOfLines={1}>{t('skipped')}: {section.skipReason}</Text>
          <TouchableOpacity
            onPress={() => clearSkipReason(jobId, section.id)}
            style={sectionStyles.reopenBtn}
            activeOpacity={0.7}
          >
            <Text style={sectionStyles.reopenText}>{t('resume')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {isExpanded && !section.skipReason && (
        <View style={sectionStyles.body}>
          {/* Estimated time */}
          {section.estimatedTime && (
            <View style={sectionStyles.estimatedRow}>
              <Clock size={13} color={COLORS.primary} />
              <Text style={sectionStyles.estimatedTime}>{t('estimatedTime')}: {section.estimatedTime}</Text>
            </View>
          )}

          {/* Todo list */}
          <View style={sectionStyles.todos}>
            {section.todos.map((todo) => (
              <TodoRow key={todo.id} todo={todo} jobId={jobId} sectionId={section.id} />
            ))}
          </View>

          {/* Photos */}
          <View style={sectionStyles.photosSection}>
            <View style={sectionStyles.photoTypeSwitch}>
              {(['before', 'after'] as const).map((pt) => (
                <TouchableOpacity
                  key={pt}
                  onPress={() => setPhotoType(pt)}
                  style={[sectionStyles.switchBtn, photoType === pt && sectionStyles.switchBtnActive]}
                >
                  <Text style={[sectionStyles.switchText, photoType === pt && sectionStyles.switchTextActive]}>
                    {pt === 'before' ? t('before') : t('after')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={sectionStyles.photoRow}>
              {(photoType === 'before' ? section.beforePhotos : section.afterPhotos).map((uri, i) => (
                <View key={i} style={sectionStyles.photoWrap}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('PhotoGallery', {
                        photos: photoType === 'before' ? section.beforePhotos : section.afterPhotos,
                        label: photoType === 'before' ? 'Before' : 'After',
                        sectionName: section.name,
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri }} style={sectionStyles.photo} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removePhoto(photoType, i)}
                    style={sectionStyles.removePhoto}
                  >
                    <X size={10} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity onPress={() => pickPhoto(photoType)} style={sectionStyles.addPhotoBtn}>
                <Camera size={20} color={COLORS.mutedForeground} />
                <Text style={sectionStyles.addPhotoText}>{t('add')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Skip section */}
          <TouchableOpacity
            onPress={() => setSkipModalVisible(true)}
            style={sectionStyles.skipBtn}
          >
            <Ban size={14} color={COLORS.mutedForeground} />
            <Text style={sectionStyles.skipBtnText}>{t('skipThis')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <SkipModal
        visible={skipModalVisible}
        sectionName={section.name}
        onConfirm={(reason) => {
          updateSkipReason(jobId, section.id, reason);
          setSkipModalVisible(false);
        }}
        onCancel={() => setSkipModalVisible(false)}
      />
    </Animated.View>
  );
}

interface AddOnsCardProps {
  addOns: AddOn[];
  jobId: string;
}

function AddOnsCard({ addOns, jobId }: AddOnsCardProps) {
  const { t } = useLanguage();
  const { toggleAddOn } = useApp();
  const [isExpanded, setIsExpanded] = useState(true);

  const selectedCount = addOns.filter((a) => a.selected).length;
  const totalCount = addOns.length;
  const allSelected = selectedCount === totalCount;

  const handleMarkAll = () => {
    addOns.forEach((a) => {
      if (!a.selected) toggleAddOn(jobId, a.id);
    });
  };

  return (
    <View style={sectionStyles.card}>
      <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={sectionStyles.header} activeOpacity={0.75}>
        <TouchableOpacity
          onPress={handleMarkAll}
          style={[sectionStyles.checkBtn, allSelected && sectionStyles.checkBtnDone]}
          activeOpacity={0.7}
          disabled={allSelected}
        >
          {allSelected ? (
            <CheckCircle2 size={22} color={COLORS.white} />
          ) : (
            <Circle size={22} color={COLORS.gray300} />
          )}
        </TouchableOpacity>
        <View style={sectionStyles.headerInfo}>
          <Text style={sectionStyles.name}>{t('addOns')}</Text>
          <Text style={sectionStyles.count}>{selectedCount}/{totalCount} {t('selected')}</Text>
        </View>
        {isExpanded ? (
          <ChevronUp size={18} color={COLORS.mutedForeground} />
        ) : (
          <ChevronDown size={18} color={COLORS.mutedForeground} />
        )}
      </TouchableOpacity>
      {isExpanded && (
        <View style={sectionStyles.body}>
          <View style={sectionStyles.todos}>
            {addOns.map((addon) => (
              <TouchableOpacity
                key={addon.id}
                onPress={() => toggleAddOn(jobId, addon.id)}
                style={sectionStyles.todoRow}
                activeOpacity={0.7}
              >
                {addon.selected ? (
                  <CheckCircle2 size={22} color={COLORS.primary} />
                ) : (
                  <Circle size={22} color={COLORS.gray300} />
                )}
                <Text style={[sectionStyles.todoText, addon.selected && sectionStyles.todoTextDone]}>
                  {addon.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export function ChecklistScreen() {
  const { t } = useLanguage();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { jobs, completeJob, cancelJob } = useApp();

  const job = jobs.find((j) => j.id === route.params.jobId);

  // Compute percentage before hooks so it's available in effects/deps
  const totalAddOns = job?.addOns?.length ?? 0;
  const doneAddOns = job?.addOns?.filter((a) => a.selected).length ?? 0;
  const totalTodos = (job?.sections.reduce((a, s) => a + s.todos.length, 0) ?? 0) + totalAddOns;
  const doneTodos = (job?.sections.reduce((a, s) =>
    a + (s.skipReason ? s.todos.length : s.todos.filter((t) => t.completed).length), 0) ?? 0) + doneAddOns;
  const progress = totalTodos > 0 ? doneTodos / totalTodos : 0;
  const percentage = Math.round(progress * 100);

  const [expandedSection, setExpandedSection] = useState<string | null>(job?.sections[0]?.id ?? null);
  const [activeTab, setActiveTab] = useState<TabFilter | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [cancelConfirmed, setCancelConfirmed] = useState(false);
  const [cancelTrackWidth, setCancelTrackWidth] = useState(0);
  const cancelMaxSwipe = cancelTrackWidth - 48 - 6;
  const [completeConfirmed, setCompleteConfirmed] = useState(false);
  const [completeTrackWidth, setCompleteTrackWidth] = useState(0);
  const completeMaxSwipe = completeTrackWidth - 48 - 6; // track width - thumb width - padding
  const completeSwipeX = useSharedValue(0);
  const completeSwipeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: completeSwipeX.value }],
  }));
  const completeSwipeBgStyle = useAnimatedStyle(() => ({
    opacity: Math.min(completeSwipeX.value / (completeMaxSwipe || 1), 1),
  }));
  const completeLabelStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(completeSwipeX.value / (completeMaxSwipe * 0.5), 1),
  }));
  const onCompleteConfirmed = () => {
    setCompleteConfirmed(true);
    setTimeout(() => {
      completeJob(job!.id);
      navigation.replace('JobCompleted', { jobId: job!.id });
    }, 1200);
  };
  const completePan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationX > 0) {
        completeSwipeX.value = Math.min(e.translationX, completeMaxSwipe);
      }
    })
    .onEnd(() => {
      if (completeSwipeX.value >= completeMaxSwipe - 10) {
        completeSwipeX.value = withTiming(completeMaxSwipe, { duration: 100 });
        runOnJS(onCompleteConfirmed)();
      } else {
        completeSwipeX.value = withTiming(0, { duration: 200 });
      }
    });
  const cancelSwipeX = useSharedValue(0);
  const cancelSwipeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cancelSwipeX.value }],
  }));
  const cancelSwipeBgStyle = useAnimatedStyle(() => ({
    opacity: Math.min(cancelSwipeX.value / (cancelMaxSwipe || 1), 1),
  }));
  const cancelLabelStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(cancelSwipeX.value / (cancelMaxSwipe * 0.5), 1),
  }));
  const onCancelConfirmed = () => {
    setCancelConfirmed(true);
    setTimeout(() => {
      setSettingsVisible(false);
      setCancelConfirmed(false);
      cancelSwipeX.value = 0;
      cancelJob(job!.id);
      navigation.goBack();
    }, 1200);
  };
  const cancelPan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationX > 0) {
        cancelSwipeX.value = Math.min(e.translationX, cancelMaxSwipe);
      }
    })
    .onEnd(() => {
      if (cancelSwipeX.value >= cancelMaxSwipe - 10) {
        cancelSwipeX.value = withTiming(cancelMaxSwipe, { duration: 100 });
        runOnJS(onCancelConfirmed)();
      } else {
        cancelSwipeX.value = withTiming(0, { duration: 200 });
      }
    });
  const [, forceUpdate] = useState(0);

  // Refs so we can mutate during render without causing extra renders
  const delayedSectionIds = useRef<Set<string>>(new Set());
  const prevSectionStatuses = useRef<Record<string, TabFilter>>({});


  const [barContainerWidth, setBarContainerWidth] = useState(0);
  const progressWidthAnim = useSharedValue(0);
  useEffect(() => {
    if (barContainerWidth > 0) {
      progressWidthAnim.value = withTiming(barContainerWidth * percentage / 100, { duration: 500 });
    }
  }, [percentage, barContainerWidth]);
  const progressBarAnimStyle = useAnimatedStyle(() => ({
    width: progressWidthAnim.value,
  }));

  if (!job) return null;

  // Detect transitions to 'completed' during render — before filteredSections is computed.
  // Using refs ensures the mutation is visible to filteredSections in the same render.
  for (const s of job.sections) {
    const newStatus = getSectionStatus(s);
    const prevStatus = prevSectionStatuses.current[s.id];
    if (prevStatus && prevStatus !== 'completed' && newStatus === 'completed') {
      if (!delayedSectionIds.current.has(s.id)) {
        delayedSectionIds.current.add(s.id);
        setTimeout(() => {
          delayedSectionIds.current.delete(s.id);
          forceUpdate((n) => n + 1);
        }, 1500);
      }
    }
    prevSectionStatuses.current[s.id] = newStatus;
  }

  const filteredSections = activeTab === null
    ? job.sections
    : job.sections.filter((s) => getSectionStatus(s) === activeTab || delayedSectionIds.current.has(s.id));

  const tabCounts = {
    pending: job.sections.filter((s) => getSectionStatus(s) === 'pending').length,
    'in-progress': job.sections.filter((s) => getSectionStatus(s) === 'in-progress').length,
    completed: job.sections.filter((s) => getSectionStatus(s) === 'completed').length,
  };



  const getAddOnsStatus = (): TabFilter => {
    if (!job.addOns || job.addOns.length === 0) return 'pending';
    const selected = job.addOns.filter((a) => a.selected).length;
    if (selected === 0) return 'pending';
    if (selected === job.addOns.length) return 'completed';
    return 'in-progress';
  };
  const showAddOns = job.addOns && job.addOns.length > 0 && (activeTab === null || getAddOnsStatus() === activeTab);


  const TABS: { key: TabFilter; label: string }[] = [
    { key: 'pending', label: t('pending') },
    { key: 'in-progress', label: t('inProgress') },
    { key: 'completed', label: t('completed') },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={COLORS.foreground} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowProgress((v) => !v)} activeOpacity={0.7} style={styles.topOrderBtn}>
          <Text style={styles.topOrder}>Order #{job.orderNumber}</Text>
          {showProgress
            ? <ChevronUp size={14} color={COLORS.mutedForeground} />
            : <ChevronDown size={14} color={COLORS.mutedForeground} />
          }
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { cancelSwipeX.value = 0; setSettingsVisible(true); }} style={styles.settingsBtn} activeOpacity={0.7}>
          <Info size={20} color={COLORS.foreground} />
        </TouchableOpacity>
      </View>

      {/* Progress hero */}
      {showProgress && (
        <View style={styles.progressHero}>
          <View style={styles.progressHeroLeft}>
            <Text style={styles.progressPct}>{percentage}%</Text>
            <Text style={styles.progressLabel}>{t('overallProgress')}</Text>
          </View>
          <View style={styles.progressHeroRight}>
            <Text style={styles.progressFraction}>{doneTodos}<Text style={styles.progressTotal}>/{totalTodos}</Text></Text>
            <Text style={styles.progressLabel}>{t('tasksDone')}</Text>
          </View>
        </View>
      )}

      {/* Progress bar — always visible */}
      <View style={styles.progressBarWrap}>
        <View
          style={styles.progressBg}
          onLayout={(e) => setBarContainerWidth(e.nativeEvent.layout.width)}
        >
          <Animated.View style={[styles.progressFill, progressBarAnimStyle]} />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(activeTab === tab.key ? null : tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tabCounts[tab.key] > 0 && (
              <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                  {tabCounts[tab.key]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Section cards + add-ons */}
        <View style={styles.sections}>
          {filteredSections.length === 0 && !showAddOns ? (
            <View style={styles.emptyTab}>
              <Text style={styles.emptyTabText}>{t('noSectionsInCategory')}</Text>
            </View>
          ) : (
            <>
              {filteredSections.map((section) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  jobId={job.id}
                  isExpanded={expandedSection === section.id}
                  onToggleExpand={() =>
                    setExpandedSection(expandedSection === section.id ? null : section.id)
                  }
                />
              ))}
              {showAddOns && <AddOnsCard addOns={job.addOns!} jobId={job.id} />}
            </>
          )}
        </View>
      </ScrollView>

      {/* Footer: Swipe to complete */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {completeConfirmed ? (
          <View style={styles.completeConfirmedTrack}>
            <CheckCircle2 size={20} color={COLORS.white} />
            <Text style={styles.completeConfirmedText}>{t('completed_excl')}</Text>
          </View>
        ) : (
          <View style={[styles.completeTrack, progress < 1 && styles.completeTrackPartial]} onLayout={(e) => setCompleteTrackWidth(e.nativeEvent.layout.width)}>
            <Animated.View style={[styles.completeReveal, progress < 1 ? styles.completeRevealPartial : null, completeSwipeBgStyle]} />
            <Animated.Text style={[styles.completeTrackLabel, completeLabelStyle]}>
              {t('swipeToComplete')}
            </Animated.Text>
            <GestureDetector gesture={completePan}>
              <Animated.View style={[styles.completeThumb, progress < 1 && styles.completeThumbPartial, completeSwipeAnimStyle]}>
                <ChevronsRight size={20} color={progress === 1 ? COLORS.primary : COLORS.primaryLight} />
              </Animated.View>
            </GestureDetector>
          </View>
        )}
      </View>

      {/* Settings / Job info modal */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => { setSettingsVisible(false); cancelSwipeX.value = 0; }}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Pressable style={settingsStyles.overlay} onPress={() => { setSettingsVisible(false); cancelSwipeX.value = 0; }}>
            <Pressable onPress={() => {}}>
              <View style={settingsStyles.sheet}>
                {/* Handle */}
                <View style={settingsStyles.handle} />

                {/* Header */}
                <View style={settingsStyles.header}>
                  <View style={settingsStyles.headerIcon}>
                    <Info size={20} color={COLORS.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={settingsStyles.title}>{job.serviceType}</Text>
                    <Text style={settingsStyles.subtitle}>Order #{job.orderNumber}</Text>
                  </View>
                  <TouchableOpacity onPress={() => { setSettingsVisible(false); cancelSwipeX.value = 0; }} style={settingsStyles.closeBtn} activeOpacity={0.7}>
                    <X size={18} color={COLORS.mutedForeground} />
                  </TouchableOpacity>
                </View>

                {/* Info cards */}
                <View style={settingsStyles.infoGrid}>
                  <View style={settingsStyles.infoCard}>
                    <CalendarDays size={16} color={COLORS.primary} />
                    <Text style={settingsStyles.infoCardLabel}>{t('date')}</Text>
                    <Text style={settingsStyles.infoCardValue}>{job.date}</Text>
                  </View>
                  <View style={settingsStyles.infoCard}>
                    <AlarmClock size={16} color={COLORS.primary} />
                    <Text style={settingsStyles.infoCardLabel}>{t('time')}</Text>
                    <Text style={settingsStyles.infoCardValue}>{job.time}</Text>
                  </View>
                  <View style={settingsStyles.infoCard}>
                    <Timer size={16} color={COLORS.primary} />
                    <Text style={settingsStyles.infoCardLabel}>{t('duration')}</Text>
                    <Text style={settingsStyles.infoCardValue}>{job.duration}</Text>
                  </View>
                </View>

                {/* Client */}
                <View style={settingsStyles.infoRowFull}>
                  <View style={settingsStyles.infoRowIcon}>
                    <User size={15} color={COLORS.primary} />
                  </View>
                  <Text style={settingsStyles.infoRowText}>{job.clientName}</Text>
                </View>

                {/* Phone */}
                {job.phone && (
                  <TouchableOpacity
                    style={settingsStyles.infoRowFull}
                    onPress={() => Linking.openURL(`tel:${job.phone}`)}
                    activeOpacity={0.7}
                  >
                    <View style={settingsStyles.infoRowIcon}>
                      <Phone size={15} color={COLORS.primary} />
                    </View>
                    <Text style={[settingsStyles.infoRowText, { color: COLORS.primary }]}>{job.phone}</Text>
                  </TouchableOpacity>
                )}

                {/* Address */}
                <View style={settingsStyles.infoRowFull}>
                  <View style={settingsStyles.infoRowIcon}>
                    <MapPin size={15} color={COLORS.primary} />
                  </View>
                  <Text style={settingsStyles.infoRowText}>{job.address}</Text>
                </View>

                {job.specialInstructions && (
                  <View style={settingsStyles.infoRowFull}>
                    <View style={settingsStyles.infoRowIcon}>
                      <Info size={15} color={COLORS.primary} />
                    </View>
                    <Text style={settingsStyles.infoRowText}>{job.specialInstructions}</Text>
                  </View>
                )}

                {job.accessInfo && (
                  <View style={settingsStyles.infoRowFull}>
                    <View style={settingsStyles.infoRowIcon}>
                      <Key size={15} color={COLORS.primary} />
                    </View>
                    <Text style={settingsStyles.infoRowText}>{job.accessInfo}</Text>
                  </View>
                )}

                {/* Divider */}
                <View style={settingsStyles.divider} />

                {/* Swipe-right cancel */}
                <Text style={settingsStyles.swipeHint}>{t('swipeRightToCancel')}</Text>
                {cancelConfirmed ? (
                  <View style={settingsStyles.cancelConfirmedTrack}>
                    <CheckCircle2 size={20} color={COLORS.white} />
                    <Text style={settingsStyles.cancelConfirmedText}>{t('canceled')}</Text>
                  </View>
                ) : (
                  <View style={settingsStyles.cancelTrack} onLayout={(e) => setCancelTrackWidth(e.nativeEvent.layout.width)}>
                    <Animated.View style={[settingsStyles.cancelReveal, cancelSwipeBgStyle]} />
                    <Animated.Text style={[settingsStyles.cancelTrackLabel, cancelLabelStyle]}>{t('cancelJob')}</Animated.Text>
                    <GestureDetector gesture={cancelPan}>
                      <Animated.View style={[settingsStyles.cancelThumb, cancelSwipeAnimStyle]}>
                        <ChevronsRight size={20} color={COLORS.white} />
                      </Animated.View>
                    </GestureDetector>
                  </View>
                )}
              </View>
            </Pressable>
          </Pressable>
        </GestureHandlerRootView>
      </Modal>

    </View>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: SPACING.xxl,
    paddingBottom: 36,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.foreground,
    marginBottom: 4,
  },
  sub: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.mutedForeground,
    marginBottom: 16,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.foreground,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.foreground,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: FONTS.semibold,
    fontSize: 14,
    color: COLORS.foreground,
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontFamily: FONTS.semibold,
    fontSize: 14,
    color: COLORS.white,
  },
});

const settingsStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: SPACING.xxl,
    paddingBottom: 36,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray200,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.semibold,
    fontSize: 16,
    color: COLORS.foreground,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.mutedForeground,
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 4,
  },
  infoCardLabel: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COLORS.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCardValue: {
    fontFamily: FONTS.semibold,
    fontSize: 13,
    color: COLORS.foreground,
    textAlign: 'center',
  },
  infoRowFull: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  infoRowIcon: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRowText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.foreground,
    flex: 1,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: 16,
  },
  swipeHint: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.mutedForeground,
    textAlign: 'center',
    marginBottom: 10,
  },
  cancelTrack: {
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray100,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelReveal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#dc2626',
    borderRadius: RADIUS.full,
  },
  cancelTrackLabel: {
    fontFamily: FONTS.semibold,
    fontSize: 14,
    color: COLORS.error,
  },
  cancelThumb: {
    position: 'absolute',
    left: 3,
    top: 2.5,
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelConfirmedTrack: {
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelConfirmedText: {
    fontFamily: FONTS.semibold,
    fontSize: 16,
    color: COLORS.white,
  },
});


const sectionStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  cardSkipped: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: 12,
  },
  checkBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
  },
  checkBtnDone: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: FONTS.semibold,
    fontSize: 15,
    color: COLORS.foreground,
  },
  count: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.mutedForeground,
  },
  estimatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: COLORS.primaryContainer,
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
  },
  estimatedTime: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.primary,
  },
  skipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.md,
  },
  skipText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#92400e',
    flex: 1,
  },
  reopenBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.warning,
  },
  reopenText: {
    fontFamily: FONTS.semibold,
    fontSize: 11,
    color: COLORS.white,
  },
  body: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: 14,
  },
  todos: {
    gap: 10,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  todoText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.foreground,
    flex: 1,
    lineHeight: 20,
  },
  todoTextDone: {
    color: COLORS.gray400,
    textDecorationLine: 'line-through',
  },
  photosSection: {
    gap: 10,
  },
  photoTypeSwitch: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.xl,
    padding: 3,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  switchBtnActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  switchText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.mutedForeground,
  },
  switchTextActive: {
    color: COLORS.foreground,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoWrap: {
    position: 'relative',
  },
  photo: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.lg,
  },
  removePhoto: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.gray100,
    borderWidth: 1.5,
    borderColor: COLORS.gray300,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoText: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.mutedForeground,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  skipBtnText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.mutedForeground,
  },
});


const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  topOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  topOrder: {
    fontFamily: FONTS.semibold,
    fontSize: 15,
    color: COLORS.foreground,
  },
  progressHero: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    gap: 20,
  },
  progressHeroLeft: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  progressHeroRight: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  progressPct: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    color: COLORS.foreground,
    includeFontPadding: false,
  },
  progressFraction: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    color: COLORS.foreground,
    includeFontPadding: false,
  },
  progressTotal: {
    fontFamily: FONTS.regular,
    fontSize: 18,
    color: COLORS.mutedForeground,
  },
  progressLabel: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.mutedForeground,
    marginTop: 2,
  },
  progressBarWrap: {
    paddingHorizontal: SPACING.xxl,
    marginBottom: SPACING.md,
  },
  progressBg: {
    height: 8,
    backgroundColor: COLORS.gray200,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xxl,
    gap: 8,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.mutedForeground,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  tabBadge: {
    backgroundColor: COLORS.gray200,
    borderRadius: RADIUS.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: COLORS.foreground,
    includeFontPadding: false,
  },
  tabBadgeTextActive: {
    color: COLORS.white,
  },
  sections: {
    paddingHorizontal: SPACING.xxl,
    marginBottom: SPACING.lg,
  },
  emptyTab: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xxl,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  emptyTabText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.mutedForeground,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.xxl,
    paddingTop: 14,
  },
  completeTrack: {
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  completeTrackPartial: {
    backgroundColor: COLORS.primaryLight,
  },
  completeReveal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.full,
  },
  completeRevealPartial: {
    backgroundColor: COLORS.primary,
  },
  completeTrackLabel: {
    fontFamily: FONTS.semibold,
    fontSize: 15,
    color: COLORS.white,
  },
  completeThumb: {
    position: 'absolute',
    left: 3,
    top: 2.5,
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeThumbPartial: {
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  completeConfirmedTrack: {
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.md,
  },
  completeConfirmedText: {
    fontFamily: FONTS.semibold,
    fontSize: 16,
    color: COLORS.white,
  },
});
