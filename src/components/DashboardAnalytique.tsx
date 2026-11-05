import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Crown,
  RefreshCw,
  Sparkles,
  Stethoscope,
  TrendingUp,
} from 'lucide-react';
import { useCyclesContext } from '../contexts/CyclesContext';
import { CycleAnalysisService } from '../services/cycleAnalysisService';
import {
  analyzeCyclesWithAi,
  cyclesSignature,
  readCachedAiAnalysis,
  type AiAnalysisFailure,
  type AiCycleAnalysis,
} from '../services/cycleAiAnalysisService';
import { StorageService } from '../services/storageService';
import { SubscriptionService } from '../services/subscriptionService';

type AiState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; analysis: AiCycleAnalysis }
  | { status: 'failed'; reason: AiAnalysisFailure };

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(255, 255, 255, 0.97)',
  border: '1px solid #fbcfe8',
  borderRadius: '10px',
  boxShadow: '0 4px 14px rgba(244, 63, 94, 0.12)',
  fontSize: '12px',
};

const TREND_LABEL = {
  increasing: 'En augmentation ↑',
  decreasing: 'En diminution ↓',
  stable: 'Stable →',
} as const;

const FAILURE_TEXT: Record<AiAnalysisFailure, string> = {
  offline: 'Tu es hors ligne : voici l’analyse calculée sur ton appareil.',
  not_pro: 'L’analyse rédigée par NyeAI est réservée à Nye Cyclea Pro. Voici l’analyse calculée sur ton appareil.',
  session: 'Ta session a expiré : reconnecte-toi pour l’analyse NyeAI. Voici l’analyse calculée sur ton appareil.',
  service: 'NyeAI est momentanément saturée. Voici l’analyse calculée sur ton appareil.',
};

function levelOf(rate: number, irregular: boolean): 'good' | 'warn' | 'alert' {
  if (!irregular) return 'good';
  return rate >= 50 ? 'alert' : 'warn';
}

