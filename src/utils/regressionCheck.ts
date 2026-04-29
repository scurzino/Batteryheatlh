export interface RegressionResult {
    isOutlier: boolean;
    deviation: number;
    sigma: number;
    predicted: number;
    zScore: number;
}

function fitExponential(
    peers: Array<{ mileage: number; soh: number }>
): { A: number; k: number } | null {
    const valid = peers.filter((p) => p.soh > 0);
    if (valid.length < 2) return null;

    const n = valid.length;
    const xs = valid.map((p) => p.mileage);
    const ys = valid.map((p) => Math.log(p.soh));

    const xBar = xs.reduce((s, x) => s + x, 0) / n;
    const yBar = ys.reduce((s, y) => s + y, 0) / n;

    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
        num += (xs[i] - xBar) * (ys[i] - yBar);
        den += (xs[i] - xBar) ** 2;
    }

    if (den === 0) return null;

    const slope = num / den;
    const intercept = yBar - slope * xBar;

    const A = Math.exp(intercept);
    const k = -slope;

    return { A, k };
}

function predictExp(A: number, k: number, mileage: number): number {
    return Math.min(100, Math.max(0, A * Math.exp(-k * mileage)));
}

/**
 * Returns the exponential regression curve points for chart overlay.
 * Always starts from mileage = 0 so the curve shows the full decay shape.
 */
export function getRegressionLine(
    peers: Array<{ mileage: number; soh: number }>,
    points = 50
): { mileage: number; predicted: number }[] {
    if (peers.length < 2) return [];

    const fit = fitExponential(peers);
    if (!fit) return [];

    const { A, k } = fit;
    // Calculate the end of the curve (at least 150,000 km, or max peer mileage + 20%)
    const maxPeer = Math.max(...peers.map((p) => p.mileage));
    const maxX = Math.max(maxPeer * 1.2, 150000);
    const step = maxX / (points - 1);

    return Array.from({ length: points }, (_, i) => {
        const mx = i * step;
        return { mileage: Math.round(mx), predicted: predictExp(A, k, mx), type: 'regression', soh: predictExp(A, k, mx) };
    });
}
