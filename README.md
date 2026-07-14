# Mona’s English Garden — Primary 4

An English-only interactive learning application for the Egyptian Primary 4 English curriculum, Term 1 (2026/2027), created for Mrs. Mona Harb.

## What is included

- Five curriculum units with five lessons each.
- A separate **The Hundred Dresses** story section.
- Simple-English vocabulary meanings, examples, and audio playback.
- A dedicated **Key Definitions** section in every lesson plan.
- Grammar, language notes, reading summaries, speaking prompts, writing workshops, and pronunciation practice.
- 30 interactive questions for every lesson.
- A 50-question bank for every unit.
- A 30-question story quiz and a 50-question story bank.
- 1,080 questions in total.
- XP, stars, badges, saved progress, term reviews, and encouraging feedback.
- A responsive feminine visual system designed for Primary 4 schoolgirls.
- Installable PWA support and device-local progress storage.

## Run the project locally

Requirements: Node.js 22+ and pnpm.

```bash
pnpm install
pnpm dev
```

## Create the GitHub Pages version

The source application is built with React and Next.js. The static `index.html` is generated during the export process.

```bash
BUILD_TARGET=github PAGES_BASE_PATH=/your-repository-name pnpm exec next build
```

The complete static website will be created in:

```text
out/index.html
```

The repository includes `.github/workflows/deploy-pages.yml`. After the project is pushed to the `main` branch and GitHub Pages is set to use GitHub Actions, every push builds and publishes the website automatically.

### Quick GitHub upload

1. Create a GitHub repository (the recommended name is `mona-english-garden-primary-4`).
2. Upload all project files, including the hidden `.github` folder.
3. Keep the default branch named `main`.
4. Choose **GitHub Actions** as the GitHub Pages source.
5. The included workflow installs, builds, and publishes the application automatically. It calculates the correct repository path, so images and interactive features work on GitHub Pages.

## Progress and privacy

Student profile information and learning progress are saved only in the browser using local storage. The application does not require an account, database, analytics service, or paid API.

## Teacher

Mrs. Mona Harb is an expert English language teacher. She holds a Bachelor’s degree from the Faculty of Al-Alsun, Ain Shams University, with Spanish as her first language and English as her second language. She has extensive experience in teaching English and creating clear, engaging learning experiences.
