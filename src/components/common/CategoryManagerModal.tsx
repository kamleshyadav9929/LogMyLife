import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal } from 'react-native';
import { UserCategory, CategoryTag, CATEGORY_TAG_INFO } from '../../types';
import { ThemeConfig } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { triggerHaptic } from '../../services/haptics';
import { X, Plus, Trash2, Edit2, Check } from 'lucide-react-native';
import { BottomSheet } from './BottomSheet';
import { CATEGORY_COLOR_OPTIONS } from '../../seed/defaultData';

import { CategoryIcon, CATEGORY_ICON_OPTIONS, CategoryIconName } from './CategoryIcon';

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
  const [icon, setIcon] = useState<string>('briefcase');

  const handleOpenAdd = () => {
    triggerHaptic.lightImpact();
    setEditingCategory(null);
    setName('');
    setTag('productive');
    setColor(CATEGORY_COLOR_OPTIONS[0]);
    setIcon('briefcase');
    setIsCreating(true);
  };

  const handleOpenEdit = (cat: UserCategory) => {
    triggerHaptic.lightImpact();
    setEditingCategory(cat);
    setName(cat.name);
    setTag(cat.tag);
    setColor(cat.color);
    setIcon(cat.icon || 'briefcase');
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
        icon,
      });
    } else {
      onAddCategory({
        name: name.trim(),
        tag,
        color,
        icon,
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
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentPadding}
          scrollEnabled={scrollEnabled}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Category Manager</Text>
              <Text style={styles.subtitle}>Customize your personal life categories</Text>
            </View>
            <TouchableOpacity onPress={closeSheet} style={styles.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {!isCreating ? (
            <>
              {/* Category List */}
              <View style={styles.listContainer}>
                {categories.map((cat) => {
                  const tagInfo = CATEGORY_TAG_INFO[cat.tag];
                  return (
                    <View key={cat.id} style={styles.categoryCard}>
                      <View style={[styles.iconBox, { backgroundColor: `${cat.color}15` }]}>
                        <CategoryIcon name={cat.icon} size={20} color={cat.color} />
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.catName}>{cat.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <CategoryIcon name={tagInfo?.icon || 'tag'} size={12} color="#64748B" />
                          <Text style={styles.catMeta}>{tagInfo?.label || cat.tag}</Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleOpenEdit(cat)}
                      >
                        <Edit2 size={16} color="#64748B" />
                      </TouchableOpacity>

                      {categories.length > 1 && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { marginLeft: 4 }]}
                          onPress={() => handleDelete(cat.id)}
                        >
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.addCategoryBtn} onPress={handleOpenAdd} activeOpacity={0.85}>
                <Plus size={18} color="#FFFFFF" />
                <Text style={styles.addCategoryBtnText}>Create Custom Category</Text>
              </TouchableOpacity>
            </>
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

              <Text style={styles.label}>Category Name:</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Graphic Design, Gym, Reading"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Category Vector Icon:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
                {CATEGORY_ICON_OPTIONS.map((item) => (
                  <TouchableOpacity
                    key={item.name}
                    style={[styles.emojiChip, icon === item.name && styles.emojiChipActive]}
                    onPress={() => setIcon(item.name)}
                  >
                    <CategoryIcon name={item.name} size={20} color={icon === item.name ? '#2563EB' : '#64748B'} />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Category Tag (Determines Productivity Weight):</Text>
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
                      <CategoryIcon name={info.icon} size={14} color={isSelected ? '#2563EB' : '#64748B'} />
                      <Text style={[styles.tagPillText, isSelected && styles.tagPillTextActive]}>
                        {info.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Color Theme:</Text>
              <View style={styles.colorGrid}>
                {CATEGORY_COLOR_OPTIONS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      color === c && styles.colorDotActive,
                    ]}
                    onPress={() => setColor(c)}
                  >
                    {color === c && <Check size={14} color="#FFFFFF" />}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.saveSubmitBtn} onPress={handleSave} activeOpacity={0.85}>
                <Check size={18} color="#FFFFFF" />
                <Text style={styles.saveSubmitText}>
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentPadding: {
    padding: 22,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    color: '#0F172A',
  },
  subtitle: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  listContainer: {
    gap: 10,
    marginBottom: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catIconText: {
    fontSize: 20,
  },
  catName: {
    fontFamily: FONTS.groteskBold,
    fontSize: 14,
    color: '#0F172A',
  },
  catMeta: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  addCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: '#2563EB',
    gap: 6,
  },
  addCategoryBtnText: {
    fontFamily: FONTS.groteskBold,
    color: '#FFFFFF',
    fontSize: 14,
  },
  formContainer: {
    gap: 12,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  formTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 16,
    color: '#0F172A',
  },
  cancelText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#2563EB',
  },
  label: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
    marginTop: 8,
    marginBottom: 4,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    fontFamily: FONTS.groteskMedium,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    borderWidth: 1,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    borderColor: '#E2E8F0',
  },
  emojiRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  emojiChip: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  emojiChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tagPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  tagPillIcon: {
    fontSize: 14,
  },
  tagPillText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 12,
    color: '#64748B',
  },
  tagPillTextActive: {
    fontFamily: FONTS.groteskBold,
    color: '#2563EB',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotActive: {
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  saveSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: '#0F172A',
    marginTop: 16,
    gap: 6,
  },
  saveSubmitText: {
    fontFamily: FONTS.groteskBold,
    color: '#FFFFFF',
    fontSize: 14,
  },
});
