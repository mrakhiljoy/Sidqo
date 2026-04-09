export interface UAEGratuityInput {
  basicMonthlySalary: number;
  endDate: string;
  startDate: string;
  unpaidLeaveDays?: number;
}

export interface UAEGratuityCalculation {
  afterFiveYearsAmount: number;
  afterFiveYearsGratuityDays: number;
  calendarServiceDays: number;
  cappedAtStatutoryMaximum: boolean;
  dailyBasicSalary: number;
  eligible: boolean;
  eligibleServiceDays: number;
  firstFiveYearsAmount: number;
  firstFiveYearsGratuityDays: number;
  grossGratuity: number;
  message?: string;
  serviceYears: number;
  shortfallDays?: number;
  statutoryMaximum: number;
  totalGratuityDays: number;
  valid: boolean;
}

const DAYS_IN_YEAR = 365;
const DAYS_IN_MONTH = 30;
const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;

function parseIsoDate(value: string): Date | null {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function differenceInDays(start: Date, end: Date) {
  return Math.max(
    0,
    Math.floor((end.getTime() - start.getTime()) / MILLISECONDS_IN_DAY)
  );
}

function getDaysInUtcMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function addYearsClamped(date: Date, yearsToAdd: number) {
  const targetYear = date.getUTCFullYear() + yearsToAdd;
  const targetMonth = date.getUTCMonth();
  const targetDay = Math.min(
    date.getUTCDate(),
    getDaysInUtcMonth(targetYear, targetMonth)
  );

  return new Date(Date.UTC(targetYear, targetMonth, targetDay));
}

function differenceInServiceYears(start: Date, end: Date) {
  let completedYears = 0;
  let anniversary = start;

  while (true) {
    const nextAnniversary = addYearsClamped(anniversary, 1);
    if (nextAnniversary > end) {
      break;
    }

    anniversary = nextAnniversary;
    completedYears += 1;
  }

  const nextServiceYear = addYearsClamped(anniversary, 1);
  const currentServiceYearLength =
    differenceInDays(anniversary, nextServiceYear) || DAYS_IN_YEAR;
  const remainderDays = differenceInDays(anniversary, end);

  return completedYears + remainderDays / currentServiceYearLength;
}

export function calculateUAEGratuity(
  input: UAEGratuityInput
): UAEGratuityCalculation {
  const start = parseIsoDate(input.startDate);
  const end = parseIsoDate(input.endDate);

  if (!start || !end) {
    return {
      afterFiveYearsAmount: 0,
      afterFiveYearsGratuityDays: 0,
      calendarServiceDays: 0,
      cappedAtStatutoryMaximum: false,
      dailyBasicSalary: 0,
      eligible: false,
      eligibleServiceDays: 0,
      firstFiveYearsAmount: 0,
      firstFiveYearsGratuityDays: 0,
      grossGratuity: 0,
      message: "Enter a valid employment start date and end date.",
      serviceYears: 0,
      statutoryMaximum: 0,
      totalGratuityDays: 0,
      valid: false,
    };
  }

  if (end <= start) {
    return {
      afterFiveYearsAmount: 0,
      afterFiveYearsGratuityDays: 0,
      calendarServiceDays: 0,
      cappedAtStatutoryMaximum: false,
      dailyBasicSalary: 0,
      eligible: false,
      eligibleServiceDays: 0,
      firstFiveYearsAmount: 0,
      firstFiveYearsGratuityDays: 0,
      grossGratuity: 0,
      message: "The employment end date must be after the start date.",
      serviceYears: 0,
      statutoryMaximum: 0,
      totalGratuityDays: 0,
      valid: false,
    };
  }

  if (!Number.isFinite(input.basicMonthlySalary) || input.basicMonthlySalary <= 0) {
    return {
      afterFiveYearsAmount: 0,
      afterFiveYearsGratuityDays: 0,
      calendarServiceDays: differenceInDays(start, end),
      cappedAtStatutoryMaximum: false,
      dailyBasicSalary: 0,
      eligible: false,
      eligibleServiceDays: 0,
      firstFiveYearsAmount: 0,
      firstFiveYearsGratuityDays: 0,
      grossGratuity: 0,
      message: "Enter your last monthly basic salary in AED.",
      serviceYears: 0,
      statutoryMaximum: 0,
      totalGratuityDays: 0,
      valid: false,
    };
  }

  const calendarServiceDays = differenceInDays(start, end);
  const normalizedUnpaidLeaveDays = Math.max(
    0,
    Math.floor(input.unpaidLeaveDays ?? 0)
  );
  const eligibleServiceDays = Math.max(
    0,
    calendarServiceDays - normalizedUnpaidLeaveDays
  );
  const calendarServiceYears = differenceInServiceYears(start, end);
  const serviceYears = Math.max(
    0,
    calendarServiceYears - normalizedUnpaidLeaveDays / DAYS_IN_YEAR
  );
  const dailyBasicSalary = input.basicMonthlySalary / DAYS_IN_MONTH;
  const statutoryMaximum = input.basicMonthlySalary * 24;

  if (serviceYears < 1) {
    return {
      afterFiveYearsAmount: 0,
      afterFiveYearsGratuityDays: 0,
      calendarServiceDays,
      cappedAtStatutoryMaximum: false,
      dailyBasicSalary,
      eligible: false,
      eligibleServiceDays,
      firstFiveYearsAmount: 0,
      firstFiveYearsGratuityDays: 0,
      grossGratuity: 0,
      message:
        "Under Article 51, gratuity starts after at least 1 year of continuous service.",
      serviceYears,
      shortfallDays: Math.max(0, Math.ceil((1 - serviceYears) * DAYS_IN_YEAR)),
      statutoryMaximum,
      totalGratuityDays: 0,
      valid: true,
    };
  }

  const firstFiveYearsOfService = Math.min(serviceYears, 5);
  const afterFiveYearsOfService = Math.max(serviceYears - 5, 0);
  const firstFiveYearsGratuityDays = firstFiveYearsOfService * 21;
  const afterFiveYearsGratuityDays = afterFiveYearsOfService * 30;
  const totalGratuityDays =
    firstFiveYearsGratuityDays + afterFiveYearsGratuityDays;
  const firstFiveYearsAmount = firstFiveYearsGratuityDays * dailyBasicSalary;
  const afterFiveYearsAmount = afterFiveYearsGratuityDays * dailyBasicSalary;
  const uncappedGratuity = firstFiveYearsAmount + afterFiveYearsAmount;
  const grossGratuity = Math.min(uncappedGratuity, statutoryMaximum);

  return {
    afterFiveYearsAmount,
    afterFiveYearsGratuityDays,
    calendarServiceDays,
    cappedAtStatutoryMaximum: uncappedGratuity > statutoryMaximum,
    dailyBasicSalary,
    eligible: true,
    eligibleServiceDays,
    firstFiveYearsAmount,
    firstFiveYearsGratuityDays,
    grossGratuity,
    serviceYears,
    statutoryMaximum,
    totalGratuityDays,
    valid: true,
  };
}

export function formatAED(value: number) {
  return new Intl.NumberFormat("en-AE", {
    currency: "AED",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

export function formatServiceYears(value: number) {
  return `${value.toFixed(2)} years`;
}
