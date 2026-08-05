import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  TextInput,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { FONTS } from '../../theme/typography';
import { triggerHaptic } from '../../services/haptics';
import { Clock, X, Check } from 'lucide-react-native';

interface Props {
  visible: boolean;
  initialTimeStr?: string; // e.g. "09:00 AM"
  title?: string;
  onSelectTime: (formattedTime: string) => void;
  onClose: () => void;
}

/**
 * Parses time string (e.g. "09:30 AM", "14:00") into a JS Date object
 */
export function parseTimeStrToDate(timeStr: string): Date {
  const date = new Date();
  if (!timeStr) {
    date.setHours(9, 0, 0, 0);
    return date;
  }
  const clean = timeStr.trim().toUpperCase();
  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');
  const match = clean.match(/(\d+):?(\d+)?/);
  if (!match) {
    date.setHours(9, 0, 0, 0);
    return date;
  }
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Formats a Date object into "hh:mm AM/PM" (e.g. "09:30 AM")
 */
export function formatDateToTimeString(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  const hrsStr = hours < 10 ? `0${hours}` : `${hours}`;
  const minsStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hrsStr}:${minsStr} ${period}`;
}

export const TimePickerModal: React.FC<Props> = ({
  visible,
  initialTimeStr = '09:00 AM',
  title = 'Select Time',
  onSelectTime,
  onClose,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(() => parseTimeStrToDate(initialTimeStr));
  const [webTimeVal, setWebTimeVal] = useState<string>('09:00');

  useEffect(() => {
    if (visible) {
      const d = parseTimeStrToDate(initialTimeStr);
      setSelectedDate(d);

      const hh = d.getHours().toString().padStart(2, '0');
      const mm = d.getMinutes().toString().padStart(2, '0');
      setWebTimeVal(`${hh}:${mm}`);
    }
  }, [visible, initialTimeStr]);

  if (!visible) return null;

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && date) {
        triggerHaptic.notificationSuccess();
        const formatted = formatDateToTimeString(date);
        onSelectTime(formatted);
      }
      onClose();
      return;
    }

    if (date) {
      triggerHaptic.selection();
      setSelectedDate(date);
    }
  };

  const handleConfirmIOS = () => {
    triggerHaptic.notificationSuccess();
    const formatted = formatDateToTimeString(selectedDate);
    onSelectTime(formatted);
    onClose();
  };

  const handleConfirmWeb = () => {
    triggerHaptic.notificationSuccess();
    if (webTimeVal) {
      const [hStr, mStr] = webTimeVal.split(':');
      let hours = parseInt(hStr, 10);
      const minutes = parseInt(mStr, 10) || 0;
      const period = hours >= 12 ? 'PM' : 'AM';
      if (hours > 12) hours -= 12;
      if (hours === 0) hours = 12;
      const hrsStr = hours < 10 ? `0${hours}` : `${hours}`;
      const minsStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
      onSelectTime(`${hrsStr}:${minsStr} ${period}`);
    } else {
      onSelectTime(initialTimeStr);
    }
    onClose();
  };

  // Android Native Time Picker
  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={selectedDate}
        mode="time"
        is24Hour={false}
        display="default"
        onChange={handleDateChange}
      />
    );
  }

  // Web Platform Fallback
  if (Platform.OS === 'web') {
    return (
      <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.webModalContent}>
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <Clock size={18} color="#2563EB" />
                <Text style={styles.headerTitle}>{title}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.webInputContainer}>
              <Text style={styles.webLabel}>Choose Time:</Text>
              <TextInput
                style={styles.webTimeInput}
                {...({ type: 'time' } as any)}
                value={webTimeVal}
                onChangeText={(val) => setWebTimeVal(val)}
              />
            </View>

            <View style={styles.footerRow}>
              <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmWeb} style={styles.confirmBtn}>
                <Check size={16} color="#FFFFFF" />
                <Text style={styles.confirmBtnText}>Set Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // iOS Native Wheel / Spinner Time Picker inside Modal
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.iosModalContent}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Clock size={18} color="#2563EB" />
              <Text style={styles.headerTitle}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={selectedDate}
              mode="time"
              display="spinner"
              is24Hour={false}
              onChange={handleDateChange}
              textColor="#0F172A"
              style={{ width: '100%', height: 200 }}
            />
          </View>

          <View style={styles.footerRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirmIOS}
              style={styles.confirmBtn}
              activeOpacity={0.8}
            >
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.confirmBtnText}>Set Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  iosModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  webModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxWidth: 340,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: FONTS.groteskBold,
    fontSize: 16,
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  pickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  webInputContainer: {
    marginVertical: 16,
  },
  webLabel: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#334155',
    marginBottom: 6,
  },
  webTimeInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: FONTS.groteskBold,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cancelBtnText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#64748B',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  confirmBtnText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
});
