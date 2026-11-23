package io.github.pouillonmathieu.echecs;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.pm.PackageInfo;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.window.OnBackInvokedDispatcher;

import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewCompat;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

/**
 * L'application : le site des mini-jeux d'échecs, embarqué (dossier assets/site, copié depuis le dépôt à chaque
 * construction) et affiché dans une WebView, sans connexion.
 *
 * - Les pages sont servies à l'adresse https://appassets.androidplatform.net/assets/site/… (WebViewAssetLoader) :
 *   une vraie adresse https, pour que tout marche comme sur le site (fetch des tables de « Capture le roi »,
 *   réglages gardés dans le localStorage).
 * - Chaque page reçoit assets/appli/appli.js (ajouté dans son <head>) : la voix du téléphone pour « Comment ça
 *   s'appelle ? » et « À l'aveugle » (la synthèse vocale du navigateur n'existe pas dans une WebView), sa dictée pour
 *   « À l'aveugle » (Dictee.java) et la couleur du fond pour les barres du système.
 * - La police Lexend, demandée à Google Fonts par les pages, est servie depuis l'application (assets/appli/polices).
 * - Les liens vers d'autres sites (Lichess, Wikimedia…) s'ouvrent dans le navigateur du téléphone. Seul le serveur des
 *   comptes (Supabase, facultatifs) est joint depuis l'application ; la connexion avec Google, Meta ou LinkedIn se fait
 *   dans le navigateur, qui revient à l'application par pomchess://connexion (retourConnexion).
 */
public class MainActivity extends Activity {
    static final String HOTE = "appassets.androidplatform.net";
    static final String SITE = "https://" + HOTE + "/assets/site/";
    static final int MOTEUR_MINIMUM = 90;

