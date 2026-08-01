import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { UserProfile } from '../../types';
import { ThemeConfig } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { triggerHaptic } from '../../services/haptics';
import { X, Check, Camera, User, Image as ImageIcon } from 'lucide-react-native';
import { BottomSheet } from './BottomSheet';

interface Props {
  visible: boolean;
  onClose: () => void;
  profile: UserProfile;
  theme: ThemeConfig;
  onSaveProfile: (updatedProfile: UserProfile) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
];

export const EditProfileModal: React.FC<Props> = ({
  visible,
  onClose,
  profile,
  theme,
  onSaveProfile,
}) => {
  const [name, setName] = useState(profile.name);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || PRESET_AVATARS[0]);

  const handlePickFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS !== 'web') {
          Alert.alert('Permission Denied', 'Camera permission is required to capture your photo.');
        }
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUrl(result.assets[0].uri);
        triggerHaptic.lightImpact();
      }
    } catch (err) {
      console.error('Error opening camera:', err);
    }
  };

  const handlePickFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS !== 'web') {
          Alert.alert('Permission Denied', 'Photos permission is required to choose an avatar image.');
        }
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUrl(result.assets[0].uri);
        triggerHaptic.lightImpact();
      }
    } catch (err) {
      console.error('Error opening photo library:', err);
    }
  };

  const handleSave = () => {
    triggerHaptic.notificationSuccess();
    onSaveProfile({
      ...profile,
      name,
      avatarUrl,
    });
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} theme={theme} snapPoints={['88%', '95%']}>
      {({ scrollEnabled, onScroll, closeSheet }) => (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View style={styles.headerRow}>
            <View style={styles.titleWithIcon}>
              <User size={20} color="#0F172A" />
              <Text style={styles.titleText}>Edit Profile & Preferences</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                triggerHaptic.lightImpact();
                closeSheet();
              }}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.scrollPadding}
            showsVerticalScrollIndicator={true}
            scrollEnabled={scrollEnabled}
            onScroll={onScroll}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {/* Avatar Preview & Source Buttons */}
            <View style={styles.avatarSection}>
              <Text style={styles.sectionLabelText}>PROFILE PICTURE</Text>
              
              <TouchableOpacity
                style={styles.avatarPreviewWrapper}
                onPress={handlePickFromLibrary}
                activeOpacity={0.9}
              >
                <Image source={{ uri: avatarUrl }} style={styles.avatarPreviewImage} />
                <View style={styles.cameraIconBadge}>
                  <Camera size={14} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              {/* Action Buttons for Camera & Photos */}
              <View style={styles.imageSourceButtonsRow}>
                <TouchableOpacity
                  style={styles.sourceBtn}
                  onPress={() => {
                    triggerHaptic.lightImpact();
                    handlePickFromCamera();
                  }}
                  activeOpacity={0.8}
                >
                  <Camera size={16} color="#2563EB" />
                  <Text style={styles.sourceBtnText}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sourceBtn}
                  onPress={() => {
                    triggerHaptic.lightImpact();
                    handlePickFromLibrary();
                  }}
                  activeOpacity={0.8}
                >
                  <ImageIcon size={16} color="#2563EB" />
                  <Text style={styles.sourceBtnText}>Choose Photo</Text>
                </TouchableOpacity>
              </View>

              {/* Preset Avatars Selection */}
              <Text style={[styles.sectionLabelText, { marginTop: 16 }]}>OR SELECT PRESET AVATAR</Text>
              <View style={styles.presetAvatarsRow}>
                {PRESET_AVATARS.map((url, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.presetAvatarOption,
                      avatarUrl === url && styles.presetAvatarSelected,
                    ]}
                    onPress={() => {
                      triggerHaptic.lightImpact();
                      setAvatarUrl(url);
                    }}
                  >
                    <Image source={{ uri: url }} style={styles.presetAvatarImage} />
                    {avatarUrl === url && (
                      <View style={styles.selectedCheckOverlay}>
                        <Check size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Full Name Input Only */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Bottom Action Bar */}
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  triggerHaptic.lightImpact();
                  closeSheet();
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
                <Check size={16} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Save Profile</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    color: '#0F172A',
    marginLeft: 8,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  formScroll: {
    flex: 1,
  },
  scrollPadding: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 60,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarPreviewWrapper: {
    position: 'relative',
    marginVertical: 12,
  },
  avatarPreviewImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#2563EB',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#2563EB',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  imageSourceButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 6,
    width: '100%',
  },
  sourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  sourceBtnText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 13,
    color: '#2563EB',
  },
  sectionLabelText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  presetAvatarsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  presetAvatarOption: {
    position: 'relative',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 2,
  },
  presetAvatarSelected: {
    borderColor: '#2563EB',
  },
  presetAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  selectedCheckOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 13,
    color: '#475569',
    marginBottom: 6,
  },
  textInput: {
    fontFamily: FONTS.groteskRegular,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 14,
    color: '#64748B',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
