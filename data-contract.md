# Contrat de données et règles de calcul

## Source

Contrat cible fondé sur le JSON fourni pour le 7 octobre 2026, `schema_version: "1.0.0"`. Les formes ci-dessous décrivent la normalisation à implémenter ; elles ne sont pas déjà produites par le serveur.

```text
Document quotidien
├── date
├── schema_version
├── environmental[]
├── biological
│   ├── city_country
│   ├── date
│   ├── timezone
│   ├── summary
│   └── computed_metrics
└── source_files / source_file_days
```

## Validation du document

- `date` doit être une date civile valide au format `YYYY-MM-DD`.
- La version initiale accepte explicitement la version `1.0.0`. Une version inconnue est exclue et signalée jusqu’à ajout d’un adaptateur.
- `environmental`, lorsqu’il est présent, doit être un tableau. `biological`, lorsqu’il est présent et non nul, doit être un objet.
- Une catégorie absente n’invalide pas l’autre. La disponibilité de chaque catégorie reste explicite.
- La date biologique, lorsqu’elle existe, doit correspondre à celle du document ; sinon le document est exclu pour incohérence.
- Une capture dont la date locale contredit celle du document est exclue avec avertissement.

## Références communes

| Champ normalisé | Origine / règle |
|---|---|
| `date` | `document.date` pour les bilans quotidiens. |
| `location_id` | Identifiant déterministe fondé sur le couple ville/pays normalisé ; identique dans toutes les réponses. |
| `city` | `biological.city_country.city`. |
| `country` | `biological.city_country.country`. |
| `timezone` | `biological.timezone` comme fuseau du document ; un fuseau explicite de capture est prioritaire pour interpréter son timestamp. |

Normaliser les espaces et la casse pour construire les identifiants, tout en conservant les libellés d’origine pour l’affichage. Le couple ville/pays peut rester ambigu pour des villes homonymes d’un même pays ; ajouter un identifiant géographique dans la source si cela se présente.

Le lieu commun du document est la référence analytique, conformément à la règle choisie. Les coordonnées des captures ne remplacent pas cette référence. Elles peuvent servir à la carte. Si ville ou pays manque, utiliser `location_id: null`, conserver les mesures et exclure ce document des classements par ville. Ne pas extraire automatiquement une ville d’une adresse libre.

## Données environnementales

| Champ source | Champ normalisé | Unité / règle |
|---|---|---|
| `timestamp` | `timestamp` | ISO 8601 avec offset après interprétation explicite du fuseau. |
| `temperature` | `temperature` | °C, à confirmer dans le pipeline source. |
| `humidity` | `humidity` | %, à confirmer ; contrôler la plage 0–100. |
| `pressure` | `pressure` | Unité à confirmer ; les valeurs suggèrent hPa. |
| `luminosity` | `luminosity` | Unité à confirmer avant affichage en lux. |
| `concentration_co2` | `co2` | Unité et calibration à confirmer avant affichage en ppm. |
| `latitude`, `longitude` | Champs identiques | Degrés ; plages −90 à 90 et −180 à 180. |
| `*_source` | `sources` | Conserver la provenance pour les métriques affichées. |

`white_luminosity`, `moods`, `environments`, altitude et autres enrichissements sont exclus de la première réponse s’ils ne servent pas à un affichage retenu. Ils restent dans le document source.

Une mesure instantanée de température n’est pas une moyenne quotidienne. Le service construit les résumés `temperature_avg`, `temperature_min`, `temperature_max`, ainsi que les moyennes des autres métriques et leurs nombres de valeurs valides.

CO₂ et AQI sont des indicateurs distincts. La carte actuelle AQI doit être remplacée par une carte CO₂ ou masquée si la donnée est indisponible.

## Données biologiques

| Champ source dans `summary` | Champ normalisé | Unité |
|---|---|---|
| `heart_rate_avg` | `heart_rate_avg` | battements/minute |
| `heart_rate_min`, `heart_rate_max` | Champs identiques | battements/minute |
| `hrv_avg_ms` | `hrv_avg_ms` | ms |
| `oxygen_saturation_avg_percent` | Champ identique | % |
| `sleep_duration_hours` | Champ identique | heures |
| `steps_total` | Champ identique | pas |
| `active_energy_kcal`, `basal_energy_kcal` | Champs identiques | kcal |
| `distance_walking_running_meters` | Champ identique | mètres ; conversion visuelle en km possible |
| `workout_count` | Champ identique | nombre |

Depuis `computed_metrics`, conserver les champs utiles : `sleep_duration_score`, `sleep_score_source`, `stress_score`, `stress_status`, et, si affichés, `hrv_baseline_ms`, `hrv_baseline_days`, `hrv_change_percent`.

Les échelles et formules de `sleep_duration_score` et `stress_score` doivent être documentées par le pipeline producteur avant affichage avec une note maximale. Ne pas supposer une échelle sur 10 ou sur 100. La fréquence moyenne ne correspond pas à une fréquence au repos. Une HRV moyenne ne constitue pas à elle seule un score de récupération.

## Valeurs manquantes et qualité

