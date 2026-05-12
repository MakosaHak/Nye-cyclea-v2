export function PrivacyPolicyContent() {
  return (
    <div
      className="mt-6 border-t border-gray-100 pt-8 pb-4 animate-in fade-in slide-in-from-top-4 duration-700"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        lineHeight: '1.6',
        color: '#4B5563',
      }}
    >
      <div className="space-y-10">
        {/* Document Header */}
        <div className="text-center pb-8 border-b border-gray-100">
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight mb-2">
            Politique de Confidentialité
          </h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
            Cadre Juridique Togo & International
          </p>
          <p className="text-[11px] text-gray-500 mt-2 font-medium">
            Dernière mise à jour : 10 mai 2026
          </p>
        </div>

        {/* Section 1: Legal Framework */}
        <section>
          <h2 className="text-[13px] font-black text-gray-900 mb-3 uppercase tracking-wider border-l-4 border-pink-500 pl-3">
            01. Cadre Légal et Conformité
          </h2>
          <p className="text-sm text-justify">
            La présente politique est régie par la <strong>Loi n°2019-014</strong> du 29 octobre
            2019 relative à la protection des données à caractère personnel en République Togolaise.
            Nye Cyclea s'engage à respecter les principes de protection édictés par l'Instance de
            Protection des Données à Caractère Personnel (IPDCP).
          </p>
          <p className="text-sm mt-3 text-justify">
            Par souci de transparence et de sécurité universelle, nos protocoles sont également
            alignés sur les standards internationaux, notamment le{' '}
            <strong>Règlement Général sur la Protection des Données (RGPD)</strong> de l'Union
            Européenne, garantissant ainsi un niveau de protection optimal pour toutes nos
            utilisatrices.
          </p>
        </section>

        {/* Section 2: Data Nature */}
        <section>
          <h2 className="text-[13px] font-black text-gray-900 mb-3 uppercase tracking-wider border-l-4 border-pink-500 pl-3">
            02. Nature des Données et Finalités
          </h2>
          <p className="text-sm mb-4 text-justify">
            Nye Cyclea traite deux types de données distincts pour assurer le bon fonctionnement du
            service :
          </p>
          <div className="grid gap-4">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <h3 className="text-xs font-bold text-gray-800 uppercase mb-2">
                Données de Santé (Sensibles)
              </h3>
              <p className="text-xs leading-relaxed">
                Dates de cycles, symptômes et notes personnelles. Ces données sont{' '}
                <strong>exclusivement stockées en local</strong> sur votre terminal (Architecture
                Offline-First) et ne sont jamais transmises à nos serveurs.
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <h3 className="text-xs font-bold text-gray-800 uppercase mb-2">Données de Compte</h3>
              <p className="text-xs leading-relaxed">
                Identifiant, mot de passe (haché) et statut d'abonnement. Ces informations sont
                nécessaires pour la gestion de votre profil et sont hébergées sur des serveurs
                sécurisés bénéficiant d'un chiffrement TLS de bout en bout.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: User Rights */}
        <section>
          <h2 className="text-[13px] font-black text-gray-900 mb-3 uppercase tracking-wider border-l-4 border-pink-500 pl-3">
            03. Droits de l'Utilisatrice
          </h2>
          <p className="text-sm mb-4 text-justify">
            Conformément à la législation togolaise et aux principes du RGPD, vous disposez des
            droits fondamentaux suivants :
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-3">
              <span className="font-bold text-pink-500">•</span> <strong>Droit d'accès :</strong>{' '}
              Consulter l'intégralité de vos données à tout moment.
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-pink-500">•</span>{' '}
              <strong>Droit de rectification :</strong> Modifier vos informations personnelles.
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-pink-500">•</span>{' '}
              <strong>Droit à l'effacement :</strong> Supprimer définitivement vos données (via le
              bouton "Supprimer mes données" ci-dessous).
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-pink-500">•</span>{' '}
              <strong>Droit à la portabilité :</strong> Exporter vos données dans un format
              structuré (JSON).
            </li>
          </ul>
        </section>

        {/* Section 4: Security */}
        <section>
          <h2 className="text-[13px] font-black text-gray-900 mb-3 uppercase tracking-wider border-l-4 border-pink-500 pl-3">
            04. Sécurité et Intégrité
          </h2>
          <p className="text-sm text-justify">
            Nous mettons en œuvre des mesures techniques de pointe (chiffrement, isolation des
            processus) pour garantir l'intégrité de vos informations. En tant qu'utilisatrice, vous
            êtes responsable de la sécurité physique de votre terminal et de la confidentialité de
            vos identifiants.
          </p>
        </section>

        {/* Final Disclaimer */}
        <div className="pt-10 border-t border-gray-100 text-center">
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest leading-relaxed">
            Votre intimité est notre priorité absolue.
            <br />
            Pour toute demande : contact@nyecyclea.com
          </p>
        </div>
      </div>
    </div>
  );
}
