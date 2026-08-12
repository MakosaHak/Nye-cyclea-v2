import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Activity, Calendar, Clock } from 'lucide-react';
import { useCyclesContext } from '../contexts/CyclesContext';
import { CycleAnalysisService } from '../services/cycleAnalysisService';

export function DashboardAnalytique() {
  const { cycles, loading } = useCyclesContext();

  const analysisData = useMemo(() => {
    if (cycles.length < 2) return null;
    return CycleAnalysisService.generateDashboardAnalysis(cycles);
  }, [cycles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500" />
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl mx-auto flex items-center justify-center mb-4">
          <Activity className="w-8 h-8 text-purple-500" />
        </div>
        <h2 className="text-gray-800 mb-2 font-bold text-lg">Analyse insuffisante</h2>
        <p className="text-gray-600 text-sm">
          Enregistrez au moins 2 cycles pour débloquer l'analyse de vos tendances.
        </p>
      </div>
    );
  }

  const { summary, pattern, analysis, monthlyData } = analysisData;

  return (
    <div className="space-y-6">
      {/* Résumé */}
      <div className="glass-card p-5">
        <p className="text-sm text-gray-600 leading-relaxed">{summary}</p>
      </div>

      {/* Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Regularity Score */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Score de Régularité</span>
            {pattern.regularityScore >= 70 ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : pattern.regularityScore >= 50 ? (
              <Activity className="w-5 h-5 text-yellow-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div className="text-3xl font-bold text-gray-800">{pattern.regularityScore}/100</div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                pattern.regularityScore >= 70 ? 'bg-green-500' : pattern.regularityScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${pattern.regularityScore}%` }}
            />
          </div>
        </div>

        {/* Average Cycle Length */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Longueur Moyenne</span>
          </div>
          <div className="text-3xl font-bold text-gray-800">{pattern.averageLength} jours</div>
          <div className="text-sm text-gray-500 mt-2">±{pattern.lengthVariance.toFixed(1)} jours</div>
        </div>

        {/* Average Period Length */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-pink-600" />
            <span className="text-sm text-gray-600">Durée Moyenne Règles</span>
          </div>
          <div className="text-3xl font-bold text-gray-800">{pattern.averagePeriodLength} jours</div>
          <div className="text-sm text-gray-500 mt-2">±{pattern.periodVariance.toFixed(1)} jours</div>
        </div>
      </div>

      {/* Cycle Length Chart */}
      <div className="glass-card p-6">
        <h2 className="text-gray-800 font-bold text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Évolution de la Longueur des Cycles
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="cycleLength"
              stroke="#ec4899"
              strokeWidth={2}
              dot={{ fill: '#ec4899', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Longueur du cycle (jours)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Period Length Chart */}
      <div className="glass-card p-6">
        <h2 className="text-gray-800 font-bold text-lg mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-pink-600" />
          Évolution de la Durée des Règles
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend />
            <Bar dataKey="periodLength" fill="#a855f7" radius={[4, 4, 0, 0]} name="Durée des règles (jours)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* AI Analysis Section */}
      <div
        className={`glass-card p-6 ${
          analysis.isIrregular ? 'border-orange-200/80' : 'border-green-200/80'
        }`}
        style={{
          background: analysis.isIrregular
            ? 'linear-gradient(135deg, rgba(255, 237, 213, 0.65), rgba(254, 226, 226, 0.55))'
            : 'linear-gradient(135deg, rgba(209, 250, 229, 0.55), rgba(220, 252, 231, 0.45))',
        }}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${
            analysis.isIrregular ? 'bg-orange-100' : 'bg-green-100'
          }`}>
            {analysis.isIrregular ? (
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            ) : (
              <CheckCircle className="w-6 h-6 text-green-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`font-bold text-lg mb-2 ${
              analysis.isIrregular ? 'text-orange-800' : 'text-green-800'
            }`}>
              {analysis.isIrregular ? 'Analyse IA : Cycles Irréguliers Détectés' : 'Analyse IA : Cycles Réguliers'}
            </h3>
            <div className="space-y-3">
              {analysis.insights.map((insight, index) => (
                <p key={index} className="text-sm text-gray-700">
                  • {insight}
                </p>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-semibold text-sm text-gray-800 mb-2">Recommandations IA :</h4>
              <div className="space-y-2">
                {analysis.recommendations.map((rec, index) => (
                  <p key={index} className="text-sm text-gray-600">
                    {index + 1}. {rec}
                  </p>
                ))}
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              Confiance de l'analyse : {Math.round(analysis.confidence * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Trends Section */}
      <div className="glass-card p-6">
        <h2 className="text-gray-800 font-bold text-lg mb-4">Tendances Détectées</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-purple-50 rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-1">Tendance Longueur Cycle</div>
            <div className={`font-bold ${
              pattern.trends.lengthTrend === 'increasing' ? 'text-red-600' :
              pattern.trends.lengthTrend === 'decreasing' ? 'text-green-600' :
              'text-blue-600'
            }`}>
              {pattern.trends.lengthTrend === 'increasing' ? 'En augmentation ↑' :
               pattern.trends.lengthTrend === 'decreasing' ? 'En diminution ↓' :
               'Stable →'}
            </div>
          </div>
          <div className="bg-pink-50 rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-1">Tendance Durée Règles</div>
            <div className={`font-bold ${
              pattern.trends.periodTrend === 'increasing' ? 'text-red-600' :
              pattern.trends.periodTrend === 'decreasing' ? 'text-green-600' :
              'text-blue-600'
            }`}>
              {pattern.trends.periodTrend === 'increasing' ? 'En augmentation ↑' :
               pattern.trends.periodTrend === 'decreasing' ? 'En diminution ↓' :
               'Stable →'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
