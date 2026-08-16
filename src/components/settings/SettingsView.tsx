import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { UserProfile, UserCategory, CategoryTag } from '../../types';
import { ThemeConfig } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { triggerHaptic } from '../../services/haptics';
import { Database } from '../../storage/db';
import { CATEGORY_COLOR_OPTIONS } from '../../seed/defaultData';
import { CategoryIcon, CATEGORY_ICON_OPTIONS, CategoryIconName } from '../common/CategoryIcon';
import {
  LayoutGrid,
  User,
  Bell,
  Palette,
  Sparkles,
  HardDrive,
  ChevronRight,
  Camera,
  Plus,
  Trash2,
  Edit2,
  Check,
  Key,
  RefreshCw,
  ShieldCheck,
  ArrowLeft,
  X,
  Moon,
  Sun,
  Download,
  Volume2,
} from 'lucide-react-native';

interface Props {
  profile: UserProfile;
  categories: UserCategory[];
  theme: ThemeConfig;
  onOpenEditProfile: () => void;
  onCategoriesUpdated: (categories: UserCategory[]) => void;
  onClose?: () => void;
}

type SubPage = 'main' | 'categories' | 'notifications' | 'data';

const TAG_OPTIONS: CategoryTag[] = ['productive', 'work', 'new_skill', 'fun', 'health', 'routine'];

const TAG_LABELS: Record<CategoryTag, { label: string; color: string }> = {
  productive: { label: 'Productive', color: '#0EA5E9' },
  work: { label: 'Work', color: '#2563EB' },
  new_skill: { label: 'Skill', color: '#7C3AED' },
  fun: { label: 'Leisure', color: '#EC4899' },
  health: { label: 'Health', color: '#10B981' },
  routine: { label: 'Routine', color: '#F59E0B' },
};

