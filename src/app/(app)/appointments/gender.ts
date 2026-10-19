/** Shared gender helpers for appointment duration & price calculation. */

export type AppointmentGender = "male" | "female";

/** Gender-aware service columns used to resolve duration/price. */
export type GenderedService = {
  duration_minutes: number;
  cost: number;
  gender_specific: boolean;
  male_duration_minutes: number | null;
  male_cost: number | null;
  female_duration_minutes: number | null;
  female_cost: number | null;
};

const GENDERS: AppointmentGender[] = ["male", "female"];

/** Anything else (missing, tampered, unexpected) falls back to male. */
export function normalizeGender(value: unknown): AppointmentGender {
  return GENDERS.includes(value as AppointmentGender)
    ? (value as AppointmentGender)
    : "male";
}

function toInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

function toNumber(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Resolves a service's duration in minutes for the customer's gender. */
export function serviceDurationMinutes(
  service: GenderedService,
  gender: AppointmentGender,
): number {
  if (service.gender_specific) {
    const specific =
      gender === "male"
        ? service.male_duration_minutes
        : service.female_duration_minutes;
    if (specific !== null && specific !== undefined) {
      return toInt(specific, toInt(service.duration_minutes, 0));
    }
  }
  return toInt(service.duration_minutes, 0);
}

/** Resolves a service's price for the customer's gender. */
export function serviceCost(
  service: GenderedService,
  gender: AppointmentGender,
): number {
  if (service.gender_specific) {
    const specific = gender === "male" ? service.male_cost : service.female_cost;
    if (specific !== null && specific !== undefined) {
      return toNumber(specific, toNumber(service.cost, 0));
    }
  }
  return toNumber(service.cost, 0);
}

/** Formats a money amount without assuming a currency symbol. */
export function formatMoney(amount: number): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}