export function DashboardAnalytique() {
  const { cycles, loading } = useCyclesContext();
  const isPremium = SubscriptionService.isPremium(StorageService.getAuth()?.subscriptionType);

  const data = useMemo(() => {
    const result = CycleAnalysisService.generateDashboardAnalysis(cycles);
    return result.pattern.cycleCount >= 1 ? result : null;
  }, [cycles]);

  const signature = useMemo(() => cyclesSignature(cycles), [cycles]);
  const [ai, setAi] = useState<AiState>({ status: 'idle' });

  const runAi = useCallback(async () => {
    if (!data) return;
    setAi({ status: 'loading' });
    const result = await analyzeCyclesWithAi(cycles, data.pattern, data.analysis);
    setAi(
      'analysis' in result
        ? { status: 'ready', analysis: result.analysis }
        : { status: 'failed', reason: result.fail }
    );
  }, [cycles, data]);

  // À chaque changement des cycles : on reprend l'analyse en cache, sinon on interroge NyeAI
  useEffect(() => {
    if (!data) {
      setAi({ status: 'idle' });
      return;
    }
    const cached = readCachedAiAnalysis(signature);
    if (cached) {
      setAi({ status: 'ready', analysis: cached });
    } else if (isPremium) {
      void runAi();
    } else {
      setAi({ status: 'failed', reason: 'not_pro' });
    }
    // runAi dépend de `data` et `cycles`, déjà couverts par `signature`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, isPremium]);

  if (loading) {
    return (
      <div className="nye-dash-empty">
        <RefreshCw className="nye-dash-spin" width={28} height={28} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="nye-dash-card nye-dash-empty">
        <div className="nye-dash-empty-icon">
          <Activity width={30} height={30} />
        </div>
        <h2>Analyse en attente</h2>
        <p>Enregistre au moins 2 débuts de règles pour débloquer l’analyse de ta régularité.</p>
      </div>
    );
  }

  const { summary, pattern, analysis, chartData } = data;
  const level = levelOf(pattern.irregularityRate, analysis.isIrregular);
  const aiAnalysis = ai.status === 'ready' ? ai.analysis : null;
  const constats = aiAnalysis?.constats.length ? aiAnalysis.constats : analysis.insights;
  const conseils = aiAnalysis ? aiAnalysis.conseils : analysis.recommendations;
  // Par prudence : il suffit que le calcul local OU l'IA le recommande
  const consulter = analysis.shouldConsult || aiAnalysis?.consulter === true;

  return (
    <div className="nye-dash">
      {/* Taux d'irrégularité */}
      <section className={`nye-dash-card nye-dash-hero is-${level}`}>
        <div className="nye-dash-hero-top">
          <div>
            <p className="nye-dash-label">Taux d’irrégularité</p>
            <p className="nye-dash-big">{pattern.irregularityRate} %</p>
          </div>
          <div className="nye-dash-hero-badge">
            {analysis.isIrregular ? (
              <AlertTriangle width={16} height={16} />
            ) : (
              <CheckCircle width={16} height={16} />
            )}
            {!analysis.isIrregular
              ? 'Cycles réguliers'
              : analysis.severity === 'high'
                ? 'Irrégularité forte'
                : 'Irrégularité modérée'}
          </div>
        </div>
        <div
          className="nye-dash-meter"
          role="img"
          aria-label={`Taux d’irrégularité : ${pattern.irregularityRate} %`}
        >
          <span style={{ width: `${Math.max(4, pattern.irregularityRate)}%` }} />
        </div>
        <p className="nye-dash-summary">{summary}</p>
      </section>

      {/* Chiffres clés */}
      <section className="nye-dash-stats">
        <div className="nye-dash-card nye-dash-stat">
          <p className="nye-dash-label">Score de régularité</p>
          <p className="nye-dash-value">
            {pattern.regularityScore}
            <small>/100</small>
          </p>
        </div>
        <div className="nye-dash-card nye-dash-stat">
          <p className="nye-dash-label">Cycle moyen</p>
          <p className="nye-dash-value">
            {pattern.averageLength}
            <small> j</small>
          </p>
          <p className="nye-dash-sub">± {pattern.lengthStdDev.toFixed(1)} j</p>
        </div>
        <div className="nye-dash-card nye-dash-stat">
          <p className="nye-dash-label">Plus court / plus long</p>
          <p className="nye-dash-value">
            {pattern.shortestLength}–{pattern.longestLength}
            <small> j</small>
          </p>
          <p className="nye-dash-sub">{pattern.lengthRange} j d’écart</p>
        </div>
        <div className="nye-dash-card nye-dash-stat">
          <p className="nye-dash-label">Durée des règles</p>
          <p className="nye-dash-value">
            {pattern.averagePeriodLength}
            <small> j</small>
          </p>
          <p className="nye-dash-sub">± {pattern.periodStdDev.toFixed(1)} j</p>
        </div>
      </section>

      {/* Analyse NyeAI */}
      <section className="nye-dash-card nye-dash-ai">
        <header className="nye-dash-ai-head">
          <div className="nye-dash-ai-title">
            <span className="nye-dash-ai-icon">
              <Sparkles width={18} height={18} />
            </span>
            <div>
              <h2>Analyse NyeAI</h2>
              <p>
                {ai.status === 'loading'
                  ? 'NyeAI étudie tes cycles…'
                  : aiAnalysis
                    ? 'Rédigée par l’IA à partir de tes cycles'
                    : 'Calculée sur ton appareil'}
              </p>
            </div>
          </div>
          {isPremium && (
            <button
              type="button"
              className="nye-dash-refresh"
              onClick={() => void runAi()}
              disabled={ai.status === 'loading'}
              aria-label="Relancer l’analyse NyeAI"
              title="Relancer l’analyse"
            >
              <RefreshCw
                width={16}
                height={16}
                className={ai.status === 'loading' ? 'nye-dash-spin' : undefined}
              />
            </button>
          )}
        </header>

        {ai.status === 'loading' ? (
          <div className="nye-dash-skeleton" aria-hidden>
            <span />
            <span />
            <span />
          </div>
        ) : (
          <>
            {ai.status === 'failed' && (
              <p className="nye-dash-note">
                {FAILURE_TEXT[ai.reason]}
                {ai.reason === 'not_pro' && (
                  <Link to="/subscribe" className="nye-dash-pro-link">
                    <Crown width={13} height={13} /> Passer Pro
                  </Link>
                )}
              </p>
            )}

            {aiAnalysis && <p className="nye-dash-resume">{aiAnalysis.resume}</p>}

            <h3 className="nye-dash-h3">Ce que montrent tes cycles</h3>
            <ul className="nye-dash-list">
              {constats.map((text, index) => (
                <li key={index}>{text}</li>
              ))}
            </ul>

            <h3 className="nye-dash-h3">Conseils pour toi</h3>
            <ol className="nye-dash-list is-numbered">
              {conseils.map((text, index) => (
                <li key={index}>{text}</li>
              ))}
            </ol>

            {consulter && (
              <div className="nye-dash-consult">
                <Stethoscope width={18} height={18} />
                <p>
                  {aiAnalysis?.motifConsultation ||
                    'Avec ces écarts, un avis médical est conseillé : montre ton historique à un·e professionnel·le de santé.'}
                </p>
              </div>
            )}

            <p className="nye-dash-foot">
              Analyse basée sur {pattern.cycleCount} cycles · information éducative, ne remplace pas
              un avis médical.
            </p>
          </>
        )}
      </section>

      {/* Longueur des cycles */}
      <section className="nye-dash-card">
        <h2 className="nye-dash-h2">
          <TrendingUp width={18} height={18} />
          Longueur de chaque cycle
        </h2>
        <p className="nye-dash-sub">En jours. La ligne pointillée est ta moyenne.</p>
        <div className="nye-dash-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ee" vertical={false} />
              <XAxis dataKey="label" stroke="#9ca3af" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis
                stroke="#9ca3af"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={['dataMin - 4', 'dataMax + 4']}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value) => [`${value} jours`, 'Cycle']}
                labelFormatter={(label) => `Règles du ${label}`}
              />
              <ReferenceLine y={pattern.averageLength} stroke="#a855f7" strokeDasharray="5 4" />
              <Line
                type="linear"
                dataKey="cycleLength"
                stroke="#ec4899"
                strokeWidth={2.5}
                dot={{ fill: '#ec4899', stroke: '#fff', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Durée des règles */}
      <section className="nye-dash-card">
        <h2 className="nye-dash-h2">
          <Clock width={18} height={18} />
          Durée des règles
        </h2>
        <p className="nye-dash-sub">En jours, pour chaque cycle.</p>
        <div className="nye-dash-chart is-small">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ee" vertical={false} />
              <XAxis dataKey="label" stroke="#9ca3af" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis
                stroke="#9ca3af"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: 'rgba(244, 114, 182, 0.08)' }}
                formatter={(value) => [`${value} jours`, 'Règles']}
                labelFormatter={(label) => `Règles du ${label}`}
              />
              <Bar dataKey="periodLength" fill="#a855f7" radius={[6, 6, 0, 0]} maxBarSize={34} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Tendances */}
      <section className="nye-dash-stats is-two">
        <div className="nye-dash-card nye-dash-stat">
          <p className="nye-dash-label">Tendance des cycles</p>
          <p className="nye-dash-trend">{TREND_LABEL[pattern.trends.lengthTrend]}</p>
        </div>
        <div className="nye-dash-card nye-dash-stat">
          <p className="nye-dash-label">Tendance des règles</p>
          <p className="nye-dash-trend">{TREND_LABEL[pattern.trends.periodTrend]}</p>
        </div>
      </section>
    </div>
  );
}
