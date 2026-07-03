# Kenyan Wealth Coach Dashboard

_Started 2026-06-21 18:22 UTC_

---

## User

<system-info comment="Only acknowledge these if relevant">
Project title is now "Untitled"
The project currently has no files except possibly dotfiles — a `list_files` on the project root would return nothing else.
Current date is now June 21, 2026
</system-info>

<default aesthetic_system_instructions>
The user has not attached a design system. If they have ALSO not attached references or art direction, and the project is empty, you must ASK the user what visual aesthetic they want. Use the questions_v2 tool to ask about preferred vibe, audience, colors, type, mood, etc. Do NOT just pick your own visual aesthetic without getting the user's aesthetic input -- this is how you get slop!

Once answered, use this guidance when creating designs:
- Choose a type pairing from web-safe set or Google Fonts. Helvetica is a good choice. Avoid hard-to-read or overly stylized fonts. Use 1-3 fonts only.
- Foreground and background: choose a color tone (warm, cool, neutral, something in-between). Use subtly-toned whites and blacks; avoid saturations above 0.02 for whites.
- Accents: choose 0-2 additional accent colors using oklch. All accents should share same chroma and lightness; vary hue.
- NEVER write out an SVG yourself that's more complicated than a square, circle, diamond, etc.
- For imagery, never hand-draw SVGs; use subtly-striped SVG placeholders instead with monospace explainers for what should be dropped there (e.g. “product shot”)

CRITICAL: ignore default aesthetic entirely if given other aesthetic instructions like reference images, design systems or guidance, or if there are files in the project already.
</default aesthetic_system_instructions>

<pasted_text name="Pasted text (685 lines)">
Below is a prompt you can give directly to Claude. It is written as if Claude is acting as a senior product designer, UX architect, and full-stack engineer.

---

# PROMPT FOR CLAUDE

You are a world-class combination of:

* Product designer (Apple + Stripe + Revolut quality)
* UX researcher
* Data visualization expert
* Senior full-stack engineer
* Motion designer
* Fintech analyst

Build a highly interactive, premium, futuristic personal finance intelligence web app called:

# MoneyDNA AI

An AI-powered financial intelligence platform that transforms raw bank statements and MPESA statements into beautiful, animated, insightful financial stories.

The experience should feel like a combination of:

* Apple Health
* Revolut
* Arc Browser
* Stripe Dashboard
* Bloomberg Terminal
* Notion AI
* Tony Stark's Jarvis

The UI must look expensive, modern, luxurious, futuristic and incredibly polished.

---

# PRIMARY PURPOSE

Allow users to upload:

### Kenyan Sources

* MPESA Statements (PDF)
* Bank statements (PDF, CSV, Excel)
* SACCO statements
* Credit card statements

Then automatically:

1. Extract transactions.
2. Categorize spending intelligently.
3. Detect patterns.
4. Show animated insights.
5. Give recommendations.
6. Forecast future cashflow.
7. Generate financial health scores.
8. Explain money habits.

Everything should be visually beautiful.

---

# DESIGN SYSTEM

Theme:

Glassmorphism + Dark Mode + Neon accents.

Colors:

Background:

#080B14

Cards:

#111827

Accent colors:

Electric Blue
Emerald Green
Purple
Orange
Red

Animations:

* Smooth transitions
* Animated charts
* Particle effects
* Floating cards
* Motion blur
* Live counters
* Number rollups
* Expanding widgets

Must feel premium like:

Tesla + Apple + Bloomberg + Iron Man HUD.

---

# LANDING PAGE

Animated hero section:

"Your money tells a story. MoneyDNA AI reveals it."

Features:

* Upload MPESA statement
* Upload bank statement
* AI-powered insights
* Financial health score
* Spending behavior analysis
* Future cashflow prediction

Background:

Floating particles and glowing financial charts.

---

# DASHBOARD

Large animated cards:

### Total Income

Rolling numbers.

### Total Expenses

Animated count-up.

### Savings Rate

Circular progress gauge.

### Financial Health Score

0-100 score with color gradients.

### Net Worth

Live animated display.

### Burn Rate

Daily spending rate.

### Monthly Cash Flow

Income vs expenses.

---

# AI CATEGORIZATION ENGINE

Automatically classify transactions into:

