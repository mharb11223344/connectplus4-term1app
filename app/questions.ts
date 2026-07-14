import type { Lesson, Unit, VocabularyItem } from "./curriculum";
import { story } from "./curriculum";

export type QuestionType = "mcq" | "true-false" | "matching" | "ordering" | "fill";

export type Question = {
  id: string;
  type: QuestionType;
  category: "Vocabulary" | "Definitions" | "Grammar" | "Reading" | "Writing" | "Pronunciation" | "Story";
  prompt: string;
  options?: string[];
  answer?: string;
  answerBoolean?: boolean;
  pairs?: { left: string; right: string }[];
  tokens?: string[];
  orderedTokens?: string[];
  explanation: string;
};

const hash = (value: string) =>
  value.split("").reduce((total, letter) => (total * 31 + letter.charCodeAt(0)) >>> 0, 2166136261);

export const shuffle = <T,>(items: T[], seed: string): T[] => {
  const result = [...items];
  let state = hash(seed) || 1;
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

const cleanTokens = (sentence: string) =>
  sentence
    .replace(/[.,!?;:]/g, "")
    .split(/\s+/)
    .filter(Boolean);

const definitionOptions = (items: VocabularyItem[], current: number, seed: string) => {
  const correct = items[current % items.length].definition;
  const distractors = items
    .filter((_, index) => index !== current % items.length)
    .map((item) => item.definition)
    .slice(0, 6);
  return shuffle([correct, ...distractors].slice(0, 4), seed);
};

export const createLessonQuestions = (lesson: Lesson): Question[] => {
  const questions: Question[] = [];

  for (let index = 0; index < 8; index += 1) {
    const item = lesson.vocabulary[index % lesson.vocabulary.length];
    questions.push({
      id: `${lesson.id}-mcq-${index + 1}`,
      type: "mcq",
      category: index < 6 ? "Vocabulary" : "Definitions",
      prompt: `Which definition matches “${item.word}”?`,
      options: definitionOptions(lesson.vocabulary, index, `${lesson.id}-mcq-${index}`),
      answer: item.definition,
      explanation: `${item.word} means ${item.definition}. Example: ${item.example}`,
    });
  }

  for (let index = 0; index < 6; index += 1) {
    const item = lesson.vocabulary[index % lesson.vocabulary.length];
    const isTrue = index % 2 === 0;
    const displayedDefinition = isTrue
      ? item.definition
      : lesson.vocabulary[(index + 1) % lesson.vocabulary.length].definition;
    questions.push({
      id: `${lesson.id}-tf-${index + 1}`,
      type: "true-false",
      category: index < 4 ? "Vocabulary" : "Reading",
      prompt: `True or False: “${item.word}” means ${displayedDefinition}.`,
      answerBoolean: isTrue,
      explanation: `${item.word} means ${item.definition}.`,
    });
  }

  for (let index = 0; index < 6; index += 1) {
    const pairs = Array.from({ length: 3 }, (_, offset) => {
      const item = lesson.vocabulary[(index + offset) % lesson.vocabulary.length];
      return { left: item.word, right: item.definition };
    });
    questions.push({
      id: `${lesson.id}-match-${index + 1}`,
      type: "matching",
      category: "Vocabulary",
      prompt: "Match each word to its correct definition.",
      pairs,
      options: shuffle(pairs.map((pair) => pair.right), `${lesson.id}-match-${index}`),
      explanation: pairs.map((pair) => `${pair.left}: ${pair.right}`).join(" • "),
    });
  }

  for (let index = 0; index < 6; index += 1) {
    const sentence = lesson.vocabulary[index % lesson.vocabulary.length].example;
    const orderedTokens = cleanTokens(sentence);
    questions.push({
      id: `${lesson.id}-order-${index + 1}`,
      type: "ordering",
      category: index < 3 ? "Grammar" : "Writing",
      prompt: "Put the words in the correct order.",
      tokens: shuffle(orderedTokens, `${lesson.id}-order-${index}`),
      orderedTokens,
      explanation: sentence,
    });
  }

  for (let index = 0; index < 4; index += 1) {
    const item = lesson.vocabulary[(index + 4) % lesson.vocabulary.length];
    const blank = item.example.replace(new RegExp(item.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "_____");
    questions.push({
      id: `${lesson.id}-fill-${index + 1}`,
      type: "fill",
      category: index < 2 ? "Vocabulary" : "Grammar",
      prompt: `Complete the sentence: ${blank}`,
      options: shuffle(
        [
          item.word,
          ...lesson.vocabulary
            .filter((candidate) => candidate.word !== item.word)
            .slice(0, 3)
            .map((candidate) => candidate.word),
        ],
        `${lesson.id}-fill-${index}`,
      ),
      answer: item.word,
      explanation: item.example,
    });
  }

  return questions;
};

export const createUnitBank = (unit: Unit): Question[] => {
  const selectedIndexes = [0, 2, 4, 6, 8, 10, 14, 20, 24, 28];
  return unit.lessons.flatMap((lesson) =>
    selectedIndexes.map((questionIndex, localIndex) => {
      const source = createLessonQuestions(lesson)[questionIndex];
      return {
        ...source,
        id: `${unit.id}-bank-${lesson.number}-${localIndex + 1}`,
      };
    }),
  );
};

const storyFalseFacts = [
  "Wanda wears a different expensive dress every day.",
  "Maddie begins the teasing in the playground.",
  "Miss Mason cancels the drawing competition.",
  "Peggy wins with one hundred dress drawings.",
  "Wanda is present when her medal is announced.",
  "Wanda’s mother writes the family letter to the class.",
  "Peggy and Maddie send a short text message instead of a letter.",
  "Wanda refuses to answer the apology.",
  "The story says popularity matters more than kindness.",
  "Maddie feels proud that she stayed silent.",
  "The drawings are hidden inside the school closet.",
  "Wanda moves because she dislikes drawing.",
  "Miss Mason is one of the students in the competition.",
  "Peggy never understands that Wanda was hurt.",
  "The story ends with the girls continuing the bullying.",
];

const storyEventQuestions = [
  { prompt: "Who creates one hundred dress drawings?", answer: "Wanda", options: ["Wanda", "Peggy", "Maddie", "Miss Mason"], explanation: "Wanda creates the dress drawings and wins the competition." },
  { prompt: "Who worries about the teasing but stays quiet?", answer: "Maddie", options: ["Maddie", "Wanda", "Miss Mason", "Wanda’s father"], explanation: "Maddie feels uncomfortable but is afraid to speak up." },
  { prompt: "Who announces the drawing competition?", answer: "Miss Mason", options: ["Miss Mason", "Peggy", "Wanda", "Maddie"], explanation: "Miss Mason is the class teacher and announces the competition." },
  { prompt: "Why does Wanda’s family move?", answer: "To escape unkind treatment", options: ["To escape unkind treatment", "To enter a new competition", "To buy more dresses", "To visit a museum"], explanation: "Wanda’s father explains that the family moves to avoid unkind treatment." },
  { prompt: "What do Peggy and Maddie send to Wanda?", answer: "An apology letter", options: ["An apology letter", "A medal", "A new blue dress", "A drawing prize"], explanation: "They write a letter that praises Wanda’s art and apologizes." },
  { prompt: "What does Wanda allow the girls to keep?", answer: "Her drawings", options: ["Her drawings", "Her medal", "Her closet", "Her schoolbag"], explanation: "Wanda responds kindly and offers her drawings." },
  { prompt: "Where do the repeated questions happen?", answer: "In the playground", options: ["In the playground", "At the museum", "At Wanda’s new school", "On a bus"], explanation: "The teasing is described in the school playground." },
  { prompt: "What is the climax of the story?", answer: "The drawings are displayed and Wanda wins", options: ["The drawings are displayed and Wanda wins", "Peggy buys a dress", "Maddie leaves school", "The playground closes"], explanation: "The display reveals Wanda’s talent just as the class realizes she is gone." },
  { prompt: "Which action is the safest way to respond to bullying?", answer: "Speak up and tell a trusted adult", options: ["Speak up and tell a trusted adult", "Laugh with the group", "Spread the story online", "Ignore every situation"], explanation: "Speaking up safely and involving a trusted adult can help stop harm." },
];

export const createStoryQuiz = (): Question[] => {
  const mcq: Question[] = Array.from({ length: 15 }, (_, index) => {
    if (index < 9) {
      const source = storyEventQuestions[index];
      return {
        id: `story-quiz-mcq-${index + 1}`,
        type: "mcq",
        category: "Story",
        prompt: source.prompt,
        options: shuffle(source.options, `story-quiz-event-${index}`),
        answer: source.answer,
        explanation: source.explanation,
      };
    }
    const item = story.vocabulary[(index - 9) % story.vocabulary.length];
    const options = shuffle(
      [item.definition, ...story.vocabulary.filter((candidate) => candidate.word !== item.word).slice(0, 3).map((candidate) => candidate.definition)],
      `story-quiz-vocab-${index}`,
    );
    return {
      id: `story-quiz-mcq-${index + 1}`,
      type: "mcq",
      category: "Vocabulary",
      prompt: `Which definition matches “${item.word}”?`,
      options,
      answer: item.definition,
      explanation: `${item.word} means ${item.definition}.`,
    };
  });

  const trueFalse: Question[] = Array.from({ length: 15 }, (_, index) => {
    const isTrue = index % 2 === 0;
    const prompt = isTrue ? story.facts[index % story.facts.length] : storyFalseFacts[index % storyFalseFacts.length];
    return {
      id: `story-quiz-tf-${index + 1}`,
      type: "true-false",
      category: "Story",
      prompt: `True or False: ${prompt}`,
      answerBoolean: isTrue,
      explanation: isTrue ? prompt : story.facts[index % story.facts.length],
    };
  });

  return [...mcq, ...trueFalse];
};

export const createStoryBank = (): Question[] => {
  const vocabularyQuestions: Question[] = story.vocabulary.map((item, index) => ({
    id: `story-bank-vocab-${index + 1}`,
    type: "mcq",
    category: "Vocabulary",
    prompt: `What does “${item.word}” mean?`,
    options: shuffle(
      [item.definition, ...story.vocabulary.filter((candidate) => candidate.word !== item.word).slice((index + 1) % 5, ((index + 1) % 5) + 3).map((candidate) => candidate.definition)],
      `story-bank-vocab-${index}`,
    ),
    answer: item.definition,
    explanation: `${item.word} means ${item.definition}. Example: ${item.example}`,
  }));

  const mcq = [
    ...vocabularyQuestions,
    ...storyEventQuestions.map((source, index): Question => ({
      id: `story-bank-event-${index + 1}`,
      type: "mcq",
      category: "Story",
      prompt: source.prompt,
      options: shuffle(source.options, `story-bank-event-${index}`),
      answer: source.answer,
      explanation: source.explanation,
    })),
  ].slice(0, 25);

  const trueStatements = story.facts.slice(0, 13);
  const falseStatements = storyFalseFacts.slice(0, 12);
  const tf = [...trueStatements.map((text) => ({ text, answer: true })), ...falseStatements.map((text) => ({ text, answer: false }))].map(
    (item, index): Question => ({
      id: `story-bank-tf-${index + 1}`,
      type: "true-false",
      category: "Story",
      prompt: `True or False: ${item.text}`,
      answerBoolean: item.answer,
      explanation: item.answer ? item.text : story.facts[index % story.facts.length],
    }),
  );

  return [...mcq, ...tf];
};

export const createTermReview = (unitNumbers: number[], units: Unit[]): Question[] => {
  const selected = units.filter((unit) => unitNumbers.includes(unit.number));
  return selected.flatMap((unit) => createUnitBank(unit).slice(0, 10));
};

export const questionCounts = {
  lesson: 30,
  unitBank: 50,
  storyQuiz: 30,
  storyBank: 50,
  total: 1080,
};

