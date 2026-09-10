// LIFE CLOCK preset library — 14 categories, 150+ data-driven presets.
// A preset is a common real-world thing + its minimal form contract:
// required/optional fields, default reminders, default recurrence, lifecycle verb.

import type { ActionType, Category, HistoryType, OptionalField, Preset, RepeatRule } from "./types";

export const CATEGORIES: Category[] = [
  { id: "documents",   name: "Documents & ID",         shortName: "Documents",  icon: "IdentificationCard",     color: "#2f7e78", major: true,  order: 1 },
  { id: "immigration", name: "Immigration & Travel",   shortName: "Travel",     icon: "Airplane",                color: "#5b6fa8", major: false, order: 2 },
  { id: "money",       name: "Money & Bills",          shortName: "Money",      icon: "CurrencyCircleDollar",   color: "#6b6fb0", major: true,  order: 3 },
  { id: "warranty",    name: "Warranties & Returns",   shortName: "Warranty",   icon: "ShieldCheck",            color: "#a8864e", major: true,  order: 4 },
  { id: "home",        name: "Home & Maintenance",     shortName: "Home",       icon: "House",                   color: "#69798f", major: true,  order: 5 },
  { id: "vehicle",     name: "Vehicle & Transport",    shortName: "Vehicle",    icon: "Car",                     color: "#4e86a8", major: true,  order: 6 },
  { id: "people",      name: "People & Dates",         shortName: "People",     icon: "Users",                   color: "#b0708e", major: true,  order: 7 },
  { id: "health",      name: "Health & Care",          shortName: "Health",     icon: "Heart",                   color: "#a55b78", major: true,  order: 8 },
  { id: "food",        name: "Food & Pantry",          shortName: "Food",       icon: "ForkKnife",               color: "#6e8f4e", major: true,  order: 9 },
  { id: "pets",        name: "Pets",                   shortName: "Pets",       icon: "PawPrint",                color: "#9e7a50", major: false, order: 10 },
  { id: "work",        name: "Work & Education",       shortName: "Work",       icon: "Briefcase",               color: "#5e7a9e", major: false, order: 11 },
  { id: "memberships", name: "Memberships & Licences", shortName: "Member.",    icon: "IdentificationBadge",     color: "#4e8f8a", major: false, order: 12 },
  { id: "property",    name: "Personal Property",      shortName: "Property",   icon: "Package",                 color: "#7e8f6e", major: false, order: 13 },
  { id: "other",       name: "Other",                  shortName: "Other",      icon: "DotsThree",               color: "#8a8274", major: false, order: 14 },
];

const BASE_OPTIONAL: OptionalField[] = [
  "custom-title", "custom-reminders", "repeat", "notes", "photo", "file",
];

type PresetInput = {
  id: string;
  categoryId: string;
  name: string;
  actionType: ActionType;
  dateLabel: string;
  titleLabel?: string;
  defaultReminders: number[];
  defaultRepeat?: RepeatRule;
  verb?: { action: string; historyType: HistoryType; secondary?: { action: string; historyType: HistoryType } };
  aliases?: string[];
  popular?: boolean;
  optionalFields?: OptionalField[];
  special?: "food";
};

const P = (input: PresetInput): Preset => ({
  id: input.id,
  categoryId: input.categoryId,
  name: input.name,
  actionType: input.actionType,
  dateLabel: input.dateLabel,
  titleLabel: input.titleLabel,
  defaultReminders: input.defaultReminders,
  defaultRepeat: input.defaultRepeat,
  aliases: input.aliases ?? [],
  popular: input.popular,
  optionalFields: input.optionalFields ?? BASE_OPTIONAL,
  lifecycle: input.verb ?? {
    action: defaultVerb(input.actionType),
    historyType: defaultHistory(input.actionType),
  },
  special: input.special,
});

function defaultVerb(t: ActionType): string {
  switch (t) {
    case "expires": return "Renew";
    case "renews": return "Renewed";
    case "replace": return "Replaced";
    case "service": return "Serviced";
    case "pay": return "Paid";
    case "return": return "Returned";
    case "best-before": return "Consumed";
    case "due": return "Completed";
    case "check": return "Checked";
    case "review": return "Reviewed";
    case "refill": return "Refilled";
    case "birthday": return "Celebrated";
    case "anniversary": return "Celebrated";
    case "renew-license": return "Renewed";
    case "custom": return "Completed";
  }
}

function defaultHistory(t: ActionType): HistoryType {
  switch (t) {
    case "renews": case "refill": case "renew-license": return "renewed";
    case "replace": return "replaced";
    case "service": return "serviced";
    case "pay": return "paid";
    case "return": return "returned";
    case "best-before": return "consumed";
    case "due": case "check": case "review": case "birthday":
    case "anniversary": case "custom": return "completed";
    default: return "renewed";
  }
}

// Reminder defaults from the spec §16 table.
const REM = {
  passport: [180, 30],
  immigration: [180, 90, 30],
  licence: [90, 30],
  insurance: [30, 7],
  warranty: [30, 7],
  return: [3, 1],
  birthday: [7, 1],
  anniversary: [7, 1],
  subscription: [3, 1],
  food: [3, 1],
  medication: [30, 7],
  filter: [7, 1],
  vehicle: [7, 1],
  certification: [90, 30],
  membership: [30, 7],
  health: [30, 7],
  general: [30, 7],
};

