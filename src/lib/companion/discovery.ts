/**
 * MoneyDNA — The Discovery (Companion onboarding)
 * -----------------------------------------------
 * A warm, human conversation that runs BEFORE money is ever mentioned. It is
 * the moment MoneyDNA gets to know WHO the user is — the foundation of the
 * companion relationship. Pure config + types; no network.
 *
 * Design notes:
 *  - Questions are conversational, not a form. Copy is written to feel human.
 *  - Every question maps to one field on CompanionProfile.
 *  - Money, goals, and statements come LATER — this layer is about the person.
 */

export interface DiscoveryOption {
  value: string;
  label: string;
}

export interface DiscoveryQuestion {
  id: string; // maps to CompanionProfile field
  companionLine: string; // what the companion "says"
  prompt: string; // the actual question
  kind: "choice" | "text" | "boolean";
  options?: DiscoveryOption[];
  placeholder?: string;
}

export const DISCOVERY: DiscoveryQuestion[] = [
  {
    id: "moneyStory",
    companionLine: "Before we talk about a single shilling, I'd love to understand you.",
    prompt: "Growing up, what was money like in your home?",
    kind: "choice",
    options: [
      { value: "scarcity", label: "There was never quite enough" },
      { value: "careful", label: "We were careful, but okay" },
      { value: "comfort", label: "Money wasn't really a worry" },
      { value: "chaos", label: "It was unpredictable — up and down" },
    ],
  },
  {
    id: "temperament",
    companionLine: "That shapes more than people realise.",
    prompt: "When money lands in your hands, what feels most true?",
    kind: "choice",
    options: [
      { value: "spender", label: "I like to enjoy it" },
      { value: "saver", label: "I want to keep as much as I can" },
      { value: "balanced", label: "A bit of both" },
    ],
  },
  {
    id: "planning",
    companionLine: "There's no wrong answer here.",
    prompt: "Are you more of a planner, or more spontaneous?",
    kind: "choice",
    options: [
      { value: "planner", label: "I like a plan" },
      { value: "spontaneous", label: "I go with the flow" },
    ],
  },
  {
    id: "riskComfort",
    companionLine: "Good to know.",
    prompt: "How do you feel about risk with money?",
    kind: "choice",
    options: [
      { value: "cautious", label: "Keep it safe" },
      { value: "moderate", label: "Some risk is fine" },
      { value: "bold", label: "I'll take a real chance for a real reward" },
    ],
  },
  {
    id: "lifeStage",
    companionLine: "Let's place where you are in life right now.",
    prompt: "Which sounds most like you today?",
    kind: "choice",
    options: [
      { value: "student", label: "Studying / just starting out" },
      { value: "earlyCareer", label: "Early in my career" },
      { value: "family", label: "Building / supporting a family" },
      { value: "established", label: "Established, thinking long-term" },
    ],
  },
  {
    id: "supportsFamily",
    companionLine: "This one matters a lot in how we plan together.",
    prompt: "Do you regularly support family with money?",
    kind: "boolean",
  },
  {
    id: "goodLife",
    companionLine: "Now the important part — you.",
    prompt: "When you imagine a good life, what does it give you most?",
    kind: "choice",
    options: [
      { value: "freedom", label: "Freedom" },
      { value: "security", label: "Security" },
      { value: "family", label: "A good life for my family" },
      { value: "adventure", label: "Adventure & experiences" },
      { value: "status", label: "Respect & achievement" },
      { value: "legacy", label: "Something that outlasts me" },
    ],
  },
  {
    id: "biggestFear",
    companionLine: "I want to understand what weighs on you, too.",
    prompt: "What's your biggest worry about money?",
    kind: "choice",
    options: [
      { value: "runningOut", label: "Running out / not having enough" },
      { value: "wastingIt", label: "Wasting what I earn" },
      { value: "neverFree", label: "Working forever, never being free" },
      { value: "lettingDown", label: "Letting the people I love down" },
      { value: "wrongChoice", label: "Making the wrong big decision" },
    ],
  },
  {
    id: "futureVision",
    companionLine: "Last one — and this is the one that matters most.",
    prompt: "In your own words: what kind of life are you trying to build?",
    kind: "text",
    placeholder: "A home, my own business, freedom to travel, security for my parents…",
  },
];

export type DiscoveryAnswers = Partial<{
  moneyStory: string;
  temperament: string;
  planning: string;
  riskComfort: string;
  lifeStage: string;
  supportsFamily: boolean;
  goodLife: string;
  biggestFear: string;
  futureVision: string;
}>;
