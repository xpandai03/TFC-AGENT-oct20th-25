import { makeId } from "./utils"

export const INITIAL_CONVERSATIONS = [
  {
    id: "c1",
    title: "Marketing plan for launch",
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    messageCount: 12,
    preview: "Drafting a 4-week GTM plan with channels, KPIs, and budget...",
    pinned: true,
    folder: "Work Projects",
    messages: [
      {
        id: makeId("m"),
        role: "user",
        content: "Draft a 4-week GTM plan.",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: makeId("m"),
        role: "assistant",
        content: "Sure — phases, owners, risks, and KPIs coming up.",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 60000).toISOString(),
      },
    ],
  },
  {
    id: "c2",
    title: "Research: vector databases vs RAG",
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    messageCount: 22,
    preview: "Compare pgvector, Milvus, and Weaviate. Cost + latency notes...",
    pinned: false,
    folder: "Code Reviews",
    messages: [],
  },
  {
    id: "c3",
    title: "Trip checklist – Paris with family",
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    messageCount: 9,
    preview: "Packing list, museum tickets, metro pass options, and cafés...",
    pinned: false,
    folder: "Personal",
    messages: [],
  },
  {
    id: "c4",
    title: "Refactor prompt templates for support",
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    messageCount: 17,
    preview: "Turn macros into reusable templates with variables and guardrails...",
    pinned: true,
    folder: "Work Projects",
    messages: [],
  },
  {
    id: "c5",
    title: "Bug triage notes",
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    messageCount: 6,
    preview: "Priorities: login rate limit, streaming flicker, retry policy...",
    pinned: false,
    folder: "Work Projects",
    messages: [],
  },
  {
    id: "c6",
    title: "AI agent: inbox clean-up flow",
    updatedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    messageCount: 31,
    preview: "Classifier → summarize → bulk actions with undo and logs...",
    pinned: false,
    folder: "Work Projects",
    messages: [],
  },
  {
    id: "c7",
    title: "Weekly review – personal goals",
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    messageCount: 8,
    preview: "Sleep routine, gym cadence, reading list, dopamine detox...",
    pinned: false,
    folder: "Personal",
    messages: [],
  },
  {
    id: "c8",
    title: "Code review: message composer",
    updatedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    messageCount: 14,
    preview: "Edge cases: IME input, paste images, drag-n-drop, retries...",
    pinned: false,
    folder: "Code Reviews",
    messages: [],
  },
  {
    id: "c9",
    title: "LLM evals – rubric + dataset",
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    messageCount: 40,
    preview: "BLEU vs human eval, task matrix, hallucination checks...",
    pinned: false,
    folder: "Work Projects",
    messages: [],
  },
  {
    id: "c10",
    title: "Prompt library – onboarding",
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    messageCount: 11,
    preview: "Create intro prompts for HR, IT, and support with guardrails...",
    pinned: false,
    folder: "Work Projects",
    messages: [],
  },
  {
    id: "c11",
    title: "Grocery budgeting – monthly",
    updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    messageCount: 5,
    preview: "Track cost per meal, reduce waste, and plan bulk buys...",
    pinned: false,
    folder: "Personal",
    messages: [],
  },
]

export const INITIAL_TEMPLATES = [
  // DAWN Prompt Templates
  {
    id: "dawn-clear-framework",
    name: "CLEAR Prompt Framework",
    content: `You are a <role> helping with <business_context>.

C — Clarity
Problem: <one-sentence statement>.
Objective & metric: <target + deadline>.
Scope & boundaries: <what's in/out>.

L — Logic
Steps:
1) <step 1>
2) <step 2>
3) <step 3>
Decision rules: <thresholds/routing>.
Data contracts: <inputs + schemas + auth>.

E — Examples
Positive: <happy-path>.
Edge cases: <case 1>, <case 2>.
Counterexample: <what NOT to do>.

A — Adaptation
Iteration protocol: <how to refine>.
Feedback signals: <metrics, review cadence>.
Change policy: <versioning/rollback>.

R — Results
Acceptance tests: <unit/integration checks>.
Success criteria (KPIs): <thresholds>.
Reporting: <dashboard/alerts/audit>.

Deliverable: <artifact + format>.
Constraints/Guardrails: <compliance, safety, privacy>.`,
    snippet: "Structured prompt framework for creating clear, comprehensive requests...",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "dawn-update-status",
    name: "Update Contact Status",
    content: `Update <CONTACT_FULL_NAME>'s status to <NEW_STATUS>`,
    snippet: "Quick template for updating a client's status in Excel...",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "dawn-add-note",
    name: "Add Note to Contact",
    content: `Add a note to <CONTACT_FULL_NAME>'s record: <NOTE_CONTENT>`,
    snippet: "Quick template for adding notes/documentation to client records...",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "dawn-view-data",
    name: "View Spreadsheet Data",
    content: `Show me the spreadsheet to verify the update`,
    snippet: "Display Excel spreadsheet to verify recent changes...",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "dawn-batch-update",
    name: "Batch Status Update",
    content: `Update these contacts to <NEW_STATUS>:
- <CONTACT_NAME_1>
- <CONTACT_NAME_2>
- <CONTACT_NAME_3>

Reason: <BRIEF_EXPLANATION>`,
    snippet: "Update multiple contacts' statuses at once with reason...",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },

  // General Templates
  {
    id: "t1",
    name: "Bug Report",
    content: `**Bug Report**

**Description:**
Brief description of the issue

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- Browser/OS:
- Version:
- Additional context:`,
    snippet: "Structured bug report template with steps to reproduce...",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "t2",
    name: "Daily Standup",
    content: `**Daily Standup Update**

**Yesterday:**
- Completed task A
- Made progress on task B

**Today:**
- Plan to work on task C
- Continue with task B

**Blockers:**
- None / List any blockers here

**Notes:**
Any additional context or updates`,
    snippet: "Daily standup format with yesterday, today, and blockers...",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "t3",
    name: "Code Review",
    content: `**Code Review Checklist**

**Scope:**
What changes are being reviewed

**Key Areas to Focus:**
- Logic correctness
- Performance implications
- Security considerations
- Test coverage

**Questions:**
- Any specific concerns?
- Performance impact?
- Breaking changes?

**Testing:**
- Unit tests added/updated?
- Manual testing completed?`,
    snippet: "Comprehensive code review checklist and questions...",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "t4",
    name: "Meeting Notes",
    content: `**Meeting Notes - [Meeting Title]**

**Date:** [Date]
**Attendees:** [List attendees]

**Agenda:**
1. Topic 1
2. Topic 2
3. Topic 3

**Key Decisions:**
- Decision 1
- Decision 2

**Action Items:**
- [ ] Task 1 - @person - Due: [date]
- [ ] Task 2 - @person - Due: [date]

**Next Steps:**
What happens next

**Notes:**
Additional context and discussion points`,
    snippet: "Meeting notes template with agenda, decisions, and action items...",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const INITIAL_FOLDERS = [
  { id: "f1", name: "Work Projects" },
  { id: "f2", name: "Personal" },
  { id: "f3", name: "Code Reviews" },
]