export const PRESETS: Preset[] = [
  // ── A · DOCUMENTS & ID ──────────────────────────────────────────────────
  P({ id: "passport", categoryId: "documents", name: "Passport", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.passport, aliases: ["travel document", "id", "document"], popular: true }),
  P({ id: "driver-licence", categoryId: "documents", name: "Driver Licence", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.licence, aliases: ["drivers license", "license", "dl"], popular: true }),
  P({ id: "national-id", categoryId: "documents", name: "National ID", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.licence, aliases: ["id card"] }),
  P({ id: "provincial-id", categoryId: "documents", name: "Provincial / State ID", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.licence, aliases: ["state id"] }),
  P({ id: "health-card", categoryId: "documents", name: "Health Card", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.licence, aliases: ["medical card", "insurance card"] }),
  P({ id: "insurance-card", categoryId: "documents", name: "Insurance Card", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.insurance, aliases: ["coverage card"] }),
  P({ id: "residence-permit", categoryId: "documents", name: "Residence Permit", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.immigration, aliases: ["pr", "permanent residence"] }),
  P({ id: "work-permit", categoryId: "documents", name: "Work Permit", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.immigration, aliases: ["open work permit", "closed work permit"] }),
  P({ id: "study-permit", categoryId: "documents", name: "Study Permit", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.immigration, aliases: ["student permit"] }),
  P({ id: "visa", categoryId: "documents", name: "Visa", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.immigration, aliases: ["visa stamp"] }),
  P({ id: "pr-card", categoryId: "documents", name: "Permanent Resident Card", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.immigration, aliases: ["pr card"] }),
  P({ id: "citizenship-document", categoryId: "documents", name: "Citizenship Document", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.general, aliases: ["citizenship certificate"] }),
  P({ id: "travel-document", categoryId: "documents", name: "Travel Document", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.immigration, aliases: [] }),
  P({ id: "birth-certificate", categoryId: "documents", name: "Birth Certificate", actionType: "review", dateLabel: "Next review", defaultReminders: REM.general, aliases: [] }),
  P({ id: "marriage-certificate", categoryId: "documents", name: "Marriage Certificate", actionType: "review", dateLabel: "Next review", defaultReminders: REM.general, aliases: [] }),
  P({ id: "divorce-certificate", categoryId: "documents", name: "Divorce Certificate", actionType: "review", dateLabel: "Next review", defaultReminders: REM.general, aliases: [] }),
  P({ id: "name-change-certificate", categoryId: "documents", name: "Name Change Certificate", actionType: "review", dateLabel: "Next review", defaultReminders: REM.general, aliases: [] }),
  P({ id: "sin-document", categoryId: "documents", name: "Social Insurance / Security Document", actionType: "review", dateLabel: "Next review", defaultReminders: REM.general, aliases: ["sin", "ssn", "social security"] }),
  P({ id: "professional-id", categoryId: "documents", name: "Professional ID", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "employee-id", categoryId: "documents", name: "Employee ID", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.general, aliases: ["work badge"] }),
  P({ id: "student-id", categoryId: "documents", name: "Student ID", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.general, aliases: ["school id"] }),
  P({ id: "library-card", categoryId: "documents", name: "Library Card", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.membership, aliases: [] }),
  P({ id: "accessibility-permit", categoryId: "documents", name: "Accessibility Permit", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "parking-permit", categoryId: "documents", name: "Parking Permit", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "firearm-licence", categoryId: "documents", name: "Firearm Licence", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.licence, aliases: ["gun licence"] }),
  P({ id: "boating-licence", categoryId: "documents", name: "Boating Licence", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "fishing-licence", categoryId: "documents", name: "Fishing Licence", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "hunting-licence", categoryId: "documents", name: "Hunting Licence", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "pilot-licence", categoryId: "documents", name: "Pilot Licence", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "security-licence", categoryId: "documents", name: "Security Licence", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "trade-licence", categoryId: "documents", name: "Trade Licence", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.licence, aliases: ["skilled trade"] }),
  P({ id: "occupational-licence", categoryId: "documents", name: "Occupational Licence", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "other-id", categoryId: "documents", name: "Other ID", actionType: "expires", dateLabel: "Expiry date", titleLabel: "ID name", defaultReminders: REM.general, aliases: [] }),
  P({ id: "other-document", categoryId: "documents", name: "Other Document", actionType: "expires", dateLabel: "Expiry date", titleLabel: "Document name", defaultReminders: REM.general, aliases: [] }),

  // ── B · IMMIGRATION & TRAVEL ────────────────────────────────────────────
  P({ id: "passport-travel", categoryId: "immigration", name: "Passport", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.passport, aliases: ["travel", "document"] }),
  P({ id: "visa-travel", categoryId: "immigration", name: "Visa", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.immigration, aliases: [] }),
  P({ id: "work-permit-travel", categoryId: "immigration", name: "Work Permit", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.immigration, aliases: [] }),
  P({ id: "study-permit-travel", categoryId: "immigration", name: "Study Permit", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.immigration, aliases: [] }),
  P({ id: "visitor-record", categoryId: "immigration", name: "Visitor Record", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.immigration, aliases: [] }),
  P({ id: "residence-permit-travel", categoryId: "immigration", name: "Residence Permit", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.immigration, aliases: [] }),
  P({ id: "pr-card-travel", categoryId: "immigration", name: "PR Card", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.immigration, aliases: ["permanent resident"] }),
  P({ id: "travel-document-2", categoryId: "immigration", name: "Travel Document", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.immigration, aliases: [] }),
  P({ id: "eta", categoryId: "immigration", name: "eTA", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.immigration, aliases: ["electronic travel authorization"] }),
  P({ id: "esta", categoryId: "immigration", name: "ESTA", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.immigration, aliases: ["usa", "us visa waiver"] }),
  P({ id: "nexus", categoryId: "immigration", name: "NEXUS", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.licence, aliases: ["border crossing"] }),
  P({ id: "global-entry", categoryId: "immigration", name: "Global Entry", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.licence, aliases: ["trusted traveler"] }),
  P({ id: "travel-insurance", categoryId: "immigration", name: "Travel Insurance", actionType: "renews", dateLabel: "Coverage end", defaultReminders: REM.insurance, aliases: ["trip insurance"] }),
  P({ id: "passport-renewal", categoryId: "immigration", name: "Passport Renewal", actionType: "due", dateLabel: "Renewal deadline", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "visa-renewal", categoryId: "immigration", name: "Visa Renewal", actionType: "due", dateLabel: "Renewal deadline", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "immigration-deadline", categoryId: "immigration", name: "Immigration Deadline", actionType: "due", dateLabel: "Deadline", defaultReminders: REM.immigration, aliases: ["application"] }),
  P({ id: "biometrics-expiry", categoryId: "immigration", name: "Biometrics Expiry", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.immigration, aliases: ["fingerprints"] }),
  P({ id: "medical-exam-expiry", categoryId: "immigration", name: "Medical Exam Expiry", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.immigration, aliases: ["ime", "panel physician"] }),
  P({ id: "language-test-validity", categoryId: "immigration", name: "Language Test Validity", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.immigration, aliases: ["ielts", "celpip", "toefl"] }),
  P({ id: "police-certificate-validity", categoryId: "immigration", name: "Police Certificate Validity", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.immigration, aliases: ["background check"] }),
  P({ id: "immigration-application-deadline", categoryId: "immigration", name: "Immigration Application Deadline", actionType: "due", dateLabel: "Deadline", defaultReminders: REM.immigration, aliases: ["submission"] }),
  P({ id: "flight-credit-expiry", categoryId: "immigration", name: "Flight Credit Expiry", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.return, aliases: ["airline credit", "voucher"] }),
  P({ id: "travel-voucher-expiry", categoryId: "immigration", name: "Travel Voucher Expiry", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.return, aliases: [] }),
  P({ id: "other-travel-document", categoryId: "immigration", name: "Other Travel Document", actionType: "expires", dateLabel: "Expiry date", titleLabel: "Document name", defaultReminders: REM.immigration, aliases: [] }),
  P({ id: "other-immigration-deadline", categoryId: "immigration", name: "Other Immigration Deadline", actionType: "due", dateLabel: "Deadline", titleLabel: "Deadline name", defaultReminders: REM.immigration, aliases: [] }),

  // ── C · MONEY, BILLS & SUBSCRIPTIONS ────────────────────────────────────
  P({ id: "streaming-subscription", categoryId: "money", name: "Streaming Subscription", actionType: "renews", dateLabel: "Next renewal", titleLabel: "Service", defaultReminders: REM.subscription, defaultRepeat: { kind: "monthly" }, aliases: ["netflix", "disney", "streaming"], popular: true }),
  P({ id: "music-subscription", categoryId: "money", name: "Music Subscription", actionType: "renews", dateLabel: "Next renewal", titleLabel: "Service", defaultReminders: REM.subscription, defaultRepeat: { kind: "monthly" }, aliases: ["spotify", "apple music"] }),
  P({ id: "cloud-storage", categoryId: "money", name: "Cloud Storage", actionType: "renews", dateLabel: "Next renewal", titleLabel: "Provider", defaultReminders: REM.subscription, defaultRepeat: { kind: "monthly" }, aliases: ["icloud", "google drive", "dropbox"] }),
  P({ id: "software-subscription", categoryId: "money", name: "Software Subscription", actionType: "renews", dateLabel: "Next renewal", titleLabel: "Software", defaultReminders: REM.subscription, defaultRepeat: { kind: "monthly" }, aliases: ["adobe", "microsoft 365"] }),
  P({ id: "ai-subscription", categoryId: "money", name: "AI Subscription", actionType: "renews", dateLabel: "Next renewal", titleLabel: "Service", defaultReminders: REM.subscription, defaultRepeat: { kind: "monthly" }, aliases: ["chatgpt", "copilot"] }),
  P({ id: "gaming-subscription", categoryId: "money", name: "Gaming Subscription", actionType: "renews", dateLabel: "Next renewal", titleLabel: "Service", defaultReminders: REM.subscription, defaultRepeat: { kind: "monthly" }, aliases: ["game pass", "playstation plus"] }),
  P({ id: "gym-membership", categoryId: "money", name: "Gym Membership", actionType: "renews", dateLabel: "Next renewal", titleLabel: "Gym", defaultReminders: REM.membership, defaultRepeat: { kind: "monthly" }, aliases: ["fitness"] }),
  P({ id: "mobile-phone-plan", categoryId: "money", name: "Mobile Phone Plan", actionType: "pay", dateLabel: "Next payment", titleLabel: "Provider", defaultReminders: REM.subscription, defaultRepeat: { kind: "monthly" }, aliases: ["cell phone", "wireless"] }),
  P({ id: "internet-plan", categoryId: "money", name: "Internet Plan", actionType: "pay", dateLabel: "Next payment", titleLabel: "Provider", defaultReminders: REM.subscription, defaultRepeat: { kind: "monthly" }, aliases: ["wifi", "broadband"] }),
  P({ id: "cable-tv-plan", categoryId: "money", name: "Cable / TV Plan", actionType: "pay", dateLabel: "Next payment", titleLabel: "Provider", defaultReminders: REM.subscription, defaultRepeat: { kind: "monthly" }, aliases: [] }),
  P({ id: "insurance-payment", categoryId: "money", name: "Insurance Payment", actionType: "pay", dateLabel: "Next payment", titleLabel: "Policy", defaultReminders: REM.insurance, defaultRepeat: { kind: "monthly" }, aliases: [] }),
  P({ id: "rent", categoryId: "money", name: "Rent", actionType: "pay", dateLabel: "Next payment", defaultReminders: REM.subscription, defaultRepeat: { kind: "monthly" }, aliases: ["apartment"] }),
  P({ id: "mortgage", categoryId: "money", name: "Mortgage", actionType: "pay", dateLabel: "Next payment", defaultReminders: REM.subscription, defaultRepeat: { kind: "monthly" }, aliases: [] }),
  P({ id: "credit-card-payment", categoryId: "money", name: "Credit Card Payment", actionType: "pay", dateLabel: "Due date", titleLabel: "Card", defaultReminders: REM.subscription, defaultRepeat: { kind: "monthly" }, aliases: ["bill"] }),
  P({ id: "loan-payment", categoryId: "money", name: "Loan Payment", actionType: "pay", dateLabel: "Next payment", titleLabel: "Loan", defaultReminders: REM.subscription, defaultRepeat: { kind: "monthly" }, aliases: [] }),
  P({ id: "car-payment", categoryId: "money", name: "Car Payment", actionType: "pay", dateLabel: "Next payment", defaultReminders: REM.subscription, defaultRepeat: { kind: "monthly" }, aliases: [] }),
  P({ id: "utility-bill", categoryId: "money", name: "Utility Bill", actionType: "pay", dateLabel: "Due date", titleLabel: "Utility", defaultReminders: REM.subscription, defaultRepeat: { kind: "monthly" }, aliases: ["city bill"] }),
  P({ id: "electricity-bill", categoryId: "money", name: "Electricity Bill", actionType: "pay", dateLabel: "Due date", defaultReminders: REM.subscription, defaultRepeat: { kind: "monthly" }, aliases: ["power", "hydro"] }),
  P({ id: "gas-bill", categoryId: "money", name: "Gas Bill", actionType: "pay", dateLabel: "Due date", defaultReminders: REM.subscription, defaultRepeat: { kind: "monthly" }, aliases: ["natural gas"] }),
  P({ id: "water-bill", categoryId: "money", name: "Water Bill", actionType: "pay", dateLabel: "Due date", defaultReminders: REM.subscription, defaultRepeat: { kind: "monthly" }, aliases: [] }),
  P({ id: "property-tax", categoryId: "money", name: "Property Tax", actionType: "pay", dateLabel: "Due date", defaultReminders: REM.licence, aliases: ["municipal tax"] }),
  P({ id: "tuition-payment", categoryId: "money", name: "Tuition Payment", actionType: "pay", dateLabel: "Due date", defaultReminders: REM.licence, aliases: ["school fees"] }),
  P({ id: "membership-fee", categoryId: "money", name: "Membership Fee", actionType: "pay", dateLabel: "Due date", titleLabel: "Membership", defaultReminders: REM.membership, aliases: [] }),
  P({ id: "annual-fee", categoryId: "money", name: "Annual Fee", actionType: "pay", dateLabel: "Due date", titleLabel: "For", defaultReminders: REM.membership, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "bank-promotion-expiry", categoryId: "money", name: "Bank Promotion Expiry", actionType: "expires", dateLabel: "End date", titleLabel: "Promotion", defaultReminders: REM.subscription, aliases: [] }),
  P({ id: "credit-card-annual-fee", categoryId: "money", name: "Credit Card Annual Fee", actionType: "pay", dateLabel: "Due date", titleLabel: "Card", defaultReminders: REM.membership, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "free-trial-ending", categoryId: "money", name: "Free Trial Ending", actionType: "expires", dateLabel: "Trial ends", titleLabel: "Service", defaultReminders: REM.subscription, aliases: ["trial"] }),
  P({ id: "promotional-rate-ending", categoryId: "money", name: "Promotional Rate Ending", actionType: "expires", dateLabel: "End date", titleLabel: "Service", defaultReminders: REM.subscription, aliases: [] }),
  P({ id: "contract-renewal", categoryId: "money", name: "Contract Renewal", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Contract", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "lease-renewal", categoryId: "money", name: "Lease Renewal", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Lease", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "domain-renewal", categoryId: "money", name: "Domain Renewal", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Domain", defaultReminders: REM.licence, defaultRepeat: { kind: "yearly" }, aliases: ["website domain", "dns"] }),
  P({ id: "website-hosting-renewal", categoryId: "money", name: "Website Hosting Renewal", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Host", defaultReminders: REM.licence, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "other-subscription", categoryId: "money", name: "Other Subscription", actionType: "renews", dateLabel: "Next renewal", titleLabel: "Subscription", defaultReminders: REM.subscription, defaultRepeat: { kind: "monthly" }, aliases: [] }),
  P({ id: "other-payment", categoryId: "money", name: "Other Payment", actionType: "pay", dateLabel: "Due date", titleLabel: "For", defaultReminders: REM.subscription, aliases: [] }),

  // ── D · WARRANTIES, PURCHASES & RETURNS ─────────────────────────────────
  P({ id: "electronics-warranty", categoryId: "warranty", name: "Electronics Warranty", actionType: "expires", dateLabel: "Warranty ends", titleLabel: "Item", defaultReminders: REM.warranty, aliases: ["gadget"] }),
  P({ id: "phone-warranty", categoryId: "warranty", name: "Phone Warranty", actionType: "expires", dateLabel: "Warranty ends", titleLabel: "Item", defaultReminders: REM.warranty, aliases: [] }),
  P({ id: "laptop-warranty", categoryId: "warranty", name: "Laptop Warranty", actionType: "expires", dateLabel: "Warranty ends", titleLabel: "Item", defaultReminders: REM.warranty, aliases: ["computer"] }),
  P({ id: "computer-warranty", categoryId: "warranty", name: "Computer Warranty", actionType: "expires", dateLabel: "Warranty ends", titleLabel: "Item", defaultReminders: REM.warranty, aliases: ["desktop"] }),
  P({ id: "tv-warranty", categoryId: "warranty", name: "TV Warranty", actionType: "expires", dateLabel: "Warranty ends", titleLabel: "Item", defaultReminders: REM.warranty, aliases: ["television"] }),
  P({ id: "gaming-console-warranty", categoryId: "warranty", name: "Gaming Console Warranty", actionType: "expires", dateLabel: "Warranty ends", titleLabel: "Item", defaultReminders: REM.warranty, aliases: ["playstation", "xbox"] }),
  P({ id: "headphones-warranty", categoryId: "warranty", name: "Headphones Warranty", actionType: "expires", dateLabel: "Warranty ends", titleLabel: "Item", defaultReminders: REM.warranty, aliases: ["earbuds"] }),
  P({ id: "camera-warranty", categoryId: "warranty", name: "Camera Warranty", actionType: "expires", dateLabel: "Warranty ends", titleLabel: "Item", defaultReminders: REM.warranty, aliases: [] }),
  P({ id: "appliance-warranty", categoryId: "warranty", name: "Appliance Warranty", actionType: "expires", dateLabel: "Warranty ends", titleLabel: "Item", defaultReminders: REM.warranty, aliases: ["fridge", "washer"] }),
  P({ id: "furniture-warranty", categoryId: "warranty", name: "Furniture Warranty", actionType: "expires", dateLabel: "Warranty ends", titleLabel: "Item", defaultReminders: REM.warranty, aliases: [] }),
  P({ id: "vehicle-part-warranty", categoryId: "warranty", name: "Vehicle Part Warranty", actionType: "expires", dateLabel: "Warranty ends", titleLabel: "Part", defaultReminders: REM.warranty, aliases: ["auto part"] }),
  P({ id: "home-repair-warranty", categoryId: "warranty", name: "Home Repair Warranty", actionType: "expires", dateLabel: "Warranty ends", titleLabel: "Repair", defaultReminders: REM.warranty, aliases: [] }),
  P({ id: "tool-warranty", categoryId: "warranty", name: "Tool Warranty", actionType: "expires", dateLabel: "Warranty ends", titleLabel: "Item", defaultReminders: REM.warranty, aliases: [] }),
  P({ id: "battery-warranty", categoryId: "warranty", name: "Battery Warranty", actionType: "expires", dateLabel: "Warranty ends", titleLabel: "Item", defaultReminders: REM.warranty, aliases: [] }),
  P({ id: "extended-warranty", categoryId: "warranty", name: "Extended Warranty", actionType: "expires", dateLabel: "Warranty ends", titleLabel: "Item", defaultReminders: REM.warranty, aliases: [] }),
  P({ id: "protection-plan", categoryId: "warranty", name: "Protection Plan", actionType: "expires", dateLabel: "Plan ends", titleLabel: "Item", defaultReminders: REM.warranty, aliases: [] }),
  P({ id: "store-warranty", categoryId: "warranty", name: "Store Warranty", actionType: "expires", dateLabel: "Warranty ends", titleLabel: "Item", defaultReminders: REM.warranty, aliases: [] }),
  P({ id: "manufacturer-warranty", categoryId: "warranty", name: "Manufacturer Warranty", actionType: "expires", dateLabel: "Warranty ends", titleLabel: "Item", defaultReminders: REM.warranty, aliases: [] }),
  P({ id: "return-deadline", categoryId: "warranty", name: "Return Deadline", actionType: "return", dateLabel: "Return by", titleLabel: "Item", defaultReminders: REM.return, aliases: ["send back"], popular: true }),
  P({ id: "exchange-deadline", categoryId: "warranty", name: "Exchange Deadline", actionType: "return", dateLabel: "Exchange by", titleLabel: "Item", defaultReminders: REM.return, aliases: [] }),
  P({ id: "price-match-deadline", categoryId: "warranty", name: "Price Match Deadline", actionType: "return", dateLabel: "Deadline", titleLabel: "Item", defaultReminders: REM.return, aliases: [] }),
  P({ id: "refund-deadline", categoryId: "warranty", name: "Refund Deadline", actionType: "return", dateLabel: "Refund by", titleLabel: "Item", defaultReminders: REM.return, aliases: ["money back"] }),
  P({ id: "gift-return-deadline", categoryId: "warranty", name: "Gift Return Deadline", actionType: "return", dateLabel: "Return by", titleLabel: "Gift", defaultReminders: REM.return, aliases: [] }),
  P({ id: "trial-period-ending", categoryId: "warranty", name: "Trial Period Ending", actionType: "expires", dateLabel: "Trial ends", titleLabel: "Product", defaultReminders: REM.subscription, aliases: [] }),
  P({ id: "rental-return", categoryId: "warranty", name: "Rental Return", actionType: "return", dateLabel: "Return by", titleLabel: "Item", defaultReminders: REM.return, aliases: [] }),
  P({ id: "equipment-rental-return", categoryId: "warranty", name: "Equipment Rental Return", actionType: "return", dateLabel: "Return by", titleLabel: "Equipment", defaultReminders: REM.return, aliases: [] }),
  P({ id: "other-warranty", categoryId: "warranty", name: "Other Warranty", actionType: "expires", dateLabel: "Warranty ends", titleLabel: "Item", defaultReminders: REM.warranty, aliases: [] }),
  P({ id: "other-return", categoryId: "warranty", name: "Other Return", actionType: "return", dateLabel: "Return by", titleLabel: "Item", defaultReminders: REM.return, aliases: [] }),

  // ── E · HOME & MAINTENANCE ──────────────────────────────────────────────
  P({ id: "furnace-filter", categoryId: "home", name: "Furnace Filter", actionType: "replace", dateLabel: "Next replacement", defaultReminders: REM.filter, defaultRepeat: { kind: "every-n-months", every: 3 }, aliases: ["hvac filter", "air filter"], popular: true }),
  P({ id: "hvac-service", categoryId: "home", name: "HVAC Service", actionType: "service", dateLabel: "Next service", defaultReminders: REM.vehicle, aliases: ["heating cooling"] }),
  P({ id: "ac-service", categoryId: "home", name: "Air Conditioner Service", actionType: "service", dateLabel: "Next service", defaultReminders: REM.vehicle, aliases: ["ac", "air conditioning"] }),
  P({ id: "furnace-service", categoryId: "home", name: "Furnace Service", actionType: "service", dateLabel: "Next service", defaultReminders: REM.vehicle, aliases: [] }),
  P({ id: "boiler-service", categoryId: "home", name: "Boiler Service", actionType: "service", dateLabel: "Next service", defaultReminders: REM.vehicle, aliases: [] }),
  P({ id: "water-heater-service", categoryId: "home", name: "Water Heater Service", actionType: "service", dateLabel: "Next service", defaultReminders: REM.vehicle, aliases: ["tank"] }),
  P({ id: "water-filter", categoryId: "home", name: "Water Filter", actionType: "replace", dateLabel: "Next replacement", defaultReminders: REM.filter, aliases: ["drinking water"] }),
  P({ id: "fridge-water-filter", categoryId: "home", name: "Fridge Water Filter", actionType: "replace", dateLabel: "Next replacement", defaultReminders: REM.filter, aliases: ["refrigerator"] }),
  P({ id: "air-purifier-filter", categoryId: "home", name: "Air Purifier Filter", actionType: "replace", dateLabel: "Next replacement", defaultReminders: REM.filter, aliases: [] }),
  P({ id: "humidifier-filter", categoryId: "home", name: "Humidifier Filter", actionType: "replace", dateLabel: "Next replacement", defaultReminders: REM.filter, aliases: [] }),
  P({ id: "dehumidifier-maintenance", categoryId: "home", name: "Dehumidifier Maintenance", actionType: "service", dateLabel: "Next service", defaultReminders: REM.vehicle, aliases: [] }),
  P({ id: "smoke-detector", categoryId: "home", name: "Smoke Detector", actionType: "check", dateLabel: "Next check", defaultReminders: REM.filter, aliases: ["alarm"] }),
  P({ id: "smoke-detector-battery", categoryId: "home", name: "Smoke Detector Battery", actionType: "replace", dateLabel: "Next replacement", defaultReminders: REM.filter, aliases: [] }),
  P({ id: "co-detector", categoryId: "home", name: "CO Detector", actionType: "check", dateLabel: "Next check", defaultReminders: REM.filter, aliases: ["carbon monoxide"] }),
  P({ id: "fire-extinguisher-inspection", categoryId: "home", name: "Fire Extinguisher Inspection", actionType: "check", dateLabel: "Next inspection", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "sump-pump-check", categoryId: "home", name: "Sump Pump Check", actionType: "check", dateLabel: "Next check", defaultReminders: REM.filter, aliases: [] }),
  P({ id: "gutter-cleaning", categoryId: "home", name: "Gutter Cleaning", actionType: "service", dateLabel: "Next cleaning", defaultReminders: REM.filter, aliases: ["eavestrough"] }),
  P({ id: "chimney-cleaning", categoryId: "home", name: "Chimney Cleaning", actionType: "service", dateLabel: "Next cleaning", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "roof-inspection", categoryId: "home", name: "Roof Inspection", actionType: "check", dateLabel: "Next inspection", defaultReminders: REM.anniversary, aliases: [] }),
  P({ id: "roof-maintenance", categoryId: "home", name: "Roof Maintenance", actionType: "service", dateLabel: "Next service", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "window-maintenance", categoryId: "home", name: "Window Maintenance", actionType: "service", dateLabel: "Next service", defaultReminders: REM.filter, aliases: [] }),
  P({ id: "garage-door-service", categoryId: "home", name: "Garage Door Service", actionType: "service", dateLabel: "Next service", defaultReminders: REM.filter, aliases: [] }),
  P({ id: "lawn-equipment-service", categoryId: "home", name: "Lawn Equipment Service", actionType: "service", dateLabel: "Next service", titleLabel: "Equipment", defaultReminders: REM.vehicle, aliases: ["mower"] }),
  P({ id: "sprinkler-winterization", categoryId: "home", name: "Sprinkler Winterization", actionType: "service", dateLabel: "Next date", defaultReminders: REM.filter, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "sprinkler-startup", categoryId: "home", name: "Sprinkler Startup", actionType: "service", dateLabel: "Next date", defaultReminders: REM.filter, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "pest-control", categoryId: "home", name: "Pest Control", actionType: "service", dateLabel: "Next service", defaultReminders: REM.filter, aliases: ["bugs"] }),
  P({ id: "septic-service", categoryId: "home", name: "Septic Service", actionType: "service", dateLabel: "Next service", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "water-softener", categoryId: "home", name: "Water Softener", actionType: "service", dateLabel: "Next service", defaultReminders: REM.filter, aliases: [] }),
  P({ id: "home-insurance", categoryId: "home", name: "Home Insurance", actionType: "renews", dateLabel: "Renewal date", defaultReminders: REM.insurance, defaultRepeat: { kind: "yearly" }, aliases: ["house insurance"] }),
  P({ id: "tenant-insurance", categoryId: "home", name: "Tenant Insurance", actionType: "renews", dateLabel: "Renewal date", defaultReminders: REM.insurance, defaultRepeat: { kind: "yearly" }, aliases: ["renter insurance"] }),
  P({ id: "property-insurance", categoryId: "home", name: "Property Insurance", actionType: "renews", dateLabel: "Renewal date", defaultReminders: REM.insurance, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "mortgage-renewal", categoryId: "home", name: "Mortgage Renewal", actionType: "renews", dateLabel: "Renewal date", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "lease-renewal-home", categoryId: "home", name: "Lease Renewal", actionType: "renews", dateLabel: "Renewal date", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "appliance-maintenance", categoryId: "home", name: "Appliance Maintenance", actionType: "service", dateLabel: "Next service", titleLabel: "Appliance", defaultReminders: REM.filter, aliases: [] }),
  P({ id: "home-security-subscription", categoryId: "home", name: "Home Security Subscription", actionType: "renews", dateLabel: "Next renewal", titleLabel: "Provider", defaultReminders: REM.subscription, defaultRepeat: { kind: "monthly" }, aliases: ["alarm monitoring"] }),
  P({ id: "generator-service", categoryId: "home", name: "Generator Service", actionType: "service", dateLabel: "Next service", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "other-home-maintenance", categoryId: "home", name: "Other Home Maintenance", actionType: "service", dateLabel: "Next service", titleLabel: "Task", defaultReminders: REM.filter, aliases: [] }),

  // ── F · VEHICLE & TRANSPORT ─────────────────────────────────────────────
  P({ id: "vehicle-insurance", categoryId: "vehicle", name: "Vehicle Insurance", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Vehicle", defaultReminders: REM.insurance, defaultRepeat: { kind: "yearly" }, aliases: ["car insurance", "auto insurance"], popular: true }),
  P({ id: "vehicle-registration", categoryId: "vehicle", name: "Vehicle Registration", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Vehicle", defaultReminders: REM.licence, defaultRepeat: { kind: "yearly" }, aliases: ["plates", "sticker"] }),
  P({ id: "driver-licence-vehicle", categoryId: "vehicle", name: "Driver Licence", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.licence, aliases: ["license"] }),
  P({ id: "oil-change", categoryId: "vehicle", name: "Oil Change", actionType: "service", dateLabel: "Next service", titleLabel: "Vehicle", defaultReminders: REM.vehicle, defaultRepeat: { kind: "every-n-months", every: 6 }, aliases: ["motor oil"] }),
  P({ id: "tire-rotation", categoryId: "vehicle", name: "Tire Rotation", actionType: "service", dateLabel: "Next service", titleLabel: "Vehicle", defaultReminders: REM.vehicle, defaultRepeat: { kind: "every-n-months", every: 6 }, aliases: ["tyres"] }),
  P({ id: "seasonal-tire-change", categoryId: "vehicle", name: "Seasonal Tire Change", actionType: "service", dateLabel: "Next date", titleLabel: "Vehicle", defaultReminders: REM.vehicle, aliases: ["winter tires", "summer tires"] }),
  P({ id: "winter-tires", categoryId: "vehicle", name: "Winter Tires", actionType: "service", dateLabel: "Next date", titleLabel: "Vehicle", defaultReminders: REM.vehicle, defaultRepeat: { kind: "yearly" }, aliases: ["snow tires"] }),
  P({ id: "summer-tires", categoryId: "vehicle", name: "Summer Tires", actionType: "service", dateLabel: "Next date", titleLabel: "Vehicle", defaultReminders: REM.vehicle, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "brake-inspection", categoryId: "vehicle", name: "Brake Inspection", actionType: "check", dateLabel: "Next inspection", titleLabel: "Vehicle", defaultReminders: REM.vehicle, aliases: ["brakes"] }),
  P({ id: "brake-service", categoryId: "vehicle", name: "Brake Service", actionType: "service", dateLabel: "Next service", titleLabel: "Vehicle", defaultReminders: REM.vehicle, aliases: ["brake pads"] }),
  P({ id: "battery-check", categoryId: "vehicle", name: "Battery Check", actionType: "check", dateLabel: "Next check", titleLabel: "Vehicle", defaultReminders: REM.vehicle, aliases: [] }),
  P({ id: "battery-replacement", categoryId: "vehicle", name: "Battery Replacement", actionType: "replace", dateLabel: "Next replacement", titleLabel: "Vehicle", defaultReminders: REM.vehicle, aliases: [] }),
  P({ id: "air-filter-vehicle", categoryId: "vehicle", name: "Air Filter", actionType: "replace", dateLabel: "Next replacement", titleLabel: "Vehicle", defaultReminders: REM.vehicle, aliases: ["engine filter"] }),
  P({ id: "cabin-filter", categoryId: "vehicle", name: "Cabin Filter", actionType: "replace", dateLabel: "Next replacement", titleLabel: "Vehicle", defaultReminders: REM.vehicle, aliases: ["cabin air"] }),
  P({ id: "coolant-service", categoryId: "vehicle", name: "Coolant Service", actionType: "service", dateLabel: "Next service", titleLabel: "Vehicle", defaultReminders: REM.vehicle, aliases: ["antifreeze"] }),
  P({ id: "transmission-service", categoryId: "vehicle", name: "Transmission Service", actionType: "service", dateLabel: "Next service", titleLabel: "Vehicle", defaultReminders: REM.vehicle, aliases: [] }),
  P({ id: "spark-plugs", categoryId: "vehicle", name: "Spark Plugs", actionType: "replace", dateLabel: "Next replacement", titleLabel: "Vehicle", defaultReminders: REM.vehicle, aliases: [] }),
  P({ id: "vehicle-inspection", categoryId: "vehicle", name: "Vehicle Inspection", actionType: "check", dateLabel: "Next inspection", titleLabel: "Vehicle", defaultReminders: REM.licence, aliases: ["safety check"] }),
  P({ id: "emissions-test", categoryId: "vehicle", name: "Emissions Test", actionType: "check", dateLabel: "Next test", titleLabel: "Vehicle", defaultReminders: REM.licence, aliases: ["smog"] }),
  P({ id: "maintenance-service", categoryId: "vehicle", name: "Maintenance Service", actionType: "service", dateLabel: "Next service", titleLabel: "Vehicle", defaultReminders: REM.vehicle, aliases: ["tune up"] }),
  P({ id: "vehicle-warranty", categoryId: "vehicle", name: "Warranty", actionType: "expires", dateLabel: "Warranty ends", titleLabel: "Vehicle", defaultReminders: REM.warranty, aliases: [] }),
  P({ id: "roadside-assistance", categoryId: "vehicle", name: "Roadside Assistance", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Provider", defaultReminders: REM.insurance, defaultRepeat: { kind: "yearly" }, aliases: ["cAA", "towing"] }),
  P({ id: "parking-permit-vehicle", categoryId: "vehicle", name: "Parking Permit", actionType: "expires", dateLabel: "Expiry date", titleLabel: "Permit", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "parking-pass", categoryId: "vehicle", name: "Parking Pass", actionType: "expires", dateLabel: "Expiry date", titleLabel: "Pass", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "toll-pass", categoryId: "vehicle", name: "Toll Pass", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Pass", defaultReminders: REM.membership, defaultRepeat: { kind: "yearly" }, aliases: ["transponder"] }),
  P({ id: "lease-end", categoryId: "vehicle", name: "Lease End", actionType: "expires", dateLabel: "Lease ends", titleLabel: "Vehicle", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "car-loan-vehicle", categoryId: "vehicle", name: "Car Loan", actionType: "pay", dateLabel: "Next payment", titleLabel: "Loan", defaultReminders: REM.subscription, defaultRepeat: { kind: "monthly" }, aliases: [] }),
  P({ id: "rental-return-vehicle", categoryId: "vehicle", name: "Rental Return", actionType: "return", dateLabel: "Return by", titleLabel: "Rental", defaultReminders: REM.return, aliases: [] }),
  P({ id: "motorcycle-insurance", categoryId: "vehicle", name: "Motorcycle Insurance", actionType: "renews", dateLabel: "Renewal date", defaultReminders: REM.insurance, defaultRepeat: { kind: "yearly" }, aliases: ["bike insurance"] }),
  P({ id: "motorcycle-registration", categoryId: "vehicle", name: "Motorcycle Registration", actionType: "renews", dateLabel: "Renewal date", defaultReminders: REM.licence, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "bike-maintenance", categoryId: "vehicle", name: "Bike Maintenance", actionType: "service", dateLabel: "Next service", defaultReminders: REM.vehicle, aliases: ["bicycle"] }),
  P({ id: "ebike-maintenance", categoryId: "vehicle", name: "E-bike Maintenance", actionType: "service", dateLabel: "Next service", defaultReminders: REM.vehicle, aliases: ["electric bike"] }),
  P({ id: "boat-registration", categoryId: "vehicle", name: "Boat Registration", actionType: "renews", dateLabel: "Renewal date", defaultReminders: REM.licence, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "boat-insurance", categoryId: "vehicle", name: "Boat Insurance", actionType: "renews", dateLabel: "Renewal date", defaultReminders: REM.insurance, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "other-vehicle-item", categoryId: "vehicle", name: "Other Vehicle Item", actionType: "service", dateLabel: "Next date", titleLabel: "Item", defaultReminders: REM.vehicle, aliases: [] }),

  // ── G · PEOPLE & IMPORTANT DATES ────────────────────────────────────────
  P({ id: "birthday", categoryId: "people", name: "Birthday", actionType: "birthday", dateLabel: "Birthday", titleLabel: "Who?", defaultReminders: REM.birthday, defaultRepeat: { kind: "yearly" }, aliases: ["birth day"], popular: true }),
  P({ id: "anniversary", categoryId: "people", name: "Anniversary", actionType: "anniversary", dateLabel: "Date", titleLabel: "Whose?", defaultReminders: REM.anniversary, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "wedding-anniversary", categoryId: "people", name: "Wedding Anniversary", actionType: "anniversary", dateLabel: "Date", titleLabel: "Who?", defaultReminders: REM.anniversary, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "relationship-anniversary", categoryId: "people", name: "Relationship Anniversary", actionType: "anniversary", dateLabel: "Date", titleLabel: "Who?", defaultReminders: REM.anniversary, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "memorial-date", categoryId: "people", name: "Memorial Date", actionType: "anniversary", dateLabel: "Date", titleLabel: "Who?", defaultReminders: REM.anniversary, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "graduation-anniversary", categoryId: "people", name: "Graduation Anniversary", actionType: "anniversary", dateLabel: "Date", titleLabel: "Who?", defaultReminders: REM.anniversary, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "important-family-date", categoryId: "people", name: "Important Family Date", actionType: "custom", dateLabel: "Date", titleLabel: "What?", defaultReminders: REM.birthday, defaultRepeat: { kind: "yearly" }, aliases: ["family"] }),
  P({ id: "child-school-date", categoryId: "people", name: "Child School Date", actionType: "due", dateLabel: "Date", titleLabel: "For", defaultReminders: REM.birthday, aliases: [] }),
  P({ id: "school-registration", categoryId: "people", name: "School Registration", actionType: "due", dateLabel: "Deadline", titleLabel: "For", defaultReminders: REM.licence, aliases: ["enrollment"] }),
  P({ id: "school-deadline", categoryId: "people", name: "School Deadline", actionType: "due", dateLabel: "Deadline", titleLabel: "For", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "parent-meeting", categoryId: "people", name: "Parent Meeting", actionType: "due", dateLabel: "Date", titleLabel: "For", defaultReminders: REM.birthday, aliases: ["pta"] }),
  P({ id: "daycare-deadline", categoryId: "people", name: "Daycare Deadline", actionType: "due", dateLabel: "Deadline", titleLabel: "For", defaultReminders: REM.licence, aliases: ["childcare"] }),
  P({ id: "camp-registration", categoryId: "people", name: "Camp Registration", actionType: "due", dateLabel: "Deadline", titleLabel: "For", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "wedding", categoryId: "people", name: "Wedding", actionType: "custom", dateLabel: "Date", titleLabel: "Whose?", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "baby-due-date", categoryId: "people", name: "Baby Due Date", actionType: "custom", dateLabel: "Due date", titleLabel: "For", defaultReminders: REM.licence, aliases: ["pregnancy"] }),
  P({ id: "retirement-date", categoryId: "people", name: "Retirement Date", actionType: "custom", dateLabel: "Date", titleLabel: "Who?", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "moving-date", categoryId: "people", name: "Moving Date", actionType: "custom", dateLabel: "Date", defaultReminders: REM.licence, aliases: ["move"] }),
  P({ id: "important-personal-deadline", categoryId: "people", name: "Important Personal Deadline", actionType: "due", dateLabel: "Deadline", titleLabel: "What?", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "gift-reminder", categoryId: "people", name: "Gift Reminder", actionType: "due", dateLabel: "Buy by", titleLabel: "For", defaultReminders: REM.birthday, aliases: ["present"] }),
  P({ id: "holiday-preparation", categoryId: "people", name: "Holiday Preparation", actionType: "due", dateLabel: "Date", titleLabel: "Which?", defaultReminders: REM.birthday, aliases: [] }),
  P({ id: "custom-important-date", categoryId: "people", name: "Custom Important Date", actionType: "custom", dateLabel: "Date", titleLabel: "What?", defaultReminders: REM.birthday, defaultRepeat: { kind: "yearly" }, aliases: [] }),

  // ── H · HEALTH & CARE ───────────────────────────────────────────────────
  P({ id: "medication-expiry", categoryId: "health", name: "Medication Expiry", actionType: "expires", dateLabel: "Expiry date", titleLabel: "Medication", defaultReminders: REM.medication, aliases: ["medicine", "drug"] }),
  P({ id: "prescription-renewal", categoryId: "health", name: "Prescription Renewal", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Medication", defaultReminders: REM.medication, aliases: ["refill"] }),
  P({ id: "prescription-refill", categoryId: "health", name: "Prescription Refill", actionType: "refill", dateLabel: "Refill by", titleLabel: "Medication", defaultReminders: REM.medication, aliases: [] }),
  P({ id: "vitamin-expiry", categoryId: "health", name: "Vitamin Expiry", actionType: "expires", dateLabel: "Expiry date", titleLabel: "Vitamin", defaultReminders: REM.medication, aliases: ["supplement"] }),
  P({ id: "first-aid-kit-expiry", categoryId: "health", name: "First Aid Kit Expiry", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.medication, aliases: [] }),
  P({ id: "epipen-expiry", categoryId: "health", name: "EpiPen Expiry", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.medication, aliases: [] }),
  P({ id: "contact-lens-replacement", categoryId: "health", name: "Contact Lens Replacement", actionType: "replace", dateLabel: "Next replacement", defaultReminders: REM.medication, aliases: ["contacts"] }),
  P({ id: "glasses-prescription-review", categoryId: "health", name: "Glasses Prescription Review", actionType: "review", dateLabel: "Next review", defaultReminders: REM.health, aliases: ["eye glasses"] }),
  P({ id: "dental-checkup", categoryId: "health", name: "Dental Checkup", actionType: "check", dateLabel: "Next checkup", defaultReminders: REM.health, aliases: ["dentist"] }),
  P({ id: "dental-cleaning", categoryId: "health", name: "Dental Cleaning", actionType: "service", dateLabel: "Next cleaning", defaultReminders: REM.health, aliases: ["hygiene"] }),
  P({ id: "eye-exam", categoryId: "health", name: "Eye Exam", actionType: "check", dateLabel: "Next exam", defaultReminders: REM.health, aliases: ["optometrist"] }),
  P({ id: "physical-checkup", categoryId: "health", name: "Physical Checkup", actionType: "check", dateLabel: "Next checkup", defaultReminders: REM.health, aliases: ["annual physical"] }),
  P({ id: "vaccination", categoryId: "health", name: "Vaccination", actionType: "due", dateLabel: "Next date", titleLabel: "Vaccine", defaultReminders: REM.health, aliases: ["vaccine", "shot"] }),
  P({ id: "booster", categoryId: "health", name: "Booster", actionType: "due", dateLabel: "Next date", titleLabel: "Booster", defaultReminders: REM.health, aliases: [] }),
  P({ id: "flu-shot", categoryId: "health", name: "Flu Shot", actionType: "due", dateLabel: "Next date", defaultReminders: REM.health, defaultRepeat: { kind: "yearly" }, aliases: ["influenza"] }),
  P({ id: "medical-device-maintenance", categoryId: "health", name: "Medical Device Maintenance", actionType: "service", dateLabel: "Next service", titleLabel: "Device", defaultReminders: REM.medication, aliases: [] }),
  P({ id: "medical-device-supply-replacement", categoryId: "health", name: "Medical Device Supply Replacement", actionType: "replace", dateLabel: "Next replacement", titleLabel: "Supply", defaultReminders: REM.medication, aliases: [] }),
  P({ id: "other-health-reminder", categoryId: "health", name: "Other Health Reminder", actionType: "custom", dateLabel: "Next date", titleLabel: "What?", defaultReminders: REM.health, aliases: [] }),

  // ── I · FOOD & PANTRY (special module) ──────────────────────────────────
  P({ id: "food-item", categoryId: "food", name: "Food Item", actionType: "best-before", dateLabel: "Best before", titleLabel: "Product name", defaultReminders: REM.food, verb: { action: "Consumed", historyType: "consumed", secondary: { action: "Discarded", historyType: "discarded" } }, aliases: ["milk", "cheese", "meat", "yogurt", "produce", "leftovers", "pantry"], popular: true, special: "food", optionalFields: ["notes", "photo", "custom-reminders"] }),

  // ── J · PETS ────────────────────────────────────────────────────────────
  P({ id: "pet-vaccination", categoryId: "pets", name: "Vaccination", actionType: "due", dateLabel: "Next date", titleLabel: "Pet", defaultReminders: REM.health, aliases: ["vaccine"] }),
  P({ id: "rabies-vaccination", categoryId: "pets", name: "Rabies Vaccination", actionType: "due", dateLabel: "Next date", titleLabel: "Pet", defaultReminders: REM.health, defaultRepeat: { kind: "yearly" }, aliases: ["rabies shot"] }),
  P({ id: "pet-medication", categoryId: "pets", name: "Medication", actionType: "due", dateLabel: "Next date", titleLabel: "Pet", defaultReminders: REM.medication, aliases: ["medicine"] }),
  P({ id: "flea-treatment", categoryId: "pets", name: "Flea Treatment", actionType: "service", dateLabel: "Next date", titleLabel: "Pet", defaultReminders: REM.medication, aliases: ["fleas"] }),
  P({ id: "tick-treatment", categoryId: "pets", name: "Tick Treatment", actionType: "service", dateLabel: "Next date", titleLabel: "Pet", defaultReminders: REM.medication, aliases: ["ticks"] }),
  P({ id: "deworming", categoryId: "pets", name: "Deworming", actionType: "service", dateLabel: "Next date", titleLabel: "Pet", defaultReminders: REM.medication, aliases: ["worms"] }),
  P({ id: "vet-checkup", categoryId: "pets", name: "Vet Checkup", actionType: "check", dateLabel: "Next checkup", titleLabel: "Pet", defaultReminders: REM.health, aliases: ["veterinarian"] }),
  P({ id: "pet-dental-check", categoryId: "pets", name: "Dental Check", actionType: "check", dateLabel: "Next check", titleLabel: "Pet", defaultReminders: REM.health, aliases: [] }),
  P({ id: "grooming", categoryId: "pets", name: "Grooming", actionType: "service", dateLabel: "Next date", titleLabel: "Pet", defaultReminders: REM.health, aliases: ["haircut"] }),
  P({ id: "pet-licence-renewal", categoryId: "pets", name: "Licence Renewal", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Pet", defaultReminders: REM.licence, defaultRepeat: { kind: "yearly" }, aliases: ["dog licence"] }),
  P({ id: "pet-insurance", categoryId: "pets", name: "Pet Insurance", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Pet", defaultReminders: REM.insurance, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "microchip-registration", categoryId: "pets", name: "Microchip Registration", actionType: "review", dateLabel: "Next review", titleLabel: "Pet", defaultReminders: REM.general, aliases: [] }),
  P({ id: "pet-food-subscription", categoryId: "pets", name: "Food Subscription", actionType: "renews", dateLabel: "Next renewal", titleLabel: "Pet", defaultReminders: REM.subscription, defaultRepeat: { kind: "monthly" }, aliases: [] }),
  P({ id: "pet-medication-refill", categoryId: "pets", name: "Medication Refill", actionType: "refill", dateLabel: "Refill by", titleLabel: "Pet", defaultReminders: REM.medication, aliases: [] }),
  P({ id: "other-pet-reminder", categoryId: "pets", name: "Other Pet Reminder", actionType: "custom", dateLabel: "Next date", titleLabel: "Pet", defaultReminders: REM.health, aliases: [] }),

  // ── K · WORK, EDUCATION & CERTIFICATIONS ────────────────────────────────
  P({ id: "professional-certification", categoryId: "work", name: "Professional Certification", actionType: "expires", dateLabel: "Expiry date", titleLabel: "Certification", defaultReminders: REM.certification, aliases: ["cert", "certificate"] }),
  P({ id: "safety-certification", categoryId: "work", name: "Safety Certification", actionType: "expires", dateLabel: "Expiry date", titleLabel: "Certification", defaultReminders: REM.certification, aliases: ["safety course"] }),
  P({ id: "first-aid-cert", categoryId: "work", name: "First Aid", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.certification, aliases: ["cpr"] }),
  P({ id: "cpr-cert", categoryId: "work", name: "CPR", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.certification, aliases: ["resuscitation"] }),
  P({ id: "whmis", categoryId: "work", name: "WHMIS", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.certification, aliases: ["hazard"] }),
  P({ id: "csts", categoryId: "work", name: "CSTS", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.certification, aliases: ["safety training"] }),
  P({ id: "training-renewal", categoryId: "work", name: "Training Renewal", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Training", defaultReminders: REM.certification, aliases: [] }),
  P({ id: "licence-renewal-work", categoryId: "work", name: "Licence Renewal", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Licence", defaultReminders: REM.certification, aliases: [] }),
  P({ id: "security-clearance", categoryId: "work", name: "Security Clearance", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.certification, aliases: [] }),
  P({ id: "background-check-validity", categoryId: "work", name: "Background Check Validity", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.certification, aliases: ["criminal record"] }),
  P({ id: "police-check-validity", categoryId: "work", name: "Police Check Validity", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.certification, aliases: ["police record"] }),
  P({ id: "employment-contract", categoryId: "work", name: "Employment Contract", actionType: "review", dateLabel: "Next review", defaultReminders: REM.licence, aliases: ["job contract"] }),
  P({ id: "probation-end", categoryId: "work", name: "Probation End", actionType: "due", dateLabel: "Date", defaultReminders: REM.licence, aliases: ["trial period"] }),
  P({ id: "performance-review", categoryId: "work", name: "Performance Review", actionType: "due", dateLabel: "Date", titleLabel: "For", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "professional-membership", categoryId: "work", name: "Professional Membership", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Association", defaultReminders: REM.membership, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "union-membership", categoryId: "work", name: "Union Membership", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Union", defaultReminders: REM.membership, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "course-deadline", categoryId: "work", name: "Course Deadline", actionType: "due", dateLabel: "Deadline", titleLabel: "Course", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "exam", categoryId: "work", name: "Exam", actionType: "due", dateLabel: "Exam date", titleLabel: "Exam", defaultReminders: REM.licence, aliases: ["test"] }),
  P({ id: "exam-registration", categoryId: "work", name: "Exam Registration", actionType: "due", dateLabel: "Deadline", titleLabel: "Exam", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "tuition-deadline", categoryId: "work", name: "Tuition Deadline", actionType: "due", dateLabel: "Deadline", defaultReminders: REM.licence, aliases: ["fees"] }),
  P({ id: "student-permit", categoryId: "work", name: "Student Permit", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.immigration, aliases: [] }),
  P({ id: "student-id-work", categoryId: "work", name: "Student ID", actionType: "expires", dateLabel: "Expiry date", defaultReminders: REM.general, aliases: [] }),
  P({ id: "scholarship-deadline", categoryId: "work", name: "Scholarship Deadline", actionType: "due", dateLabel: "Deadline", titleLabel: "For", defaultReminders: REM.licence, aliases: ["grant"] }),
  P({ id: "application-deadline", categoryId: "work", name: "Application Deadline", actionType: "due", dateLabel: "Deadline", titleLabel: "For", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "credential-renewal", categoryId: "work", name: "Credential Renewal", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Credential", defaultReminders: REM.certification, aliases: [] }),
  P({ id: "other-work-deadline", categoryId: "work", name: "Other Work Deadline", actionType: "due", dateLabel: "Deadline", titleLabel: "What?", defaultReminders: REM.licence, aliases: [] }),
  P({ id: "other-education-deadline", categoryId: "work", name: "Other Education Deadline", actionType: "due", dateLabel: "Deadline", titleLabel: "What?", defaultReminders: REM.licence, aliases: [] }),

  // ── L · MEMBERSHIPS & LICENCES ──────────────────────────────────────────
  P({ id: "gym-membership-l", categoryId: "memberships", name: "Gym", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Gym", defaultReminders: REM.membership, defaultRepeat: { kind: "monthly" }, aliases: ["fitness"] }),
  P({ id: "warehouse-membership", categoryId: "memberships", name: "Warehouse Membership", actionType: "renews", dateLabel: "Renewal date", defaultReminders: REM.membership, defaultRepeat: { kind: "yearly" }, aliases: ["costco", "sam's club"] }),
  P({ id: "professional-association", categoryId: "memberships", name: "Professional Association", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Association", defaultReminders: REM.membership, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "club-membership", categoryId: "memberships", name: "Club Membership", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Club", defaultReminders: REM.membership, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "library-membership", categoryId: "memberships", name: "Library Membership", actionType: "renews", dateLabel: "Renewal date", defaultReminders: REM.membership, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "sports-club", categoryId: "memberships", name: "Sports Club", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Club", defaultReminders: REM.membership, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "golf-membership", categoryId: "memberships", name: "Golf Membership", actionType: "renews", dateLabel: "Renewal date", defaultReminders: REM.membership, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "recreation-membership", categoryId: "memberships", name: "Recreation Membership", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Facility", defaultReminders: REM.membership, defaultRepeat: { kind: "yearly" }, aliases: ["rec centre"] }),
  P({ id: "software-licence", categoryId: "memberships", name: "Software Licence", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Software", defaultReminders: REM.membership, defaultRepeat: { kind: "yearly" }, aliases: ["license key"] }),
  P({ id: "domain-name", categoryId: "memberships", name: "Domain Name", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Domain", defaultReminders: REM.membership, defaultRepeat: { kind: "yearly" }, aliases: ["website"] }),
  P({ id: "professional-licence", categoryId: "memberships", name: "Professional Licence", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Licence", defaultReminders: REM.certification, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "trade-licence-l", categoryId: "memberships", name: "Trade Licence", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Licence", defaultReminders: REM.certification, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "security-licence-l", categoryId: "memberships", name: "Security Licence", actionType: "renews", dateLabel: "Renewal date", defaultReminders: REM.certification, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "business-licence", categoryId: "memberships", name: "Business Licence", actionType: "renews", dateLabel: "Renewal date", defaultReminders: REM.certification, defaultRepeat: { kind: "yearly" }, aliases: ["business registration"] }),
  P({ id: "fishing-licence-l", categoryId: "memberships", name: "Fishing Licence", actionType: "renews", dateLabel: "Renewal date", defaultReminders: REM.licence, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "hunting-licence-l", categoryId: "memberships", name: "Hunting Licence", actionType: "renews", dateLabel: "Renewal date", defaultReminders: REM.licence, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "boating-licence-l", categoryId: "memberships", name: "Boating Licence", actionType: "renews", dateLabel: "Renewal date", defaultReminders: REM.licence, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "other-membership", categoryId: "memberships", name: "Other Membership", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Membership", defaultReminders: REM.membership, defaultRepeat: { kind: "yearly" }, aliases: [] }),
  P({ id: "other-licence", categoryId: "memberships", name: "Other Licence", actionType: "renews", dateLabel: "Renewal date", titleLabel: "Licence", defaultReminders: REM.licence, defaultRepeat: { kind: "yearly" }, aliases: [] }),

  // ── M · PERSONAL PROPERTY ───────────────────────────────────────────────
  P({ id: "electronics-property", categoryId: "property", name: "Electronics", actionType: "review", dateLabel: "Next review", titleLabel: "Item", defaultReminders: REM.warranty, aliases: ["gadget"] }),
  P({ id: "phone-property", categoryId: "property", name: "Phone", actionType: "review", dateLabel: "Next review", titleLabel: "Model", defaultReminders: REM.warranty, aliases: ["smartphone"] }),
  P({ id: "laptop-property", categoryId: "property", name: "Laptop", actionType: "review", dateLabel: "Next review", titleLabel: "Model", defaultReminders: REM.warranty, aliases: ["computer"] }),
  P({ id: "camera-property", categoryId: "property", name: "Camera", actionType: "review", dateLabel: "Next review", titleLabel: "Item", defaultReminders: REM.warranty, aliases: [] }),
  P({ id: "watch-property", categoryId: "property", name: "Watch", actionType: "review", dateLabel: "Next review", titleLabel: "Item", defaultReminders: REM.warranty, aliases: ["timepiece"] }),
  P({ id: "jewelry-property", categoryId: "property", name: "Jewelry", actionType: "review", dateLabel: "Next review", titleLabel: "Item", defaultReminders: REM.warranty, aliases: [] }),
  P({ id: "tools-property", categoryId: "property", name: "Tools", actionType: "review", dateLabel: "Next review", titleLabel: "Item", defaultReminders: REM.warranty, aliases: [] }),
  P({ id: "furniture-property", categoryId: "property", name: "Furniture", actionType: "review", dateLabel: "Next review", titleLabel: "Item", defaultReminders: REM.warranty, aliases: [] }),
  P({ id: "appliance-property", categoryId: "property", name: "Appliance", actionType: "review", dateLabel: "Next review", titleLabel: "Item", defaultReminders: REM.warranty, aliases: ["fridge", "washer"] }),
  P({ id: "bicycle-property", categoryId: "property", name: "Bicycle", actionType: "review", dateLabel: "Next review", titleLabel: "Item", defaultReminders: REM.vehicle, aliases: ["bike"] }),
  P({ id: "sports-equipment", categoryId: "property", name: "Sports Equipment", actionType: "review", dateLabel: "Next review", titleLabel: "Item", defaultReminders: REM.warranty, aliases: [] }),
  P({ id: "musical-instrument", categoryId: "property", name: "Musical Instrument", actionType: "review", dateLabel: "Next review", titleLabel: "Item", defaultReminders: REM.warranty, aliases: ["guitar"] }),
  P({ id: "collectible", categoryId: "property", name: "Collectible", actionType: "review", dateLabel: "Next review", titleLabel: "Item", defaultReminders: REM.warranty, aliases: [] }),
  P({ id: "other-valuable-item", categoryId: "property", name: "Other Valuable Item", actionType: "review", dateLabel: "Next review", titleLabel: "Item", defaultReminders: REM.warranty, aliases: [] }),

  // ── N · OTHER ───────────────────────────────────────────────────────────
  P({ id: "deadline", categoryId: "other", name: "Deadline", actionType: "due", dateLabel: "Deadline", titleLabel: "What?", defaultReminders: REM.general, aliases: ["due date"] }),
  P({ id: "renewal", categoryId: "other", name: "Renewal", actionType: "renews", dateLabel: "Renewal date", titleLabel: "What?", defaultReminders: REM.general, aliases: [] }),
  P({ id: "expiry", categoryId: "other", name: "Expiry", actionType: "expires", dateLabel: "Expiry date", titleLabel: "What?", defaultReminders: REM.general, aliases: ["expiration"] }),
  P({ id: "replacement", categoryId: "other", name: "Replacement", actionType: "replace", dateLabel: "Next replacement", titleLabel: "What?", defaultReminders: REM.filter, aliases: [] }),
  P({ id: "maintenance", categoryId: "other", name: "Maintenance", actionType: "service", dateLabel: "Next service", titleLabel: "What?", defaultReminders: REM.filter, aliases: [] }),
  P({ id: "payment", categoryId: "other", name: "Payment", actionType: "pay", dateLabel: "Due date", titleLabel: "What?", defaultReminders: REM.subscription, aliases: ["bill"] }),
  P({ id: "appointment", categoryId: "other", name: "Appointment", actionType: "due", dateLabel: "Date", titleLabel: "What?", defaultReminders: REM.birthday, aliases: ["meeting", "booking"] }),
  P({ id: "return", categoryId: "other", name: "Return", actionType: "return", dateLabel: "Return by", titleLabel: "What?", defaultReminders: REM.return, aliases: [] }),
  P({ id: "review", categoryId: "other", name: "Review", actionType: "review", dateLabel: "Next review", titleLabel: "What?", defaultReminders: REM.general, aliases: [] }),
  P({ id: "custom-item", categoryId: "other", name: "Custom Item", actionType: "custom", dateLabel: "Next date", titleLabel: "What?", defaultReminders: REM.general, aliases: ["anything"], popular: true }),
];

export const PRESET_BY_ID: Record<string, Preset> = Object.fromEntries(
  PRESETS.map((p) => [p.id, p]),
);

export const CATEGORY_BY_ID: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
);

export const MAJOR_CATEGORIES = CATEGORIES.filter((c) => c.major);
export const MINOR_CATEGORIES = CATEGORIES.filter((c) => !c.major);

export const POPULAR_PRESETS = PRESETS.filter((p) => p.popular);