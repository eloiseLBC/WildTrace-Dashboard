# Configuration et validation en local

## Statut

Ce guide décrit la procédure cible après implémentation. La branche de référence ne contient pas encore tous les éléments nécessaires. L’arbre GitHub examiné ne présente notamment pas de `package.json`, de fichier d’entrée React ni de `vite.config.js` : il faut retrouver ou ajouter ces fichiers avant de prétendre lancer et compiler le projet complet.

## Paramètres à obtenir

- Namespace OCI Object Storage.
- Nom du bucket contenant les documents quotidiens consolidés.
- Préfixe exact de ces objets, idéalement terminé par `/` pour délimiter le dossier logique.
- Région OCI et profil d’authentification.
- Confirmation que le document fourni correspond bien au format publié.

Les chemins dans `source_files` ne permettent pas de déduire le préfixe de la compilation quotidienne elle-même.

## Authentification OCI

Le SDK serveur peut utiliser `ConfigFileAuthenticationDetailsProvider`. La configuration locale contient notamment les OCID user/tenancy, la région, l’empreinte de la clé et le chemin de la clé privée. La clé publique correspondante doit être enregistrée dans OCI et l’identité doit disposer des autorisations IAM de lecture/liste requises pour le bucket.

Si la CLI OCI est déjà installée, son assistant peut préparer cette configuration :

```bash
oci setup config
```

Le SDK n’exige pas que la CLI reste installée pour fonctionner. Ne pas copier les clés privées, le fichier OCI ou les identifiants sensibles dans le repository, les réponses API ou les variables frontend.

Références officielles : [configuration SDK/CLI](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/sdkconfig.htm), [exemple du SDK JavaScript/TypeScript](https://docs.oracle.com/en-us/iaas/tools/typescript-sdk-examples/latest/objectstorage/ListObjects.ts.html), [API Object Storage](https://docs.oracle.com/en-us/iaas/tools/typescript/latest/classes/_objectstorage_lib_client_.objectstorageclient.html).

## Variables applicatives

Copier `.env.example` vers `.env` dans le dossier applicatif, puis renseigner les valeurs. Ajouter `.env` au `.gitignore` et conserver `.env.example` versionné.

Les noms proposés doivent être raccordés au code serveur. Le chargement du fichier `.env` devra être explicite, via le runtime Node choisi ou une bibliothèque adaptée ; sa seule présence ne configure pas le serveur actuel.

| Variable | Usage |
|---|---|
| `OCI_NAMESPACE` | Namespace Object Storage. |
| `OCI_DAILY_BUCKET` | Bucket commun des documents consolidés. |
| `OCI_DAILY_PREFIX` | Préfixe des documents quotidiens. |
| `OCI_CONFIG_PROFILE` | Profil local, par défaut `DEFAULT`. |
| `OCI_CONFIG_FILE` | Chemin optionnel du fichier OCI ; vide pour le chemin par défaut du SDK. |
| `PORT` | Port du serveur, proposé à 3001. |
| `CORS_ORIGIN` | Origine frontend autorisée, à ajuster au port local réel. |
| `DAILY_CACHE_TTL_SECONDS` | Durée du cache commun, proposée à 60 secondes. |
| `OCI_DOWNLOAD_CONCURRENCY` | Nombre maximal de téléchargements simultanés, proposé à 5. |
| `INSIGHTS_MIN_SLEEP_NIGHTS` | Minimum de nuits admissibles par lieu, proposé à 5. |

Valider ces variables au démarrage. Le bucket et le préfixe sont déterminés par le serveur, pas librement fournis par le navigateur.

## Dépendances et lancement cible

Dans le dossier contenant le futur `package.json`, les dépendances serveur envisagées sont :

```bash
npm install express cors oci-common oci-objectstorage
```

Le code serveur actuel utilise les modules ES ; configurer le projet en conséquence. La bibliothèque de traitement des fuseaux et la stratégie de chargement `.env` seront choisies à l’implémentation.

Ajouter des scripts distincts pour le frontend et le serveur, par exemple `dev` et `dev:server`. Les commandes suivantes ne seront valides qu’une fois ces scripts définis :

```bash
npm run dev:server
npm run dev
```

Configurer Vite pour transmettre `/api` vers le serveur local sur le port configuré. Les loaders utiliseront des URL relatives telles que `/api/biological/captures`.

## Parcours de vérification

1. Vérifier que le processus démarre et que `/api/health` répond.
2. Appeler `/api/locations` pour vérifier réellement la lecture OCI ; le health check seul ne la vérifie pas.
3. Charger la journée du 7 octobre 2026 depuis le document d’exemple : dix captures environnementales et un bilan biologique doivent être extraits, associés à Luynes, France.
4. Vérifier les valeurs numériques et unités, les chaînes CO₂ transformées en `null`, le stress indisponible et le sommeil zéro de disponibilité inconnue.
5. Vérifier une période sans données, une date invalide, une erreur OCI et un document JSON invalide. Les états vide, erreur et partiel doivent être distincts.
6. Tester plusieurs documents, une version quotidienne dupliquée et une liste OCI paginée.
7. Tester les moyennes avec valeurs manquantes, les seuils de classement et les ex æquo.
8. Ouvrir les pages environnementale et biologique : elles doivent afficher les données de l’API et des intitulés exacts, sans retour automatique aux exemples.
9. Vérifier que des appels simultanés partagent la lecture commune et que l’expiration du cache rafraîchit les données.

Les tests de calcul utiliseront des fixtures explicites ; ils ne nécessitent pas des identifiants OCI. La connexion réelle se valide séparément avec l’environnement local configuré.

## Déploiement ultérieur

Choisir un hébergement capable d’exécuter le serveur ou des fonctions backend adaptées. Un hébergement statique React seul ne suffit pas à exécuter cette couche OCI. Configurer l’identité serveur, le routage `/api`, les paramètres, les origines autorisées et l’accès au Dashboard avant publication.
