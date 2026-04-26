# UXI 2025/26 — Health Tracker
## User Experience and Design of UI and Services

**Team:**
- Bc. Vsevolod Pokhvalenko, xpokhv00
- Serigne Mansour Diop, xdiopse00
- Arda Firat Gok, xgokard00
- Serkan Altinbas, xaltins00
- Arturs Ungurs, xungura00

---

## Project Goal

People manage their health reactively — they remember a medication only when something goes wrong, they arrive at a doctor's appointment unable to recall what symptoms they had three weeks ago, and they rely on memory for decisions that have real clinical consequences.

**The problem we were solving:**
- Medication adherence is hard, especially when doses have timing rules (routine schedules, cooldown intervals between as-needed doses)
- The moment before a doctor visit is stressful — patients cannot reconstruct their own recent health history from memory
- Caregivers managing health for children or elderly relatives carry a disproportionate cognitive load with no tools designed for them
- Existing health apps are either too clinical (designed for professionals) or too passive (they log data but offer no guidance)

**Our goal was to design an app that:**
- Answers the user's most urgent question — *"can I take this now?"* — in under three seconds, without opening the app
- Turns passive data logging into something useful: a structured summary the user can hand to a doctor
- Stays out of the way — fast, clear, no clutter — because health management is a task, not an experience to linger in

---

## User and Use Cases

**Who the user is**

The user is not a health enthusiast. They are an ordinary person for whom managing medications and appointments is a background obligation, not a hobby. They are often rushed, sometimes anxious, and they interact with the app in moments of need — not at a comfortable desk with full attention.

Three user profiles shaped our design:

**Marta, 42 — working parent and caregiver**
Manages her own blood pressure medication and her son's occasional antihistamine. Her biggest frustration: she cannot remember if she already gave her son his dose. She needs a fast, unambiguous answer, not a log to scroll through.

**Tomáš, 67 — chronic condition, regular specialist visits**
Sees his cardiologist every three months. When asked "what symptoms have you had since our last visit?" he draws a blank. He would benefit enormously from a structured summary — but he is not going to manually compile one.

**Jana, 29 — PRN medication user**
Takes a low-dose medication occasionally, with a strict minimum interval between doses. She currently does mental arithmetic or checks her recent calls to estimate the time. She wants a clear, immediate answer: ready or not.

**How they use the app**

1. **The morning glance** — Without unlocking the phone, the user sees on the home screen widget which medications are due today and what the next scheduled dose is.
2. **The "can I take it?" check** — User opens the as-needed panel (widget or app), sees green = take now, grey with a countdown = wait. Decision made in two seconds.
3. **Logging a symptom** — After a difficult day, the user adds a symptom with a severity score. Takes fifteen seconds. Over time this builds a picture.
4. **Pre-appointment preparation** — A notification arrives the evening before. The user opens the app, reviews the checklist: fasting requirements, documents to bring, questions to ask.
5. **The doctor visit** — User exports a one-page PDF summary. The doctor receives: current medications, recent symptoms with frequency and severity, appointment history. No verbal recall required.

---

## Important and Interesting Parts of the Project

**1. The "can I take it now?" answer is the core interaction**

As-needed medications have a minimum safe interval between doses. This is not a convenience feature — it is a safety concern. Our design gives the answer on one screen without any navigation: a green card with a "TAKE NOW" button means yes; a grey card with a progress bar and countdown means no, and here is exactly how long. The progress bar fills as time passes, so the user has a physical sense of where they are in the waiting period — not just an abstract number.

This interaction was the most important design problem in the project. Getting it right meant the app does something no calendar or reminder can do.

**2. The home screen widget as the primary interface**

We made a deliberate design bet: for daily medication management, the widget *is* the product. Most users should not need to open the app at all on a normal day. The widget shows the most urgent state — what is missed, what is next, what is already done — in a format designed to be read in under five seconds while making coffee.

This forced us to think hard about information hierarchy. Every pixel of the widget had to earn its place. The result was two widget types with distinct visual states: urgent (orange/red), upcoming (blue with a progress bar), and done (green list).

