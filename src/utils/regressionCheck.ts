import { FlatEntry } from '../data/mockData';

export interface RegressionResult {
    isOutlier: boolean;
    deviation: number;    // actual - predicted (SOH space)
    sigma: number;        // standard deviation of residuals (SOH space)
    predicted: number;    // predicted SOH for this mileage
    zScore: number;       // |deviation| / sigma
}

/**
 * Fits an exponential decay model:  SOH = A * exp(-k * mileage)
 *
 * Linearisation: ln(SOH) = ln(A) - k * mileage
 * → OLS on (mileage, ln(SOH)) → back-transform A = exp(intercept), k = -slope
 *
 * Returns { A, k } or null if the fit is degenerate.
 */
function fitExponential(
    peers: Array<{ mileage: number; soh: number }>
): { A: number; k: number } | null {
    // Guard: need all SOH > 0 to take logarithm
    const valid = peers.filter((p) => p.soh > 0);
    if (valid.length < 2) return null;

    const n = valid.length;
    const xs = valid.map((p) => p.mileage);
    const ys = valid.map((p) => Math.log(p.soh));   // ln(SOH)

    const xBar = xs.reduce((s, x) => s + x, 0) / n;
    const yBar = ys.reduce((s, y) => s + y, 0) / n;

    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
        num += (xs[i] - xBar) * (ys[i] - yBar);
        den += (xs[i] - xBar) ** 2;
    }

    if (den === 0) return null;

    const slope = num / den;          // -k
    const intercept = yBar - slope * xBar; // ln(A)

    const A = Math.exp(intercept);
    const k = -slope;                 // k > 0 ↔ decay

    return { A, k };
}

/** Evaluate the exponential model at a given mileage. */
function predictExp(A: number, k: number, mileage: number): number {
    return Math.min(100, Math.max(0, A * Math.exp(-k * mileage)));
}

/**
 * Checks whether a new SOH entry is an outlier given the existing entries
 * for the same (OEM, model, year) combination.
 *
 * Model: exponential decay  SOH = A · exp(-k · mileage)
 *   - Captures fast initial degradation near 100 % SOH that gradually flattens.
 *   - Fit via linearisation ln(SOH) vs mileage → standard OLS.
 *   - Outlier flagged when |residual| > 2 σ (2-sigma rule, SOH space).
 */
export function checkRegression(
    entry: { oem: string; model: string; year: number; soh: number; mileage: number },
    existingEntries: FlatEntry[]
): RegressionResult {
    // Filter to same model group (approved entries only, at least 3 points)
    const peers = existingEntries.filter(
        (e) =>
            e.oem === entry.oem &&
            e.model === entry.model &&
            e.year === entry.year &&
            e.status === 'approved'
    );

    if (peers.length < 3) {
        return { isOutlier: false, deviation: 0, sigma: 0, predicted: entry.soh, zScore: 0 };
    }

    const fit = fitExponential(peers);

    if (!fit) {
        // Degenerate case – skip outlier detection
        return { isOutlier: false, deviation: 0, sigma: 0, predicted: entry.soh, zScore: 0 };
    }

    const { A, k } = fit;
    const predicted = predictExp(A, k, entry.mileage);

    // Compute residuals in original SOH space for robust sigma estimation
    const residuals = peers.map((p) => p.soh - predictExp(A, k, p.mileage));
    const n = residuals.length;
    const variance = residuals.reduce((s, r) => s + r ** 2, 0) / n;
    const sigma = Math.sqrt(variance);

    const deviation = entry.soh - predicted;
    const zScore = sigma === 0 ? 0 : Math.abs(deviation) / sigma;
    const isOutlier = zScore > 2;

    return { isOutlier, deviation, sigma, predicted, zScore };
}

/**
 * Returns the exponential regression curve points for chart overlay.
 * Always starts from mileage = 0 so the curve shows the full decay shape.
 */
export function getRegressionLine(
    oem: string,
    model: string,
    year: number,
    entries: FlatEntry[],
    points = 50
): { mileage: number; predicted: number }[] {
    const peers = entries.filter(
        (e) => e.oem === oem && e.model === model && e.year === year && e.status === 'approved'
    );
    if (peers.length < 2) return [];

    const fit = fitExponential(peers);
    if (!fit) return [];

    const { A, k } = fit;
    const maxX = Math.max(...peers.map((p) => p.mileage));
    const step = maxX / (points - 1);

    return Array.from({ length: points }, (_, i) => {
        const mx = i * step;
        return { mileage: Math.round(mx), predicted: predictExp(A, k, mx) };
    });
}
