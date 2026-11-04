import { clsx } from 'clsx';
import {
    X, Zap, Car, Dumbbell, Truck, Target, Plane, Ship, UserX,
    Wheat, Fish, Pickaxe, Cpu, TreeDeciduous, Crosshair, HardHat,
    Wrench, ChefHat, Bomb, FlaskConical, Heart, Beer, Brush, Wine, Scissors, Printer, Gem,
    TrendingUp, Briefcase, Clock
} from 'lucide-react';

// Skill Overview from server
export interface SkillOverview {
    skill: string;
    level: number;
    currentXP: number;
    xpToNextLevel: number;
    progressPercent: number;
    organizationBonus: number;
    category: 'basis' | 'minijob' | 'beruf';
    lastUsed: Date;
}

// Skill icons mapping
const SKILL_ICONS: Record<string, React.ElementType> = {
    // BASIS Skills (7)
    driving: Car,
    fitness: Dumbbell,
    trucking: Truck,
    weapons: Target,
    piloting: Plane,
    boating: Ship,
    thief: UserX,
    // MINIJOB Skills (7)
    farming: Wheat,
    fishing: Fish,
    mining: Pickaxe,
    electronics: Cpu,
    woodcutting: TreeDeciduous,
    hunting: Crosshair,
    construction: HardHat,
    // BERUF Skills (11)
    mechanic: Wrench,
    cooking: ChefHat,
    weapon_crafting: Bomb,
    chemistry: FlaskConical,
    medical: Heart,
    bartending: Beer,
    tattooing: Brush,
    brewing: Wine,
    barber: Scissors,
    printing: Printer,
    jewelry: Gem,
};

// Skill labels mapping
const SKILL_LABELS: Record<string, string> = {
    // BASIS Skills
    driving: 'Fahren',
    fitness: 'Fitness',
    trucking: 'Trucking',
    weapons: 'Waffen',
    piloting: 'Fliegen',
    boating: 'Bootfahren',
    thief: 'Diebstahl',
    // MINIJOB Skills
    farming: 'Landwirtschaft',
    fishing: 'Angeln',
    mining: 'Bergbau',
    electronics: 'Elektronik',
    woodcutting: 'Holzfällen',
    hunting: 'Jagen',
    construction: 'Bau',
    // BERUF Skills
    mechanic: 'Mechaniker',
    cooking: 'Kochen',
    weapon_crafting: 'Waffenbau',
    chemistry: 'Chemie',
    medical: 'Medizin',
    bartending: 'Barkeeper',
    tattooing: 'Tätowieren',
    brewing: 'Brauen',
    barber: 'Friseur',
    printing: 'Drucken',
    jewelry: 'Schmuck',
};

// Category config
const CATEGORY_CONFIG = {
    basis: {
        label: 'Basis-Fähigkeiten',
        description: 'Alle haben, Decay aktiv',
        icon: Zap,
        color: 'text-blue-400',
        bgColor: 'bg-blue-900/40',
        borderColor: 'border-blue-500/30',
        barColor: 'from-blue-500 to-cyan-400',
    },
    minijob: {
        label: 'Minijob-Fähigkeiten',
        description: 'Langsamer Decay, kein Limit',
        icon: Clock,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-900/40',
        borderColor: 'border-emerald-500/30',
        barColor: 'from-emerald-500 to-teal-400',
    },
    beruf: {
        label: 'Berufs-Fähigkeiten',
        description: '100 Punkte Pool',
        icon: Briefcase,
        color: 'text-purple-400',
        bgColor: 'bg-purple-900/40',
        borderColor: 'border-purple-500/30',
        barColor: 'from-purple-500 to-pink-400',
    },
};

interface SkillsPanelProps {
    skills: SkillOverview[];
    onClose: () => void;
}

