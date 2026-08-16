import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { UserCategory, CategoryTag, CATEGORY_TAG_INFO } from '../../types';
import { ThemeConfig } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { triggerHaptic } from '../../services/haptics';
import { X, Plus, Trash2, Edit2, Check } from 'lucide-react-native';
import { BottomSheet } from './BottomSheet';
import { CATEGORY_COLOR_OPTIONS } from '../../seed/defaultData';

interface Props {
  visible: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  categories: UserCategory[];
  onAddCategory: (category: Omit<UserCategory, 'id' | 'createdAt'>) => void;
  onUpdateCategory: (id: string, category: Partial<UserCategory>) => void;
  onDeleteCategory: (id: string) => void;
}

const TAG_OPTIONS: CategoryTag[] = ['productive', 'work', 'new_skill', 'fun', 'health', 'routine'];

export const CategoryManagerModal: React.FC<Props> = ({
  visible,
  onClose,
  theme,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [editingCategory, setEditingCategory] = useState<UserCategory | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [name, setName] = useState('');
  const [tag, setTag] = useState<CategoryTag>('productive');
  const [color, setColor] = useState(CATEGORY_COLOR_OPTIONS[0]);

  const handleOpenAdd = () => {
    triggerHaptic.lightImpact();
    setEditingCategory(null);
    setName('');
    setTag('productive');
    setColor(CATEGORY_COLOR_OPTIONS[0]);
    setIsCreating(true);
  };

  const handleOpenEdit = (cat: UserCategory) => {
    triggerHaptic.lightImpact();
    setEditingCategory(cat);
    setName(cat.name);
    setTag(cat.tag);
    setColor(cat.color);
    setIsCreating(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    triggerHaptic.notificationSuccess();

    if (editingCategory) {
      onUpdateCategory(editingCategory.id, {
        name: name.trim(),
        tag,
        color,
      });
    } else {
      onAddCategory({
        name: name.trim(),
        tag,
        color,
        icon: 'folder',
      });
    }

    setIsCreating(false);
    setEditingCategory(null);
  };

  const handleDelete = (id: string) => {
    triggerHaptic.mediumImpact();
    onDeleteCategory(id);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} theme={theme} snapPoints={['85%', '92%']}>
      {({ scrollEnabled, onScroll, closeSheet }) => (
        <View style={styles.container}>
          {/* Header matching Habit Tracker exactly */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.roundBackBtn}
              onPress={closeSheet}
              activeOpacity={0.8}
            >
              <X size={18} color="#0F172A" />
            </TouchableOpacity>

            <View style={styles.titleRow}>
              <Text style={styles.titleText}>Manage Categories</Text>
            </View>

            {!isCreating ? (
              <TouchableOpacity
                style={styles.neutralChipAddBtn}
                onPress={handleOpenAdd}
                activeOpacity={0.8}
              >
                <Plus size={15} color="#0F172A" strokeWidth={2.5} style={{ marginRight: 4 }} />
                <Text style={styles.neutralChipAddBtnTxt}>Add</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 38 }} />
            )}
          </View>

          {/* Hairline Divider below Header */}
          <View style={styles.headerHairline} />

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.contentPadding}
            scrollEnabled={scrollEnabled}
            onScroll={onScroll}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {!isCreating ? (
              /* Simple Icon-less Category List without outer box */
              <View style={styles.simpleListContainer}>
                {categories.map((cat, index) => {
                  const tagInfo = CATEGORY_TAG_INFO[cat.tag];
                  return (
                    <React.Fragment key={cat.id}>
                      <View style={styles.simpleCategoryRow}>
                        {/* Minimalist Color Dot (No Logo Icon) */}
                        <View style={[styles.colorDotIndicator, { backgroundColor: cat.color }]} />

                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.catNameText}>{cat.name}</Text>
                          <Text style={styles.catMetaText}>{tagInfo?.label || cat.tag}</Text>
                        </View>

                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            style={styles.roundActionBtn}
                            onPress={() => handleOpenEdit(cat)}
                          >
                            <Edit2 size={15} color="#64748B" />
                          </TouchableOpacity>

                          {categories.length > 1 && (
                            <TouchableOpacity
                              style={[styles.roundActionBtn, { marginLeft: 6 }]}
                              onPress={() => handleDelete(cat.id)}
                            >
                              <Trash2 size={15} color="#EF4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      {index < categories.length - 1 && <View style={styles.rowHairline} />}
                    </React.Fragment>
                  );
                })}
              </View>
            ) : (
              /* Add / Edit Category Form */
              <View style={styles.formContainer}>
                <View style={styles.formHeaderRow}>
                  <Text style={styles.formTitle}>
                    {editingCategory ? 'Edit Category' : 'New Category'}
                  </Text>
                  <TouchableOpacity onPress={() => setIsCreating(false)}>
                    <Text style={styles.cancelText}>Back to List</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>CATEGORY NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Graphic Design, Gym, Reading"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                />

                <Text style={styles.label}>PRODUCTIVITY TAG</Text>
                <View style={styles.tagGrid}>
                  {TAG_OPTIONS.map((t) => {
                    const info = CATEGORY_TAG_INFO[t];
                    const isSelected = tag === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[styles.tagPill, isSelected && styles.tagPillActive]}
                        onPress={() => setTag(t)}
                      >
                        <Text style={[styles.tagPillText, isSelected && styles.tagPillTextActive]}>
                          {info.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.label}>COLOR ACCENT</Text>
                <View style={styles.colorGrid}>
                  {CATEGORY_COLOR_OPTIONS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.colorDotChoice,
                        { backgroundColor: c },
                        color === c && styles.colorDotChoiceActive,
                      ]}
                      onPress={() => setColor(c)}
                    >
                      {color === c && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.saveSubmitBtn} onPress={handleSave} activeOpacity={0.85}>
                  <Text style={styles.saveSubmitText}>
                    {editingCategory ? 'Save Changes' : 'Create Category'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerHairline: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 20,
    marginBottom: 12,
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
  titleText: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 18,
    color: '#0F172A',
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
  contentPadding: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  // Simple List Styling (No Outer Box, No Icons)
  simpleListContainer: {
    paddingVertical: 4,
  },
  simpleCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  colorDotIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  catNameText: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 15,
    color: '#0F172A',
  },
  catMetaText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roundActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowHairline: {
    height: 1,
    backgroundColor: '#F8FAFC',
  },

  // Form Styling
  formContainer: {
    gap: 14,
    paddingTop: 8,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  formTitle: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 16,
    color: '#0F172A',
  },
  cancelText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#64748B',
  },
  label: {
    fontFamily: FONTS.groteskBold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: '#64748B',
    marginTop: 6,
  },
  input: {
    fontFamily: FONTS.groteskMedium,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    borderWidth: 0,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
  },
  tagPillActive: {
    backgroundColor: '#FCE7F3',
  },
  tagPillText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
    color: '#64748B',
  },
  tagPillTextActive: {
    color: '#BE185D',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorDotChoice: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotChoiceActive: {
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  saveSubmitBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    backgroundColor: '#1E293B',
    marginTop: 16,
  },
  saveSubmitText: {
    fontFamily: FONTS.groteskBold,
    color: '#FFFFFF',
    fontSize: 14,
  },
});
