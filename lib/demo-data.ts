/**
 * ILLUSTRATIVE DATA for the pitch demo (/demo). None of this is real.
 *
 * The point of the demo is to make the operating model tangible while pitching,
 * so the scenarios are built to expose the four things that actually
 * differentiate CTLYST and which a static page can only assert:
 *   1. diagnosis overrides the founder's stated need
 *   2. the mentor and capital tracks run on different clocks
 *   3. failure states are handled, not hidden
 *   4. success is a specific outcome, never "a connection made"
 *
 * The lead scenario is the worked example from CTLYSTProjectPlanWEB.html §10.3
 * and the /schemes page: an agri-tech prototype, a ₹20 lakh SISFS grant, a
 * retired production engineer, a ₹5 lakh award and an illustrative 5% fee of
 * ₹25,000. Names are invented; the mechanics are not.
 */

export type Tag = "Manual" | "Assisted" | "Automated";
export type StepState = "done" | "active" | "blocked" | "waiting";

export type Step = { label: string; state: StepState; note?: string; tag: Tag };

export type Founder = {
  id: string;
  name: string;
  venture: string;
  city: string;
  since: string;
  /** what they said they needed */
  statedNeed: string;
  /** what the diagnosis actually found */
  diagnosis: string;
  /** the reframe, in one line — this is the pitch moment */
  reframe: string;
  mentorTrack: Step[];
  capitalTrack: Step[];
  mentor?: { name: string; background: string; committed: string };
  scheme?: { name: string; ask: string; status: string };
  outcome?: { headline: string; award: string; fee: string; at: string };
  alert?: string;
};

