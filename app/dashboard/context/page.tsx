'use client';

import React, { useState } from 'react';
import {
  UserCheck,
  Shield,
  Trash2,
  Plus,
  Save,
  Check,
  AlertTriangle,
  Sparkles,
  Eye,
  RefreshCw,
  Phone,
  MessageSquare,
} from 'lucide-react';
import { useStudentSession } from '@/lib/session-context';
import { mockStudentFacts } from '@/lib/fixtures';
import { StudentFact, Activity } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function StudentContextPage() {
  const { student, phoneNumber, updateProfile } = useStudentSession();

  // Profile form state
  const [formData, setFormData] = useState({
    fullName: student.fullName || '',
    county: student.county || '',
    schoolName: student.schoolName || '',
    schoolType: student.schoolType || 'national',
    kcseYear: student.kcseYear || 2025,
    satScore: student.satScore || '',
    intendedMajors: student.intendedMajors?.join(', ') || '',
    needsFullAid: student.needsFullAid,
    familyIncomeBand: student.familyIncomeBand || 'under_5k',
  });

  const [activities, setActivities] = useState<Activity[]>(student.activities || []);
  const [facts, setFacts] = useState<StudentFact[]>(mockStudentFacts);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showGeminiJson, setShowGeminiJson] = useState(false);

  // Handle Form Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Save Profile Handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      fullName: formData.fullName,
      county: formData.county,
      schoolName: formData.schoolName,
      schoolType: formData.schoolType as any,
      kcseYear: Number(formData.kcseYear),
      satScore: formData.satScore ? Number(formData.satScore) : undefined,
      intendedMajors: formData.intendedMajors
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean),
      needsFullAid: formData.needsFullAid,
      familyIncomeBand: formData.familyIncomeBand as any,
      activities,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Delete Fact
  const handleDeleteFact = (keyToDelete: string) => {
    setFacts((prev) => prev.filter((f) => f.key !== keyToDelete));
  };

  // Add sample activity
  const handleAddActivity = () => {
    setActivities((prev) => [
      ...prev,
      {
        title: 'New Student Activity',
        role: 'Member / Participant',
        years: 1,
        summary: 'Describe leadership, initiative, or community involvement.',
      },
    ]);
  };

  const handleUpdateActivity = (index: number, updates: Partial<Activity>) => {
    setActivities((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleDeleteActivity = (index: number) => {
    setActivities((prev) => prev.filter((_, i) => i !== index));
  };

  // Reconstruct the exact context payload injected into Gemini 2.5 Flash
  const geminiInjectedContext = {
    profile: {
      fullName: student.fullName,
      phoneNumber: student.phoneNumber,
      schoolName: student.schoolName,
      schoolType: student.schoolType,
      kcseGrade: student.kcseGrade,
      kcsePoints: student.kcsePoints,
      gpaEquivalent: student.gpaEquivalent,
      satScore: student.satScore,
      intendedMajors: student.intendedMajors,
      needsFullAid: student.needsFullAid,
      familyIncomeBand: student.familyIncomeBand,
    },
    facts,
    channel: 'web',
    instructions:
      'Never guarantee admission. Never invent university requirements. Label all GPA conversions as indicative. Never request payment or financial transfers.',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-saffron uppercase tracking-widest mb-1">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Student Context &amp; Privacy Transparency</span>
          </div>
          <h1 className="font-fraunces text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-bone">
            Identity &amp; Context
          </h1>
          <p className="text-sm font-display text-bone-muted mt-1 max-w-2xl">
            Review and edit the personal facts Pepea uses across USSD, SMS, WhatsApp, and Web. You maintain full ownership and can delete any inferred fact.
          </p>
        </div>

        {/* Gemini Disclosure Modal Toggle */}
        <button
          onClick={() => setShowGeminiJson(!showGeminiJson)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-saffron/40 bg-saffron/10 text-saffron text-xs font-mono hover:bg-saffron/20 transition-colors self-start sm:self-auto"
        >
          <Eye className="w-4 h-4" />
          <span>{showGeminiJson ? 'Hide Gemini Payload' : 'What Gemini Sees'}</span>
        </button>
      </div>

      {/* 2. Transparent "What Gemini Sees" Disclosure Box */}
      {showGeminiJson && (
        <Card className="bg-screen border-phosphor/30 text-phosphor font-mono space-y-3">
          <div className="flex items-center justify-between border-b border-phosphor/20 pb-2">
            <span className="text-xs uppercase tracking-wider text-phosphor font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Live Server Context Injected into Gemini 2.5 Flash:
            </span>
            <span className="text-[10px] text-phosphor/60">Read-only system view</span>
          </div>
          <pre className="text-xs overflow-x-auto p-2 bg-black/40 rounded-lg max-h-72 leading-relaxed">
            {JSON.stringify(geminiInjectedContext, null, 2)}
          </pre>
          <p className="text-[11px] text-phosphor/70 pt-1">
            Privacy Guarantee: We never sell student data or train external foundational models on private drafts.
          </p>
        </Card>
      )}

      {/* 3. Main Form Grid */}
      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* Core Profile Card */}
        <Card className="bg-ink-surface border-white/10 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h2 className="font-editorial text-2xl font-bold text-bone">Academic &amp; School Profile</h2>
              <p className="text-xs font-display text-bone-muted">
                Your high school records and test scores used for university recommendations.
              </p>
            </div>
            <span className="text-xs font-mono text-phosphor bg-screen px-2.5 py-1 rounded border border-phosphor/30">
              {phoneNumber}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
            <Input
              label="County in Kenya"
              name="county"
              value={formData.county}
              onChange={handleChange}
              placeholder="e.g. Kericho, Nairobi, Kiambu"
            />
            <Input
              label="Secondary School Name"
              name="schoolName"
              value={formData.schoolName}
              onChange={handleChange}
              placeholder="e.g. Alliance High School"
            />

            <div>
              <label className="block text-xs font-mono font-medium tracking-wider text-bone-muted uppercase mb-1.5">
                School Type
              </label>
              <select
                name="schoolType"
                value={formData.schoolType}
                onChange={handleChange}
                className="w-full bg-ink-surface border border-white/10 rounded-lg px-4 py-3 text-bone font-display focus:outline-none focus:ring-1 focus:ring-saffron"
              >
                <option value="national">National High School</option>
                <option value="extra_county">Extra-County School</option>
                <option value="county">County School</option>
                <option value="sub_county">Sub-County Day School</option>
                <option value="private">Private Secondary School</option>
              </select>
            </div>

            <Input
              label="KCSE Graduation Year"
              name="kcseYear"
              type="number"
              value={formData.kcseYear}
              onChange={handleChange}
            />

            <Input
              label="SAT Score (Optional)"
              name="satScore"
              type="number"
              placeholder="e.g. 1440 (or leave blank)"
              value={formData.satScore}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Input
              label="Intended Majors (Comma-separated)"
              name="intendedMajors"
              value={formData.intendedMajors}
              onChange={handleChange}
              placeholder="Computer Science, Electrical Engineering, Economics"
              hint="Colleges evaluate applications by prospective academic department."
            />

            <div>
              <label className="block text-xs font-mono font-medium tracking-wider text-bone-muted uppercase mb-1.5">
                Estimated Family Income Band
              </label>
              <select
                name="familyIncomeBand"
                value={formData.familyIncomeBand}
                onChange={handleChange}
                className="w-full bg-ink-surface border border-white/10 rounded-lg px-4 py-3 text-bone font-display focus:outline-none focus:ring-1 focus:ring-saffron"
              >
                <option value="under_5k">Under $5,000 / year (Full Aid Eligible)</option>
                <option value="5k_20k">$5,000 – $20,000 / year</option>
                <option value="20k_60k">$20,000 – $60,000 / year</option>
                <option value="over_100k">Over $100,000 / year</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="needsFullAid"
                checked={formData.needsFullAid}
                onChange={handleChange}
                className="w-4 h-4 rounded border-white/20 bg-ink accent-saffron"
              />
              <span className="text-sm font-display text-bone">
                I require 100% full demonstrated financial aid to attend a US university (Tuition + Room &amp; Board).
              </span>
            </label>
          </div>
        </Card>

        {/* Extracurricular Activities Card */}
        <Card className="bg-ink-surface border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h2 className="font-editorial text-2xl font-bold text-bone">
                Activities &amp; Leadership (Common App List)
              </h2>
              <p className="text-xs font-display text-bone-muted">
                Add science projects, family commitments, tutoring, or community initiatives.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddActivity}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Activity
            </Button>
          </div>

          <div className="space-y-4">
            {activities.map((act, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-ink/50 border border-white/5 space-y-3 relative group"
              >
                <button
                  type="button"
                  onClick={() => handleDeleteActivity(idx)}
                  className="absolute top-4 right-4 text-bone-muted hover:text-murram-light transition-colors"
                  title="Remove activity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pr-8">
                  <Input
                    label="Activity Title"
                    value={act.title}
                    onChange={(e) => handleUpdateActivity(idx, { title: e.target.value })}
                  />
                  <Input
                    label="Role / Position"
                    value={act.role || ''}
                    onChange={(e) => handleUpdateActivity(idx, { role: e.target.value })}
                  />
                  <Input
                    label="Years of Involvement"
                    type="number"
                    value={act.years || 1}
                    onChange={(e) => handleUpdateActivity(idx, { years: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium tracking-wider text-bone-muted uppercase mb-1">
                    Impact &amp; Accomplishments (Max 150 chars for Common App)
                  </label>
                  <input
                    type="text"
                    value={act.summary || ''}
                    onChange={(e) => handleUpdateActivity(idx, { summary: e.target.value })}
                    className="w-full bg-ink-surface border border-white/10 rounded-lg px-3 py-2 text-xs font-display text-bone"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Inferred Context Facts Card (With Delete) */}
        <Card className="bg-ink-surface border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h2 className="font-editorial text-2xl font-bold text-bone">
                Inferred Admissions Facts
              </h2>
              <p className="text-xs font-display text-bone-muted">
                Facts extracted from your statements and WhatsApp chats. Delete any inaccurate item.
              </p>
            </div>
            <Badge variant="indicative">{facts.length} Verified Facts</Badge>
          </div>

          <div className="divide-y divide-white/5">
            {facts.map((fact) => (
              <div key={fact.key} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-saffron uppercase">
                      {fact.key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-bone-muted">
                      Source: {fact.source}
                    </span>
                  </div>
                  <p className="text-sm font-display text-bone leading-relaxed">{fact.value}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteFact(fact.key)}
                  className="p-1.5 text-bone-muted hover:text-murram-light hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
                  title="Delete fact"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Save Bar */}
        <div className="sticky bottom-6 p-4 rounded-2xl bg-ink-elevated border border-white/20 shadow-2xl flex items-center justify-between">
          <p className="text-xs font-mono text-bone-muted">
            All updates sync automatically to your E.164 phone profile.
          </p>
          <Button type="submit" variant="primary" size="md">
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 mr-1 text-ink" /> Profile Updated
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1.5" /> Save Profile
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