export function SkillsPanel({ skills, onClose }: SkillsPanelProps) {
    // Separate skills by category
    const basisSkills = skills.filter(s => s.category === 'basis');
    const minijobSkills = skills.filter(s => s.category === 'minijob');
    const berufSkills = skills.filter(s => s.category === 'beruf');

    // Calculate total beruf skill points used (only beruf has limit)
    const totalBerufPoints = berufSkills.reduce((sum, s) => sum + s.level, 0);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-75">
            <div className="bg-[#0d1a2d] rounded-xl w-[800px] max-h-[85vh] overflow-hidden shadow-2xl border border-primary-500/50">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e3a5f] bg-linear-to-r from-[#1e3a5f]/50 to-[#0d1a2d]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-500/30 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-primary-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Fähigkeiten</h2>
                            <p className="text-xs text-slate-400">Deine Skill-Übersicht</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg bg-[#162a42] hover:bg-red-600/80 text-slate-400 hover:text-white transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)] custom-scrollbar space-y-6">
                    {skills.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Keine Skills vorhanden</p>
                            <p className="text-sm mt-2">Beginne zu arbeiten und zu lernen!</p>
                        </div>
                    ) : (
                        <>
                            {/* BASIS Skills */}
                            {basisSkills.length > 0 && (
                                <SkillCategory
                                    category="basis"
                                    skills={basisSkills}
                                />
                            )}

                            {/* MINIJOB Skills */}
                            {minijobSkills.length > 0 && (
                                <SkillCategory
                                    category="minijob"
                                    skills={minijobSkills}
                                />
                            )}

                            {/* BERUF Skills */}
                            {berufSkills.length > 0 && (
                                <SkillCategory
                                    category="beruf"
                                    skills={berufSkills}
                                    poolUsed={totalBerufPoints}
                                    poolMax={100}
                                />
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-[#0a1420] border-t border-[#1e3a5f] flex items-center justify-between text-xs text-slate-500">
                    <span>Level durch Bücher lesen oder praktische Arbeit steigern</span>
                    <span>Berufs-Skills teilen sich 100 Punkte</span>
                </div>
            </div>
        </div>
    );
}

// Skill Category Section
interface SkillCategoryProps {
    category: 'basis' | 'minijob' | 'beruf';
    skills: SkillOverview[];
    poolUsed?: number;
    poolMax?: number;
}

function SkillCategory({ category, skills, poolUsed, poolMax }: SkillCategoryProps) {
    const config = CATEGORY_CONFIG[category];
    const Icon = config.icon;

    return (
        <div className={clsx("rounded-xl border p-4", config.borderColor, "bg-[#0a1420]/50")}>
            {/* Category Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center", config.bgColor)}>
                        <Icon className={clsx("w-4 h-4", config.color)} />
                    </div>
                    <div>
                        <h3 className={clsx("text-sm font-semibold", config.color)}>{config.label}</h3>
                        <p className="text-xs text-slate-500">{config.description}</p>
                    </div>
                </div>
                {poolMax && (
                    <div className="text-right">
                        <span className={clsx("text-sm font-bold", config.color)}>{poolUsed}</span>
                        <span className="text-xs text-slate-500">/{poolMax} Punkte</span>
                    </div>
                )}
            </div>

            {/* Pool Bar (only for beruf) */}
            {poolMax && (
                <div className="mb-4 bg-[#162a42] rounded-full h-2 overflow-hidden">
                    <div
                        className={clsx("h-full bg-linear-to-r transition-all", config.barColor)}
                        style={{ width: `${Math.min(100, (poolUsed || 0) / poolMax * 100)}%` }}
                    />
                </div>
            )}

            {/* Skills Grid */}
            <div className="grid grid-cols-2 gap-3">
                {skills.map((skill) => (
                    <SkillCard key={skill.skill} skill={skill} categoryConfig={config} />
                ))}
            </div>
        </div>
    );
}

// Individual Skill Card
interface SkillCardProps {
    skill: SkillOverview;
    categoryConfig: typeof CATEGORY_CONFIG[keyof typeof CATEGORY_CONFIG];
}

function SkillCard({ skill, categoryConfig }: SkillCardProps) {
    const Icon = SKILL_ICONS[skill.skill] || Zap;
    const label = SKILL_LABELS[skill.skill] || skill.skill;

    const getLevelBadge = (level: number) => {
        if (level >= 90) return { text: 'Meister', color: 'text-yellow-400 bg-yellow-900/50' };
        if (level >= 75) return { text: 'Experte', color: 'text-purple-400 bg-purple-900/50' };
        if (level >= 50) return { text: 'Erfahren', color: 'text-blue-400 bg-blue-900/50' };
        if (level >= 25) return { text: 'Lehrling', color: 'text-green-400 bg-green-900/50' };
        return { text: 'Anfänger', color: 'text-slate-400 bg-[#162a42]' };
    };

    const badge = getLevelBadge(skill.level);

    return (
        <div className="bg-[#12243a] rounded-lg p-3 border border-[#1e3a5f] hover:border-[#2a4a6a] transition-all">
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", categoryConfig.bgColor)}>
                    <Icon className={clsx("w-5 h-5", categoryConfig.color)} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h4 className="text-white font-medium text-sm truncate">{label}</h4>
                        <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full", badge.color)}>
                            {badge.text}
                        </span>
                    </div>

                    {/* Level */}
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg font-bold text-white">{skill.level}</span>
                        <span className="text-slate-500 text-xs">/ 100</span>
                        {skill.organizationBonus > 0 && (
                            <span className="text-[10px] text-green-400 bg-green-900/30 px-1 py-0.5 rounded-sm">
                                +{skill.organizationBonus}
                            </span>
                        )}
                    </div>

                    {/* Progress bar */}
                    <div className="bg-[#0a1420] rounded-full h-1.5 overflow-hidden mb-1">
                        <div
                            className={clsx("h-full bg-linear-to-r transition-all", categoryConfig.barColor)}
                            style={{ width: `${skill.progressPercent}%` }}
                        />
                    </div>

                    {/* XP info */}
                    <div className="flex justify-between text-[10px] text-slate-500">
                        <span>{skill.currentXP} XP</span>
                        <span>{skill.xpToNextLevel} XP</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SkillsPanel;