export const FOUNDERS: Founder[] = [
  {
    id: "f-01",
    name: "Meera R.",
    venture: "Soil-moisture sensor for smallholder farms",
    city: "Nashik",
    since: "Week 3",
    statedNeed: "We need funding.",
    diagnosis:
      "The design cannot be manufactured at target cost, so any grant application would fail on feasibility. Capital is not the bottleneck yet — manufacturability is.",
    reframe: "Asked for money. Needed a production engineer first.",
    mentor: {
      name: "S. Raghavan",
      background: "Retired production engineer, 31 years in instrumentation",
      committed: "4 hrs / month",
    },
    scheme: {
      name: "Startup India Seed Fund Scheme — prototype grant",
      ask: "Up to ₹20 lakh via an approved incubator",
      status: "Submitted · awaiting incubator committee",
    },
    mentorTrack: [
      { label: "Matched", state: "done", note: "3 candidates, 1 accepted", tag: "Manual" },
      { label: "Mentor accepted", state: "done", tag: "Manual" },
      { label: "Engagement", state: "done", note: "6 sessions", tag: "Manual" },
      { label: "Design revised for manufacture", state: "done", note: "Unit cost ₹4,100 → ₹1,850", tag: "Manual" },
      { label: "Milestone review", state: "active", tag: "Assisted" },
    ],
    capitalTrack: [
      { label: "Eligibility screen", state: "done", note: "DPIIT recognition confirmed", tag: "Assisted" },
      { label: "Scheme shortlist", state: "done", note: "3 of 6 matched", tag: "Assisted" },
      { label: "Application support", state: "done", note: "Drafted with founder", tag: "Manual" },
      { label: "Submission", state: "done", tag: "Manual" },
      { label: "Outcome — disbursal", state: "active", note: "Committee meets in 11 days", tag: "Manual" },
    ],
  },
  {
    id: "f-02",
    name: "Arjun K.",
    venture: "Campus logistics coordination app",
    city: "Pune",
    since: "Week 2",
    statedNeed: "We need a technical co-founder.",
    diagnosis:
      "No demand evidence. Zero user interviews conducted, and the described problem has not been confirmed with a single prospective user. Hiring now would build the wrong thing faster.",
    reframe: "Asked for a co-founder. Needed to talk to twenty users.",
    mentor: {
      name: "K. Iyer",
      background: "Retired operations director, campus services",
      committed: "2 hrs / month",
    },
    mentorTrack: [
      { label: "Matched", state: "done", tag: "Manual" },
      { label: "Mentor accepted", state: "done", tag: "Manual" },
      { label: "Engagement", state: "active", note: "Running 20 discovery interviews", tag: "Manual" },
      { label: "Milestone review", state: "waiting", tag: "Assisted" },
    ],
    capitalTrack: [
      { label: "Eligibility screen", state: "done", note: "Not yet DPIIT-recognised", tag: "Assisted" },
      {
        label: "Scheme shortlist",
        state: "blocked",
        note: "Held deliberately — applying before demand evidence wastes the one attempt",
        tag: "Manual",
      },
    ],
  },
  {
    id: "f-03",
    name: "Priya S.",
    venture: "Low-cost assistive grip for arthritis",
    city: "Mumbai",
    since: "Week 6",
    statedNeed: "We need help with the prototype.",
    diagnosis:
      "Prototype work was progressing, then contact stopped. Two check-ins unanswered. Nothing is wrong with the venture; the founder has gone quiet.",
    reframe: "Silence is a state the system has to handle, not ignore.",
    alert: "Founder silent 21 days — escalated to a call, then archived if unanswered",
    mentor: {
      name: "D. Fernandes",
      background: "Retired orthopaedic device engineer",
      committed: "3 hrs / month",
    },
    mentorTrack: [
      { label: "Matched", state: "done", tag: "Manual" },
      { label: "Mentor accepted", state: "done", tag: "Manual" },
      { label: "Engagement", state: "blocked", note: "No response since 4 Aug", tag: "Automated" },
    ],
    capitalTrack: [
      { label: "Eligibility screen", state: "done", tag: "Assisted" },
      { label: "Scheme shortlist", state: "waiting", tag: "Assisted" },
    ],
  },
  {
    id: "f-04",
    name: "Rahul M.",
    venture: "Textile dye effluent recovery",
    city: "Solapur",
    since: "Week 1",
    statedNeed: "We need a mentor who understands dyeing chemistry.",
    diagnosis:
      "Stated need confirmed — this one was accurate. The constraint is on our side: no chemical-process mentor on the bench.",
    reframe: "Sometimes the founder is right and we are the bottleneck.",
    alert: "No mentor available in domain — 2 candidates being approached",
    mentorTrack: [
      { label: "Matched", state: "blocked", note: "Bench has no chemical-process mentor", tag: "Manual" },
      { label: "Mentor accepted", state: "waiting", tag: "Manual" },
    ],
    capitalTrack: [
      { label: "Eligibility screen", state: "done", tag: "Assisted" },
      { label: "Scheme shortlist", state: "done", note: "Maharashtra state policy — 2 matched", tag: "Assisted" },
      { label: "Application support", state: "waiting", tag: "Manual" },
    ],
  },
  {
    id: "f-05",
    name: "Imran S.",
    venture: "Vernacular exam-prep audio for low-bandwidth phones",
    city: "Aurangabad",
    since: "Week 4",
    statedNeed: "We need to be listed on an incubator's website.",
    diagnosis:
      "Distribution is already working — 900 weekly listeners with no spend. The constraint is unit economics: every listener costs more than they return.",
    reframe: "Asked for legitimacy. Needed a costing model.",
    mentor: {
      name: "A. Bose",
      background: "Retired power electronics lead, 26 years",
      committed: "2 hrs / month",
    },
    mentorTrack: [
      { label: "Matched", state: "done", tag: "Manual" },
      { label: "Mentor accepted", state: "done", tag: "Manual" },
      { label: "Engagement", state: "active", note: "Rebuilding the cost model", tag: "Manual" },
      { label: "Milestone review", state: "waiting", tag: "Assisted" },
    ],
    capitalTrack: [
      { label: "Eligibility screen", state: "done", note: "DPIIT recognition confirmed", tag: "Assisted" },
      { label: "Scheme shortlist", state: "active", note: "State policy + AIM incubation", tag: "Assisted" },
      { label: "Application support", state: "waiting", tag: "Manual" },
    ],
  },
  {
    id: "f-06",
    name: "Neha B.",
    venture: "Refill network for household cleaning liquids",
    city: "Thane",
    since: "Week 8",
    statedNeed: "We need a grant to open three more refill points.",
    diagnosis:
      "The first point is not yet profitable. Funding replication before the unit works would multiply a loss, so the capital track is deliberately held.",
    reframe: "Asked to scale. Needed the first site to pay for itself.",
    mentor: {
      name: "K. Iyer",
      background: "Retired operations director, campus services",
      committed: "2 hrs / month",
    },
    mentorTrack: [
      { label: "Matched", state: "done", tag: "Manual" },
      { label: "Mentor accepted", state: "done", tag: "Manual" },
      { label: "Engagement", state: "done", note: "9 sessions", tag: "Manual" },
      { label: "Milestone review", state: "active", note: "Site margin −₹8/unit → +₹3/unit", tag: "Assisted" },
    ],
    capitalTrack: [
      { label: "Eligibility screen", state: "done", tag: "Assisted" },
      {
        label: "Scheme shortlist",
        state: "blocked",
        note: "Held until the first site clears break-even",
        tag: "Manual",
      },
    ],
  },
  {
    id: "f-07",
    name: "Tanvi J.",
    venture: "Sensor retrofit for municipal water pumps",
    city: "Nagpur",
    since: "Week 5",
    statedNeed: "We need an introduction to the municipal corporation.",
    diagnosis:
      "The introduction is available. What is missing is a compliance file the buyer is required to ask for, which would end the conversation on day one.",
    reframe: "Asked for a meeting. Needed the paperwork the meeting demands.",
    alert: "Stalled at a milestone — compliance file 3 weeks overdue",
    mentor: {
      name: "S. Raghavan",
      background: "Retired production engineer, 31 years in instrumentation",
      committed: "4 hrs / month",
    },
    scheme: {
      name: "Credit Guarantee Scheme",
      ask: "Collateral-free working capital",
      status: "On hold · terms being re-verified",
    },
    mentorTrack: [
      { label: "Matched", state: "done", tag: "Manual" },
      { label: "Mentor accepted", state: "done", tag: "Manual" },
      { label: "Engagement", state: "blocked", note: "Compliance file outstanding", tag: "Manual" },
      { label: "Milestone review", state: "waiting", tag: "Assisted" },
    ],
    capitalTrack: [
      { label: "Eligibility screen", state: "done", tag: "Assisted" },
      { label: "Scheme registry", state: "done", note: "Scheme terms 24 days old — re-verify", tag: "Assisted" },
      { label: "Scheme shortlist", state: "waiting", tag: "Assisted" },
    ],
  },
];

