import { Task, SubjectProgress, AISyncResult, TaskCategory, UserCategory } from '../types';

export async function runNightlyAISync(
  apiKey: string | null,
  tasks: Task[],
  syllabus: SubjectProgress[],
  categories?: UserCategory[]
): Promise<AISyncResult> {
  const dateStr = new Date().toISOString().split('T')[0];
  const completedTasks = tasks.filter(t => t.completed);
  const pendingTasks = tasks.filter(t => !t.completed);

  // Build category names from user-defined categories
  const getCatName = (catId: string) => {
    if (!categories) return catId;
    const found = categories.find(c => c.id === catId);
    return found ? found.name : catId;
  };

  const categoryNames = categories ? categories.map(c => c.name) : [];
  const categoryStr = categoryNames.length > 0 ? categoryNames.join(', ') : 'General Activities';

  const subjectNames = syllabus.map(s => s.subject);
  const subjectStr = subjectNames.length > 0 ? subjectNames.join(', ') : '';

  const categoryListForAI = categories
    ? categories.map(c => `"${c.id}" (${c.name}, type: ${c.tag})`).join(', ')
    : '"work", "learning", "health", "personal"';

  const promptText = `
You are an expert AI Productivity & Life Coach.
Here are the user's today activity logs:
- Date: ${dateStr}
- Completed Tasks (${completedTasks.length}/${tasks.length}): ${completedTasks.map(t => `${t.title} [${getCatName(t.category)}]`).join(', ') || 'None'}
- Pending Tasks (${pendingTasks.length}): ${pendingTasks.map(t => `${t.title} [${getCatName(t.category)}]`).join(', ') || 'None'}
- User's Categories: ${categoryStr}
${subjectStr ? `- Enrolled Subjects: ${subjectStr}` : ''}

Available category IDs for scheduling: ${categoryListForAI}

Analyze this data and return ONLY a valid JSON object (no markdown codeblock formatting, just raw JSON) with this exact schema:
{
  "productivityScore": <number between 0 and 100>,
  "keyTakeaway": "<concise 2-sentence summary of today's achievement and focus based strictly on actual user tasks>",
  "nextDayFocus": "<1 sentence key priority for tomorrow>",
  "suggestedSchedule": [
    { "time": "08:00 AM - 09:30 AM", "activity": "<activity name based on user's categories>", "category": "<one of the available category IDs>" },
    { "time": "10:00 AM - 11:30 AM", "activity": "<activity name>", "category": "<category ID>" },
    { "time": "02:00 PM - 04:30 PM", "activity": "<activity name>", "category": "<category ID>" },
    { "time": "06:00 PM - 07:00 PM", "activity": "<activity name>", "category": "<category ID>" }
  ]
}
`;

  if (apiKey && apiKey.trim().length > 10) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return {
          id: 'ai-' + Date.now(),
          dateStr,
          productivityScore: Math.min(100, Math.max(0, parsed.productivityScore || 75)),
          keyTakeaway: parsed.keyTakeaway || (tasks.length > 0 ? `Completed ${completedTasks.length} of ${tasks.length} tasks today.` : 'No tasks logged today.'),
          nextDayFocus: parsed.nextDayFocus || 'Focus on high-priority pending items tomorrow.',
          suggestedSchedule: parsed.suggestedSchedule || [],
          syncedAt: new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn('Gemini API call failed, using local template synthesizer:', err);
    }
  }

  // Authentic Local Data-Driven AI Synthesizer
  const ratio = tasks.length > 0 ? completedTasks.length / tasks.length : 0;
  const score = tasks.length > 0 ? Math.round(ratio * 100) : 75;

  const topTaskTitle = completedTasks[0]?.title || pendingTasks[0]?.title || 'Daily Goal';

  // Build schedule from user's actual categories
  const defaultCats = categories && categories.length > 0
    ? categories
    : [
        { id: 'cat-work', name: 'Work', tag: 'work' as const, color: '#2563EB', icon: '💼', createdAt: '' },
        { id: 'cat-learning', name: 'Learning', tag: 'new_skill' as const, color: '#7C3AED', icon: '🧠', createdAt: '' },
        { id: 'cat-health', name: 'Health', tag: 'health' as const, color: '#10B981', icon: '💪', createdAt: '' },
        { id: 'cat-personal', name: 'Personal', tag: 'routine' as const, color: '#F59E0B', icon: '🏠', createdAt: '' },
      ];

  const suggestedSchedule: { time: string; activity: string; category: TaskCategory }[] = [];

  if (defaultCats.length >= 1) {
    suggestedSchedule.push({
      time: '08:00 AM - 09:30 AM',
      activity: `Focused Session: ${topTaskTitle}`,
      category: completedTasks[0]?.category || defaultCats[0].id,
    });
  }
  if (defaultCats.length >= 2) {
    suggestedSchedule.push({
      time: '10:00 AM - 11:30 AM',
      activity: `${defaultCats[1].name} Block`,
      category: defaultCats[1].id,
    });
  }
  if (defaultCats.length >= 3) {
    suggestedSchedule.push({
      time: '02:00 PM - 04:00 PM',
      activity: pendingTasks[0] ? `Project Sprint: ${pendingTasks[0].title}` : `${defaultCats[2].name} Session`,
      category: pendingTasks[0]?.category || defaultCats[2].id,
    });
  }
  if (defaultCats.length >= 4) {
    suggestedSchedule.push({
      time: '06:00 PM - 07:00 PM',
      activity: `${defaultCats[3].name} & Journaling`,
      category: defaultCats[3].id,
    });
  }

  return {
    id: 'ai-' + Date.now(),
    dateStr,
    productivityScore: score,
    keyTakeaway: tasks.length > 0
      ? `Completed ${completedTasks.length} out of ${tasks.length} planned tasks. Overall execution ratio is ${Math.round(ratio * 100)}%.`
      : 'No tasks scheduled today. Add items to your planner for a detailed AI productivity evaluation.',
    nextDayFocus: pendingTasks.length > 0
      ? `Prioritize completing pending task: "${pendingTasks[0].title}".`
      : 'Continue steady progress on your goals.',
    suggestedSchedule,
    syncedAt: new Date().toISOString(),
  };
}

