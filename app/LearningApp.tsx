"use client";

import { useEffect, useState } from "react";
import { allLessons, story, teacherBio, units, type Lesson, type Unit } from "./curriculum";
import {
  createLessonQuestions,
  createStoryBank,
  createStoryQuiz,
  createTermReview,
  createUnitBank,
  questionCounts,
  shuffle,
  type Question,
} from "./questions";

type StudentProfile = {
  name: string;
  className: string;
  school: string;
  avatar: string;
};

type Progress = {
  xp: number;
  completedLessons: string[];
  stars: Record<string, number>;
  bestScores: Record<string, number>;
  badges: string[];
  lastUnitId?: string;
  lastLessonId?: string;
};

type AppView = "welcome" | "dashboard" | "unit" | "lesson" | "story" | "quiz";

type QuizSession = {
  id: string;
  title: string;
  subtitle: string;
  questions: Question[];
  returnView: Exclude<AppView, "welcome" | "quiz">;
  unitId?: string;
  lessonId?: string;
  badge?: string;
};

const PROFILE_KEY = "mona-primary4-profile-v1";
const PROGRESS_KEY = "mona-primary4-progress-v1";

const blankProfile: StudentProfile = { name: "", className: "", school: "", avatar: "👧🏽" };
const blankProgress: Progress = { xp: 0, completedLessons: [], stars: {}, bestScores: {}, badges: [] };
const avatars = ["👧🏽", "👧🏻", "👧🏾", "👧🏼", "🧕🏽", "🧕🏻", "🧕🏾", "👩🏻‍🦱"];

const badgeCatalog = [
  { name: "First Bloom", icon: "🌷", note: "Complete your first lesson." },
  { name: "Vocabulary Hero", icon: "📚", note: "Score 80% or more in a lesson quiz." },
  { name: "Unit Star", icon: "⭐", note: "Complete all five lessons in one unit." },
  { name: "Story Master", icon: "👗", note: "Score 80% or more in the story quiz." },
  { name: "English Champion", icon: "👑", note: "Reach 1,000 XP." },
];

const speak = (text: string) => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.82;
  utterance.pitch = 1.06;
  window.speechSynthesis.speak(utterance);
};

const starsText = (count = 0) => `${"★".repeat(count)}${"☆".repeat(Math.max(0, 3 - count))}`;

function TeacherModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="teacher-modal" role="dialog" aria-modal="true" aria-labelledby="teacher-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close teacher profile">×</button>
        <div className="teacher-mark" aria-hidden="true">MH</div>
        <span className="eyebrow">Who Am I?</span>
        <h2 id="teacher-title">{teacherBio.name}</h2>
        <p className="teacher-title">{teacherBio.title}</p>
        <div className="teacher-copy">
          {teacherBio.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        <div className="value-row">
          {teacherBio.values.map((value) => <span key={value}>{value}</span>)}
        </div>
        <div className="signature">Teach with heart. Learn with joy.</div>
      </section>
    </div>
  );
}

function AppHeader({ profile, progress, onHome, onTeacher }: { profile: StudentProfile; progress: Progress; onHome: () => void; onTeacher: () => void }) {
  return (
    <header className="app-header">
      <button className="brand-button" onClick={onHome} aria-label="Go to learning garden">
        <span className="brand-flower">✿</span>
        <span><strong>Mona’s English Garden</strong><small>Primary 4 • Term 1</small></span>
      </button>
      <div className="header-actions">
        <div className="mini-stat"><span>✨</span><strong>{progress.xp}</strong><small>XP</small></div>
        <button className="teacher-link" onClick={onTeacher}>Who Am I?</button>
        <div className="student-chip"><span>{profile.avatar}</span><div><strong>{profile.name}</strong><small>{profile.className || "Young learner"}</small></div></div>
      </div>
    </header>
  );
}

