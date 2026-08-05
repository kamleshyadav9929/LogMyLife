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
  onCycleTheme: () => void;
  onCategoriesUpdated: (categories: UserCategory[]) => void;
  onClose?: () => void;
}

type SubPage = 'main' | 'categories' | 'notifications' | 'theme' | 'ai' | 'data';

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
  onCycleTheme,
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

  // Gemini API Key State
  const [apiKey, setApiKey] = useState('');
  const [keySavedToast, setKeySavedToast] = useState(false);

  // Notification Preferences State
  const [dailyReminders, setDailyReminders] = useState(true);
  const [focusAlerts, setFocusAlerts] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);

  useEffect(() => {
    Database.getGeminiApiKey().then((k) => {
      if (k) setApiKey(k);
    });
  }, []);

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

  const handleSaveApiKey = async () => {
    triggerHaptic.notificationSuccess();
    await Database.saveGeminiApiKey(apiKey.trim());
    setKeySavedToast(true);
    setTimeout(() => setKeySavedToast(false), 2500);
  };

  const handleResetCategories = async () => {
    triggerHaptic.heavyImpact();
    const resetList = await Database.resetCategoriesToDefault();
    onCategoriesUpdated(resetList);
  };

  // Helper Header for Sub-Pages
  const renderSubPageHeader = (title: string, subtitle: string) => (
    <View style={styles.subPageHeaderRow}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigateTo('main')}
        activeOpacity={0.7}
      >
        <ArrowLeft size={18} color={theme.textPrimary || '#0F172A'} />
      </TouchableOpacity>
      <View style={styles.subPageTitleBox}>
        <Text style={[styles.mainHeading, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[styles.mainSubheading, { color: theme.textMuted }]}>{subtitle}</Text>
      </View>
    </View>
  );

  // ----------------------------------------------------
  // SUB-PAGE 1: MANAGE CATEGORIES
  // ----------------------------------------------------
  if (activeSubPage === 'categories') {
    return (
      <View style={styles.outerWrapper}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {renderSubPageHeader('Manage Categories', 'Add, customize or edit your life categories')}

          <View style={styles.subPageCard}>
            <View style={styles.subPanelHeader}>
              <Text style={styles.subPanelTitle}>Active Categories ({categories.length})</Text>
              <TouchableOpacity style={styles.addCatBtn} onPress={handleOpenAddCategory}>
                <Plus size={13} color="#FFFFFF" />
                <Text style={styles.addCatBtnText}>Add Category</Text>
              </TouchableOpacity>
            </View>

            {/* Category Form */}
            {isCreatingCategory && (
              <View style={styles.formBox}>
                <Text style={styles.formTitle}>
                  {editingCategory ? 'Edit Category' : 'New Category'}
                </Text>

                <TextInput
                  style={styles.textInput}
                  value={catName}
                  onChangeText={setCatName}
                  placeholder="Category Name (e.g. Design, Gym, Coding)"
                  placeholderTextColor="#8E918F"
                />

                <Text style={styles.fieldLabel}>Productivity Tag</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  {TAG_OPTIONS.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.tagPill, catTag === t && styles.tagPillActive]}
                      onPress={() => setCatTag(t)}
                    >
                      <Text style={[styles.tagPillText, catTag === t && styles.tagPillTextActive]}>
                        {TAG_LABELS[t].label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.fieldLabel}>Icon</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  {CATEGORY_ICON_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.name}
                      style={[styles.iconChoice, catIcon === opt.name && styles.iconChoiceActive]}
                      onPress={() => setCatIcon(opt.name)}
                    >
                      <CategoryIcon name={opt.name as CategoryIconName} size={16} color={catIcon === opt.name ? '#0B57D0' : '#444746'} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.fieldLabel}>Color Accent</Text>
                <View style={styles.colorRow}>
                  {CATEGORY_COLOR_OPTIONS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.colorSwatch, { backgroundColor: c }, catColor === c && styles.colorSwatchActive]}
                      onPress={() => setCatColor(c)}
                    >
                      {catColor === c && <Check size={12} color="#FFFFFF" />}
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.formActionRow}>
                  <TouchableOpacity style={styles.cancelFormBtn} onPress={() => setIsCreatingCategory(false)}>
                    <Text style={styles.cancelFormText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveFormBtn} onPress={handleSaveCategory}>
                    <Text style={styles.saveFormText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Category List */}
            <View style={styles.catList}>
              {categories.map((cat) => {
                const tagMeta = TAG_LABELS[cat.tag] || { label: cat.tag, color: '#444746' };
                return (
                  <View key={cat.id} style={styles.catItemRow}>
                    <View style={[styles.catIconBox, { backgroundColor: `${cat.color}15` }]}>
                      <CategoryIcon name={(cat.icon || 'briefcase') as CategoryIconName} size={16} color={cat.color} />
                    </View>
                    <View style={styles.catInfo}>
                      <Text style={styles.catNameText} numberOfLines={1}>{cat.name}</Text>
                      <View style={[styles.tagBadge, { backgroundColor: `${tagMeta.color}15` }]}>
                        <Text style={[styles.tagBadgeText, { color: tagMeta.color }]}>{tagMeta.label}</Text>
                      </View>
                    </View>
                    <View style={styles.catActions}>
                      <TouchableOpacity style={styles.catActionBtn} onPress={() => handleOpenEditCategory(cat)}>
                        <Edit2 size={13} color="#444746" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.catActionBtn} onPress={() => handleDeleteCategory(cat.id)}>
                        <Trash2 size={13} color="#BA1A1A" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity style={styles.resetCatBtn} onPress={handleResetCategories}>
              <RefreshCw size={13} color="#444746" />
              <Text style={styles.resetCatText}>Reset to Default Categories</Text>
            </TouchableOpacity>
          </View>
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
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {renderSubPageHeader('Notifications & Reminders', 'Configure daily log alerts & focus session prompts')}

          <View style={styles.subPageCard}>
            <View style={styles.switchRow}>
              <View style={styles.switchTextGroup}>
                <Text style={styles.switchTitle}>Daily Reflection Prompt</Text>
                <Text style={styles.switchDesc}>Receive daily evening prompt to log your wins & mindset</Text>
              </View>
              <Switch
                value={dailyReminders}
                onValueChange={(val) => {
                  triggerHaptic.lightImpact();
                  setDailyReminders(val);
                }}
                trackColor={{ false: '#E0E0E0', true: '#D3E3FD' }}
                thumbColor={dailyReminders ? '#0B57D0' : '#8E918F'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.switchRow}>
              <View style={styles.switchTextGroup}>
                <Text style={styles.switchTitle}>Focus Session Alerts</Text>
                <Text style={styles.switchDesc}>Alerts when Pomodoro focus timers complete</Text>
              </View>
              <Switch
                value={focusAlerts}
                onValueChange={(val) => {
                  triggerHaptic.lightImpact();
                  setFocusAlerts(val);
                }}
                trackColor={{ false: '#E0E0E0', true: '#D3E3FD' }}
                thumbColor={focusAlerts ? '#0B57D0' : '#8E918F'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.switchRow}>
              <View style={styles.switchTextGroup}>
                <Text style={styles.switchTitle}>Sound & Haptics</Text>
                <Text style={styles.switchDesc}>Haptic feedback on task completions and logs</Text>
              </View>
              <Switch
                value={soundEffects}
                onValueChange={(val) => {
                  triggerHaptic.lightImpact();
                  setSoundEffects(val);
                }}
                trackColor={{ false: '#E0E0E0', true: '#D3E3FD' }}
                thumbColor={soundEffects ? '#0B57D0' : '#8E918F'}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ----------------------------------------------------
  // SUB-PAGE 3: APPEARANCE & THEME
  // ----------------------------------------------------
  if (activeSubPage === 'theme') {
    return (
      <View style={styles.outerWrapper}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {renderSubPageHeader('Appearance & Theme', 'Customize visual themes and palette preferences')}

          <View style={styles.subPageCard}>
            <TouchableOpacity style={styles.themeOptionCard} onPress={onCycleTheme} activeOpacity={0.8}>
              <View style={styles.themeOptionHeader}>
                <Sun size={20} color="#0B57D0" />
                <Text style={styles.themeOptionTitle}>Pure Minimalist White</Text>
              </View>
              <Text style={styles.themeOptionDesc}>Clean white background with slate typography and vibrant color accents.</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.themeOptionCard} onPress={onCycleTheme} activeOpacity={0.8}>
              <View style={styles.themeOptionHeader}>
                <Moon size={20} color="#7C3AED" />
                <Text style={styles.themeOptionTitle}>Slate Light</Text>
              </View>
              <Text style={styles.themeOptionDesc}>Soft slate backdrop with elevated material cards for reduced eye strain.</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cycleThemeFullBtn} onPress={onCycleTheme}>
              <Palette size={16} color="#FFFFFF" />
              <Text style={styles.cycleThemeFullBtnText}>Cycle Visual Theme</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ----------------------------------------------------
  // SUB-PAGE 4: GEMINI AI INTEGRATION
  // ----------------------------------------------------
  if (activeSubPage === 'ai') {
    return (
      <View style={styles.outerWrapper}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {renderSubPageHeader('Gemini AI Integration', 'Configure custom API key for schedule AI replanning')}

          <View style={styles.subPageCard}>
            <Text style={styles.subPanelDesc}>
              Enter your Gemini API key to unlock automated schedule generation, daily workload balancing, and reflection summaries.
            </Text>

            <View style={styles.apiKeyBox}>
              <TextInput
                style={styles.apiKeyInput}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="Paste Gemini API key (AIzaSy...)"
                placeholderTextColor="#8E918F"
                secureTextEntry
              />
              <TouchableOpacity style={styles.saveKeyBtn} onPress={handleSaveApiKey}>
                <Key size={13} color="#FFFFFF" />
                <Text style={styles.saveKeyText}>Save</Text>
              </TouchableOpacity>
            </View>

            {keySavedToast && (
              <View style={styles.toastNotice}>
                <ShieldCheck size={14} color="#2E7D32" />
                <Text style={styles.toastNoticeText}>Gemini API key saved successfully!</Text>
              </View>
            )}
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
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {renderSubPageHeader('Data & Storage', 'Manage local offline storage and dataset backups')}

          <View style={styles.subPageCard}>
            <Text style={styles.subPanelDesc}>
              LogMyLife runs 100% offline with local storage adapter. You can reset categories or manage local state below.
            </Text>

            <TouchableOpacity style={styles.dataActionBtn} onPress={handleResetCategories}>
              <RefreshCw size={14} color="#1F1F1F" />
              <Text style={styles.dataActionText}>Reset Categories to Default System</Text>
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
      {/* Top Close Bar if inside a modal */}
      {onClose && (
        <View style={styles.topBar}>
          <View style={styles.topBarSpacer} />
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={22} color="#1F1F1F" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Clean Minimal Section Header with Faint Header Underline */}
        <View style={styles.topTitleHeader}>
          <Text style={[styles.mainHeading, { color: theme.textPrimary }]}>Settings</Text>
          <Text style={[styles.mainSubheading, { color: theme.textMuted }]}>
            Manage categories & app preferences
          </Text>
        </View>

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
              <Camera size={12} color="#1F1F1F" />
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

        {/* Google Material List Container */}
        <View style={styles.materialCard}>
          {/* ROW 1: MANAGE CATEGORIES (Navigates to dedicated Categories Sub-Page!) */}
          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => navigateTo('categories')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <LayoutGrid size={20} color="#1F1F1F" style={styles.rowIcon} />
              <Text style={styles.rowLabel} numberOfLines={1}>
                Manage Categories
              </Text>
            </View>

            <View style={styles.rowRight}>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{categories.length}</Text>
              </View>
              <ChevronRight size={20} color="#444746" />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* ROW 2: NOTIFICATIONS & OFFERS (Navigates to dedicated Notifications Sub-Page!) */}
          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => navigateTo('notifications')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Bell size={20} color="#1F1F1F" style={styles.rowIcon} />
              <Text style={styles.rowLabel} numberOfLines={1}>
                Notifications & reminders
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.sideValueText}>{dailyReminders ? '1' : '0'}</Text>
              <ChevronRight size={20} color="#444746" />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* ROW 3: APPEARANCE & THEME (Navigates to dedicated Appearance Sub-Page!) */}
          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => navigateTo('theme')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Palette size={20} color="#1F1F1F" style={styles.rowIcon} />
              <Text style={styles.rowLabel} numberOfLines={1}>
                Appearance & theme
              </Text>
            </View>
            <View style={styles.rowRight}>
              <ChevronRight size={20} color="#444746" />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* ROW 4: GEMINI AI INTEGRATION (Navigates to dedicated Gemini AI Sub-Page!) */}
          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => navigateTo('ai')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Sparkles size={20} color="#1F1F1F" style={styles.rowIcon} />
              <Text style={styles.rowLabel} numberOfLines={1}>
                Gemini AI integration
              </Text>
            </View>
            <View style={styles.rowRight}>
              <View style={[styles.statusBadge, { backgroundColor: apiKey ? '#E8F5E9' : '#FFF3E0' }]}>
                <Text style={[styles.statusBadgeText, { color: apiKey ? '#2E7D32' : '#E65100' }]}>
                  {apiKey ? 'Active' : 'Setup'}
                </Text>
              </View>
              <ChevronRight size={20} color="#444746" />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* ROW 5: DATA & STORAGE (Navigates to dedicated Data & Storage Sub-Page!) */}
          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => navigateTo('data')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <HardDrive size={20} color="#1F1F1F" style={styles.rowIcon} />
              <Text style={styles.rowLabel} numberOfLines={1}>
                Data & storage
              </Text>
            </View>
            <View style={styles.rowRight}>
              <ChevronRight size={20} color="#444746" />
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
    backgroundColor: '#EEF2F9',
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
});