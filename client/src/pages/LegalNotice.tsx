/**
 * Page OnePage avec mentions légales pour TubeTest Tracker
 */

export default function LegalNotice() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">TubeTest Tracker</h1>
          <p className="text-gray-600 mt-2">Outil d'analyse et d'optimisation YouTube</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Optimisez vos vidéos YouTube avec l'IA
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            TubeTest Tracker est un outil personnel de monitoring et d'optimisation 
            pour chaînes YouTube. Analysez vos performances, testez vos miniatures 
            et titres, et maximisez votre engagement.
          </p>
        </section>

        {/* Features */}
        <section className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Analyse des Performances</h3>
            <p className="text-gray-600">
              Suivez vos métriques clés : vues, CTR, temps de visionnage, 
              engagement, et courbes de rétention.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Tests A/B</h3>
            <p className="text-gray-600">
              Créez et comparez des variantes de titres et miniatures 
              pour identifier ce qui fonctionne le mieux.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">Optimisation IA</h3>
            <p className="text-gray-600">
              Générez automatiquement des suggestions de titres et miniatures 
              optimisées grâce à l'intelligence artificielle.
            </p>
          </div>
        </section>

        {/* Legal Notice */}
        <section className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Mentions Légales</h2>
          
          <div className="space-y-6 text-gray-700">
            <div>
              <h3 className="font-semibold text-lg mb-2">Éditeur du site</h3>
              <p>
                <strong>Nom</strong> : Christophe Folli<br />
                <strong>Email</strong> : omniscience@polemikos.fr<br />
                <strong>Site web</strong> : https://tubetest-tracker.manus.space
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Hébergement</h3>
              <p>
                Ce site est hébergé par <strong>Manus Cloud Platform</strong><br />
                Site web : https://manus.im
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Propriété intellectuelle</h3>
              <p>
                L'ensemble de ce site relève de la législation française et internationale 
                sur le droit d'auteur et la propriété intellectuelle. Tous les droits de 
                reproduction sont réservés, y compris pour les documents téléchargeables 
                et les représentations iconographiques et photographiques.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Données personnelles</h3>
              <p>
                TubeTest Tracker utilise l'API YouTube pour récupérer les données de vos 
                chaînes YouTube. Ces données sont stockées de manière sécurisée et ne sont 
                jamais partagées avec des tiers. Conformément au RGPD, vous disposez d'un 
                droit d'accès, de rectification et de suppression de vos données personnelles.
              </p>
              <p className="mt-2">
                Pour exercer ces droits, contactez-nous à l'adresse : 
                <strong> omniscience@polemikos.fr</strong>
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Cookies</h3>
              <p>
                Ce site utilise des cookies strictement nécessaires à son fonctionnement 
                (authentification, session utilisateur). Aucun cookie de tracking ou de 
                publicité n'est utilisé.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Utilisation de l'API YouTube</h3>
              <p>
                TubeTest Tracker utilise l'API YouTube conformément aux 
                <a 
                  href="https://developers.google.com/youtube/terms/api-services-terms-of-service" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-1"
                >
                  Conditions d'utilisation des services d'API YouTube
                </a> et au 
                <a 
                  href="https://developers.google.com/youtube/terms/developer-policies" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-1"
                >
                  Règlement pour les développeurs
                </a>.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Contact</h3>
              <p>
                Pour toute question concernant ce site ou son utilisation, 
                vous pouvez nous contacter à l'adresse : 
                <strong> omniscience@polemikos.fr</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center mt-16 text-gray-600">
          <p>© {new Date().getFullYear()} Christophe Folli - Tous droits réservés</p>
          <p className="mt-2 text-sm">
            TubeTest Tracker est un outil personnel d'analyse et d'optimisation YouTube
          </p>
        </footer>
      </main>
    </div>
  );
}