function WelcomeScreen({ storedProfile, onStart, onTeacher }: { storedProfile: StudentProfile | null; onStart: (profile: StudentProfile) => void; onTeacher: () => void }) {
  const [form, setForm] = useState<StudentProfile>(storedProfile ?? blankProfile);
  const [error, setError] = useState("");

  const start = () => {
    if (!form.name.trim()) {
      setError("Please enter your name to start your adventure.");
      return;
    }
    onStart({ ...form, name: form.name.trim(), className: form.className.trim(), school: form.school.trim() });
  };

  return (
    <main className="welcome-screen" style={{ backgroundImage: 'url("assets/hero.webp")' }}>
      <div className="welcome-overlay" />
      <div className="floating-sparkle sparkle-one">✦</div>
      <div className="floating-sparkle sparkle-two">✿</div>
      <section className="welcome-copy">
        <div className="curriculum-brand" aria-label="English Primary 4, Egyptian Curriculum, Term One, 2026 to 2027">
          <span>Egyptian Curriculum</span>
          <strong>English Primary 4</strong>
          <small>Term One • 2026/2027</small>
        </div>
        <h1>Grow your English.<br /><em>Shine every day.</em></h1>
        <div className="teacher-signature">
          <span>Your English Teacher</span>
          <strong>Mrs. Mona Harb</strong>
        </div>
        <p>A joyful English learning adventure made especially for brilliant young learners.</p>
        <button className="text-link light-link" onClick={onTeacher}>Meet your teacher <span>→</span></button>
      </section>
      <section className="student-glass-card" aria-labelledby="welcome-form-title">
        <div className="glass-icon">🌷</div>
        <span className="eyebrow">Your learning garden</span>
        <h2 id="welcome-form-title">Welcome, superstar!</h2>
        <p>Tell us a little about you, then let the adventure begin.</p>
        <label>
          <span>Your name *</span>
          <input value={form.name} onChange={(event) => { setForm({ ...form, name: event.target.value }); setError(""); }} placeholder="Type your name" autoComplete="name" />
        </label>
        <div className="input-grid">
          <label><span>Class</span><input value={form.className} onChange={(event) => setForm({ ...form, className: event.target.value })} placeholder="4A" /></label>
          <label><span>School</span><input value={form.school} onChange={(event) => setForm({ ...form, school: event.target.value })} placeholder="Your school" /></label>
        </div>
        <fieldset className="avatar-fieldset">
          <legend>Choose your avatar</legend>
          <div className="avatar-list">
            {avatars.map((avatar) => <button type="button" key={avatar} className={form.avatar === avatar ? "avatar active" : "avatar"} onClick={() => setForm({ ...form, avatar })} aria-label={`Choose avatar ${avatar}`}>{avatar}</button>)}
          </div>
        </fieldset>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button full-button" onClick={start}>{storedProfile ? "Continue My Journey" : "Start Learning"} <span>→</span></button>
        <small className="privacy-note">🔒 Your progress stays safely on this device.</small>
      </section>
    </main>
  );
}

function ProgressRing({ value }: { value: number }) {
  return <div className="progress-ring" style={{ "--progress": `${value * 3.6}deg` } as React.CSSProperties}><span>{value}%</span></div>;
}