Food
Transport
Rent
Shopping
Entertainment
Bills
Utilities
Fuel
School Fees
Medical
Insurance
Loans
Savings
Investments
Salary
Business Income
Transfers
Restaurants
Subscriptions
Travel
Miscellaneous

Allow users to:

* Edit categories
* Create custom categories
* Train the AI

---

# BEAUTIFUL ANALYTICS

## Spending Sunburst Chart

Animated radial breakdown.

## Sankey Flow Diagram

Show where money flows.

Income
↓

Categories
↓

Subcategories

Animated flows.

---

## Spending Galaxy

Represent each transaction as stars.

Large stars = large transactions.

Clusters reveal spending habits.

---

## Calendar Heatmap

Daily spending intensity.

Similar to GitHub contribution graph.

---

## Timeline Replay

Play button.

Watch the month unfold day by day.

See money entering and leaving.

Speed controls:

1x
2x
5x

---

## Animated Pie Charts

Morphing segments.

Hover interactions.

---

## Income vs Expense River Chart

Animated stream visualization.

---

## Spending DNA

Create a unique fingerprint of spending behavior.

Traits:

Impulse Buyer
Saver
Investor
Balanced
Luxury Lifestyle
Family Oriented
Business Focused

AI explains why.

---

# AI INSIGHTS ENGINE

Generate human-readable observations.

Examples:

"You spend 27% more on dining than the average household."

"Transport costs increased by 18% compared to last month."

"Your weekend spending accounts for 42% of total expenses."

"You are most likely to overspend between 7PM and 10PM."

"Recurring subscriptions are costing KES 8,250 monthly."

"Coffee purchases alone amount to KES 5,400 monthly."

---

# SUBSCRIPTION DETECTOR

Detect:

Netflix
Spotify
Showmax
Apple
Google
DSTV
Gym
Internet
Insurance

Show:

Monthly cost
Annual cost

Allow cancellation suggestions.

---

# MPESA SPECIFIC ANALYSIS

Separate:

Paybill
Till Numbers
Send Money
Withdrawals
Fuliza
M-Shwari
Loans
Airtime
Bundles
Bank Transfers

Identify:

Most paid businesses.

Create:

Top 20 merchants leaderboard.

---

# CASH FLOW FORECASTING

Predict:

7 days
30 days
90 days

Show:

Projected balance.

Confidence intervals.

Expected shortfalls.

Recurring bills.

Upcoming expenses.

Animated forecasting graphs.

---

# GOALS ENGINE

Create goals:

Emergency Fund
House
Car
Vacation
School Fees
Business Capital

Track progress with animated progress bars.

---

# FINANCIAL HEALTH SCORE

Score components:

Savings behavior
Income consistency
Debt ratio
Spending volatility
Cashflow stability
Recurring expenses
Emergency fund

Give:

Score 0-100.

With explanations.

---

# WEALTH COACH AI

ChatGPT-like assistant.

Questions:

"Where is my money going?"

"How can I save KES 10,000 monthly?"

"Am I overspending?"

"What will happen if I continue this lifestyle?"

"Which expenses should I cut?"

Use RAG with user's transaction history.

---

# ANOMALY DETECTION

Detect:

Unusual spending.

Duplicate charges.

Unexpected withdrawals.

Fraud risk.

Large transactions.

Color alerts:

Yellow
Orange
Red

---

# COMPARISON ENGINE

Compare:

This month vs previous month.

Year over year.

Income trends.

Category trends.

Show animated bars.

---

# SMART RECOMMENDATIONS

Examples:

"Reducing restaurant spending by 15% saves KES 62,000 annually."

"Moving excess cash into MMF could generate KES 28,000 yearly."

"Paying this loan early saves KES 12,500 interest."

---

# LIFE SIMULATOR

Interactive sliders:

Rent
Fuel
School fees
Salary
Entertainment

Instantly simulate:

"What happens if..."

Visual future projections.

---

# EMOTIONAL SPENDING ANALYSIS

Detect:

Weekend spender.

Night spender.

Stress spending.

Salary day spikes.

Impulse buying.

Explain patterns.

---

# FAMILY MODE

Separate profiles:

Father
Mother
Children

Shared expenses dashboard.

Household spending analysis.

---

# BUSINESS MODE

Separate:

Personal expenses.

Business expenses.

