# IELTS Imperia — Question Database & System Guide

> This document is the **single source of truth** for understanding how questions are stored, structured, and used in this project. Any AI or developer working on this project must read this file before touching question-related code.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Question Database Structure](#2-question-database-structure)
3. [Variant Groups](#3-variant-groups)
4. [Exercise JSON Format (All Types)](#4-exercise-json-format-all-types)
5. [Question Types Reference](#5-question-types-reference)
6. [How to Add New Questions (AI Workflow)](#6-how-to-add-new-questions-ai-workflow)
7. [How the Backend Uses Questions](#7-how-the-backend-uses-questions)
8. [Test Creation Logic](#8-test-creation-logic)
9. [Student Test Flow](#9-student-test-flow)
10. [Scoring Rules](#10-scoring-rules)
11. [Schema Reference](#11-schema-reference)
12. [Frontend Question Rendering](#12-frontend-question-rendering)
13. [Common Mistakes to Avoid](#13-common-mistakes-to-avoid)

---

## 1. System Overview

This is an **IELTS practice test platform** for language training centers. Two types of questions exist:

| Subject | Source Book |
|---------|------------|
| **Grammar** | Cambridge Grammar for IELTS |
| **Vocabulary** | Cambridge Vocabulary for IELTS |

**No Writing section exists in this system.** If you see Writing references in old code, they are deprecated and should be removed.

### Core Concepts

- **Variant Group**: A range of units (e.g., units 1–5). Questions belong to one variant group.
- **Exercise**: One complete exercise from the book. It has an instruction, optional passage, and 4–12 questions.
- **Section**: A timed block in a test. One section = one subject type (GRAMMAR or VOCABULARY) + a time limit. A section contains multiple randomly selected exercises.
- **Test**: Created by an admin. Has one or more sections in a defined order. Each section has its own countdown timer.

---

## 2. Question Database Structure

All questions are stored as **JSON files** in the `backend/question_database/` directory.

```
backend/
└── question_database/
    ├── grammar/
    │   ├── 1_5/           ← Units 1–5
    │   │   ├── ex_001.json
    │   │   ├── ex_002.json
    │   │   └── ...
    │   ├── 5_10/          ← Units 5–10
    │   ├── 10_15/
    │   ├── 15_20/
    │   └── 20_25/
    └── vocabulary/
        ├── 1_5/
        ├── 5_10/
        ├── 10_15/
        ├── 15_20/
        └── 20_25/
```

### Rules

- One file = one exercise from the book.
- File naming: `ex_001.json`, `ex_002.json`, ... (zero-padded, sequential).
- Never mix grammar and vocabulary in the same folder.
- Never mix variant groups in the same folder.
- The `id` field inside JSON must be globally unique (see format below).

---

## 3. Variant Groups

| Group Key | Units Covered | Folder Name |
|-----------|--------------|-------------|
| `1_5`     | Units 1–5    | `1_5/`      |
| `5_10`    | Units 5–10   | `5_10/`     |
| `10_15`   | Units 10–15  | `10_15/`    |
| `15_20`   | Units 15–20  | `15_20/`    |
| `20_25`   | Units 20–25  | `20_25/`    |

**Full MOC** is not a separate folder. When admin selects "Full MOC", the system draws from **all variant group folders** combined.

### Multi-Group Selection

Admin can select multiple groups (e.g., `1_5` + `10_15`). The system merges all exercises from all selected groups into one pool and randomly picks the required number of exercises from that combined pool. There is no per-group quota — it is a pure random draw from the merged pool.

---

## 4. Exercise JSON Format (All Types)

Every exercise JSON file follows this base structure:

```json
{
  "id": "grammar_1_5_001",
  "subject": "grammar",
  "variantGroup": "1_5",
  "type": "gap_fill",
  "title": "Exercise 3A",
  "instruction": "Complete the sentences using the correct form of the verb in brackets.",
  "passage": null,
  "questions": []
}
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Globally unique. Format: `{subject}_{variantGroup}_{3-digit-number}`. Example: `grammar_1_5_001` |
| `subject` | string | ✅ | Either `"grammar"` or `"vocabulary"` |
| `variantGroup` | string | ✅ | One of: `"1_5"`, `"5_10"`, `"10_15"`, `"15_20"`, `"20_25"` |
| `type` | string | ✅ | See Question Types section below |
| `title` | string | ✅ | Exercise title as it appears in the book (e.g., `"Exercise 5B"`) |
| `instruction` | string | ✅ | Full instruction text shown above questions |
| `passage` | string or null | ✅ | Reading passage text (left panel). Set `null` if no passage |
| `questions` | array | ✅ | Array of question objects (format varies by type) |

---

## 5. Question Types Reference

### 5.1 `gap_fill` — Fill in the Blank

Student types an answer into an inline text input. The blank appears inside the sentence text as `___`.

**JSON:**
```json
{
  "type": "gap_fill",
  "title": "Exercise 2A",
  "instruction": "Complete the sentences with ONE word.",
  "passage": null,
  "questions": [
    {
      "id": 1,
      "text": "Darwin's finches ___ found on the Galapagos Islands.",
      "answer": "are"
    },
    {
      "id": 2,
      "text": "The birds ___ (vary) in size from 10 to 20 centimetres.",
      "answer": "vary"
    }
  ]
}
```

**Rendering rule**: Replace `___` with `<input>` element inline inside the sentence.

**Grading**: Case-insensitive exact match. `"Are"` = `"are"` ✅. Trim whitespace before comparing.

---

### 5.2 `mcq` — Multiple Choice (A/B/C/D)

Student selects one option from 4 choices.

**JSON:**
```json
{
  "type": "mcq",
  "title": "Exercise 4C",
  "instruction": "Choose the correct answer A, B, C or D.",
  "passage": "Darwin's finches are a group of about fifteen species...",
  "questions": [
    {
      "id": 1,
      "text": "What is the closest known relative of the Galapagos finches?",
      "options": {
        "A": "The true finch",
        "B": "Tiaris obscurus",
        "C": "Cocos finch",
        "D": "Geospizini"
      },
      "answer": "B"
    }
  ]
}
```

**Grading**: Exact match on option key (`"A"`, `"B"`, `"C"`, or `"D"`).

---

### 5.3 `tfng` — True / False / Not Given

Student selects one of three options: TRUE, FALSE, or NOT GIVEN.

**JSON:**
```json
{
  "type": "tfng",
  "title": "Exercise 1A",
  "instruction": "Do the following statements agree with the information in the passage? Write TRUE, FALSE or NOT GIVEN.",
  "passage": "Darwin's finches are a group of about fifteen species...",
  "questions": [
    {
      "id": 1,
      "text": "Darwin's finches are closely related to true finches.",
      "answer": "FALSE"
    },
    {
      "id": 2,
      "text": "The birds were first collected during the second voyage of the Beagle.",
      "answer": "TRUE"
    },
    {
      "id": 3,
      "text": "Darwin studied finches for twenty years after his voyage.",
      "answer": "NOT GIVEN"
    }
  ]
}
```

**Grading**: Exact match (`"TRUE"`, `"FALSE"`, or `"NOT GIVEN"`).

---

### 5.4 `matching` — Matching

Student matches each item on the left to an option on the right using a **dropdown selector**.

**JSON:**
```json
{
  "type": "matching",
  "title": "Exercise 6B",
  "instruction": "Match each word (1–4) with its meaning (A–E). You may use each letter more than once.",
  "passage": null,
  "leftLabel": "Word",
  "rightLabel": "Meaning",
  "options": {
    "A": "relating to two different things existing together",
    "B": "the process of becoming gradually smaller",
    "C": "a group of living things that can breed together",
    "D": "having a wide variety",
    "E": "the ability to adapt to different conditions"
  },
  "questions": [
    { "id": 1, "text": "diverse",    "answer": "D" },
    { "id": 2, "text": "species",    "answer": "C" },
    { "id": 3, "text": "dual",       "answer": "A" },
    { "id": 4, "text": "resilience", "answer": "E" }
  ]
}
```

**Rendering rule**: Show left items as a numbered list. Each row has a dropdown with all options (A, B, C...) listed with their full text.

**Grading**: Exact match on option key.

---

### 5.5 `error_correction` — Find and Correct the Error

Each question contains a sentence with exactly one grammatical error. Student types the **corrected word or phrase**.

**JSON:**
```json
{
  "type": "error_correction",
  "title": "Exercise 8A",
  "instruction": "Each sentence contains one grammatical error. Find the error and write the correct word.",
  "passage": null,
  "questions": [
    {
      "id": 1,
      "text": "Darwin's finches has remarkable diversity in beak form.",
      "errorWord": "has",
      "answer": "have"
    },
    {
      "id": 2,
      "text": "The birds was first collected during the second voyage.",
      "errorWord": "was",
      "answer": "were"
    }
  ]
}
```

**Rendering rule**: Display the full sentence. Highlight/underline the `errorWord`. Show a text input for the student to type the corrected word.

**Grading**: Case-insensitive exact match on the corrected word/phrase.

---

### 5.6 `sentence_transformation` — Sentence Transformation

Student rewrites or completes a sentence so it has the same meaning as the original. Student types into a text input.

**JSON:**
```json
{
  "type": "sentence_transformation",
  "title": "Exercise 9C",
  "instruction": "Complete the second sentence so that it means the same as the first. Use NO MORE THAN THREE WORDS.",
  "passage": null,
  "questions": [
    {
      "id": 1,
      "stem": "Despite being small, the finch survived the drought.",
      "prompt": "Although the finch was small, ___.",
      "answer": "it survived"
    },
    {
      "id": 2,
      "stem": "People say that Darwin visited the islands twice.",
      "prompt": "Darwin ___ visited the islands twice.",
      "answer": "is said to have"
    }
  ]
}
```

**Rendering rule**: Show `stem` (original sentence), then `prompt` with `___` replaced by an inline `<input>`.

**Grading**: Case-insensitive. Accept answer if student input matches `answer` exactly after trimming whitespace. For answers with multiple acceptable forms, use an `answers` array instead of `answer` string:
```json
"answers": ["it survived", "it survived the drought"]
```

---

## 6. How to Add New Questions (AI Workflow)

When the user provides a screenshot of an exercise and its answer key, follow these steps **exactly**:

### Step 1 — Identify the exercise metadata
- **Subject**: Is this from Cambridge Grammar for IELTS → `"grammar"`, or Cambridge Vocabulary for IELTS → `"vocabulary"`?
- **Variant Group**: The user will specify which group (e.g., `"1_5"`). Never guess.
- **Type**: Determine the question type from the visual layout (see Section 5).

### Step 2 — Determine the file name
1. Look in the target folder: `backend/question_database/{subject}/{variantGroup}/`
2. Find the highest existing file number (e.g., `ex_005.json`)
3. New file = `ex_006.json`
4. If folder is empty, start with `ex_001.json`

### Step 3 — Determine the exercise ID
Format: `{subject}_{variantGroup}_{3-digit-number}`
Example: If file is `ex_006.json` in `grammar/1_5/`, then `id = "grammar_1_5_006"`

### Step 4 — Extract all content from the screenshot
- Copy the instruction text **exactly** as written in the book
- Copy the passage text **exactly** (preserve paragraph breaks using `\n\n`)
- Copy each question text **exactly**
- For MCQ: copy all four options exactly
- For matching: copy all left items and all right options exactly

### Step 5 — Extract answers from the answer key screenshot
- Match each question number to its correct answer
- For gap_fill: write the exact expected word/phrase as the answer
- For MCQ/TFNG/matching: write the option key (`"A"`, `"B"`, `"TRUE"`, etc.)
- For error_correction: write both `errorWord` (the wrong word in the sentence) and `answer` (the correction)
- For sentence_transformation: write the expected completion text

### Step 6 — Write the JSON file
Use the Write tool to create the file at the correct path.

### Step 7 — Verify
After writing, read the file back and confirm:
- `id` is unique
- All questions have correct `answer` values
- `type` matches the actual question format
- JSON is valid (no trailing commas, all strings quoted)

---

## 7. How the Backend Uses Questions

### Question Loader (`backend/src/utils/questionLoader.ts`)

Key functions:

```typescript
// Load all exercises from a single variant group folder
loadExercisesFromGroup(subject: 'grammar' | 'vocabulary', group: string): Exercise[]

// Load exercises from multiple variant groups (merged pool)
loadExercisesFromGroups(subject: 'grammar' | 'vocabulary', groups: string[]): Exercise[]

// Randomly select N unique exercises from a pool
selectRandomExercises(pool: Exercise[], count: number): Exercise[]

// Get count of available exercises for validation
countAvailableExercises(subject: string, groups: string[]): number
```

### Selection Logic

```typescript
// When admin creates a test section with:
// subject: 'grammar', variantGroups: ['1_5', '10_15'], numberOfExercises: 3

const pool = loadExercisesFromGroups('grammar', ['1_5', '10_15']);
// pool = all exercises from grammar/1_5/ + grammar/10_15/ combined

const selected = selectRandomExercises(pool, 3);
// selected = 3 unique random exercises from pool
// Each student gets a different random selection
```

### Answer Security

**The backend NEVER sends correct answers to the frontend.**

When building the question payload for the student:
- Remove all `answer` and `answers` fields
- For `error_correction`: also remove `errorWord` — send the sentence with the error word visually highlighted but not labeled
- Store the answer map server-side in memory, keyed by `sessionId`

---

## 8. Test Creation Logic

### Admin Creates a Test

Admin provides:
```typescript
{
  title: "Grammar Test — Week 3",
  maxAttempts: 3,   // how many times a student can re-take this test
  sections: [
    {
      subject: "grammar",
      variantGroups: ["1_5", "5_10"],  // multi-select
      numberOfExercises: 2,
      timeAllocated: 20    // minutes for this entire section
    },
    {
      subject: "vocabulary",
      variantGroups: ["1_5"],
      numberOfExercises: 1,
      timeAllocated: 10
    }
  ]
}
```

Rules:
- Minimum 1 section per test
- No maximum on number of sections
- Same subject can appear multiple times (e.g., 2 grammar sections)
- `numberOfExercises` cannot exceed available exercises in the selected groups (validate server-side)
- `timeAllocated` is in minutes, minimum 1

### PIN Generation
A unique 4-digit PIN is auto-generated for each test session. The admin shares this PIN with students.

---

## 9. Student Test Flow

### Joining a Test
1. Student enters 4-digit PIN
2. Server validates PIN and checks:
   - Test is active
   - Student has not exceeded `maxAttempts` for this test
3. Server randomly selects exercises for each section (unique per student per attempt)
4. Server stores answer maps in memory
5. Student receives section list with exercises (no answers)

### Taking a Test
1. Sections are presented in the order defined by the admin
2. Each section has a countdown timer (`timeAllocated` minutes)
3. Within a section, student sees all exercises as tabs/parts (1-Part, 2-Part, etc.)
4. Student can freely navigate between exercises within the current section
5. Student can freely navigate between questions within an exercise
6. When section timer expires → answers for that section are auto-submitted → next section begins automatically
7. Student cannot return to a previous section once its timer has expired
8. After all sections complete → results are calculated and saved

### Re-taking a Test
- Student enters the same PIN again
- System checks `maxAttempts` — if not exceeded, allows entry
- **Completely new random exercises are selected** (may overlap with previous attempt by chance)
- Previous answers are **not** pre-filled
- Previous attempt results remain visible in "My Results"
- Each attempt is saved as a separate result record

---

## 10. Scoring Rules

### Per Section
- Each question is worth 1 point
- Correct answer = 1 point, wrong or blank = 0 points
- `sectionScore = correctCount / totalQuestions * 100` (percentage)

### Per Test
- `totalScore = totalCorrect / totalQuestions * 100` (percentage, across all sections)

### Answer Matching
All comparisons are **case-insensitive** and **whitespace-trimmed**.

| Type | Match Rule |
|------|-----------|
| `gap_fill` | Exact match after normalization |
| `mcq` | Exact option key match (`"A"`, `"B"`, etc.) |
| `tfng` | Exact match (`"TRUE"`, `"FALSE"`, `"NOT GIVEN"`) |
| `matching` | Exact option key match per question |
| `error_correction` | Exact match on corrected word/phrase |
| `sentence_transformation` | Exact match; if multiple valid answers exist, match against `answers` array |

---

## 11. Schema Reference

### TestSession
```prisma
model TestSession {
  id          String        @id @default(cuid())
  pinCode     String        @unique
  title       String
  maxAttempts Int           @default(1)
  createdBy   String
  isActive    Boolean       @default(true)
  sections    TestSection[]
  results     Result[]
  createdAt   DateTime      @default(now())
}
```

### TestSection
```prisma
model TestSection {
  id                String      @id @default(cuid())
  testSessionId     String
  testSession       TestSession @relation(fields: [testSessionId], references: [id], onDelete: Cascade)
  subject           SectionSubject   // GRAMMAR | VOCABULARY
  variantGroups     String      // JSON array stored as string: '["1_5","10_15"]'
  numberOfExercises Int
  timeAllocated     Int         // minutes
  sectionOrder      Int
}

enum SectionSubject {
  GRAMMAR
  VOCABULARY
}
```

### Result
```prisma
model Result {
  id             String          @id @default(cuid())
  studentId      String
  testSessionId  String
  attemptNumber  Int             @default(1)
  totalScore     Float
  submittedAt    DateTime        @default(now())
  isCompleted    Boolean         @default(false)
  answers        StudentAnswer[]
}
```

---

## 12. Frontend Question Rendering

### Component Map

| Question Type | Component |
|--------------|-----------|
| `gap_fill` | `<GapFillQuestion>` |
| `mcq` | `<McqQuestion>` |
| `tfng` | `<TfngQuestion>` |
| `matching` | `<MatchingQuestion>` |
| `error_correction` | `<ErrorCorrectionQuestion>` |
| `sentence_transformation` | `<SentenceTransformationQuestion>` |

### Layout (matches book design)
```
┌─────────────────────────────────────────────────────┐
│  IELTS Imperia    [Not saved]    ⚙  ▶ Skip   ●58:40 │  ← Header (timer top-right)
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│   PASSAGE / TEXT     │    QUESTIONS                 │
│   (left panel)       │    (right panel)             │
│                      │                              │
│   Scrollable         │    Question 1...             │
│   independently      │    Question 2...             │
│                      │    ...                       │
├──────────────────────┴──────────────────────────────┤
│  < Prev   [1-Part] [2-Part] [3-Part]   Next >       │  ← Exercise navigation
└─────────────────────────────────────────────────────┘
```

- **Left panel**: passage or exercise context (scrollable)
- **Right panel**: questions (scrollable)
- **Bottom**: Part buttons = exercise tabs within current section
- **Timer**: counts down total section time, red when < 60 seconds
- **"Not saved"** badge: shown until student selects/types an answer for current question

---

## 13. Common Mistakes to Avoid

1. **Do NOT add `answer` fields to the client-side payload.** Answers are stored server-side only.
2. **Do NOT create a new folder** for variant groups other than the 5 defined ones. If the user specifies a different group, ask for clarification.
3. **Do NOT skip the `id` uniqueness check.** Duplicate IDs will cause wrong grading.
4. **Do NOT use relative imports** in the question loader — always use `path.join(__dirname, ...)` for JSON loading.
5. **Do NOT hardcode variant group names** in frontend or backend logic — always read them from the section configuration.
6. **Writing section is REMOVED.** Do not re-add it. If you see `SectionType.WRITING` or `WritingQuestion`, remove it.
7. **Do NOT allow students to see previous attempt answers** when re-taking. Each attempt starts completely fresh.
8. **Timer is per SECTION, not per exercise.** One timer covers all exercises in a section.
9. **Full MOC selection** = draw from all 5 variant groups combined. It is not a separate folder.
10. **Passage field is nullable.** Not all exercises have a reading passage. Always check for `null` before rendering the left panel.