**3. Visual language as a communication tool**

The entire app uses a single, consistent color system to communicate health states:
- **Green** = safe, done, ready, good adherence
- **Blue** = scheduled, upcoming, planned
- **Orange/amber** = waiting, on cooldown, moderate concern
- **Red** = missed, urgent, requires action

This language appears on medication cards, symptom severity indicators, widget states, and the PDF report. Once a user learns it once, they never have to re-learn it in a different part of the app. The design system is not an aesthetic choice — it is a literacy tool.

**4. Routine vs. as-needed as a first-class distinction**

Most medication apps treat all medications the same. We surface the type difference visually from the first glance: routine medications are **blue**, as-needed are **teal**. The interaction model also differs — routine medications have a simple "take" confirmation, while as-needed medications show the cooldown state and safety interval. This distinction matters to users who manage both types simultaneously.

**5. The doctor report as the payoff for consistent logging**

Logging symptoms daily feels pointless in the moment. The doctor report makes the value concrete: everything the user has recorded over 7, 14, or 30 days, structured into a one-page summary they can share in one tap. This is the feature that answers the question *why should I bother logging this?*

---

## Used Technologies and Tools

**Design tools**
- Figma — interface design, component exploration, layout wireframing

**Platform**
- Mobile application (Android)
- Home screen widgets (native Android, displayed without opening the app)

**Key capabilities delivered to the user**
- Offline-first: all data stays on the device, no account required, no internet dependency
- Push notifications: medication reminders, daily morning summary, pre-appointment alerts
- PDF export: structured health report shareable via any app on the device (email, messaging, print)
- Real-time countdown: cooldown timers update live on the widget and in-app

---

## Design Preliminaries

**Starting point: what does the user actually need to know?**

We began by listing the questions a user asks when they interact with health data:
1. Did I take my medication today?
2. Can I take another dose right now?
3. What do I need to do before my appointment?
4. What have my symptoms been like recently?
5. What do I tell my doctor?

Every screen in the app was designed to answer one of these questions as directly as possible. If a screen did not answer one of them, it did not belong.

**Personas**

The three personas (Marta, Tomáš, Jana) described above drove specific design requirements:
- Marta's scenario → multi-person support, fast caregiver overview
- Tomáš's scenario → doctor report, symptom history, appointment preparation
- Jana's scenario → PRN cooldown UI, the widget as primary surface

**Design requirements from user analysis**

| Requirement | Source |
|---|---|
| Answer "can I take it?" without opening the app | Jana, Marta |
| Show preparation checklist before appointment | Tomáš |
| Export health summary for doctor | Tomáš |
| Distinguish data for multiple family members | Marta |
| Work offline, no account | All personas |
| Scannable in under 5 seconds | All personas |

**Visual hierarchy decisions**
- The most urgent item always appears at the top of any list (missed dose before next scheduled, most severe symptom first)
- State is communicated by color before text — the user should know the meaning before they read the label
- Buttons only appear when an action is available — a "TAKE" button on a medication in cooldown would be confusing and potentially dangerous

---

## Testing

**1. First-use navigation test**

Three participants (not team members) were given the app with no explanation and asked to: find out when they could next take a painkiller; log a symptom; find their upcoming appointment.

*Findings:* The PRN cooldown state was understood immediately without instruction — the visual green/grey distinction did the work. The symptom log was found quickly. The appointment preparation checklist was discovered only after prompting — it was not visible enough on the appointment detail screen. → The checklist section was moved up and given a distinct visual container.

**2. Widget comprehension test**

Participants were shown a screenshot of the widget for five seconds, then asked to describe what it told them.

*Findings:* "Something is missed" (ACTION REQUIRED section) was identified by all participants. The NEXT UP countdown was understood by most. The DONE TODAY list was noticed but its significance (adherence confirmation) was not always clear. → Added a subtle green background to DONE TODAY to reinforce the positive meaning.

**3. Information hierarchy review**

The team reviewed every screen asking: what is the first thing the user needs to see? Is it actually the first thing visible?

