# L'application Android

L'application « Mini-jeux d'échecs » (« Chess mini-games » sur un téléphone en anglais) : tout le site, embarqué dans
l'application. Elle marche sans connexion et n'a même pas la permission d'aller sur Internet ; les réglages et les
records restent sur le téléphone. Android 7.0 ou plus récent.

## L'installer sur un téléphone

À chaque modification du site sur `main`, GitHub reconstruit l'application (`.github/workflows/android.yml`) et la
publie ici : <https://github.com/pouillonmathieu/echecseducatifs/releases/tag/android>.
Sur le téléphone, télécharger `mini-jeux-echecs.apk`, l'ouvrir et accepter l'installation (Android demande
d'autoriser le navigateur à installer des applications). Une nouvelle version s'installe par-dessus l'ancienne :
les réglages sont gardés.

## Comment elle est faite

- `app/build.gradle` copie le site (`index.html`, `css/`, `js/`, `jeux/`, `en/`) dans l'application à chaque
  construction : rien à recopier à la main, l'application suit le site. Les fichiers `.gz` (tables de « Capture le
  roi ») y sont rangés en `.gzip`, car Android décompresserait les `.gz` et changerait leur nom.
- `MainActivity.java` affiche le site dans une WebView, à l'adresse `https://appassets.androidplatform.net/assets/site/`
  (WebViewAssetLoader) : une vraie adresse, pour que tout marche comme sur le site. Elle ouvre la page d'accueil dans
  la dernière langue utilisée (sinon celle du téléphone), gère le bouton retour, ouvre les liens vers d'autres sites
  (Lichess, Wikimedia…) dans le navigateur, sert la police Lexend depuis l'application (`assets/appli/polices`, licence
  SIL OFL) à la place de Google Fonts, et laisse les barres du système prendre la couleur du fond de la page.
- `assets/appli/appli.js` est ajouté dans le `<head>` de chaque page : il donne aux pages un `speechSynthesis` qui
  utilise la voix du téléphone (`Voix.java`, TextToSpeech), pour « Comment ça s'appelle ? », et transmet la couleur du
  fond (thème clair ou sombre).
- Si le moteur web du téléphone (« Android System WebView ») est plus ancien que Chrome 90, un message propose de le
  mettre à jour depuis le Play Store (avec un moteur trop ancien, l'échiquier ne s'afficherait pas). Dans
  l'application, le pied de page de l'accueil dit « Les réglages restent sur ce téléphone ».
- L'icône : Pom', sur un fond jaune pâle (`app/src/main/res/mipmap-*`, et `icone-512.png` pour le Play Store).

## Vérifications faites

Dans un téléphone Android 11 simulé (sans accélération : la seule possible ici) : l'application s'installe, s'ouvre
sur l'accueil (police Lexend, contenu sous la barre d'état), ouvre un jeu, revient avec le bouton retour, rouvre dans
la dernière langue choisie, et prévient que le moteur web est trop ancien (version 83 sur cette image, sans mise à
jour). Le jeu lui-même n'a pas pu y être vu, à cause de ce vieux moteur. La voix, la police et la couleur du fond ont
été vérifiées dans Chromium, avec un pont Android simulé.

## La construire soi-même

Avec le SDK Android (variable `ANDROID_HOME`) et Java 17 ou plus :

```bash
cd android
./gradlew assembleRelease
```

L'APK est dans `app/build/outputs/apk/release/`.

## Signature

Les APK sont signés avec la **clé de test** du projet (`cle-de-test.jks`, mot de passe `echecs-test`, écrit dans
`app/build.gradle`). Elle n'est pas secrète : elle sert seulement à ce qu'une nouvelle version s'installe par-dessus
l'ancienne, quelle que soit la machine qui l'a construite. Pour publier sur le Play Store, il faudra une vraie clé,
gardée secrète : la construction l'utilise si les variables `CLE_FICHIER`, `CLE_MOT_DE_PASSE` et `CLE_ALIAS` sont
données (par exemple depuis des secrets GitHub). Le Play Store demande aussi un compte développeur Google (payant,
une fois), un format `.aab` (`./gradlew bundleRelease`), une politique de confidentialité et, pour une application
destinée aux enfants, de remplir le questionnaire « Familles ».
