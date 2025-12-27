// GrowthBook L3 Deep Mod: AI Experiment Analyzer
// Bayesian statistical analysis with anomaly detection

// --- Math & Stats Utilities ---

const logGamma = (z: number): number => {
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5
  ];
  let x = z, y = z;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += c[j] / ++y;
  return -tmp + Math.log(2.5066282746310005 * ser / x);
};

// --- Analysis Service ---

export interface ExperimentMetric {
  uniqueId: string;
  name: string;
  type: 'binomial' | 'count' | 'duration';
  control: { count: number; value: number };
  variation: { count: number; value: number };
}

export interface AnalysisResult {
  metricName: string;
  upliftPercent: number;
  chanceToBeatControl: number;
  risk: number;
  isAnomaly: boolean;
  explanation: string;
}

export class AIExperimentAnalyzer {
  private llmClient: any;

  constructor() {
    // Initialize LLM client here
  }

  /**
   * Main entry point.
   * Calculates Bayesian stats and checks for anomalies.
   */
  public async analyze(metric: ExperimentMetric): Promise<AnalysisResult> {
    const stats = this.calculateBayesianStats(metric);
    const isAnomaly = this.detectAnomaly(metric);
    const explanation = await this.generateInsight(metric, stats, isAnomaly);

    return {
      metricName: metric.name,
      upliftPercent: stats.uplift,
      chanceToBeatControl: stats.probability,
      risk: stats.risk,
      isAnomaly,
      explanation
    };
  }

  private calculateBayesianStats(metric: ExperimentMetric) {
    const ctrlCr = metric.control.count > 0 ? metric.control.value / metric.control.count : 0;
    const varCr = metric.variation.count > 0 ? metric.variation.value / metric.variation.count : 0;

    const uplift = ctrlCr === 0 ? 0 : ((varCr - ctrlCr) / ctrlCr) * 100;

    const p1 = ctrlCr;
    const p2 = varCr;
    const n1 = metric.control.count;
    const n2 = metric.variation.count;

    const pooledP = (metric.control.value + metric.variation.value) / (n1 + n2);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));

    let probability = 0.5;
    if (se > 0) {
      const z = (p2 - p1) / se;
      probability = 0.5 * (1 + this.erf(z / Math.sqrt(2)));
    }

    const risk = (1 - probability) * Math.abs(uplift);

    return { uplift, probability, risk };
  }

  private detectAnomaly(metric: ExperimentMetric): boolean {
    if (metric.variation.count < 30) return false;

    const cr = metric.variation.count > 0 ? metric.variation.value / metric.variation.count : 0;
    const ctrlCr = metric.control.count > 0 ? metric.control.value / metric.control.count : 0;

    if (ctrlCr > 0) {
      const uplift = (cr - ctrlCr) / ctrlCr;
      if (uplift > 1.5) return true;
      if (uplift < -0.9) return true;
    }

    return false;
  }

  private async generateInsight(
    metric: ExperimentMetric,
    stats: { uplift: number; probability: number },
    isAnomaly: boolean
  ): Promise<string> {

    if (isAnomaly) {
      return `Anomaly Detected: The observed uplift of ${stats.uplift.toFixed(1)}% is statistically unusual. Verify tracking implementation before proceeding.`;
    }

    if (stats.probability > 0.95) {
      return `Strong Signal: There is a ${(stats.probability * 100).toFixed(1)}% chance this variation beats the control. Recommended to ship.`;
    }

    if (stats.probability < 0.1) {
      return `Negative Impact: The variation is likely underperforming the control. Consider rollback.`;
    }

    return `Inconclusive: Current data shows a ${stats.uplift.toFixed(1)}% uplift, but confidence (${(stats.probability * 100).toFixed(1)}%) is too low to make a decision. Gather more samples.`;
  }

  private erf(x: number): number {
    const sign = (x >= 0) ? 1 : -1;
    x = Math.abs(x);
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const t = 1.0/(1.0 + p*x);
    const y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-x*x);
    return sign*y;
  }
}

export default AIExperimentAnalyzer;
