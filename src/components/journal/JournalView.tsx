import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { JournalEntry, MoodType, TaskCategory } from '../../types';
import { ThemeConfig } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { Database } from '../../storage/db';
import { triggerHaptic } from '../../services/haptics';
import { JournalEmptyIllustration } from '../common/EmptyStateIllustrations';
import {
  Flame,
  Brain,
  Smile,
  Coffee,
  Plus,
  Check,
  Search,
  Trash2,
  AlertCircle,
  BookOpen,
  ChevronUp,
  ChevronDown,
  Mic,
  MicOff,
  Sparkles,
  X,
  Zap,
} from 'lucide-react-native';

interface Props {
  entries: JournalEntry[];
  theme: ThemeConfig;
  onSaveEntry: (updated: JournalEntry[]) => void;
  onCloseModal?: () => void;
}

interface CategorizedWin {
  text: string;
  category: TaskCategory;
}

interface VoiceAnalysisResult {
  mood: MoodType;
  reflections: string;
  wins: { text: string; category: string }[];
  blockers: string[];
  confidence: number;
}

const getEntryScore = (entry: JournalEntry): number => {
  if ((entry as any).productivityScore !== undefined) {
    return (entry as any).productivityScore;
  }
  let baseScore = 75;
  if (entry.mood === 'deep_work') baseScore = 88;
  else if (entry.mood === 'energized') baseScore = 85;
  else if (entry.mood === 'content') baseScore = 78;
  else if (entry.mood === 'tired') baseScore = 65;
  const winBonus = (entry.wins?.length || 0) * 5;
  const blockerPenalty = (entry.blockers?.length || 0) * 4;
  const reflectionBonus = entry.reflections && entry.reflections.length > 40 ? 5 : 0;
  return Math.min(100, Math.max(35, baseScore + winBonus - blockerPenalty + reflectionBonus));
};

const formatLogDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;
  const dateObj = new Date(year, month - 1, day);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (
    dateObj.getFullYear() === today.getFullYear() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getDate() === today.getDate()
  ) {
    return 'Today, ' + dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (
    dateObj.getFullYear() === yesterday.getFullYear() &&
    dateObj.getMonth() === yesterday.getMonth() &&
    dateObj.getDate() === yesterday.getDate()
  ) {
    return 'Yesterday, ' + dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
};

async function analyzeVoiceWithGemini(transcript: string, apiKey: string): Promise<VoiceAnalysisResult> {
  const prompt = `You are an expert life-journaling AI. Analyze this spoken voice note and extract structured journal data.

Voice transcript: "${transcript}"

Return ONLY raw JSON (no markdown, no code blocks):
{
  "mood": "<one of: energized, deep_work, content, tired>",
  "reflections": "<2-4 sentence first-person daily reflection synthesized from transcript>",
  "wins": [{ "text": "<win or accomplishment>", "category": "<one of: Work & Projects, Learning & Skills, Health & Fitness, Personal & Life, Focus & Deep Work>" }],
  "blockers": ["<challenge or blocker mentioned>"],
  "confidence": <number 0-100>
}

Rules: infer mood from emotional tone, extract up to 5 wins and 5 blockers, return empty arrays if none mentioned.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanJson) as VoiceAnalysisResult;
}

export const JournalView: React.FC<Props> = ({ entries, theme, onSaveEntry, onCloseModal }) => {
  const [selectedMood, setSelectedMood] = useState<MoodType>('deep_work');
  const [reflectionText, setReflectionText] = useState('');
  const [winInput, setWinInput] = useState('');
  const [selectedWinCategory, setSelectedWinCategory] = useState<TaskCategory>('Work & Projects');
  const [winsList, setWinsList] = useState<CategorizedWin[]>([]);
  const [blockerInput, setBlockerInput] = useState('');
  const [blockersList, setBlockersList] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | MoodType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  // Voice / AI States
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [aiStatus, setAiStatus] = useState<'idle' | 'listening' | 'analyzing' | 'filled' | 'error'>('idle');
  const [aiStatusMessage, setAiStatusMessage] = useState('');

  const recognitionRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRing = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation;
    let ringLoop: Animated.CompositeAnimation;
    if (isListening) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.14, duration: 550, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.94, duration: 550, useNativeDriver: true }),
        ])
      );
      ringLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseRing, { toValue: 1.7, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseRing, { toValue: 1.0, duration: 10, useNativeDriver: true }),
        ])
      );
      pulseLoop.start();
      ringLoop.start();
      return () => { pulseLoop.stop(); ringLoop.stop(); };
    } else {
      Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true }).start();
      Animated.spring(pulseRing, { toValue: 1, useNativeDriver: true }).start();
    }
  }, [isListening]);

  const moods: { type: MoodType; label: string; icon: any; accentColor: string; lightBg: string; activeText: string }[] = [
    { type: 'energized', label: 'Energized', icon: Flame,  accentColor: '#F59E0B', lightBg: '#FEF3C7', activeText: '#B45309' },
    { type: 'deep_work', label: 'Deep Work', icon: Brain,  accentColor: '#2563EB', lightBg: '#EFF6FF', activeText: '#1D4ED8' },
    { type: 'content',   label: 'Content',   icon: Smile,  accentColor: '#10B981', lightBg: '#ECFDF5', activeText: '#047857' },
    { type: 'tired',     label: 'Tired',     icon: Coffee, accentColor: '#64748B', lightBg: '#F1F5F9', activeText: '#475569' },
  ];

  const categories: TaskCategory[] = [
    'Work & Projects', 'Learning & Skills', 'Health & Fitness', 'Personal & Life', 'Focus & Deep Work',
  ];

  const categoryColors: Record<string, { bg: string; text: string }> = {
    'Work & Projects':   { bg: '#DBEAFE', text: '#1D4ED8' },
    'Learning & Skills': { bg: '#F3E8FF', text: '#6D28D9' },
    'Health & Fitness':  { bg: '#D1FAE5', text: '#047857' },
    'Personal & Life':   { bg: '#FEF3C7', text: '#B45309' },
    'Focus & Deep Work': { bg: '#E0F2FE', text: '#0369A1' },
  };

  const reflectionTemplates = [
    'Completed all high-priority work tasks efficiently',
    'Maintained 3+ hours of uninterrupted deep focus',
    'Learned a new skill concept and took structured notes',
    'Finished key project milestones ahead of schedule',
    'Balanced work sprints with refreshing rest breaks',
    'Achieved daily focus target and positive momentum',
  ];

  // ── Voice Handlers ──────────────────────────────────────────────────────────
  const startVoiceRecording = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Web Only', 'Voice input works in the Expo web build (Chrome/Edge).');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      Alert.alert('Not Supported', 'Speech recognition requires Chrome or Edge browser.');
      return;
    }
    setShowVoicePanel(true);
    setVoiceTranscript('');
    setAiStatus('listening');
    setAiStatusMessage('Listening… speak naturally about your day');
    triggerHaptic.mediumImpact();

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    let finalTranscript = '';
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += t + ' ';
        else interim = t;
      }
      setVoiceTranscript(finalTranscript + interim);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error !== 'aborted') {
        setAiStatus('error');
        setAiStatusMessage('Microphone error. Please try again.');
      }
    };
    recognition.start();
    setIsListening(true);
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    setIsListening(false);
    triggerHaptic.lightImpact();
    if (voiceTranscript.trim().length > 0) {
      setAiStatusMessage('Recording stopped. Tap "Fill with AI" to analyze.');
    }
  };

  const analyzeWithAI = async () => {
    if (!voiceTranscript.trim()) {
      Alert.alert('No Transcript', 'Please speak something first.');
      return;
    }
    const apiKey = await Database.getGeminiApiKey();
    if (!apiKey || apiKey.trim().length < 10) {
      Alert.alert('API Key Required', 'Set your Gemini API key in Settings → Gemini AI Integration.');
      return;
    }
    setIsAnalyzing(true);
    setAiStatus('analyzing');
    setAiStatusMessage('AI is analyzing your voice note…');
    triggerHaptic.mediumImpact();
    try {
      const result = await analyzeVoiceWithGemini(voiceTranscript.trim(), apiKey);
      setSelectedMood(result.mood || 'content');
      setReflectionText(result.reflections || '');
      setWinsList((result.wins || []).map((w) => ({
        text: w.text,
        category: categories.includes(w.category) ? w.category : 'Work & Projects',
      })));
      setBlockersList(result.blockers || []);
      setAiStatus('filled');
      setAiStatusMessage(`Fields filled with ${result.confidence || 90}% confidence ✓`);
      triggerHaptic.notificationSuccess();
      setTimeout(() => {
        setShowVoicePanel(false);
        setAiStatus('idle');
        setVoiceTranscript('');
        setAiStatusMessage('');
      }, 2400);
    } catch (err) {
      console.error('Voice AI analysis failed:', err);
      setAiStatus('error');
      setAiStatusMessage('AI analysis failed. Check API key or try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const dismissVoicePanel = () => {
    stopVoiceRecording();
    setShowVoicePanel(false);
    setAiStatus('idle');
    setVoiceTranscript('');
    setAiStatusMessage('');
  };

  // ── Form Handlers ───────────────────────────────────────────────────────────
  const handleAddWin = () => {
    if (winInput.trim()) {
      triggerHaptic.lightImpact();
      setWinsList([...winsList, { text: winInput.trim(), category: selectedWinCategory }]);
      setWinInput('');
    }
  };
  const handleRemoveWin = (index: number) => { triggerHaptic.lightImpact(); setWinsList(winsList.filter((_, i) => i !== index)); };
  const handleAddBlocker = () => {
    if (blockerInput.trim()) {
      triggerHaptic.lightImpact();
      setBlockersList([...blockersList, blockerInput.trim()]);
      setBlockerInput('');
    }
  };
  const handleRemoveBlocker = (index: number) => { triggerHaptic.lightImpact(); setBlockersList(blockersList.filter((_, i) => i !== index)); };
  const handleApplyTemplate = (template: string) => {
    triggerHaptic.lightImpact();
    setReflectionText((prev) => prev.length > 0 ? `${prev}\n• ${template}` : `• ${template}`);
  };

  const handleSubmitJournal = async () => {
    if (!reflectionText.trim() && winsList.length === 0) {
      Alert.alert('Empty Entry', 'Please write a reflection or add at least one win before saving.');
      return;
    }
    triggerHaptic.notificationSuccess();
    const winsFormatted = winsList.map((w) => `[${w.category}] ${w.text}`);
    const newEntry = {
      dateStr: new Date().toISOString().split('T')[0],
      mood: selectedMood,
      reflections: reflectionText || 'Logged daily reflections & mindset notes.',
      wins: winsFormatted,
      blockers: blockersList,
    };
    const updated = await Database.saveJournalEntry(newEntry);
    onSaveEntry(updated);
    setReflectionText('');
    setWinsList([]);
    setBlockersList([]);
    setSelectedMood('deep_work');
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
      if (onCloseModal) onCloseModal();
    }, 1800);
  };

  const handleDeleteEntry = (entryId: string) => {
    Alert.alert('Delete Entry', 'Remove this reflection log?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        triggerHaptic.mediumImpact();
        const updated = await Database.deleteJournalEntry(entryId);
        onSaveEntry(updated);
      }},
    ]);
  };

  const filteredEntries = entries.filter((e) => {
    const matchesFilter = historyFilter === 'all' || e.mood === historyFilter;
    const matchesSearch = searchQuery === '' ||
      e.reflections.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.wins && e.wins.some((w) => w.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (e.blockers && e.blockers.some((b) => b.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesFilter && matchesSearch;
  });

  const selectedMoodObj = moods.find((m) => m.type === selectedMood) || moods[1];
