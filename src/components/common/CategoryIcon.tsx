import React from 'react';
import {
  Briefcase,
  Brain,
  Activity,
  User,
  Target,
  Folder,
  Code,
  BookOpen,
  Coffee,
  Dumbbell,
  Sparkles,
  Zap,
  CheckCircle2,
  Heart,
  Smile,
  Layers,
  LucideProps,
} from 'lucide-react-native';

export type CategoryIconName =
  | 'briefcase'
  | 'brain'
  | 'activity'
  | 'user'
  | 'target'
  | 'folder'
  | 'code'
  | 'book'
  | 'coffee'
  | 'dumbbell'
  | 'sparkles'
  | 'zap'
  | 'heart'
  | 'smile'
  | 'layers';

export const CATEGORY_ICON_OPTIONS: { name: CategoryIconName; label: string }[] = [
  { name: 'briefcase', label: 'Work' },
  { name: 'brain', label: 'Learning' },
  { name: 'activity', label: 'Health' },
  { name: 'user', label: 'Personal' },
  { name: 'target', label: 'Focus' },
  { name: 'folder', label: 'Projects' },
  { name: 'code', label: 'Coding' },
  { name: 'book', label: 'Reading' },
  { name: 'coffee', label: 'Routine' },
  { name: 'dumbbell', label: 'Fitness' },
  { name: 'sparkles', label: 'Creative' },
  { name: 'zap', label: 'Skill' },
  { name: 'heart', label: 'Wellness' },
  { name: 'layers', label: 'General' },
];

interface Props extends LucideProps {
  name: string;
  size?: number;
  color?: string;
}

export const CategoryIcon: React.FC<Props> = ({ name, size = 18, color = '#64748B', ...props }) => {
  const iconName = name ? name.toLowerCase().trim() : 'folder';

  switch (iconName) {
    case 'briefcase':
    case 'work':
    case 'job':
      return <Briefcase size={size} color={color} {...props} />;
    case 'brain':
    case 'skill':
    case 'learning':
    case 'study':
      return <Brain size={size} color={color} {...props} />;
    case 'activity':
    case 'health':
    case 'fitness':
      return <Activity size={size} color={color} {...props} />;
    case 'user':
    case 'personal':
    case 'life':
      return <User size={size} color={color} {...props} />;
    case 'target':
    case 'focus':
    case 'goal':
      return <Target size={size} color={color} {...props} />;
    case 'folder':
    case 'project':
    case 'projects':
      return <Folder size={size} color={color} {...props} />;
    case 'code':
    case 'dev':
    case 'programming':
      return <Code size={size} color={color} {...props} />;
    case 'book':
    case 'reading':
      return <BookOpen size={size} color={color} {...props} />;
    case 'coffee':
    case 'break':
    case 'routine':
      return <Coffee size={size} color={color} {...props} />;
    case 'dumbbell':
    case 'gym':
    case 'workout':
      return <Dumbbell size={size} color={color} {...props} />;
    case 'sparkles':
    case 'creative':
    case 'art':
      return <Sparkles size={size} color={color} {...props} />;
    case 'zap':
    case 'productivity':
      return <Zap size={size} color={color} {...props} />;
    case 'heart':
      return <Heart size={size} color={color} {...props} />;
    case 'smile':
      return <Smile size={size} color={color} {...props} />;
    default:
      return <Layers size={size} color={color} {...props} />;
  }
};