export const SettingsView: React.FC<Props> = ({
  profile,
  categories,
  theme,
  onOpenEditProfile,
  onCategoriesUpdated,
  onClose,
}) => {
  // Navigation State inside Settings: 'main' overview or dedicated sub-page
  const [activeSubPage, setActiveSubPage] = useState<SubPage>('main');

  // Category Management Form State
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<UserCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catTag, setCatTag] = useState<CategoryTag>('productive');
  const [catColor, setCatColor] = useState(CATEGORY_COLOR_OPTIONS[0]);
  const [catIcon, setCatIcon] = useState<string>('briefcase');

  // Notification Preferences State
  const [dailyReminders, setDailyReminders] = useState(true);
  const [focusAlerts, setFocusAlerts] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);

  const firstName = profile.name ? profile.name.split(' ')[0] : 'User';

  const navigateTo = (page: SubPage) => {
    triggerHaptic.lightImpact();
    setActiveSubPage(page);
  };

  const handleOpenAddCategory = () => {
    triggerHaptic.lightImpact();
    setEditingCategory(null);
    setCatName('');
    setCatTag('productive');
    setCatColor(CATEGORY_COLOR_OPTIONS[0]);
    setCatIcon('briefcase');
    setIsCreatingCategory(true);
  };

  const handleOpenEditCategory = (cat: UserCategory) => {
    triggerHaptic.lightImpact();
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatTag(cat.tag);
    setCatColor(cat.color);
    setCatIcon(cat.icon || 'briefcase');
    setIsCreatingCategory(true);
  };

  const handleSaveCategory = async () => {
    if (!catName.trim()) return;
    triggerHaptic.notificationSuccess();

    let updated: UserCategory[];
    if (editingCategory) {
      updated = await Database.updateCategory(editingCategory.id, {
        name: catName.trim(),
        tag: catTag,
        color: catColor,
        icon: catIcon,
      });
    } else {
      updated = await Database.addCategory({
        name: catName.trim(),
        tag: catTag,
        color: catColor,
        icon: catIcon,
      });
    }

    onCategoriesUpdated(updated);
    setIsCreatingCategory(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (id: string) => {
    triggerHaptic.mediumImpact();
    const updated = await Database.deleteCategory(id);
    onCategoriesUpdated(updated);
  };

  const handleResetCategories = async () => {
    triggerHaptic.heavyImpact();
    const resetList = await Database.resetCategoriesToDefault();
    onCategoriesUpdated(resetList);
  };

  // Helper Header for Sub-Pages (Matching Habit Tracker Header)
  const renderSubPageHeader = (title: string, subtitle?: string, rightAction?: React.ReactNode) => (
    <View style={styles.habitStyleHeaderWrapper}>
      <View style={styles.habitStyleHeaderRow}>
        <TouchableOpacity
          style={styles.roundBackBtn}
          onPress={() => navigateTo('main')}
          activeOpacity={0.8}
        >
          <ArrowLeft size={18} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.titleRow}>
          <Text style={styles.habitTitleText}>{title}</Text>
        </View>

        {rightAction || <View style={{ width: 38 }} />}
      </View>

      {/* Hairline Divider below Header */}
      <View style={styles.headerHairline} />
    </View>
  );

  // ----------------------------------------------------
  // SUB-PAGE 1: MANAGE CATEGORIES
  // ----------------------------------------------------
  if (activeSubPage === 'categories') {
    return (
      <View style={styles.outerWrapper}>
        {renderSubPageHeader(
          'Manage Categories',
          undefined,
          <TouchableOpacity
            style={styles.neutralChipAddBtn}
            onPress={handleOpenAddCategory}
            activeOpacity={0.8}
          >
            <Plus size={15} color="#0F172A" strokeWidth={2.5} style={{ marginRight: 4 }} />
            <Text style={styles.neutralChipAddBtnTxt}>Add</Text>
          </TouchableOpacity>
        )}

        <ScrollView style={styles.container} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Category Form */}
          {isCreatingCategory && (
            <View style={styles.formBoxClean}>
              <Text style={styles.formTitleClean}>
                {editingCategory ? 'Edit Category' : 'New Category'}
              </Text>

              <TextInput
                style={styles.textInputClean}
                value={catName}
                onChangeText={setCatName}
                placeholder="Category Name (e.g. Design, Gym, Coding)"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.fieldLabelClean}>PRODUCTIVITY TAG</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {TAG_OPTIONS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tagPillClean, catTag === t && styles.tagPillCleanActive]}
                    onPress={() => setCatTag(t)}
                  >
                    <Text style={[styles.tagPillCleanText, catTag === t && styles.tagPillCleanTextActive]}>
                      {TAG_LABELS[t].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabelClean}>COLOR ACCENT</Text>
              <View style={styles.colorRowClean}>
                {CATEGORY_COLOR_OPTIONS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorSwatchClean, { backgroundColor: c }, catColor === c && styles.colorSwatchCleanActive]}
                    onPress={() => setCatColor(c)}
                  >
                    {catColor === c && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formActionRowClean}>
                <TouchableOpacity style={styles.cancelFormBtnClean} onPress={() => setIsCreatingCategory(false)}>
                  <Text style={styles.cancelFormTextClean}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveFormBtnClean} onPress={handleSaveCategory}>
                  <Text style={styles.saveFormTextClean}>Save Category</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Simple Flat Category List without outer box */}
          <View style={styles.simpleFlatCatList}>
            {categories.map((cat, index) => {
              const tagMeta = TAG_LABELS[cat.tag] || { label: cat.tag, color: '#64748B' };
              return (
                <React.Fragment key={cat.id}>
                  <View style={styles.simpleFlatCatRow}>
                    {/* Minimalist Color Dot Indicator (No Logo Icon) */}
                    <View style={[styles.colorDotIndicator, { backgroundColor: cat.color }]} />

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.catNameTextClean} numberOfLines={1}>{cat.name}</Text>

                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <Text style={styles.catTagMetaText}>{tagMeta.label}</Text>
                      </View>
                    </View>

                    <View style={styles.catActionsClean}>
                      <TouchableOpacity style={styles.roundActionBtnClean} onPress={() => handleOpenEditCategory(cat)}>
                        <Edit2 size={15} color="#64748B" />
                      </TouchableOpacity>
                      {categories.length > 1 && (
                        <TouchableOpacity style={[styles.roundActionBtnClean, { marginLeft: 6 }]} onPress={() => handleDeleteCategory(cat.id)}>
                          <Trash2 size={15} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {index < categories.length - 1 && <View style={styles.rowHairlineClean} />}
                </React.Fragment>
              );
            })}
          </View>

          <TouchableOpacity style={styles.resetCatBtnClean} onPress={handleResetCategories}>
            <RefreshCw size={13} color="#64748B" />
            <Text style={styles.resetCatTextClean}>Reset to Default Categories</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ----------------------------------------------------
  // SUB-PAGE 2: NOTIFICATIONS & REMINDERS
  // ----------------------------------------------------
  if (activeSubPage === 'notifications') {
    return (
      <View style={styles.outerWrapper}>
        {renderSubPageHeader('Notifications & Reminders')}

        <ScrollView style={styles.container} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View style={styles.simpleFlatCatList}>
            <View style={styles.switchRowClean}>
              <View style={styles.switchTextGroupClean}>
                <Text style={styles.switchTitleClean}>Daily Reflection Prompt</Text>
                <Text style={styles.switchDescClean}>Receive daily evening prompt to log your wins & mindset</Text>
              </View>
              <Switch
                value={dailyReminders}
                onValueChange={(val) => {
                  triggerHaptic.lightImpact();
                  setDailyReminders(val);
                }}
                trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                thumbColor={dailyReminders ? '#2563EB' : '#94A3B8'}
              />
            </View>

            <View style={styles.rowHairlineClean} />

            <View style={styles.switchRowClean}>
              <View style={styles.switchTextGroupClean}>
                <Text style={styles.switchTitleClean}>Focus Session Alerts</Text>
                <Text style={styles.switchDescClean}>Alerts when Pomodoro focus timers complete</Text>
              </View>
              <Switch
                value={focusAlerts}
                onValueChange={(val) => {
                  triggerHaptic.lightImpact();
                  setFocusAlerts(val);
                }}
                trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                thumbColor={focusAlerts ? '#2563EB' : '#94A3B8'}
              />
            </View>

            <View style={styles.rowHairlineClean} />

            <View style={styles.switchRowClean}>
              <View style={styles.switchTextGroupClean}>
                <Text style={styles.switchTitleClean}>Sound & Haptics</Text>
                <Text style={styles.switchDescClean}>Haptic feedback on task completions and logs</Text>
              </View>
              <Switch
                value={soundEffects}
                onValueChange={(val) => {
                  triggerHaptic.lightImpact();
                  setSoundEffects(val);
                }}
                trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                thumbColor={soundEffects ? '#2563EB' : '#94A3B8'}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ----------------------------------------------------
  // SUB-PAGE 5: DATA & STORAGE
  // ----------------------------------------------------
  if (activeSubPage === 'data') {
    return (
      <View style={styles.outerWrapper}>
        {renderSubPageHeader('Data & Storage')}

        <ScrollView style={styles.container} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View style={styles.simpleFlatCatList}>
            <Text style={styles.subPanelDescClean}>
              LogMyLife runs 100% offline with local storage adapter. You can reset categories or manage local state below.
            </Text>

            <TouchableOpacity style={styles.resetCatBtnClean} onPress={handleResetCategories}>
              <RefreshCw size={14} color="#0F172A" />
              <Text style={styles.resetCatTextClean}>Reset Categories to Default System</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ----------------------------------------------------
  // MAIN SETTINGS OVERVIEW PAGE
  // ----------------------------------------------------
  return (
    <View style={styles.outerWrapper}>
      {/* Header matching Planner page header layout */}
      <View style={styles.plannerHeaderRow}>
        <View style={styles.plannerHeaderLeftRow}>
          <View>
            <Text style={styles.plannerHeaderTitle}>Settings</Text>
            <Text style={styles.plannerHeaderSubtitle}>Manage categories & app preferences</Text>
          </View>
        </View>

        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.roundBackBtn} activeOpacity={0.8}>
            <X size={18} color="#0F172A" />
          </TouchableOpacity>
        )}
      </View>

      {/* Hairline Divider below Header */}
      <View style={styles.headerHairline} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Centered User Avatar & Name */}
        <View style={styles.headerBlock}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={onOpenEditProfile}
            activeOpacity={0.85}
          >
            <View style={styles.avatarCircle}>
              {profile.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitial}>{firstName.charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <View style={styles.cameraBadge}>
              <Camera size={12} color="#0F172A" />
            </View>
          </TouchableOpacity>

          <Text style={styles.greetingText}>Hi, {firstName}!</Text>

          <TouchableOpacity
            style={styles.manageAccountBtn}
            onPress={onOpenEditProfile}
            activeOpacity={0.8}
          >
            <Text style={styles.manageAccountBtnText}>Manage your profile</Text>
          </TouchableOpacity>
        </View>

        {/* Section Label */}
        <Text style={styles.sectionHeaderLabel}>App preferences & data</Text>

        {/* Clean Flat List Container */}
        <View style={styles.simpleFlatCatList}>
          {/* ROW 1: MANAGE CATEGORIES */}
          <TouchableOpacity
            style={styles.simpleFlatCatRow}
            onPress={() => navigateTo('categories')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <LayoutGrid size={18} color="#0F172A" style={styles.rowIcon} />
              <Text style={styles.rowLabelClean} numberOfLines={1}>
                Manage Categories
              </Text>
            </View>

            <View style={styles.rowRight}>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{categories.length}</Text>
              </View>
              <ChevronRight size={18} color="#64748B" />
            </View>
          </TouchableOpacity>

          <View style={styles.rowHairlineClean} />

          {/* ROW 2: NOTIFICATIONS & REMINDERS */}
          <TouchableOpacity
            style={styles.simpleFlatCatRow}
            onPress={() => navigateTo('notifications')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Bell size={18} color="#0F172A" style={styles.rowIcon} />
              <Text style={styles.rowLabelClean} numberOfLines={1}>
                Notifications & Reminders
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.sideValueText}>{dailyReminders ? '1' : '0'}</Text>
              <ChevronRight size={18} color="#64748B" />
            </View>
          </TouchableOpacity>

          <View style={styles.rowHairlineClean} />

          {/* ROW 3: DATA & STORAGE */}
          <TouchableOpacity
            style={styles.simpleFlatCatRow}
            onPress={() => navigateTo('data')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <HardDrive size={18} color="#0F172A" style={styles.rowIcon} />
              <Text style={styles.rowLabelClean} numberOfLines={1}>
                Data & Storage
              </Text>
            </View>
            <View style={styles.rowRight}>
              <ChevronRight size={18} color="#64748B" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 4,
  },
  topBarSpacer: {
    width: 22,
  },
  closeBtn: {
    padding: 6,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topTitleHeader: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  mainHeading: {
    fontFamily: FONTS.displayBold,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  mainSubheading: {
    fontFamily: FONTS.groteskRegular,
    fontSize: 12,
    marginTop: 3,
    letterSpacing: 0.1,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0B57D0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontFamily: FONTS.bold,
    fontSize: 34,
    color: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C4C7C5',
  },
  greetingText: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: '#1F1F1F',
    marginBottom: 12,
  },
  manageAccountBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#747775',
    backgroundColor: 'transparent',
  },
  manageAccountBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: '#0B57D0',
  },
  sectionHeaderLabel: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: '#444746',
    marginBottom: 12,
    paddingLeft: 4,
  },
  materialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    overflow: 'hidden',
    paddingVertical: 4,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginVertical: 2,
    minHeight: 58,
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rowIcon: {
    marginRight: 2,
  },
  rowLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#1F1F1F',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sideValueText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#444746',
  },
  countBadge: {
    backgroundColor: '#E8DEF8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: '#1D192B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
  },
  divider: {
    height: 1,
    backgroundColor: '#E1E3E1',
    marginLeft: 54,
    marginRight: 18,
    marginVertical: 2,
  },

  // SUB-PAGE SPECIFIC STYLES
  subPageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E1E3E1',
  },
  subPageTitleBox: {
    flex: 1,
  },
  subPageTitle: {
    fontFamily: FONTS.extraBold,
    fontSize: 20,
    color: '#1F1F1F',
  },
  subPageSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#444746',
    marginTop: 1,
  },
  subPageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E1E3E1',
  },
  subPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  subPanelTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: '#1F1F1F',
  },
  subPanelDesc: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#444746',
    marginBottom: 16,
    lineHeight: 18,
  },
  addCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0B57D0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addCatBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  catList: {
    gap: 8,
    marginBottom: 12,
  },
  catItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#F7F9FC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E3E1',
  },
  catIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  catInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 4,
  },
  catNameText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: '#1F1F1F',
    flexShrink: 1,
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagBadgeText: {
    fontFamily: FONTS.semiBold,
    fontSize: 10,
  },
  catActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catActionBtn: {
    padding: 4,
  },
  resetCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
  },
  resetCatText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: '#444746',
  },
  formBox: {
    backgroundColor: '#F7F9FC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E1E3E1',
  },
  formTitle: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: '#1F1F1F',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C4C7C5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#1F1F1F',
    marginBottom: 10,
  },
  fieldLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: '#444746',
    marginBottom: 4,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#EEF2F9',
    marginRight: 6,
  },
  tagPillActive: {
    backgroundColor: '#0B57D0',
  },
  tagPillText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: '#444746',
  },
  tagPillTextActive: {
    color: '#FFFFFF',
  },
  iconChoice: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#EEF2F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  iconChoiceActive: {
    backgroundColor: '#D3E3FD',
    borderWidth: 1,
    borderColor: '#0B57D0',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  colorSwatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchActive: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  formActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 6,
  },
  cancelFormBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cancelFormText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: '#444746',
  },
  saveFormBtn: {
    backgroundColor: '#0B57D0',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveFormText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  apiKeyBox: {
    flexDirection: 'row',
    gap: 8,
  },
  apiKeyInput: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C4C7C5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#1F1F1F',
  },
  saveKeyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0B57D0',
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  saveKeyText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  toastNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  toastNoticeText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: '#2E7D32',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  switchTextGroup: {
    flex: 1,
    paddingRight: 12,
  },
  switchTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: '#1F1F1F',
  },
  switchDesc: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#444746',
    marginTop: 2,
  },
  themeOptionCard: {
    backgroundColor: '#F7F9FC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E1E3E1',
  },
  themeOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  themeOptionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: '#1F1F1F',
  },
  themeOptionDesc: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#444746',
  },
  cycleThemeFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0B57D0',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  cycleThemeFullBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  dataActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F7F9FC',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C4C7C5',
  },
  dataActionText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: '#1F1F1F',
  },
  // Habit Tracker Style Header & Simple Icon-less Category Styles
  plannerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 18 : 18,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  plannerHeaderLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  plannerHeaderTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  plannerHeaderSubtitle: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  habitStyleHeaderWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  habitStyleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  roundBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitTitleText: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 18,
    color: '#0F172A',
  },
  headerHairline: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  neutralChipAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 0,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  neutralChipAddBtnTxt: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#0F172A',
  },
  simpleFlatCatList: {
    paddingVertical: 4,
  },
  simpleFlatCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  colorDotIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  catNameTextClean: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 15,
    color: '#0F172A',
  },
  catTagMetaText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
  },
  catActionsClean: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roundActionBtnClean: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowHairlineClean: {
    height: 1,
    backgroundColor: '#F8FAFC',
  },
  resetCatBtnClean: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
  },
  resetCatTextClean: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#64748B',
  },
  formBoxClean: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  formTitleClean: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 16,
    color: '#0F172A',
  },
  textInputClean: {
    fontFamily: FONTS.groteskMedium,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
  },
  fieldLabelClean: {
    fontFamily: FONTS.groteskBold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: '#64748B',
    marginTop: 4,
  },
  tagPillClean: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  tagPillCleanActive: {
    backgroundColor: '#FCE7F3',
  },
  tagPillCleanText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
    color: '#64748B',
  },
  tagPillCleanTextActive: {
    color: '#BE185D',
  },
  colorRowClean: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorSwatchClean: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchCleanActive: {
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  formActionRowClean: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  cancelFormBtnClean: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  cancelFormTextClean: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#475569',
  },
  saveFormBtnClean: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#1E293B',
  },
  saveFormTextClean: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  switchRowClean: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  switchTextGroupClean: {
    flex: 1,
    paddingRight: 16,
  },
  switchTitleClean: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 14,
    color: '#0F172A',
  },
  switchDescClean: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  subPanelDescClean: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginVertical: 8,
  },
  rowLabelClean: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 14,
    color: '#0F172A',
  },
});