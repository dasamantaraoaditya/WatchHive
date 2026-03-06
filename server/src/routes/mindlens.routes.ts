import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { db } from '../db/index.js';
import { entries } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

const router = Router();

// Genre to Psychological Theme Mapping
const GENRE_THEMES: Record<string, string> = {
    'Action': 'Adrenaline Seeking',
    'Adventure': 'Exploration & Novelty',
    'Animation': 'Imagination & Playfulness',
    'Comedy': 'Stress Relief & Optimism',
    'Crime': 'Justice & Order Seeking',
    'Documentary': 'Intellectual Curiosity',
    'Drama': 'Emotional Processing',
    'Family': 'Comfort & Connection',
    'Fantasy': 'Escapism & Creativity',
    'History': 'Context & Perspective',
    'Horror': 'Thrill Seeking',
    'Music': 'Aesthetic Appreciation',
    'Mystery': 'Problem Solving',
    'Romance': 'Emotional Connection',
    'Science Fiction': 'Future-Oriented Thinking',
    'TV Movie': 'Comfort Viewing',
    'Thriller': 'Suspense & Stimulation',
    'War': 'Intensity & Conflict Awareness',
    'Western': 'Independence & Justice',
};

const MOOD_MAP: Record<string, string> = {
    'Comedy': 'Lighthearted',
    'Animation': 'Lighthearted',
    'Family': 'Lighthearted',
    'Horror': 'Tense',
    'Thriller': 'Tense',
    'Mystery': 'Tense',
    'Crime': 'Tense',
    'Drama': 'Reflective',
    'History': 'Reflective',
    'Documentary': 'Reflective',
    'War': 'Reflective',
    'Action': 'Excited',
    'Adventure': 'Excited',
    'Sci-Fi': 'Excited',
    'Fantasy': 'Excited',
    'Romance': 'Sentimental',
};

// Soul Personas based on USER's request
const SOUL_PERSONAS = [
    {
        name: 'The Contract Killer',
        description: 'Cold, calculated, and high-stakes. You prefer narratives where every choice is a life-or-death decision.',
        icon: '🎯',
        color: '#dc2626',
        criteria: { themes: ['Justice & Order Seeking', 'Suspense & Stimulation'], moods: ['Tense'] }
    },
    {
        name: 'The Sharp Lawyer',
        description: 'Analytical and sharp-witted. You love dissecting arguments and finding the elusive truth in complex dramas.',
        icon: '⚖️',
        color: '#2563eb',
        criteria: { themes: ['Justice & Order Seeking', 'Context & Perspective'], moods: ['Reflective'] }
    },
    {
        name: 'The Master Judge',
        description: 'Moral clarity and heavy decisions. You gravitate towards stories that explore right, wrong, and the gray areas in between.',
        icon: '👨‍⚖️',
        color: '#4b5563',
        criteria: { themes: ['Justice & Order Seeking', 'History'], moods: ['Reflective'] }
    },
    {
        name: 'The Wise Teacher',
        description: 'Always seeking knowledge. You view cinema as a lens to learn about the complexities of history and human nature.',
        icon: '🎓',
        color: '#059669',
        criteria: { themes: ['Intellectual Curiosity', 'Context & Perspective'], moods: ['Reflective'] }
    },
    {
        name: 'The Creator God',
        description: 'Limitless imagination. You love sprawling worlds that defy reality and the visionary minds that build them.',
        icon: '⚛️',
        color: '#d946ef',
        criteria: { themes: ['Escapism & Creativity', 'Imagination & Playfulness'], moods: ['Lighthearted', 'Excited'] }
    },
    {
        name: 'The Vengeful Batman',
        description: 'You are a guardian of the shadows. Justice, grit, and the complex morality of the night guide your viewing.',
        icon: '🦇',
        color: '#111827',
        criteria: { themes: ['Justice & Order Seeking', 'Adrenaline Seeking'], moods: ['Tense'] }
    },
    {
        name: 'The Agent of Chaos (Joker)',
        description: 'You enjoy the unpredictability of it all. High adrenaline and suspense keep you coming back for more.',
        icon: '🤡',
        color: '#7c3aed',
        criteria: { themes: ['Thrill Seeking', 'Adrenaline Seeking'], moods: ['Excited'] }
    },
    {
        name: 'The Ancient Vampire',
        description: 'Gothic, immortal, and elegantly dark. You prefer stories that transcend time and explore the seductive side of danger.',
        icon: '🧛',
        color: '#991b1b',
        criteria: { themes: ['Thrill Seeking', 'Escapism & Creativity'], moods: ['Tense', 'Sentimental'] }
    },
    {
        name: 'The Sandman',
        description: 'Lord of Dreams. Surreal, philosophical, and atmospheric narratives are where your mind truly feels at home.',
        icon: '⏳',
        color: '#0ea5e9',
        criteria: { themes: ['Imagination & Playfulness', 'Future-Oriented Thinking'], moods: ['Reflective'] }
    },
    {
        name: 'The Mamba Mentality (Kobe)',
        description: 'Relentless focus and competitive fire. You are drawn to stories of triumph, failure, and the obsession with greatness.',
        icon: '🐍',
        color: '#facc15',
        criteria: { themes: ['Intensity & Conflict Awareness', 'Adrenaline Seeking'], moods: ['Excited'] }
    },
    {
        name: 'The Smooth Soul (Wiz Khalifa)',
        description: 'Aesthetic, rhythmic, and high-vibing. You prioritize visual and auditory beauty in every cinematic experience.',
        icon: '🎶',
        color: '#22c55e',
        criteria: { themes: ['Aesthetic Appreciation', 'Stress Relief & Optimism'], moods: ['Lighthearted'] }
    },
    {
        name: 'The Devilish Rebel',
        description: 'You are drawn to the dark side of ambition and the seductive power of rebellion. Rules are just suggestions to you.',
        icon: '😈',
        color: '#dc2626',
        criteria: { themes: ['Thrill Seeking', 'Intensity & Conflict Awareness'], moods: ['Excited', 'Tense'] }
    },
    {
        name: 'The Sturdy Dwarf',
        description: 'Grounded, loyal, and deep-rooted. You prefer stories of companionship, craft, and the enduring strength of the earth.',
        icon: '⚒️',
        color: '#92400e',
        criteria: { themes: ['Independence & Justice', 'Comfort & Connection'], moods: ['Reflective'] }
    },
];