Tax-ready reports.

Profit analysis.

---

# EXPORTS

PDF reports.

Excel.

CSV.

PowerPoint.

Email summary.

---

# GAMIFICATION

Achievements:

30 days under budget.

Savings streak.

Debt reduction.

Milestones.

Animated badges.

---

# AI STORY MODE

Turn spending into a narrated story.

Example:

"In March, your largest spending category was food. Weekend restaurant visits increased significantly. Savings improved by 11%, while transport costs declined."

Display as a timeline movie.

---

# VOICE MODE

Ask:

"Where did I spend most last month?"

Receive spoken answers.

---

# PRIVACY

Everything encrypted.

No statement storage by default.

Local processing option.

User-controlled deletion.

Bank-grade security.

---

# TECH STACK

Frontend:

Next.js 15
TypeScript
Tailwind
Framer Motion
Shadcn UI
Three.js
D3.js
GSAP

Backend:

Python FastAPI

AI:

OpenAI
Claude
LangChain

Database:

PostgreSQL

Vector DB:

Qdrant

Charts:

ECharts
D3

Authentication:

Clerk

Storage:

Supabase

Deployment:

Vercel

---

# DELIVERABLE

Build this as a production-grade SaaS with:

1. Complete file structure.
2. Component hierarchy.
3. Database schema.
4. Backend architecture.
5. APIs.
6. AI pipeline.
7. MPESA statement parser.
8. PDF parser.
9. Category engine.
10. Analytics engine.
11. Motion design system.
12. Responsive design.
13. Mobile app design.
14. Dark mode.
15. Premium UX.
16. Sample datasets.
17. Demo pages.
18. Fully interactive dashboards.

Do not make it look like a normal finance dashboard.

Make it feel like the user is entering a futuristic financial command center where their money comes alive and tells a story.

Aim for a product quality that could compete with Revolut, Monarch Money, Copilot Money, and potentially become the leading personal finance intelligence platform in Africa.

</pasted_text>

