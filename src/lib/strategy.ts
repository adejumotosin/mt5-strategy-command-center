import type {
  PositionInput,
  PositionResult,
  SetupStatus,
  TradeRecord,
  ValidationRule,
} from "@/lib/types";

const EPSILON = 1e-10;

function roundDownToStep(value: number, step: number) {
  if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) return 0;
  const precision = Math.max(0, (step.toString().split(".")[1] ?? "").length);
  return Number((Math.floor((value + EPSILON) / step) * step).toFixed(precision));
}

export function calculatePosition(input: PositionInput): PositionResult {
  const stopDistance = Math.abs(input.entry - input.stop);
  const riskAmount = input.equity * (input.riskPercent / 100);
  const riskPerLot = stopDistance * input.valuePerPoint;

  if (
    input.equity <= 0 ||
    input.riskPercent <= 0 ||
    input.riskPercent > 0.5 ||
    stopDistance <= 0 ||
    input.valuePerPoint <= 0
  ) {
    return {
      riskAmount,
      stopDistance,
      rawVolume: 0,
      volume: 0,
      actualRisk: 0,
      target: input.entry,
      valid: false,
      warning: "Check equity, risk, entry, stop and the broker value per point.",
    };
  }

  const rawVolume = riskAmount / riskPerLot;
  const steppedVolume = roundDownToStep(rawVolume, input.volumeStep);
  const volume = Math.min(steppedVolume, input.volumeMax);
  const actualRisk = volume * riskPerLot;
  const targetDistance = stopDistance * 4;
  const target =
    input.direction === "Long"
      ? input.entry + targetDistance
      : input.entry - targetDistance;

  if (volume < input.volumeMin) {
    return {
      riskAmount,
      stopDistance,
      rawVolume,
      volume: 0,
      actualRisk: 0,
      target,
      valid: false,
      warning: "The risk-based volume is below this broker's minimum lot size.",
    };
  }

  return {
    riskAmount,
    stopDistance,
    rawVolume,
    volume,
    actualRisk,
    target,
    valid: true,
  };
}

export function getSetupStatus(rules: ValidationRule[]): SetupStatus {
  const required = rules.filter((rule) => rule.required);
  if (required.some((rule) => !rule.passed && rule.id.startsWith("block-"))) {
    return "blocked";
  }
  if (required.every((rule) => rule.passed)) return "valid";
  return "developing";
}

export function summarizeTrades(trades: TradeRecord[]) {
  if (trades.length === 0) {
    return {
      total: 0,
      winRate: 0,
      expectancy: 0,
      profitFactor: 0,
      totalR: 0,
      maxDrawdown: 0,
      planAdherence: 0,
      equityCurve: [0],
    };
  }

  let running = 0;
  let peak = 0;
  let maxDrawdown = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let wins = 0;
  let followedPlan = 0;
  const equityCurve = [0];

  for (const trade of trades) {
    running += trade.resultR;
    equityCurve.push(running);
    peak = Math.max(peak, running);
    maxDrawdown = Math.max(maxDrawdown, peak - running);
    if (trade.resultR > 0) {
      wins += 1;
      grossProfit += trade.resultR;
    } else if (trade.resultR < 0) {
      grossLoss += Math.abs(trade.resultR);
    }
    if (trade.followedPlan) followedPlan += 1;
  }

  return {
    total: trades.length,
    winRate: (wins / trades.length) * 100,
    expectancy: running / trades.length,
    profitFactor: grossLoss === 0 ? grossProfit : grossProfit / grossLoss,
    totalR: running,
    maxDrawdown,
    planAdherence: (followedPlan / trades.length) * 100,
    equityCurve,
  };
}

export function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}
