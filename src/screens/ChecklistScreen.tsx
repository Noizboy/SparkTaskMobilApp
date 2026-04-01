import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Modal,
  TextInput as RNTextInput,
} from 'react-native';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Camera,
  X,
  Ban,
  CheckCheck,
  ChevronsLeft,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/StatusBadge';
import { Section, AddOn } from '../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { RootStackParamList } from '../types';
import { formatDate } from '../utils/dateUtils';

type Route = RouteProp<RootStackParamList, 'Checklist'>;
type TabFilter = 'pending' | 'in-progress' | 'completed';

interface SkipModalProps {
  visible: boolean;
  sectionName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

function SkipModal({ visible, sectionName, onConfirm, onCancel }: SkipModalProps) {
  const [reason, setReason] = useState('');
  const reasons = ['Client request', 'Already clean', 'No access', 'Out of time', 'Other'];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <Text style={modalStyles.title}>Skip "{sectionName}"?</Text>
          <Text style={modalStyles.sub}>Select or type a reason</Text>
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
            placeholder="Or type a custom reason..."
            value={reason}
            onChangeText={setReason}
            style={modalStyles.input}
            placeholderTextColor={COLORS.gray400}
          />
          <View style={modalStyles.actions}>
            <TouchableOpacity onPress={onCancel} style={modalStyles.cancelBtn}>
              <Text style={modalStyles.cancelText}>Cancel</Text>
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
              <Text style={modalStyles.confirmText}>Skip Section</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface SectionCardProps {
  section: Section;
  jobId: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

type SectionNav = NativeStackNavigationProp<RootStackParamList>;

function SectionCard({ section, jobId, isExpanded, onToggleExpand }: SectionCardProps) {
  const { toggleTodo, markAllDone, photosChange, updateSkipReason } = useApp();
  const navigation = useNavigation<SectionNav>();
  const [photoType, setPhotoType] = useState<'before' | 'after'>('before');
  const [skipModalVisible, setSkipModalVisible] = useState(false);

  const completedCount = section.todos.filter((t) => t.completed).length;
  const totalCount = section.todos.length;
  const allDone = completedCount === totalCount;

  const pickPhoto = async (type: 'before' | 'after') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      const libraryStatus = (await ImagePicker.requestMediaLibraryPermissionsAsync()).status;
      if (libraryStatus !== 'granted') {
        Alert.alert('Permission needed', 'Camera or gallery access is required.');
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
    Alert.alert('Add Photo', 'Choose source', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
          if (!result.canceled) {
            const current = type === 'before' ? section.beforePhotos : section.afterPhotos;
            photosChange(jobId, section.id, type, [...current, result.assets[0].uri]);
          }
        },
      },
      {
        text: 'Gallery',
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
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removePhoto = (type: 'before' | 'after', index: number) => {
    const current = type === 'before' ? section.beforePhotos : section.afterPhotos;
    photosChange(jobId, section.id, type, current.filter((_, i) => i !== index));
  };

  return (
    <View style={[sectionStyles.card, section.skipReason ? sectionStyles.cardSkipped : null]}>
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
            {section.skipReason ? 'Skipped' : `${completedCount}/${totalCount} tasks`}
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
          <Text style={sectionStyles.skipText}>Skipped: {section.skipReason}</Text>
        </View>
      )}

      {isExpanded && !section.skipReason && (
        <View style={sectionStyles.body}>
          {/* Mark all button */}
          {!allDone && (
            <TouchableOpacity
              onPress={() => markAllDone(jobId, section.id)}
              style={sectionStyles.markAllBtn}
            >
              <CheckCheck size={14} color={COLORS.white} />
              <Text style={sectionStyles.markAllText}>Mark all done</Text>
            </TouchableOpacity>
          )}

          {/* Todo list */}
          <View style={sectionStyles.todos}>
            {section.todos.map((todo) => (
              <TouchableOpacity
                key={todo.id}
                onPress={() => toggleTodo(jobId, section.id, todo.id)}
                style={sectionStyles.todoRow}
                activeOpacity={0.7}
              >
                {todo.completed ? (
                  <CheckCircle2 size={22} color={COLORS.primary} />
                ) : (
                  <Circle size={22} color={COLORS.gray300} />
                )}
                <Text style={[sectionStyles.todoText, todo.completed && sectionStyles.todoTextDone]}>
                  {todo.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Photos */}
          <View style={sectionStyles.photosSection}>
            <View style={sectionStyles.photoTypeSwitch}>
              {(['before', 'after'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setPhotoType(t)}
                  style={[sectionStyles.switchBtn, photoType === t && sectionStyles.switchBtnActive]}
                >
                  <Text style={[sectionStyles.switchText, photoType === t && sectionStyles.switchTextActive]}>
                    {t === 'before' ? 'Before' : 'After'}
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
                <Text style={sectionStyles.addPhotoText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Skip section */}
          <TouchableOpacity
            onPress={() => setSkipModalVisible(true)}
            style={sectionStyles.skipBtn}
          >
            <Ban size={14} color={COLORS.mutedForeground} />
            <Text style={sectionStyles.skipBtnText}>Skip this section</Text>
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
    </View>
  );
}

interface AddOnsCardProps {
  addOns: AddOn[];
  jobId: string;
}

function AddOnsCard({ addOns, jobId }: AddOnsCardProps) {
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
          <Text style={sectionStyles.name}>Add-ons</Text>
          <Text style={sectionStyles.count}>{selectedCount}/{totalCount} selected</Text>
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
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { jobs, completeJob, cancelJob } = useApp();

  const job = jobs.find((j) => j.id === route.params.jobId);
  const [expandedSection, setExpandedSection] = useState<string | null>(job?.sections[0]?.id ?? null);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>('pending');

  const swipeX = useSharedValue(0);
  const swipeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: swipeX.value }],
  }));

  if (!job) return null;

  const totalTodos = job.sections.reduce((a, s) => a + s.todos.length, 0);
  const doneTodos = job.sections.reduce((a, s) => a + s.todos.filter((t) => t.completed).length, 0);
  const progress = totalTodos > 0 ? doneTodos / totalTodos : 0;
  const percentage = Math.round(progress * 100);

  // Filter sections by tab
  const getSectionStatus = (section: Section): TabFilter => {
    if (section.skipReason) return 'completed';
    const done = section.todos.filter((t) => t.completed).length;
    if (done === 0) return 'pending';
    if (done === section.todos.length) return 'completed';
    return 'in-progress';
  };

  const filteredSections = job.sections.filter((s) => getSectionStatus(s) === activeTab);

  const tabCounts = {
    pending: job.sections.filter((s) => getSectionStatus(s) === 'pending').length,
    'in-progress': job.sections.filter((s) => getSectionStatus(s) === 'in-progress').length,
    completed: job.sections.filter((s) => getSectionStatus(s) === 'completed').length,
  };

  const handleComplete = () => {
    completeJob(job.id);
    navigation.goBack();
  };

  const handleCancel = () => {
    Alert.alert('Cancel Job', 'Reset this job back to upcoming?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Reset',
        style: 'destructive',
        onPress: () => {
          cancelJob(job.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const getAddOnsStatus = (): TabFilter => {
    if (!job.addOns || job.addOns.length === 0) return 'pending';
    const selected = job.addOns.filter((a) => a.selected).length;
    if (selected === 0) return 'pending';
    if (selected === job.addOns.length) return 'completed';
    return 'in-progress';
  };
  const showAddOns = job.addOns && job.addOns.length > 0 && getAddOnsStatus() === activeTab;

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationX < 0) swipeX.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX < -120) runOnJS(handleCancel)();
      swipeX.value = withSpring(0);
    });

  const TABS: { key: TabFilter; label: string }[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={COLORS.foreground} />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.topOrder}>#{job.orderNumber}</Text>
          <StatusBadge status={job.status} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress hero */}
      <View style={styles.progressHero}>
        <View style={styles.progressHeroLeft}>
          <Text style={styles.progressPct}>{percentage}%</Text>
          <Text style={styles.progressLabel}>Overall Progress</Text>
        </View>
        <View style={styles.progressHeroRight}>
          <Text style={styles.progressFraction}>{doneTodos}<Text style={styles.progressTotal}>/{totalTodos}</Text></Text>
          <Text style={styles.progressLabel}>Tasks done</Text>
        </View>
      </View>
      <View style={styles.progressBarWrap}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${percentage}%` }]} />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
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
        {/* Job header */}
        <View style={styles.jobHeader}>
          {job.status !== 'completed' && (
            <>
              <Text style={styles.clientName}>{job.clientName}</Text>
              <Text style={styles.address}>{job.address}</Text>
            </>
          )}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{formatDate(job.date)}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{job.time}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{job.duration}</Text>
          </View>
        </View>

        {/* Section cards + add-ons */}
        <View style={styles.sections}>
          {filteredSections.length === 0 && !showAddOns ? (
            <View style={styles.emptyTab}>
              <Text style={styles.emptyTabText}>No sections in this category.</Text>
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

      {/* Footer: Complete button + swipe cancel */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          onPress={() => setCompleteModalVisible(true)}
          style={[styles.completeBtn, progress < 1 && styles.completeBtnPartial]}
          activeOpacity={0.85}
        >
          <Text style={styles.completeBtnText}>
            {progress === 1 ? 'Complete Job ✓' : 'Complete Job'}
          </Text>
        </TouchableOpacity>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.swipeCancelRow, swipeAnimStyle]}>
            <ChevronsLeft size={16} color={COLORS.error} />
            <Text style={styles.swipeCancelText}>Swipe left to cancel job</Text>
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Complete confirmation modal */}
      <Modal
        visible={completeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCompleteModalVisible(false)}
      >
        <View style={completeStyles.overlay}>
          <View style={completeStyles.sheet}>
            <View style={completeStyles.iconWrap}>
              <CheckCircle2 size={40} color={COLORS.white} />
            </View>
            <Text style={completeStyles.title}>Complete this job?</Text>
            <Text style={completeStyles.sub}>
              {progress < 1
                ? `${totalTodos - doneTodos} tasks are still incomplete. Are you sure you want to mark this job as complete?`
                : 'All tasks are done! Mark this job as complete?'}
            </Text>
            <View style={completeStyles.actions}>
              <TouchableOpacity onPress={() => setCompleteModalVisible(false)} style={completeStyles.cancelBtn}>
                <Text style={completeStyles.cancelText}>Not yet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setCompleteModalVisible(false);
                  handleComplete();
                }}
                style={completeStyles.confirmBtn}
              >
                <Text style={completeStyles.confirmText}>Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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

const completeStyles = StyleSheet.create({
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
    alignItems: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.foreground,
    marginBottom: 8,
  },
  sub: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.mutedForeground,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: FONTS.semibold,
    fontSize: 15,
    color: COLORS.foreground,
  },
  confirmBtn: {
    flex: 1,
    height: 50,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontFamily: FONTS.semibold,
    fontSize: 15,
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
  body: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: 14,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  markAllText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.white,
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
  topCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  jobHeader: {
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.lg,
    gap: 3,
  },
  clientName: {
    fontFamily: FONTS.semibold,
    fontSize: 17,
    color: COLORS.foreground,
  },
  address: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.mutedForeground,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  metaText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.mutedForeground,
  },
  metaDot: {
    color: COLORS.gray300,
    fontSize: 12,
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
  completeBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  completeBtnPartial: {
    backgroundColor: COLORS.primaryLight,
  },
  completeBtnText: {
    fontFamily: FONTS.semibold,
    fontSize: 16,
    color: COLORS.white,
  },
  swipeCancelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
  },
  swipeCancelText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.error,
  },
});