    private WebView web;
    private FrameLayout cadre;
    private Voix voix;
    private Dictee dictee;
    private WebViewAssetLoader chargeur;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle etat) {
        super.onCreate(etat);

        cadre = new FrameLayout(this);
        cadre.setBackgroundColor(getColor(R.color.fond));
        web = new WebView(this);
        web.setBackgroundColor(getColor(R.color.fond));
        cadre.addView(web, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(cadre);
        bordABord(); // (après setContentView : la fenêtre doit exister)
        // le contenu s'arrête aux barres du système (et au clavier) ; derrière elles, la couleur du fond de la page
        cadre.setOnApplyWindowInsetsListener((v, insets) -> {
            int g, h, d, b;
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets s = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                android.graphics.Insets ime = insets.getInsets(WindowInsets.Type.ime());
                g = s.left; h = s.top; d = s.right; b = Math.max(s.bottom, ime.bottom);
            } else {
                g = insets.getSystemWindowInsetLeft(); h = insets.getSystemWindowInsetTop();
                d = insets.getSystemWindowInsetRight(); b = insets.getSystemWindowInsetBottom();
            }
            v.setPadding(g, h, d, b);
            return insets;
        });

        WebSettings r = web.getSettings();
        r.setJavaScriptEnabled(true);
        r.setDomStorageEnabled(true);
        r.setMediaPlaybackRequiresUserGesture(false);
        r.setAllowFileAccess(false);
        r.setAllowContentAccess(false);
        r.setTextZoom(100); // les pages sont dessinées pour tenir sur un écran : on ne les agrandit pas

        chargeur = new WebViewAssetLoader.Builder()
                .setDomain(HOTE)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        web.setWebViewClient(new Client());
        voix = new Voix(this, web);
        dictee = new Dictee(this, web);
        web.addJavascriptInterface(new Pont(), "EchecsAndroid");

        // le bouton retour : la page précédente, sinon on quitte
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::retour);
        }

        if (retourConnexion(getIntent())) { /* la page du compte est chargée */ }
        else if (etat == null || web.restoreState(etat) == null) web.loadUrl(pageDAccueil());
        if (etat == null) verifierMoteur();
    }

    /** Les jeux demandent un moteur web récent (Chrome 90 ou plus) : sinon, on propose de le mettre à jour. */
    private void verifierMoteur() {
        PackageInfo p = WebViewCompat.getCurrentWebViewPackage(this);
        if (p == null || p.versionName == null) return;
        int majeure;
        try { majeure = Integer.parseInt(p.versionName.split("\\.")[0]); } catch (NumberFormatException e) { return; }
        if (majeure >= MOTEUR_MINIMUM) return;
        new AlertDialog.Builder(this)
                .setTitle(R.string.moteur_titre)
                .setMessage(getString(R.string.moteur_texte, p.versionName))
                .setPositiveButton(R.string.moteur_mettre_a_jour, (d, w) -> {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + p.packageName)));
                    } catch (ActivityNotFoundException e) {
                        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + p.packageName)));
                    }
                })
                .setNegativeButton(R.string.moteur_plus_tard, null)
                .show();
    }

    /** Le retour d'une connexion faite dans le navigateur : pomchess://connexion?code=… -> la page du compte, avec le
     *  code (la page l'échange contre une session, avec la clé gardée dans la WebView au départ de la connexion). */
    private boolean retourConnexion(Intent i) {
        Uri u = i == null ? null : i.getData();
        if (u == null || !"pomchess".equals(u.getScheme()) || !"connexion".equals(u.getHost())) return false;
        String langue = prefs().getString("langue", "fr");
        String requete = u.getEncodedQuery();
        web.loadUrl(SITE + (langue.equals("en") ? "en/" : "") + "compte/index.html" + (requete == null ? "" : "?" + requete));
        return true;
    }

    @Override
    protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        setIntent(i);
        retourConnexion(i);
    }

    /** La page d'accueil : celle de la dernière langue utilisée, sinon celle du téléphone. */
    private String pageDAccueil() {
        String langue = prefs().getString("langue", null);
        if (langue == null) langue = Locale.getDefault().getLanguage().equals("fr") ? "fr" : "en";
        return SITE + (langue.equals("en") ? "en/index.html" : "index.html");
    }

    private SharedPreferences prefs() { return getSharedPreferences("appli", MODE_PRIVATE); }

    private void retour() {
        if (web.canGoBack()) web.goBack();
        else finish();
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() { retour(); } // (avant Android 13)

    @Override
    protected void onSaveInstanceState(Bundle etat) {
        super.onSaveInstanceState(etat);
        web.saveState(etat);
    }

    @Override
    protected void onPause() {
        super.onPause();
        voix.arreter();
        dictee.arreter();
        web.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
    }

    /** La réponse à la demande du micro (dictée de « À l'aveugle »). */
    @Override
    public void onRequestPermissionsResult(int code, String[] permissions, int[] resultats) {
        super.onRequestPermissionsResult(code, permissions, resultats);
        if (code == Dictee.DEMANDE_MICRO) dictee.permission(resultats.length > 0 && resultats[0] == android.content.pm.PackageManager.PERMISSION_GRANTED);
    }

    @Override
    protected void onDestroy() {
        voix.fermer();
        dictee.fermer();
        web.destroy();
        super.onDestroy();
    }

    /** L'application occupe tout l'écran, derrière les barres du système (elles restent visibles). */
    @SuppressWarnings("deprecation")
    private void bordABord() {
        Window f = getWindow();
        f.setStatusBarColor(Color.TRANSPARENT);
        f.setNavigationBarColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= 30) f.setDecorFitsSystemWindows(false);
        else f.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        if (Build.VERSION.SDK_INT >= 29) f.setNavigationBarContrastEnforced(false);
        teinterBarres((getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES);
    }

    /** Les icônes des barres du système : foncées sur un fond clair, claires sur un fond sombre. */
    @SuppressWarnings("deprecation")
    private void teinterBarres(boolean sombre) {
        Window f = getWindow();
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController c = f.getInsetsController();
            if (c == null) return;
            int clair = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
            c.setSystemBarsAppearance(sombre ? 0 : clair, clair);
        } else {
            View v = f.getDecorView();
            int drapeaux = v.getSystemUiVisibility();
            int clair = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | (Build.VERSION.SDK_INT >= 26 ? View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR : 0);
            v.setSystemUiVisibility(sombre ? drapeaux & ~clair : drapeaux | clair);
        }
    }

    /** Ce que les pages peuvent demander à l'application (window.EchecsAndroid, utilisé par appli.js). */
    class Pont {
        @JavascriptInterface public String voix() { return voix.liste(); }
        @JavascriptInterface public void parler(String id, String texte, String langue, float vitesse) { voix.parler(id, texte, langue, vitesse); }
        @JavascriptInterface public void arreter() { voix.arreter(); }
        /** La dictée (window.SpeechRecognition, dans appli.js). */
        @JavascriptInterface public boolean dicteePossible() { return dictee.possible(); }
        @JavascriptInterface public void ecouter(String id, String langue, int max, String indices) { dictee.ecouter(id, langue, max, indices); }
        @JavascriptInterface public void arreterEcoute() { dictee.arreter(); }
        /** La couleur du fond de la page (#rrggbb) : derrière les barres du système, avec des icônes lisibles. */
        @JavascriptInterface public void fond(String couleur, boolean sombre) {
            runOnUiThread(() -> {
                try {
                    int c = Color.parseColor(couleur);
                    cadre.setBackgroundColor(c);
                    web.setBackgroundColor(c);
                    teinterBarres(sombre);
                } catch (IllegalArgumentException e) { /* couleur illisible : on garde l'ancienne */ }
            });
        }
    }

    class Client extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView vue, WebResourceRequest demande) {
            Uri u = demande.getUrl();
            String hote = u.getHost() == null ? "" : u.getHost();
            // la police Lexend : depuis l'application
            if (hote.equals("fonts.googleapis.com")) return asset("appli/polices/lexend.css", "text/css");
            // le serveur des comptes (Supabase) : en ligne, normalement
            if (hote.endsWith(".supabase.co")) return null;
            // rien d'autre ne sort de l'application
            if (!hote.equals(HOTE)) return new WebResourceResponse("text/plain", "utf-8", 404, "Hors ligne", null, new ByteArrayInputStream(new byte[0]));
            String chemin = u.getPath() == null ? "" : u.getPath();
            // les pages du site reçoivent le script de l'application
            if (chemin.startsWith("/assets/site/") && (chemin.endsWith(".html") || chemin.endsWith("/"))) {
                String fichier = chemin.substring("/assets/".length()) + (chemin.endsWith("/") ? "index.html" : "");
                return pageAvecScript(fichier);
            }
            // les fichiers .gz du site sont rangés en .gzip (voir app/build.gradle)
            if (chemin.endsWith(".gz")) return asset(chemin.substring("/assets/".length()) + "ip", "application/octet-stream");
            // le moteur d'échecs (Stockfish, « À l'aveugle ») : le navigateur veut le bon type pour du WebAssembly
            if (chemin.endsWith(".wasm")) return asset(chemin.substring("/assets/".length()), "application/wasm");
            return chargeur.shouldInterceptRequest(u);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView vue, WebResourceRequest demande) {
            Uri u = demande.getUrl();
            if (HOTE.equals(u.getHost())) return false;
            // un autre site : dans le navigateur du téléphone
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, u));
            } catch (ActivityNotFoundException e) { /* pas de navigateur */ }
            return true;
        }

        @Override
        public void onPageFinished(WebView vue, String url) {
            // la langue de la dernière page : l'application rouvrira dans cette langue
            if (url != null && url.startsWith(SITE)) prefs().edit().putString("langue", url.startsWith(SITE + "en/") ? "en" : "fr").apply();
        }

        @Override
        public boolean onRenderProcessGone(WebView vue, RenderProcessGoneDetail detail) {
            // le moteur de la page s'est arrêté (manque de mémoire) : on repart proprement
            recreate();
            return true;
        }
    }

    private WebResourceResponse asset(String fichier, String type) {
        try {
            return new WebResourceResponse(type, "utf-8", getAssets().open(fichier));
        } catch (IOException e) {
            return null;
        }
    }

    private WebResourceResponse pageAvecScript(String fichier) {
        try (InputStream in = getAssets().open(fichier)) {
            ByteArrayOutputStream o = new ByteArrayOutputStream();
            byte[] tampon = new byte[16384];
            for (int n; (n = in.read(tampon)) > 0; ) o.write(tampon, 0, n);
            String html = o.toString("UTF-8");
            int i = html.indexOf("<head>");
            String script = "<script src=\"/assets/appli/appli.js\"></script>";
            html = i >= 0 ? html.substring(0, i + 6) + script + html.substring(i + 6) : script + html;
            return new WebResourceResponse("text/html", "utf-8", new ByteArrayInputStream(html.getBytes(StandardCharsets.UTF_8)));
        } catch (IOException e) {
            return new WebResourceResponse("text/html", "utf-8", 404, "Introuvable", null,
                    new ByteArrayInputStream("<!doctype html><meta charset=utf-8><p>Page introuvable.</p>".getBytes(StandardCharsets.UTF_8)));
        }
    }
}