function Dashboard({ profile, progress, onUnit, onStory, onReview, onTeacher }: {
  profile: StudentProfile;
  progress: Progress;
  onUnit: (unit: Unit) => void;
  onStory: () => void;
  onReview: (part: 1 | 2) => void;
  onTeacher: () => void;
}) {
  const completion = Math.round((progress.completedLessons.length / allLessons.length) * 100);
  const earnedStars = Object.values(progress.stars).reduce((sum, item) => sum + item, 0);
  return (
    <div className="app-shell">
      <AppHeader profile={profile} progress={progress} onHome={() => undefined} onTeacher={onTeacher} />
      <main className="dashboard-main">
        <section className="dashboard-welcome">
          <div>
            <span className="eyebrow">Hello, {profile.name}! {profile.avatar}</span>
            <h1>Ready to make your English bloom?</h1>
            <p>Choose a unit, collect stars, and grow a little stronger with every lesson.</p>
            <div className="welcome-stats">
              <span><strong>{progress.completedLessons.length}</strong> lessons finished</span>
              <span><strong>{earnedStars}</strong> stars collected</span>
              <span><strong>{progress.badges.length}</strong> badges earned</span>
            </div>
          </div>
          <ProgressRing value={completion} />
        </section>

        <div className="section-heading">
          <div><span className="eyebrow">Your learning path</span><h2>Explore the units</h2></div>
          <span className="question-total">{questionCounts.total.toLocaleString()} interactive questions</span>
        </div>

        <section className="unit-grid">
          {units.map((unit) => {
            const completeCount = unit.lessons.filter((lesson) => progress.completedLessons.includes(lesson.id)).length;
            const unitStars = unit.lessons.reduce((sum, lesson) => sum + (progress.stars[lesson.id] ?? 0), 0);
            return (
              <article className="unit-card" key={unit.id} style={{ "--unit": unit.color, "--soft": unit.softColor } as React.CSSProperties}>
                <button className="unit-image-button" onClick={() => onUnit(unit)} aria-label={`Open Unit ${unit.number}: ${unit.title}`}>
                  <img src={unit.image} alt={`Girls exploring ${unit.title}`} />
                  <span className="unit-number">Unit {unit.number}</span>
                  <span className="unit-stars">★ {unitStars}/15</span>
                </button>
                <div className="unit-card-copy">
                  <div className="unit-title-row"><span>{unit.icon}</span><div><h3>{unit.title}</h3><p>{unit.tagline}</p></div></div>
                  <div className="card-progress"><span style={{ width: `${completeCount * 20}%` }} /></div>
                  <div className="card-footer"><small>{completeCount}/5 lessons</small><button onClick={() => onUnit(unit)}>Explore <span>→</span></button></div>
                </div>
              </article>
            );
          })}
          <article className="unit-card story-card" style={{ "--unit": "#b25fa8", "--soft": "#fff0fb" } as React.CSSProperties}>
            <button className="unit-image-button" onClick={onStory} aria-label="Open The Hundred Dresses story section">
              <img src={story.image} alt="Girls sharing an apology beside dress drawings" />
              <span className="unit-number">Story Section</span>
              <span className="unit-stars">80 questions</span>
            </button>
            <div className="unit-card-copy">
              <div className="unit-title-row"><span>👗</span><div><h3>{story.title}</h3><p>{story.tagline}</p></div></div>
              <div className="story-pills"><span>Characters</span><span>Events</span><span>Kindness</span></div>
              <div className="card-footer"><small>Separate story journey</small><button onClick={onStory}>Read <span>→</span></button></div>
            </div>
          </article>
        </section>

        <section className="review-strip">
          <div className="review-intro"><span>🏆</span><div><h2>Term Review Challenges</h2><p>Mix vocabulary, grammar, reading, and writing from several units.</p></div></div>
          <button onClick={() => onReview(1)}><span>Review 1</span><strong>Units 1–3</strong><small>30 questions →</small></button>
          <button onClick={() => onReview(2)}><span>Review 2</span><strong>Units 4–5 + Story</strong><small>30 questions →</small></button>
        </section>

        <section className="badge-section">
          <div className="section-heading"><div><span className="eyebrow">Celebrate progress</span><h2>Your badge garden</h2></div></div>
          <div className="badge-grid">
            {badgeCatalog.map((badge) => {
              const earned = progress.badges.includes(badge.name);
              return <article key={badge.name} className={earned ? "badge earned" : "badge"}><span>{badge.icon}</span><div><h3>{badge.name}</h3><p>{earned ? "You earned this badge!" : badge.note}</p></div></article>;
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

function UnitView({ unit, profile, progress, onHome, onLesson, onBank, onTeacher }: {
  unit: Unit;
  profile: StudentProfile;
  progress: Progress;
  onHome: () => void;
  onLesson: (lesson: Lesson) => void;
  onBank: () => void;
  onTeacher: () => void;
}) {
  return (
    <div className="app-shell" style={{ "--unit": unit.color, "--soft": unit.softColor } as React.CSSProperties}>
      <AppHeader profile={profile} progress={progress} onHome={onHome} onTeacher={onTeacher} />
      <main className="inner-main">
        <button className="back-button" onClick={onHome}>← Back to the learning garden</button>
        <section className="unit-hero">
          <img src={unit.image} alt={`Unit ${unit.number}: ${unit.title}`} />
          <div className="unit-hero-shade" />
          <div className="unit-hero-copy"><span className="eyebrow">Unit {unit.number}</span><h1>{unit.title}</h1><p>{unit.tagline}</p><div className="value-row light-values">{unit.values.map((value) => <span key={value}>{value}</span>)}</div></div>
          <div className="unit-hero-stat"><strong>{unit.lessons.filter((lesson) => progress.completedLessons.includes(lesson.id)).length}/5</strong><small>Lessons complete</small></div>
        </section>
        <section className="unit-overview-grid">
          <div className="review-focus"><span className="eyebrow">Unit map</span><h2>What you will learn</h2><div className="focus-list">{unit.reviewFocus.map((item) => <span key={item}>✓ {item}</span>)}</div></div>
          <button className="bank-callout" onClick={onBank}><span className="bank-icon">🎯</span><span><small>Unit challenge</small><strong>50-Question Bank</strong><em>Practise the whole unit with instant feedback.</em></span><b>Start →</b></button>
        </section>
        <div className="section-heading"><div><span className="eyebrow">Five steps to shine</span><h2>Unit lessons</h2></div></div>
        <section className="lesson-grid">
          {unit.lessons.map((lesson) => {
            const stars = progress.stars[lesson.id] ?? 0;
            return (
              <article className="lesson-card" key={lesson.id}>
                <button className="lesson-cover" onClick={() => onLesson(lesson)} style={{ backgroundImage: `linear-gradient(130deg, ${unit.color}e6, ${unit.color}55), url(${unit.image})` }}>
                  <span className="lesson-step">Lesson {lesson.number}</span><span className="lesson-icon">{lesson.icon}</span><span className="lesson-kind">{lesson.kind}</span>
                </button>
                <div className="lesson-card-copy"><small>Pages {lesson.pages}</small><h3>{lesson.title}</h3><p>{lesson.overview}</p><div className="lesson-card-footer"><span className="stars" aria-label={`${stars} out of 3 stars`}>{starsText(stars)}</span><button onClick={() => onLesson(lesson)}>{progress.completedLessons.includes(lesson.id) ? "Review" : "Start"} →</button></div></div>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}

type LessonTab = "plan" | "words" | "language" | "reading" | "writing";

function LessonView({ unit, lesson, profile, progress, onBack, onHome, onQuiz, onTeacher }: {
  unit: Unit;
  lesson: Lesson;
  profile: StudentProfile;
  progress: Progress;
  onBack: () => void;
  onHome: () => void;
  onQuiz: () => void;
  onTeacher: () => void;
}) {
  const [tab, setTab] = useState<LessonTab>("plan");
  const tabs: { id: LessonTab; label: string; icon: string }[] = [
    { id: "plan", label: "Lesson Plan", icon: "🌷" },
    { id: "words", label: "Words & Definitions", icon: "📚" },
    { id: "language", label: "Language Focus", icon: "✨" },
    { id: "reading", label: "Reading & Speaking", icon: "📖" },
    { id: "writing", label: "Writing & Sounds", icon: "✏️" },
  ];
  return (
    <div className="app-shell" style={{ "--unit": unit.color, "--soft": unit.softColor } as React.CSSProperties}>
      <AppHeader profile={profile} progress={progress} onHome={onHome} onTeacher={onTeacher} />
      <main className="inner-main lesson-main">
        <button className="back-button" onClick={onBack}>← Back to Unit {unit.number}</button>
        <section className="lesson-hero" style={{ backgroundImage: `linear-gradient(105deg, ${unit.color}f2 0%, ${unit.color}cc 42%, transparent 78%), url(${unit.image})` }}>
          <div><span className="eyebrow">Unit {unit.number} • Lesson {lesson.number} • Pages {lesson.pages}</span><h1>{lesson.icon} {lesson.title}</h1><p>{lesson.bigQuestion}</p><div className="lesson-hero-meta"><span>{lesson.kind}</span><span>30 quiz questions</span><span>{lesson.definitions.length} key definitions</span></div></div>
          <div className="lesson-score"><small>Your best</small><strong>{progress.bestScores[lesson.id] ?? 0}%</strong><span>{starsText(progress.stars[lesson.id] ?? 0)}</span></div>
        </section>
        <nav className="lesson-tabs" aria-label="Lesson sections">
          {tabs.map((item) => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}><span>{item.icon}</span>{item.label}</button>)}
        </nav>

        <section className="lesson-content">
          {tab === "plan" && <div className="content-stack">
            <article className="big-question-card"><span>Think</span><h2>{lesson.bigQuestion}</h2><p>{lesson.overview}</p></article>
            <div className="two-column-content">
              <article className="content-card"><span className="eyebrow">Learning goals</span><h2>By the end, you can…</h2><ul className="check-list">{lesson.objectives.map((item) => <li key={item}>{item}</li>)}</ul></article>
              <article className="content-card definition-card"><span className="eyebrow">Never miss a meaning</span><h2>Key Definitions</h2><div className="definition-list">{lesson.definitions.map((item) => <div key={item.term}><strong>{item.term}</strong><p>{item.meaning}</p><button onClick={() => speak(`${item.term}. ${item.meaning}`)} aria-label={`Listen to the definition of ${item.term}`}>🔊 Listen</button></div>)}</div></article>
            </div>
            <article className="content-card"><span className="eyebrow">Remember</span><h2>Important lesson facts</h2><div className="fact-grid">{lesson.facts.map((fact) => <span key={fact}>✦ {fact}</span>)}</div></article>
          </div>}

          {tab === "words" && <div className="content-stack">
            <article className="section-intro"><span className="eyebrow">Word garden</span><h2>Vocabulary in simple English</h2><p>Listen, read the meaning, and notice how each word works in a sentence.</p></article>
            <div className="vocabulary-grid">{lesson.vocabulary.map((item, index) => <article key={item.word} className="word-card"><div className="word-number">{String(index + 1).padStart(2, "0")}</div><button className="sound-button" onClick={() => speak(`${item.word}. ${item.definition}. ${item.example}`)} aria-label={`Listen to ${item.word}`}>🔊</button><h3>{item.word}</h3><p>{item.definition}</p><blockquote>{item.example}</blockquote></article>)}</div>
          </div>}

          {tab === "language" && <div className="content-stack">
            <article className="language-focus-card"><div><span className="eyebrow">Language in use</span><h2>{lesson.languageFocus.title}</h2><p>{lesson.languageFocus.explanation}</p></div><div className="example-stack">{lesson.languageFocus.examples.map((example) => <button key={example} onClick={() => speak(example)}><span>{example}</span><b>🔊</b></button>)}</div></article>
            <article className="content-card"><span className="eyebrow">Smart notes</span><h2>Language Notes</h2><ul className="note-list">{lesson.languageNotes.map((note, index) => <li key={note}><span>{index + 1}</span>{note}</li>)}</ul></article>
            <article className="content-card definition-card"><span className="eyebrow">Concept check</span><h2>Definitions to remember</h2><div className="definition-list horizontal">{lesson.definitions.map((item) => <div key={item.term}><strong>{item.term}</strong><p>{item.meaning}</p></div>)}</div></article>
          </div>}

          {tab === "reading" && <div className="content-stack">
            <article className="reading-card"><div className="reading-heading"><div><span className="eyebrow">Read and understand</span><h2>{lesson.reading.title}</h2></div><button onClick={() => speak(lesson.reading.summary)}>🔊 Listen to summary</button></div><p className="reading-summary">{lesson.reading.summary}</p><h3>Key ideas</h3><ol>{lesson.reading.keyIdeas.map((idea) => <li key={idea}>{idea}</li>)}</ol></article>
            <article className="content-card speaking-card"><span className="eyebrow">Speak with confidence</span><h2>Talk with a partner</h2><div>{lesson.speaking.map((prompt) => <button key={prompt} onClick={() => speak(prompt)}><span>💬</span>{prompt}<b>🔊</b></button>)}</div></article>
          </div>}

          {tab === "writing" && <div className="content-stack">
            <div className="two-column-content">
              <article className="content-card"><span className="eyebrow">Writing workshop</span><h2>{lesson.writing.title}</h2><ol className="step-list">{lesson.writing.steps.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol><div className="model-answer"><small>Model</small><p>{lesson.writing.model}</p><button onClick={() => speak(lesson.writing.model)}>🔊 Listen</button></div></article>
              <article className="content-card pronunciation-card"><span className="eyebrow">Sound studio</span><h2>{lesson.pronunciation.title}</h2><p>{lesson.pronunciation.explanation}</p><div>{lesson.pronunciation.examples.map((example) => <button key={example} onClick={() => speak(example)}>{example}<span>🔊</span></button>)}</div></article>
            </div>
          </div>}
        </section>

        <section className="lesson-quiz-callout"><div><span>🎯</span><div><small>Ready to shine?</small><h2>Lesson Challenge</h2><p>30 questions: multiple choice, true or false, matching, ordering, and fill in the blank.</p></div></div><button className="primary-button" onClick={onQuiz}>Start 30 Questions →</button></section>
      </main>
    </div>
  );
}

type StoryTab = "summary" | "characters" | "words" | "events" | "elements" | "values";

function StoryView({ profile, progress, onHome, onQuiz, onBank, onTeacher }: {
  profile: StudentProfile;
  progress: Progress;
  onHome: () => void;
  onQuiz: () => void;
  onBank: () => void;
  onTeacher: () => void;
}) {
  const [tab, setTab] = useState<StoryTab>("summary");
  const storyTabs: { id: StoryTab; label: string; icon: string }[] = [
    { id: "summary", label: "Summary", icon: "📖" }, { id: "characters", label: "Characters", icon: "👧" },
    { id: "words", label: "Story Vocabulary", icon: "📚" }, { id: "events", label: "Events", icon: "🧵" },
    { id: "elements", label: "Story Elements", icon: "🔍" }, { id: "values", label: "Moral Lessons", icon: "💗" },
  ];
  return (
    <div className="app-shell story-shell">
      <AppHeader profile={profile} progress={progress} onHome={onHome} onTeacher={onTeacher} />
      <main className="inner-main">
        <button className="back-button" onClick={onHome}>← Back to the learning garden</button>
        <section className="story-hero"><img src={story.image} alt="The Hundred Dresses story section" /><div className="story-hero-shade" /><div className="story-hero-copy"><span className="eyebrow">Separate Story Section</span><h1>{story.title}</h1><p>{story.tagline}</p><div className="story-pills"><span>Empathy</span><span>Courage</span><span>Kindness</span><span>Speaking up</span></div></div></section>
        <nav className="lesson-tabs story-tabs" aria-label="Story sections">{storyTabs.map((item) => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}><span>{item.icon}</span>{item.label}</button>)}</nav>
        <section className="lesson-content story-content">
          {tab === "summary" && <div className="content-stack"><article className="story-summary-card"><span className="eyebrow">The story in clear English</span><h2>Story Summary</h2><p>{story.summary}</p><button onClick={() => speak(story.summary)}>🔊 Listen to the summary</button></article><article className="content-card definition-card"><span className="eyebrow">Key concepts</span><h2>Story Definitions</h2><div className="definition-list horizontal">{story.definitions.map((item) => <div key={item.term}><strong>{item.term}</strong><p>{item.meaning}</p></div>)}</div></article></div>}
          {tab === "characters" && <div className="character-grid">{story.characters.map((character, index) => <article key={character.name} className="character-card"><span className="character-avatar">{["🎨", "🎀", "💭", "👩‍🏫", "✉️"][index]}</span><small>{character.role}</small><h2>{character.name}</h2><div className="trait-row">{character.traits.map((trait) => <span key={trait}>{trait}</span>)}</div><p>{character.journey}</p><button onClick={() => speak(`${character.name}. ${character.role}. ${character.journey}`)}>🔊 Listen</button></article>)}</div>}
          {tab === "words" && <div className="vocabulary-grid">{story.vocabulary.map((item, index) => <article key={item.word} className="word-card"><div className="word-number">{String(index + 1).padStart(2, "0")}</div><button className="sound-button" onClick={() => speak(`${item.word}. ${item.definition}. ${item.example}`)}>🔊</button><h3>{item.word}</h3><p>{item.definition}</p><blockquote>{item.example}</blockquote></article>)}</div>}
          {tab === "events" && <div className="event-timeline">{story.events.map((event) => <article key={event.step}><span>{event.step}</span><div><small>Story event</small><h2>{event.title}</h2><p>{event.text}</p></div><button onClick={() => speak(`${event.title}. ${event.text}`)}>🔊</button></article>)}</div>}
          {tab === "elements" && <div className="element-grid">{Object.entries(story.elements).map(([name, text]) => <article key={name}><span>{({ setting: "🏫", characters: "👥", problem: "⚡", climax: "🎨", resolution: "✉️", moral: "💗" } as Record<string, string>)[name]}</span><small>Story element</small><h2>{name}</h2><p>{text}</p></article>)}</div>}
          {tab === "values" && <div className="content-stack"><article className="big-question-card story-question"><span>Think kindly</span><h2>What should a student do when she sees bullying?</h2><p>Speak up safely, support the person being hurt, and tell a trusted adult. Silence can allow harm to continue.</p></article><div className="moral-grid">{story.moralLessons.map((lesson, index) => <article key={lesson}><span>{["🌷", "🗣️", "💌", "🎨", "🛡️", "✨"][index]}</span><p>{lesson}</p></article>)}</div></div>}
        </section>
        <section className="story-quiz-row"><div><span>👗</span><div><small>Story quiz</small><h2>30 Questions</h2><p>15 multiple choice + 15 true or false</p></div><button onClick={onQuiz}>Start quiz →</button></div><div><span>🏆</span><div><small>Story question bank</small><h2>50 Questions</h2><p>25 multiple choice + 25 true or false</p></div><button onClick={onBank}>Open bank →</button></div></section>
      </main>
    </div>
  );
}

function QuizRunner({ session, profile, progress, onFinish, onExit }: {
  session: QuizSession;
  profile: StudentProfile;
  progress: Progress;
  onFinish: (score: number, total: number) => void;
  onExit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | boolean | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [availableTokens, setAvailableTokens] = useState<string[]>(session.questions[0]?.tokens ?? []);
  const [orderedTokens, setOrderedTokens] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const question = session.questions[index];

  const ready = question.type === "matching"
    ? question.pairs?.every((pair) => matches[pair.left])
    : question.type === "ordering"
      ? availableTokens.length === 0
      : selected !== null;

  const checkAnswer = () => {
    let isCorrect = false;
    if (question.type === "true-false") isCorrect = selected === question.answerBoolean;
    else if (question.type === "matching") isCorrect = Boolean(question.pairs?.every((pair) => matches[pair.left] === pair.right));
    else if (question.type === "ordering") isCorrect = orderedTokens.join(" ") === question.orderedTokens?.join(" ");
    else isCorrect = selected === question.answer;
    setCorrect(isCorrect); setChecked(true); if (isCorrect) setScore((value) => value + 1);
  };

  const next = () => {
    if (index + 1 >= session.questions.length) {
      setFinished(true);
      onFinish(score + (correct && !checked ? 1 : 0), session.questions.length);
    } else {
      const nextIndex = index + 1;
      setSelected(null);
      setMatches({});
      setAvailableTokens(session.questions[nextIndex]?.tokens ?? []);
      setOrderedTokens([]);
      setChecked(false);
      setCorrect(false);
      setIndex(nextIndex);
    }
  };

  const restartQuiz = () => {
    setIndex(0);
    setSelected(null);
    setMatches({});
    setAvailableTokens(session.questions[0]?.tokens ?? []);
    setOrderedTokens([]);
    setChecked(false);
    setCorrect(false);
    setScore(0);
    setFinished(false);
  };

  const finalScore = Math.round((score / session.questions.length) * 100);
  if (finished) {
    const message = finalScore >= 90 ? "Outstanding work!" : finalScore >= 70 ? "Beautiful progress!" : "Every try helps you grow!";
    return <div className="quiz-shell"><AppHeader profile={profile} progress={progress} onHome={onExit} onTeacher={() => undefined} /><main className="result-main"><section className="result-card"><div className="result-burst">{finalScore >= 80 ? "👑" : "🌷"}</div><span className="eyebrow">Challenge complete</span><h1>{message}</h1><p>You answered <strong>{score}</strong> out of <strong>{session.questions.length}</strong> questions correctly.</p><div className="score-circle"><strong>{finalScore}%</strong><span>{finalScore >= 90 ? "★★★" : finalScore >= 70 ? "★★☆" : "★☆☆"}</span></div><div className="result-actions"><button className="primary-button" onClick={onExit}>Continue Learning →</button><button className="secondary-button" onClick={restartQuiz}>Try Again</button></div></section></main></div>;
  }

  const moveToken = (token: string, tokenIndex: number) => {
    if (checked) return;
    setAvailableTokens((items) => items.filter((_, currentIndex) => currentIndex !== tokenIndex));
    setOrderedTokens((items) => [...items, token]);
  };

  const resetTokens = () => {
    if (checked) return;
    setAvailableTokens(question.tokens ?? []); setOrderedTokens([]);
  };

  return (
    <div className="quiz-shell">
      <AppHeader profile={profile} progress={progress} onHome={onExit} onTeacher={() => undefined} />
      <main className="quiz-main">
        <div className="quiz-topline"><button className="back-button" onClick={onExit}>× Exit challenge</button><div><small>{session.subtitle}</small><h1>{session.title}</h1></div><div className="quiz-counter"><strong>{index + 1}</strong><span>/ {session.questions.length}</span></div></div>
        <div className="quiz-progress"><span style={{ width: `${((index + 1) / session.questions.length) * 100}%` }} /></div>
        <section className="question-card">
          <div className="question-meta"><span>{question.category}</span><span>{question.type.replace("-", " ")}</span><span>✨ {score * 10} XP</span></div>
          <h2>{question.prompt}</h2>

          {(question.type === "mcq" || question.type === "fill") && <div className="option-grid">{question.options?.map((option, optionIndex) => <button key={option} disabled={checked} className={selected === option ? "selected" : ""} onClick={() => setSelected(option)}><span>{String.fromCharCode(65 + optionIndex)}</span>{option}</button>)}</div>}
          {question.type === "true-false" && <div className="true-false-grid"><button disabled={checked} className={selected === true ? "selected true-choice" : "true-choice"} onClick={() => setSelected(true)}><span>✓</span><strong>True</strong></button><button disabled={checked} className={selected === false ? "selected false-choice" : "false-choice"} onClick={() => setSelected(false)}><span>×</span><strong>False</strong></button></div>}
          {question.type === "matching" && <div className="matching-list">{question.pairs?.map((pair) => <label key={pair.left}><strong>{pair.left}</strong><span>→</span><select disabled={checked} value={matches[pair.left] ?? ""} onChange={(event) => setMatches({ ...matches, [pair.left]: event.target.value })}><option value="">Choose the definition</option>{question.options?.map((option) => <option value={option} key={option}>{option}</option>)}</select></label>)}</div>}
          {question.type === "ordering" && <div className="ordering-workspace"><div className="ordered-line">{orderedTokens.length ? orderedTokens.map((token, tokenIndex) => <span key={`${token}-${tokenIndex}`}>{token}</span>) : <em>Your sentence will bloom here…</em>}</div><div className="token-bank">{availableTokens.map((token, tokenIndex) => <button key={`${token}-${tokenIndex}`} onClick={() => moveToken(token, tokenIndex)}>{token}</button>)}</div><button className="reset-order" onClick={resetTokens}>↻ Reset order</button></div>}

          {checked && <div className={correct ? "answer-feedback correct" : "answer-feedback incorrect"}><span>{correct ? "🌟" : "🌱"}</span><div><strong>{correct ? "Brilliant!" : "Not yet — keep growing!"}</strong><p>{question.explanation}</p></div></div>}
          <div className="question-actions">{!checked ? <button className="primary-button" disabled={!ready} onClick={checkAnswer}>Check Answer</button> : <button className="primary-button" onClick={next}>{index + 1 === session.questions.length ? "See My Result" : "Next Question"} →</button>}</div>
        </section>
      </main>
    </div>
  );
}

export default function LearningApp() {
  const [view, setView] = useState<AppView>("welcome");
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [progress, setProgress] = useState<Progress>(blankProgress);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(PROFILE_KEY);
      const savedProgress = localStorage.getItem(PROGRESS_KEY);
      // Loading the browser-only profile after hydration avoids a server/client mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedProfile) setProfile(JSON.parse(savedProfile));
      if (savedProgress) setProgress({ ...blankProgress, ...JSON.parse(savedProgress) });
    } catch { /* Keep the safe blank state. */ }
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, [progress]);

  const begin = (nextProfile: StudentProfile) => { setProfile(nextProfile); setView("dashboard"); };
  const home = () => { setView(profile ? "dashboard" : "welcome"); setSelectedUnit(null); setSelectedLesson(null); };
  const openUnit = (unit: Unit) => { setSelectedUnit(unit); setSelectedLesson(null); setView("unit"); setProgress((value) => ({ ...value, lastUnitId: unit.id })); };
  const openLesson = (lesson: Lesson) => { setSelectedLesson(lesson); setView("lesson"); setProgress((value) => ({ ...value, lastUnitId: selectedUnit?.id, lastLessonId: lesson.id })); };

  const startQuiz = (session: QuizSession) => { setQuizSession({ ...session, questions: shuffle(session.questions, `${session.id}-${Date.now()}`) }); setView("quiz"); };
  const finishQuiz = (score: number, total: number) => {
    if (!quizSession) return;
    const percentage = Math.round((score / total) * 100);
    setProgress((current) => {
      const next: Progress = { ...current, xp: current.xp + score * 10, bestScores: { ...current.bestScores, [quizSession.id]: Math.max(current.bestScores[quizSession.id] ?? 0, percentage) } };
      const badges = new Set(current.badges);
      if (quizSession.lessonId) {
        next.completedLessons = Array.from(new Set([...current.completedLessons, quizSession.lessonId]));
        next.stars = { ...current.stars, [quizSession.lessonId]: Math.max(current.stars[quizSession.lessonId] ?? 0, percentage >= 90 ? 3 : percentage >= 70 ? 2 : 1) };
        badges.add("First Bloom");
        if (percentage >= 80) badges.add("Vocabulary Hero");
        const unit = units.find((item) => item.id === quizSession.unitId);
        if (unit && unit.lessons.every((lesson) => next.completedLessons.includes(lesson.id))) badges.add("Unit Star");
      }
      if (quizSession.badge && percentage >= 80) badges.add(quizSession.badge);
      if (next.xp >= 1000) badges.add("English Champion");
      next.badges = Array.from(badges);
      return next;
    });
  };

  const exitQuiz = () => { const returnView = quizSession?.returnView ?? "dashboard"; setQuizSession(null); setView(returnView); };

  const dashboard = profile && <Dashboard profile={profile} progress={progress} onUnit={openUnit} onStory={() => setView("story")} onTeacher={() => setTeacherOpen(true)} onReview={(part) => {
    const questions = part === 1 ? createTermReview([1, 2, 3], units) : [...createTermReview([4, 5], units), ...createStoryQuiz().slice(0, 10)];
    startQuiz({ id: `review-${part}`, title: `Term Review ${part}`, subtitle: part === 1 ? "Units 1–3" : "Units 4–5 + Story", questions, returnView: "dashboard" });
  }} />;

  return <>
    {view === "welcome" && <WelcomeScreen storedProfile={profile} onStart={begin} onTeacher={() => setTeacherOpen(true)} />}
    {view === "dashboard" && dashboard}
    {view === "unit" && profile && selectedUnit && <UnitView unit={selectedUnit} profile={profile} progress={progress} onHome={home} onTeacher={() => setTeacherOpen(true)} onLesson={openLesson} onBank={() => startQuiz({ id: `${selectedUnit.id}-bank`, title: `${selectedUnit.title} Question Bank`, subtitle: `Unit ${selectedUnit.number} • 50 questions`, questions: createUnitBank(selectedUnit), returnView: "unit", unitId: selectedUnit.id })} />}
    {view === "lesson" && profile && selectedUnit && selectedLesson && <LessonView unit={selectedUnit} lesson={selectedLesson} profile={profile} progress={progress} onBack={() => setView("unit")} onHome={home} onTeacher={() => setTeacherOpen(true)} onQuiz={() => startQuiz({ id: selectedLesson.id, title: `${selectedLesson.title} Challenge`, subtitle: `Unit ${selectedUnit.number} • Lesson ${selectedLesson.number}`, questions: createLessonQuestions(selectedLesson), returnView: "lesson", unitId: selectedUnit.id, lessonId: selectedLesson.id })} />}
    {view === "story" && profile && <StoryView profile={profile} progress={progress} onHome={home} onTeacher={() => setTeacherOpen(true)} onQuiz={() => startQuiz({ id: "story-quiz", title: "The Hundred Dresses Story Quiz", subtitle: "15 multiple choice + 15 true or false", questions: createStoryQuiz(), returnView: "story", badge: "Story Master" })} onBank={() => startQuiz({ id: "story-bank", title: "The Hundred Dresses Question Bank", subtitle: "50 story questions", questions: createStoryBank(), returnView: "story", badge: "Story Master" })} />}
    {view === "quiz" && profile && quizSession && <QuizRunner session={quizSession} profile={profile} progress={progress} onFinish={finishQuiz} onExit={exitQuiz} />}
    {teacherOpen && <TeacherModal onClose={() => setTeacherOpen(false)} />}
  </>;
}