N’accepter comme mesure que les valeurs de type nombre et finies. Les chaînes `"sensor"` et `"Sensor"` présentes dans le CO₂ de l’exemple deviennent `null` ; elles ne sont pas converties en nombres ni déplacées silencieusement dans un autre champ.

Une valeur absente, invalide ou hors plage établie devient `null`. Les plages physiques ou métier restent spécifiques à chaque mesure. Une valeur inhabituelle mais numérique doit être signalée selon une règle documentée ; elle ne doit pas être corrigée arbitrairement.

Un zéro numérique n’est pas une valeur absente. Pour le sommeil, cependant, le JSON actuel ne permet pas de distinguer zéro sommeil d’absence d’échantillons. Proposition de normalisation : conserver la valeur brute zéro, ajouter `sleep_data_status: "unknown"` et l’exclure des classements tant que le producteur ne fournit pas un statut ou un nombre d’échantillons. Les durées positives valides sont marquées `available` ; elles ne garantissent pas à elles seules que la nuit est complète.

Évolution recommandée du producteur : ajouter un statut de disponibilité, un nombre d’échantillons et, si possible, un indicateur de complétude. `stress_status: "insufficient_data"` implique que le score de stress ne participe pas aux statistiques, même si une valeur incohérente l’accompagne.

## Temps

Ne jamais laisser le fuseau du navigateur déterminer l’heure d’une capture. Pour un timestamp sans offset, utiliser son fuseau explicite ou celui du document. Sans fuseau exploitable, garder le timestamp brut et signaler que l’instant exact ne peut pas être déterminé ; ne pas inventer UTC. Les horaires ambigus ou inexistants lors des changements d’heure doivent être signalés.

Les bilans biologiques gardent une date civile ; ne pas fabriquer une heure de mesure à minuit. `generated_at` désigne la génération du bilan et `location_metadata.captured_at` la collecte de localisation, pas l’heure du sommeil.

## Déduplication

Clé quotidienne : date + lieu, pour la série personnelle actuelle. Préférer un nom d’objet déterministe remplacé à chaque nouvelle génération. Si plusieurs objets existent pour cette clé, retenir la version la plus récente selon une date de génération fiable ou les métadonnées OCI ; ne jamais additionner deux bilans du même jour. En cas de conflit impossible à résoudre, signaler et exclure la clé des calculs.

Les captures reçoivent un identifiant déterministe fondé sur le document et leur position dans le tableau, afin de préserver les mesures distinctes. Un identifiant de capture fourni par le producteur serait préférable. Deux captures au même timestamp ne sont pas automatiquement des doublons.

## Calculs

Pour une métrique : filtrer les valeurs numériques finies et admissibles, puis calculer `somme / effectif`. Sans valeur valide, retourner `null`. Les minimums et maximums suivent la même règle. Arrondir seulement à l’affichage.

### Environnement

Le résumé quotidien est une moyenne arithmétique des captures valides pour chaque métrique. Avec une collecte irrégulière, elle décrit les captures, pas une moyenne continue de la journée.

Pour une comparaison entre villes sur plusieurs jours, utiliser par défaut la moyenne des moyennes quotidiennes valides, donnant le même poids à chaque journée. Indiquer le nombre de jours et le nombre de captures. Toute moyenne pondérée par la durée nécessiterait une règle supplémentaire de couverture temporelle.

### Sommeil par ville

1. Appliquer les filtres de période et de lieu.
2. Utiliser un seul bilan par jour et lieu.
3. Retenir les durées admissibles avec `sleep_data_status: "available"`.
4. Calculer durée moyenne et nombre de nuits admissibles par ville.
5. Appliquer un minimum configurable, initialement proposé à cinq nuits.
6. Trier par moyenne décroissante. Retourner tous les ex æquo selon la précision affichée, proposée à deux décimales.

Le seuil de cinq nuits est une règle de produit initiale, pas une garantie statistique. Le résultat exprime la durée moyenne la plus élevée parmi les lieux observés, sans conclusion causale sur la ville.

Un classement par score de durée suivra les mêmes règles après définition de sa formule et de son échelle. Il ne doit pas être présenté comme une mesure de qualité du sommeil.

### Exemple fourni

Le document du 7 octobre 2026 contient dix captures environnementales, un bilan biologique et le lieu Luynes, France. Le sommeil est à zéro avec un score nul ; il n’est pas admissible au classement dans le contrat initial. Le stress est indisponible avec `insufficient_data`. Aucun classement entre villes n’est possible avec ce seul document.

## Indicateurs à adapter dans l’interface

- « Resting heart rate » → fréquence cardiaque moyenne.
- « Air Quality / AQI » → CO₂, après confirmation de l’unité.
- « Sleep quality /10 » → durée de sommeil ; score de durée uniquement si son contrat est établi.
- « Best recovery » → HRV moyenne si la carte est conservée sous cet intitulé explicite.
- Score d’harmonie actuel → masquer tant que sa formule et la gestion des composantes manquantes ne sont pas définies.
- Insights synthétiques → désactiver hors mode démonstration ; les comparaisons réelles proviennent des calculs décrits ici.