<!-- The user explicitly selected the following skills for this project, as attachments to their message. These are not optional context — they define how you work. Use them. -->
<attached-skill name="Design Components">
This project uses Design Components: every design is a single streaming `Name.dc.html` file. The full authoring spec is in your system prompt under "Writing code — Design Components" — follow it. Author and edit `.dc.html` content with the `dc_write`, `dc_html_str_replace`, `dc_js_str_replace`, and `dc_set_props` tools (not `write_file`; `str_replace_edit` works but won't stream); template edits stream into the live preview as you type.
</attached-skill>

<attached-skill name="Hi-fi design">
Create a high-fidelity, polished design.

Follow this general design process (use the todo list to remember):
(1) ask questions, (2) find existing UI kits and collect design context — copy ALL relevant components and read ALL relevant examples; ask the user if you can't find them, (3) start your file with assumptions + context + design reasoning (as if you are a junior designer and the user is your manager), with placeholders for the designs, and show it to the user early, (4) build out the designs and show the user again ASAP; append some next steps, (5) use your tools to check, verify and iterate on the design.

Good hi-fi designs do not start from scratch — they are rooted in existing design context. Ask the user to Import their codebase, or find a suitable UI kit / design resources, or ask for screenshots of existing UI. You MUST spend time trying to acquire design context, including components. If you cannot find them, ask the user for them. In the Import menu, they can link a local codebase, provide screenshots or Figma links; they can also link another project. Mocking a full product from scratch is a LAST RESORT and will lead to poor design. If stuck, try listing design assets and ls'ing design system files — be proactive! Some designs may need multiple design systems — get them all. Use the starter components (device frames and the like) to get high-quality scaffolding for free.

When presenting several options or explorations side-by-side, lay them out as labeled frames directly in the template — plain markup, not a canvas/artboard component, so every frame stays directly editable. The page is plain HTML — let the body itself scroll; never set `overflow:auto`/`scroll` on an inner wrapper, and don't build pan/zoom into the file. The outermost wrapper carries both the gray background and `width:max-content` (so the gray extends with the scroll) plus `min-width:100%; min-height:100vh; box-sizing:border-box; padding:48px; background:#e7e5df`. Inside it, each section is a start-aligned flex row — `display:flex; gap:48px; align-items:flex-start` — never centered on the horizontal axis: `justify-content:center`, `place-items:center`, or `margin:auto` on an overflowing row pushes frames off the left edge where scroll can't reach. Each frame gets `flex:none` and a fixed pixel width; a frame is a small label above a white card (`background:#fff; border-radius:2px; box-shadow:0 1px 3px rgba(0,0,0,.08)`).

When designing, asking many good questions is ESSENTIAL.

Give options: try to give 3+ variations across several dimensions. Mix by-the-book designs that match existing patterns with new and novel interactions, including interesting layouts, metaphors, and visual styles. Have some options that use color or advanced CSS; some with iconography and some without. Start your variations basic and get more advanced and creative as you go! Try remixing the brand assets and visual DNA in interesting ways — play with scale, fills, texture, visual rhythm, layering, novel layouts, type treatments. The goal is not the perfect option; it's exploring atomic variations the user can mix and match.

CSS, HTML, JS and SVG are amazing. Users often don't know what they can do. Surprise the user.

If you do not have an icon, asset or component, draw a placeholder: in hi-fi design, a placeholder is better than a bad attempt at the real thing.
</attached-skill>

<attached-skill name="Interactive prototype">
Create a fully interactive prototype with realistic state management and transitions. Use React useState/useEffect for dynamic behavior. Include hover states, click interactions, form validation, animated transitions, and multi-step navigation flows. It should feel like a real working app, not a static mockup.
</attached-skill>


<system-reminder>Auto-injected reminder (ignore if not relevant): do not recreate copyrighted or branded UI unless the user's email domain matches that company. Create original designs instead.</system-reminder>

## Assistant

This is an ambitious, richly-specified product — far more than fits in one buildable artifact. The aesthetic direction is already clear (dark glassmorphism, neon accents, Iron-Man-HUD energy), so before I build I need to scope *what* to deliver first. A few quick questions:

_[tool: questions_v2]_

## User

Questions answered:
- vibe: 3
- variations: No — commit to one strong direction
- data: Kenyan small-business owner (business + personal mixed)
- fidelity: Fully interactive — live counters, working charts, clickable nav, simulated AI
- deliverable: An upload→insight flow (upload statement → AI reveals story), The Landing page (animated hero + upload + feature showcase), The Dashboard command center (animated scores, cards, charts) — the hero screen, The Analytics deep-dive (sunburst, sankey, galaxy, heatmap, DNA)
- extras: make the AI Wealth Coach prominenT AND PROMOTE SAVING CULTURE

## Assistant

Scope locked: one cohesive, fully-interactive DC — **Landing → Upload-to-insight flow → Dashboard command center → Analytics deep-dive → prominent AI Wealth Coach**, dark glass + neon, Kenyan SME data, savings-culture throughout. Building it now.

_[tool: update_todos]_

_[tool: set_project_title]_

Now the main build. Writing the logic class with all sample data and chart builders:

_[tool: dc_write]_

I left a syntax error in the Sankey builder. Fixing it:

_[tool: dc_js_str_replace]_

Let me verify it renders across screens.

_[tool: show_html]_

I'm fixing/verifying rendering, so a quick look is warranted:

_[tool: show_html]_

Landing looks strong. Let me check the app screens by navigating.

_[tool: eval_js]_

_[tool: eval_js]_

_[tool: sleep]_

_[tool: screenshot]_

_[tool: eval_js]_

DOM is fully populated — html-to-image just choked on the SVG-heavy area. Let me grab a real pixel capture of the dashboard.

_[tool: save_screenshot]_

_[tool: save_screenshot]_

Content exists in DOM but paints blank — let me check geometry.

_[tool: eval_js]_

Found it: the screen container is stuck at `opacity:0` — the entrance animation gets restarted by the rapid count-up re-renders and pauses at frame 0. Removing the opacity animation from the app screens:

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: eval_js]_

_[tool: show_html]_

_[tool: eval_js]_

_[tool: eval_js]_

_[tool: sleep]_

_[tool: eval_js]_

Fixed — opacity 1 now. Let me capture the dashboard and analytics for a real look.

_[tool: save_screenshot]_

Excellent — dashboard is gorgeous. Let me scroll down to check the rest, then analytics and coach.

_[tool: save_screenshot]_

Dashboard is complete. Minor: goal have/target labels touch. Let me check analytics and coach first.