*Findings:* On the medications list, as-needed medications in cooldown were appearing before ready medications because of sort order. A user looking for something they can take had to scan past unavailable options. → Sort order changed: READY always before ON COOLDOWN.

**4. Report usefulness review**

The doctor report draft was shown to one team member's family doctor (informally). Feedback: the medication section was useful; the symptom section needed clearer time anchoring ("since when?").

*Finding:* Report window selector (7 / 14 / 30 days / all) was added to the report, and the time range is now stated explicitly at the top of the exported PDF.

---

## Most Important Achieved Results

**The as-needed medication panel**

This is the interaction we are most proud of. The design answers a binary question — ready or not — with an immediate visual state, no reading required. When a medication is available, the card is white with a green "TAKE NOW" button. When it is in cooldown, the card is muted, shows a progress bar filling toward availability, and displays the exact remaining time. When multiple as-needed medications exist, the panel pages through them smoothly. The design is calm when nothing is urgent and attention-demanding when something needs action.

**The home screen widget**

Two states the user sees every day:
- *Morning:* NEXT UP section shows the upcoming dose with a time-to-dose progress bar filling as the scheduled time approaches.
- *Missed:* ACTION REQUIRED section appears in a warm red-orange, with the medication name and a rescue button. It cannot be missed.

The widget uses the same color vocabulary as the app, so there is no translation needed between the two surfaces.

**Consistent severity language**

Symptoms are logged with a 1–10 severity. That number, and its color meaning, appears identically on the logging screen, the symptom card, the detail view, the history screen, and the PDF report. Green = mild (1–3), amber = moderate (4–6), red = severe (7–10). A user who has used the app for one day understands this language everywhere it appears.

**The doctor report**

A structured, clean PDF generated from the user's logged data. Designed to be handed directly to a physician without explanation. It contains: the report period, current medications with dosage and instructions, recent symptoms with frequency and severity, appointment history, and routine adherence percentage. The export takes one tap. No account, no upload, no internet.

**Multi-person support done quietly**

Caregivers can assign any medication, symptom, or appointment to a named family member. The interface does not add complexity for users who only track themselves — the feature is invisible until needed. When filtering by person, the entire app (history, report, widgets) reflects only that person's data.

---

## Distribution of the Work in the Team

- **Vsevolod Pokhvalenko** — overall UI architecture and design system, medication tracking feature (both types), home screen widgets design and integration, PDF report design, notification design, visual consistency across all screens
- **Serigne Mansour Diop** — symptom tracking UI, symptom detail and trend visualization, category system
- **Arda Firat Gok** — appointment management screens, preparation checklist design, appointment notification design
- **Serkan Altinbas** — doctor report screen UI, history screen, report data presentation
- **Arturs Ungurs** — onboarding flow, home screen layout, medication card component, testing coordination

---

## What Was the Biggest Challenge

**Designing the widget under severe constraints.**

Home screen widgets on Android cannot scroll freely, cannot use arbitrary layouts, and update only at intervals. Designing a useful, readable interface within these constraints was the hardest design problem we faced. Every piece of information had to be carefully chosen because space is fixed and nothing can be hidden behind a tap.

The bigger challenge was making the widget feel like a natural extension of the app — same language, same hierarchy, same meaning — rather than a simplified afterthought. When a user sees green in the widget and green in the app, they should mean the same thing instinctively.

**Balancing information density with clarity.**

Health data is inherently complex. The temptation was to show everything — all medications, all symptoms, full history, every detail. The real design work was deciding what *not* to show, and trusting that showing less, more clearly, serves the user better than showing more, confusingly.

---

## Experience Gained From the Project

**About UI design:**
- The most important design question is not "how should this look?" but "what does the user need to know right now?" Everything else follows from that.
- Color is communication, not decoration. A consistent color system across an entire product builds user confidence — they learn the language once and it works everywhere.
- Constraints produce better design. The widget's severe space limitations forced clarity that improved the whole app's visual language.