/**
 * @route   GET /api/v1/mindlens/insights
 * @desc    Generate psychological insights from watch history
 * @access  Private
 */
router.get('/insights', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;

        // Fetch last 100 entries for analysis
        const userEntries = await db
            .select({
                id: entries.id,
                title: entries.title,
                type: entries.type,
                watchedAt: entries.watchedAt,
                tags: entries.tags,
                rating: entries.rating,
                tmdbId: entries.tmdbId,
            })
            .from(entries)
            .where(eq(entries.userId, userId))
            .orderBy(desc(entries.watchedAt))
            .limit(100);

        if (userEntries.length < 5) {
            res.json({
                hasEnoughData: false,
                message: "Need more watch history to generate insights."
            });
            return;
        }

        // --- Analysis Logic ---

        // 1. Theme & Mood Analysis (from Tags as proxy for Genres)
        const themeCounts: Record<string, number> = {};
        const moodCounts: Record<string, number> = {};

        // Helper to simplify genre matching
        const normalize = (s: string) => s.toLowerCase().trim();

        userEntries.forEach(entry => {
            if (entry.tags && Array.isArray(entry.tags)) {
                entry.tags.forEach(tag => {
                    // Match tag to known genres
                    for (const [genre, theme] of Object.entries(GENRE_THEMES)) {
                        if (normalize(tag).includes(normalize(genre)) || normalize(genre).includes(normalize(tag))) {
                            themeCounts[theme] = (themeCounts[theme] || 0) + 1;
                        }
                    }
                    for (const [genre, mood] of Object.entries(MOOD_MAP)) {
                        if (normalize(tag).includes(normalize(genre)) || normalize(genre).includes(normalize(tag))) {
                            moodCounts[mood] = (moodCounts[mood] || 0) + 1;
                        }
                    }
                });
            }
        });

        // 2. Temporal Analysis (Time of Day of Watch)
        const timeOfDay = {
            morning: 0,   // 5-12
            afternoon: 0, // 12-17
            evening: 0,   // 17-22
            night: 0      // 22-5
        };

        userEntries.forEach(entry => {
            const hour = new Date(entry.watchedAt).getHours();
            if (hour >= 5 && hour < 12) timeOfDay.morning++;
            else if (hour >= 12 && hour < 17) timeOfDay.afternoon++;
            else if (hour >= 17 && hour < 22) timeOfDay.evening++;
            else timeOfDay.night++;
        });

        // 3. Generate Insights
        const insights: string[] = [];
        const topThemes = Object.entries(themeCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
        const topMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).slice(0, 2);

        if (topThemes.length > 0) {
            insights.push(`Your dominant viewing pattern suggests a leaning towards **${topThemes[0][0]}**.`);
            if (topThemes[0][0] === 'Adrenaline Seeking') {
                insights.push("You seek stimulation and excitement, perhaps to counterbalance a routine lifestyle.");
            } else if (topThemes[0][0] === 'Stress Relief & Optimism') {
                insights.push("You prioritize mood regulation and positivity, using entertainment as a recharge mechanism.");
            } else if (topThemes[0][0] === 'Emotional Processing') {
                insights.push("You engage deeply with complex narratives, using stories to reflect on human experiences.");
            } else if (topThemes[0][0] === 'Intellectual Curiosity') {
                insights.push("You view entertainment as a learning opportunity.");
            }
        }

        if (timeOfDay.night > (userEntries.length * 0.4)) {
            insights.push("High late-night activity detected. You might be a 'Revenge Bedtime Procrastinator', reclaiming personal time at night.");
        } else if (timeOfDay.morning > (userEntries.length * 0.3)) {
            insights.push("You start your day with content, possibly integrating entertainment into your morning routine for motivation.");
        }

        // 4. Assign Soul Persona
        let selectedPersona = SOUL_PERSONAS[0]; // Default
        let maxPersonaScore = -1;

        const currentThemes = topThemes.map(t => t[0]);
        const currentMoods = topMoods.map(m => m[0]);

        SOUL_PERSONAS.forEach(persona => {
            let score = 0;
            persona.criteria.themes.forEach(t => {
                if (currentThemes.includes(t)) score += 2;
            });
            persona.criteria.moods.forEach(m => {
                if (currentMoods.includes(m)) score += 1;
            });

            if (score > maxPersonaScore) {
                maxPersonaScore = score;
                selectedPersona = persona;
            }
        });

        // 5. Construct Response
        res.json({
            hasEnoughData: true,
            userProfile: {
                totalEntries: userEntries.length,
                primaryMood: topMoods[0] ? topMoods[0][0] : 'Balanced',
            },
            persona: {
                name: selectedPersona.name,
                description: selectedPersona.description,
                icon: selectedPersona.icon,
                color: selectedPersona.color
            },
            themes: topThemes.map(([name, score]) => ({ name, score })),
            timeDistribution: timeOfDay,
            insights,
            generatedAt: new Date(),
        });

    } catch (error) {
        console.error('MindLens Analysis Error:', error);
        res.status(500).json({ error: 'Failed to generate MindLens insights' });
    }
});

export default router;
