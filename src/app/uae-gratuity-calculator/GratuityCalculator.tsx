"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Calculator,
  CheckCircle2,
  Clock3,
  FileText,
  Sparkles,
} from "lucide-react";
import {
  calculateUAEGratuity,
  formatAED,
  formatServiceYears,
} from "@/lib/gratuity";

const exampleScenarios = [
  {
    basicSalary: "5000",
    endDate: "2026-04-10",
    label: "3 years on AED 5,000",
    startDate: "2023-04-10",
    unpaidLeaveDays: "0",
  },
  {
    basicSalary: "7000",
    endDate: "2026-04-10",
    label: "5+ years on AED 7,000",
    startDate: "2020-01-01",
    unpaidLeaveDays: "14",
  },
  {
    basicSalary: "12000",
    endDate: "2026-04-10",
    label: "Long-service example",
    startDate: "2017-06-01",
    unpaidLeaveDays: "30",
  },
];

interface FormState {
  basicSalary: string;
  endDate: string;
  startDate: string;
  unpaidLeaveDays: string;
}

const initialForm: FormState = {
  basicSalary: "",
  endDate: "",
  startDate: "",
  unpaidLeaveDays: "0",
};

function formatDays(value: number) {
  return `${value.toFixed(2)} days`;
}

export default function GratuityCalculator() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const calculation = calculateUAEGratuity({
    basicMonthlySalary: Number(form.basicSalary),
    endDate: form.endDate,
    startDate: form.startDate,
    unpaidLeaveDays: Number(form.unpaidLeaveDays || 0),
  });

  const showResult =
    submitted && Boolean(form.startDate || form.endDate || form.basicSalary);

  const applyExample = (example: FormState) => {
    setForm(example);
    setSubmitted(true);
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
        }}
        className="card-surface p-6 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-400/10 border border-gold-400/15 mb-4">
              <Calculator className="w-4 h-4 text-gold-400" />
              <span className="text-xs font-display font-semibold uppercase tracking-[0.18em] text-gold-400/85">
                Free Tool
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
              Calculate Your UAE Gratuity
            </h2>
            <p className="text-sm sm:text-base text-white/45 max-w-xl leading-relaxed">
              Estimate your end-of-service gratuity using the standard private-sector
              formula based on your last basic salary, service period and unpaid
              leave days.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs font-display font-semibold uppercase tracking-[0.16em] text-white/35 mb-3">
            Quick examples
          </p>
          <div className="flex flex-wrap gap-2">
            {exampleScenarios.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => applyExample(example)}
                className="px-3 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-sm text-white/65 hover:text-white hover:border-gold-400/30 hover:bg-gold-400/[0.06] transition-colors"
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-white/70 mb-2 block">
              Employment start date
            </span>
            <div className="relative">
              <CalendarDays className="w-4 h-4 text-white/30 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
                className="w-full rounded-2xl bg-white/[0.03] border border-white/[0.08] pl-11 pr-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-gold-400/35"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-white/70 mb-2 block">
              Employment end date
            </span>
            <div className="relative">
              <Clock3 className="w-4 h-4 text-white/30 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={form.endDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    endDate: event.target.value,
                  }))
                }
                className="w-full rounded-2xl bg-white/[0.03] border border-white/[0.08] pl-11 pr-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-gold-400/35"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-white/70 mb-2 block">
              Last monthly basic salary (AED)
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={form.basicSalary}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  basicSalary: event.target.value,
                }))
              }
              placeholder="e.g. 5000"
              className="w-full rounded-2xl bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-gold-400/35"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-white/70 mb-2 block">
              Unpaid leave or unpaid absence days
            </span>
            <input
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={form.unpaidLeaveDays}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  unpaidLeaveDays: event.target.value,
                }))
              }
              placeholder="0"
              className="w-full rounded-2xl bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-gold-400/35"
            />
          </label>
        </div>

        <div className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-white/55 leading-relaxed">
              Use your <span className="text-white/80 font-medium">basic salary only</span>.
              Housing, transport, commissions, bonuses, notice pay and unused leave
              encashment are not part of this estimate.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            className="btn-primary inline-flex items-center justify-center gap-2 text-sm"
          >
            <Calculator className="w-4 h-4" />
            Calculate gratuity
          </button>
          <Link
            href="/chat?q=gratuity"
            className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
          >
            Ask Sidqo to review it
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </form>

      <div className="card-surface p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <p className="text-xs font-display font-semibold uppercase tracking-[0.16em] text-white/35">
            Result
          </p>
        </div>

        {!showResult ? (
          <div className="rounded-3xl border border-dashed border-white/[0.12] bg-white/[0.02] px-5 py-10 text-center">
            <p className="text-lg font-display font-semibold text-white/85 mb-2">
              Your estimate will appear here
            </p>
            <p className="text-sm text-white/40 max-w-md mx-auto leading-relaxed">
              Enter your dates and last basic salary to get an instant gratuity
              estimate plus a clean breakdown you can use in a settlement check.
            </p>
          </div>
        ) : !calculation.valid ? (
          <div className="rounded-3xl border border-red-400/15 bg-red-400/[0.05] p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-300 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-display font-semibold text-white mb-1">
                  Calculation needs one more detail
                </p>
                <p className="text-sm text-white/55 leading-relaxed">
                  {calculation.message}
                </p>
              </div>
            </div>
          </div>
        ) : !calculation.eligible ? (
          <div className="space-y-5">
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-white/35 font-display font-semibold mb-3">
                Estimated gratuity
              </p>
              <p className="font-display text-4xl sm:text-5xl font-bold text-white mb-3">
                {formatAED(0)}
              </p>
              <p className="text-sm text-white/55 leading-relaxed">
                {calculation.message} You are currently at{" "}
                <span className="text-white/85 font-medium">
                  {formatServiceYears(calculation.serviceYears)}
                </span>{" "}
                of eligible service.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                <p className="text-white/35 mb-2">Eligible service days</p>
                <p className="text-xl font-display font-semibold text-white">
                  {calculation.eligibleServiceDays.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                <p className="text-white/35 mb-2">Days needed to reach 1 year</p>
                <p className="text-xl font-display font-semibold text-white">
                  {(calculation.shortfallDays ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-[28px] border border-gold-400/15 bg-gradient-to-br from-gold-400/[0.08] via-white/[0.02] to-teal-500/[0.05] p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <p className="text-xs uppercase tracking-[0.18em] text-white/40 font-display font-semibold">
                  Estimated gratuity
                </p>
              </div>
              <p className="font-display text-4xl sm:text-5xl font-bold text-white mb-3">
                {formatAED(calculation.grossGratuity)}
              </p>
              <p className="text-sm text-white/55 leading-relaxed">
                Based on{" "}
                <span className="text-white/85 font-medium">
                  {formatServiceYears(calculation.serviceYears)}
                </span>{" "}
                of eligible service and a last basic salary of{" "}
                <span className="text-white/85 font-medium">
                  {formatAED(Number(form.basicSalary))}
                </span>
                .
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                <p className="text-sm text-white/35 mb-2">Daily basic salary</p>
                <p className="text-xl font-display font-semibold text-white">
                  {formatAED(calculation.dailyBasicSalary)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                <p className="text-sm text-white/35 mb-2">Eligible service</p>
                <p className="text-xl font-display font-semibold text-white">
                  {calculation.eligibleServiceDays.toLocaleString()} days
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <p className="font-display font-semibold text-white">
                  How the estimate is built
                </p>
              </div>
              <div className="divide-y divide-white/[0.06]">
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white/80 font-medium">
                      First 5 years at 21 days per year
                    </p>
                    <p className="text-sm text-white/35">
                      {formatDays(calculation.firstFiveYearsGratuityDays)}
                    </p>
                  </div>
                  <p className="text-white font-display font-semibold">
                    {formatAED(calculation.firstFiveYearsAmount)}
                  </p>
                </div>
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white/80 font-medium">
                      Service after 5 years at 30 days per year
                    </p>
                    <p className="text-sm text-white/35">
                      {formatDays(calculation.afterFiveYearsGratuityDays)}
                    </p>
                  </div>
                  <p className="text-white font-display font-semibold">
                    {formatAED(calculation.afterFiveYearsAmount)}
                  </p>
                </div>
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white/80 font-medium">Total gratuity days</p>
                    <p className="text-sm text-white/35">
                      Before any statutory cap
                    </p>
                  </div>
                  <p className="text-white font-display font-semibold">
                    {formatDays(calculation.totalGratuityDays)}
                  </p>
                </div>
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white/80 font-medium">Statutory maximum</p>
                    <p className="text-sm text-white/35">
                      Total gratuity cannot exceed two years of wage
                    </p>
                  </div>
                  <p className="text-white font-display font-semibold">
                    {formatAED(calculation.statutoryMaximum)}
                  </p>
                </div>
              </div>
            </div>

            {calculation.cappedAtStatutoryMaximum && (
              <div className="rounded-2xl border border-gold-400/15 bg-gold-400/[0.05] p-4">
                <p className="text-sm text-white/70 leading-relaxed">
                  Your raw estimate is above the legal maximum, so the result has
                  been capped at two years of basic salary.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-white/55 leading-relaxed">
                  This is an estimate for the standard private-sector gratuity
                  formula. Your final settlement can still include unpaid salary,
                  notice pay, unused leave encashment, deductions lawfully owed by
                  the worker, or Savings Scheme treatment.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