_[tool: eval_js]_

_[tool: sleep]_

_[tool: save_screenshot]_

Analytics nav didn't trigger (icon char in the label). Let me click it correctly.

_[tool: eval_js]_

_[tool: eval_js]_

_[tool: eval_js]_

_[tool: sleep]_

_[tool: eval_js]_

Now on Analytics. Capturing:

_[tool: save_screenshot]_

Analytics renders great. Two small fixes: Sankey left labels are clipped, and goal amounts touch. Fixing both:

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Now the coach. Navigating and testing the chat:

_[tool: eval_js]_

_[tool: sleep]_

_[tool: eval_js]_

_[tool: sleep]_

_[tool: save_screenshot]_

Everything works — chat sends, AI responds with savings-culture coaching, bold formatting renders. The full flow is complete: Landing → Upload → Dashboard → Analytics → Coach, all interactive with live count-ups and working charts.

_[tool: update_todos]_

_[tool: snip]_

_[tool: ready_for_verification]_

**MoneyDNA AI** is built — one cohesive, fully-interactive command center:

- **Landing** — animated particle hero, "Your money tells a story" headline, glass stat strip, feature grid
- **Upload→insight flow** — drop zone → live 5-step AI processing → reveal
- **Dashboard** — count-up KPIs, animated health gauge (78) & savings ring (26%), 12-month cashflow river, category bars, M-PESA breakdown, top merchants, anomaly alerts, savings goals, AI insights
- **Analytics** — spending-DNA radar ("The Disciplined Builder"), sunburst, Sankey money-flow, daily heatmap, spending galaxy
- **Wealth Coach** — prominent chat with numbers-backed answers, savings-culture nudges, suggestion chips

Built around Kenyan SME data (Wanjiru / Kamau Hardware), with a saving-culture thread throughout (streaks, "pay yourself first," beat-your-target framing). All charts are real working SVG; navigation, count-ups, and chat are live.

Next steps if you want them: a **cashflow forecast** screen (7/30/90-day projection), the **Life Simulator** sliders, or a **timeline replay** of the month. Just say which.

## User

IF I CLICK HERE I SHOULD BE ABLE TO GO BACK TO THE HOME PAGE

## Assistant

The user wants the sidebar logo to be clickable to return to the landing page. Let me find that element and add an onClick.

_[tool: grep]_

_[tool: grep]_

_[tool: dc_html_str_replace]_

Done — the **MoneyDNA AI** logo in the sidebar is now clickable and takes you back to the landing/home page.

## User

THIS IS NOT FOR KENYA ONLY ITS FOR ANYONE

## Assistant

The user wants to broaden the positioning beyond Kenya. Let me update that badge.

_[tool: grep]_

_[tool: dc_html_str_replace]_

Updated to "FINANCIAL INTELLIGENCE · FOR EVERYONE." The product still understands M-PESA and bank statements, but the positioning now speaks to anyone.

## User

MAKE IT POSSIBLE TO UPLOAD DOCUMENT CSV,PDF,EXCEL DOC

## Assistant

The user wants a real file picker. Let me add a hidden file input wired to the dropzone, accepting PDF/CSV/Excel, then run the analysis on selection.

_[tool: read_file]_

I'll add a hidden file input, point the dropzone at it, and run the analysis with the chosen filename shown.

_[tool: dc_html_str_replace]_

Now wire up the logic. Let me add the ref, picker, drag/drop handlers, and a chosen-filename caption.

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Now expose the new handlers/values in `renderVals`:

_[tool: dc_js_str_replace]_

Let me surface the chosen filename during processing:

_[tool: dc_js_str_replace]_

The dropzone now accepts real PDF/CSV/Excel files via click-to-browse or drag-and-drop, with format badges and a live drag state. Let me verify it loads and the picker is wired.

_[tool: show_html]_

_[tool: eval_js]_

_[tool: eval_js]_

The file input is wired with the correct accept types and the format badges render. The upload zone now supports:

- **Click to browse** — opens a real file picker filtered to PDF, CSV, XLS/XLSX
- **Drag & drop** — with a live "Release to upload" highlight state
- The chosen filename then appears in the processing screen (e.g. `📄 statement.pdf · Parsing PDF…`)

The "Use Wanjiru's sample statement" button still works for the demo path.