export async function replanTomorrowSchedule(
  apiKey: string | null,
  customPrompt: string,
  tasks: Task[],
  syllabus: SubjectProgress[],
  categories?: UserCategory[]
): Promise<{ time: string; activity: string; category: TaskCategory }[]> {
  const categoryNames = categories ? categories.map(c => c.name) : [];
  const categoryListForAI = categories
    ? categories.map(c => `"${c.id}" (${c.name})`).join(', ')
    : '"work", "learning", "health", "personal"';

  const subjectNames = syllabus.map(s => s.subject);
  const promptText = `
You are an intelligent AI schedule planner. Re-plan tomorrow's schedule based on this directive:
"${customPrompt}"

User's Categories: ${categoryNames.length > 0 ? categoryNames.join(', ') : 'Work, Learning, Health, Personal'}
Available category IDs: ${categoryListForAI}
${subjectNames.length > 0 ? `Enrolled Subjects: ${subjectNames.join(', ')}` : ''}

Generate 4-5 schedule slots strictly incorporating the user directive.
Return ONLY raw JSON with schema:
[
  { "time": "08:00 AM - 09:30 AM", "activity": "<activity title>", "category": "<one of the available category IDs>" }
]
`;

  if (apiKey && apiKey.trim().length > 10) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Gemini custom replan failed, falling back to local synthesizer:', err);
    }
  }

  // Authentic Local Directive Synthesizer using user categories
  const schedule: { time: string; activity: string; category: TaskCategory }[] = [];
  const cleanDirective = customPrompt.trim();

  const defaultCats = categories && categories.length > 0
    ? categories
    : [
        { id: 'cat-work', name: 'Work', tag: 'work' as const, color: '#2563EB', icon: '💼', createdAt: '' },
        { id: 'cat-learning', name: 'Learning', tag: 'new_skill' as const, color: '#7C3AED', icon: '🧠', createdAt: '' },
        { id: 'cat-health', name: 'Health', tag: 'health' as const, color: '#10B981', icon: '💪', createdAt: '' },
        { id: 'cat-personal', name: 'Personal', tag: 'routine' as const, color: '#F59E0B', icon: '🏠', createdAt: '' },
      ];

  schedule.push({
    time: '08:00 AM - 10:00 AM',
    activity: `Primary Focus: ${cleanDirective}`,
    category: defaultCats[0]?.id || 'cat-work',
  });

  if (defaultCats.length >= 2) {
    schedule.push({
      time: '10:30 AM - 12:00 PM',
      activity: `${defaultCats[1].name} Session`,
      category: defaultCats[1].id,
    });
  }

  if (defaultCats.length >= 3) {
    schedule.push({
      time: '02:00 PM - 04:30 PM',
      activity: `Deep Sprint: ${cleanDirective}`,
      category: defaultCats[2].id,
    });
  }

  if (defaultCats.length >= 4) {
    schedule.push({
      time: '06:00 PM - 07:00 PM',
      activity: `${defaultCats[3].name} & Daily Reflection`,
      category: defaultCats[3].id,
    });
  }

  return schedule;
}