/** Closed loops. Success is a specific outcome, never "a connection made". */
export const LEDGER = [
  {
    founder: "Ananya D.",
    venture: "Cold-chain monitor for dairy co-operatives",
    outcome: "Prototype grant secured",
    award: "₹5,00,000",
    fee: "₹25,000",
    note: "5% success fee, illustrative — charged only on money that arrived",
    at: "Month 4",
  },
  {
    founder: "Vikram T.",
    venture: "Braille label printer",
    outcome: "Working prototype built",
    award: "—",
    fee: "₹0",
    note: "No capital raised. Counted anyway: the founder shipped.",
    at: "Month 3",
  },
  {
    founder: "Sana Q.",
    venture: "Rural pharmacy stock ledger",
    outcome: "Application rejected · re-entered at diagnosis",
    award: "—",
    fee: "₹0",
    note: "Rejection returns the founder to diagnosis, never to intake",
    at: "Month 5",
  },
];

export const MENTOR_BENCH = [
  { name: "S. Raghavan", field: "Production engineering", load: 2, cap: 3 },
  { name: "K. Iyer", field: "Operations", load: 1, cap: 2 },
  { name: "D. Fernandes", field: "Medical devices", load: 1, cap: 2 },
  { name: "A. Bose", field: "Power electronics", load: 0, cap: 2 },
  { name: "—", field: "Chemical process", load: 0, cap: 0 },
];

export const REGISTRY = [
  { scheme: "Startup India Seed Fund Scheme", checked: "6 days ago", state: "current" },
  { scheme: "Fund of Funds for Startups", checked: "6 days ago", state: "current" },
  { scheme: "Credit Guarantee Scheme", checked: "24 days ago", state: "stale" },
  { scheme: "Section 80-IAC", checked: "6 days ago", state: "current" },
  { scheme: "Atal Innovation Mission", checked: "31 days ago", state: "stale" },
  { scheme: "Maharashtra State Startup Policy", checked: "9 days ago", state: "current" },
];
