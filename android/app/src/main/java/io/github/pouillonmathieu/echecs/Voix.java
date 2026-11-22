package io.github.pouillonmathieu.echecs;

import android.content.Context;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

/**
 * La voix du téléphone (TextToSpeech), pour lire les mots de « Comment ça s'appelle ? ». appli.js en fait un
 * window.speechSynthesis, comme dans un navigateur : le jeu n'a pas à savoir qu'il est dans l'application.
 */
class Voix {
    private final WebView web;
    private TextToSpeech tts;
    private volatile String liste = "[]";

    Voix(Context ctx, WebView web) {
        this.web = web;
        tts = new TextToSpeech(ctx.getApplicationContext(), (statut) -> {
            if (statut != TextToSpeech.SUCCESS) return;
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String id) { }
                @Override public void onDone(String id) { fin(id); }
                @SuppressWarnings("deprecation")
                @Override public void onError(String id) { fin(id); }
                @Override public void onError(String id, int code) { fin(id); }
                @Override public void onStop(String id, boolean interrompu) { fin(id); }
            });
            liste = calculerListe();
            // les voix sont prêtes : la page est prévenue (comme l'événement « voiceschanged » d'un navigateur)
            web.post(() -> web.evaluateJavascript("window.__voixPretes && window.__voixPretes()", null));
        });
    }

    /** Les langues que le téléphone sait lire (installées sur l'appareil), au format JSON. */
    private String calculerListe() {
        Set<String> langues = new LinkedHashSet<>();
        try {
            Set<Voice> voix = tts.getVoices();
            if (voix != null) for (Voice v : voix) {
                if (v.getFeatures() != null && v.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)) continue;
                langues.add(v.getLocale().toLanguageTag());
            }
        } catch (RuntimeException e) { /* certains moteurs ne donnent pas leurs voix */ }
        JSONArray a = new JSONArray();
        try {
            for (String l : langues) a.put(new JSONObject().put("lang", l).put("name", l));
        } catch (org.json.JSONException e) { /* rien */ }
        return a.toString();
    }

    String liste() { return liste; }

    void parler(String id, String texte, String langue, float vitesse) {
        if (tts == null) { fin(id); return; }
        tts.setLanguage(Locale.forLanguageTag(langue));
        tts.setSpeechRate(vitesse > 0 ? vitesse : 1f);
        tts.speak(texte, TextToSpeech.QUEUE_FLUSH, new Bundle(), id);
    }

    void arreter() {
        if (tts != null) tts.stop();
    }

    void fermer() {
        if (tts != null) tts.shutdown();
        tts = null;
    }

    private void fin(String id) {
        String js = "window.__voixFin && window.__voixFin(" + JSONObject.quote(id) + ")";
        web.post(() -> web.evaluateJavascript(js, null));
    }
}