**About users:**
- Users do not read. They scan. If the meaning is not communicated by shape, color, or position before the user reads a word, it will be missed.
- The user's mental model of their own health is surprisingly fragile. Small design decisions — like surfacing "you missed a dose" visually rather than burying it in a list — have real behavioral impact.

**About working as a team on a design project:**
- Agreeing on visual language early saves enormous time. When one person uses green for "active" and another uses green for "completed," the product becomes incoherent.
- Design decisions need owners. Too many opinions without resolution leads to inconsistency, not quality.

---

## What We Have Discovered

- **The widget is more useful than the app for daily use.** Once it was working, most team members stopped opening the app for routine checks. This was not what we expected, and it reframed how we thought about what the product actually is.
- **Utility is invisible when it works.** The best UI moment in the project is one users never comment on: the green/grey ready-or-not state. No one says "I love how you designed that" — they just make the right decision without thinking. That is the goal.
- **Logging is only meaningful if the data is used.** Symptom logging felt pointless to test users until we showed them the doctor report. The connection between daily input and useful output had to be made visible. Without the report, the app is just a diary. With it, it is a health tool.
- **Simplicity is a product of removing things, not adding them.** Every version of every screen we designed started with too much. The good version came from asking "what can we remove?" until removing anything more would break the usefulness.
- **Health apps require a different kind of trust.** Users are more cautious about health data than social data. The decision to keep all data on-device, with no account or server, was received positively even by test users who did not ask about it. The absence of a login screen communicates safety.

---

## Autoevaluation

**Problem Selection: 80%**
The problem is real, affects most people at some point, and has clear design opportunity — most existing solutions are either too clinical or too passive. The multi-person / caregiver scope was slightly too broad and diluted focus.

**Problem Analysis: 65%**
Personas and use cases were well-defined and genuinely drove design decisions. External user research was limited — most testing was done within the team. A structured study with real users outside the project would have revealed more.

**Testing: 55%**
Tests were task-based and produced actionable findings. The sample was small and not fully independent. No quantitative usability metrics were collected. The informal doctor review of the report was valuable but not systematic.

**UI Design: 80%**
The design system is coherent and well-applied. The widget UI and as-needed panel are strong. Some secondary screens have minor inconsistencies. The onboarding experience could be more polished.

**Use of Resources: 70%**
We built on established design patterns for mobile health interfaces and did not reinvent navigation or interaction conventions. The color and severity language draws on familiar traffic-light conventions that users already understand.

**Team Cooperation: 70%**
The team maintained a shared product vision throughout. Some design inconsistencies crept in from parallel work without sufficient review. Regular design reviews caught most of these but not all.

**Overall Impression: 78%**
The product solves a real problem with a coherent design language and a standout feature (the widget + PRN cooldown system). The doctor report creates genuine utility from otherwise passive data. With more time, external usability testing and a more refined onboarding would significantly improve the result.

---

## Recommendation for Assigning Future Projects

- **Preserve** the freedom to define your own problem — projects with real personal motivation produce meaningfully better design.
- **Stress** the difference between features and design. Adding more features is not progress. Better answers to user needs is progress.
- **Recommend** requiring at least two rounds of external user testing with written findings — it produces the biggest design improvements per hour invested.
- **Warn** that platform-native components (widgets, notifications, system share sheets) behave very differently from in-app UI and require separate design thinking.

---

## Recommendation for Future Students

- **Pick a problem you have personally experienced.** You will make better design decisions when you are also the user. You will also sustain motivation through the difficult parts.
- **Start with the user's question, not the feature list.** Write down the three most important questions your user needs answered. Design backwards from those. Do not design a screen and then figure out what it answers.
- **Test early with people outside your team.** Builders are blind to their own product's confusion. Someone seeing it for the first time in thirty seconds will find what you missed in thirty hours.
- **Agree on a color and spacing system before building anything.** Inconsistency is the most visible sign of poor design coordination, and it is the hardest thing to fix at the end.
- **Less is more, and then less again.** Every first version of a screen has too much on it. The best design work is removal.
- **Widgets and notifications are separate design problems** from the app itself. Budget time specifically for them — they have unique constraints and are often the most-used surface.
