import { Heart, AlertTriangle, Lightbulb, BookOpen } from 'lucide-react';

export function MedicalInfo() {
  return (
    <div className="space-y-6 pb-24 max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-8 h-8" />
          <h2 className="text-white font-bold text-xl">Conseils médicaux</h2>
        </div>
        <p className="text-white/90">
          Informations validées pour mieux comprendre votre cycle menstruel
        </p>
      </div>

      {/* Understanding Your Cycle */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-gray-800 mb-4 flex items-center gap-2 font-bold text-lg">
          <Heart className="w-6 h-6 text-pink-600" />
          Comprendre votre cycle
        </h3>

        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg">
            <h4 className="text-red-900 mb-2">🌙 Phase menstruelle (Jours 1-5)</h4>
            <p className="text-sm text-red-800">
              Le premier jour de vos règles marque le début de votre cycle. L'utérus évacue la
              muqueuse qui s'était préparée pour une éventuelle grossesse. C'est normal de ressentir
              des crampes et de la fatigue.
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="text-green-900 mb-2">🌱 Phase folliculaire (Jours 1-13)</h4>
            <p className="text-sm text-green-800">
              Vos ovaires préparent un ovule pour l'ovulation. Le taux d'œstrogène augmente, ce qui
              peut améliorer votre humeur et votre niveau d'énergie. Votre muqueuse utérine
              s'épaissit à nouveau.
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="text-purple-900 mb-2">✨ Phase d'ovulation (Jour 14)</h4>
            <p className="text-sm text-purple-800">
              Un ovule mature est libéré par l'ovaire. C'est la période la plus fertile de votre
              cycle. L'ovule peut être fécondé pendant environ 12-24 heures, mais les spermatozoïdes
              peuvent survivre jusqu'à 5 jours, d'où la fenêtre fertile de ~6 jours.
            </p>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="text-yellow-900 mb-2">🌻 Phase lutéale (Jours 15-28)</h4>
            <p className="text-sm text-yellow-800">
              Après l'ovulation, le corps se prépare à une potentielle grossesse. Si l'ovule n'est
              pas fécondé, les taux hormonaux chutent et le cycle recommence. Certaines femmes
              ressentent des symptômes prémenstruels (SPM) durant cette phase.
            </p>
          </div>
        </div>
      </div>

      {/* Healthy Tips */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-gray-800 mb-4 flex items-center gap-2 font-bold text-lg">
          <Lightbulb className="w-6 h-6 text-yellow-600" />
          Conseils pour un cycle sain (Bonus de Tonton Makosa✨)
        </h3>

        <ul className="space-y-3">
          <li className="flex gap-3">
            <span className="text-2xl flex-shrink-0">💪</span>
            <div>
              <p className="text-gray-800">Activité physique régulière</p>
              <p className="text-sm text-gray-600">
                L'exercice modéré peut aider à réguler vos hormones et réduire les crampes
                menstruelles.
              </p>
            </div>
          </li>

          <li className="flex gap-3">
            <span className="text-2xl flex-shrink-0">🥗</span>
            <div>
              <p className="text-gray-800">Alimentation équilibrée</p>
              <p className="text-sm text-gray-600">
                Privilégiez les fruits, légumes, céréales complètes et aliments riches en fer,
                surtout pendant vos règles.
              </p>
            </div>
          </li>

          <li className="flex gap-3">
            <span className="text-2xl flex-shrink-0">💧</span>
            <div>
              <p className="text-gray-800">Hydratation</p>
              <p className="text-sm text-gray-600">
                Buvez suffisamment d'eau tout au long de votre cycle pour réduire les ballonnements
                et la rétention d'eau.
              </p>
            </div>
          </li>

          <li className="flex gap-3">
            <span className="text-2xl flex-shrink-0">😴</span>
            <div>
              <p className="text-gray-800">Sommeil de qualité</p>
              <p className="text-sm text-gray-600">
                7-9 heures de sommeil par nuit aident à réguler vos hormones et votre cycle
                menstruel.
              </p>
            </div>
          </li>

          <li className="flex gap-3">
            <span className="text-2xl flex-shrink-0">🧘‍♀️</span>
            <div>
              <p className="text-gray-800">Gestion du stress</p>
              <p className="text-sm text-gray-600">
                Le stress peut affecter votre cycle. Pratiquez des techniques de relaxation comme le
                yoga ou la méditation.
              </p>
            </div>
          </li>
        </ul>
      </div>

      {/* Warning Signs */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-amber-200">
        <h3 className="text-gray-800 mb-4 flex items-center gap-2 font-bold text-lg">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
          Quand consulter un professionnel de santé
        </h3>

        <div className="bg-amber-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-amber-900 mb-3">
            Consultez un médecin si vous observez l'un des signes suivants :
          </p>

          <ul className="space-y-2 text-sm text-amber-900">
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span>Absence de règles pendant plus de 3 mois (hors grossesse)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span>Règles très abondantes (changement de protection toutes les 1-2 heures)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span>Règles durant plus de 7 jours</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span>Douleurs pelviennes sévères</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span>Saignements entre les règles</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span>Cycles très irréguliers (variation de plus de 8-10 jours)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span>Symptômes prémenstruels qui affectent votre qualité de vie</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Contraception Notice */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-gray-800 mb-3 font-bold text-lg">⚠️ Important à savoir</h3>

        <div className="space-y-3 text-sm text-gray-700">
          <p className="p-3 bg-blue-50 rounded-lg">
            <strong>Contraception :</strong> Cette application NE DOIT PAS être utilisée comme
            méthode contraceptive. Les prédictions sont des estimations et ne garantissent pas la
            période fertile avec certitude. Pour une contraception fiable, consultez un
            professionnel de santé.
          </p>

          <p className="p-3 bg-purple-50 rounded-lg">
            <strong>Conception :</strong> Si vous essayez de concevoir, cette application peut vous
            aider à identifier votre fenêtre fertile, mais consultez un médecin pour des conseils
            personnalisés.
          </p>

          <p className="p-3 bg-pink-50 rounded-lg">
            <strong>Diagnostic médical :</strong> Cette application est un outil de suivi, pas un
            outil de diagnostic. Seul un professionnel de santé peut diagnostiquer et traiter des
            problèmes médicaux.
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-100 rounded-xl p-4 text-xs text-gray-600 text-center">
        <p>
          Les informations fournies dans cette application sont à titre éducatif uniquement et ne
          remplacent pas les conseils médicaux professionnels. Consultez toujours un médecin
          qualifié pour toute question concernant votre santé.
        </p>
      </div>
    </div>
  );
}
