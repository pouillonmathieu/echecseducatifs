package io.github.pouillonmathieu.echecs;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;

/**
 * La dictée du téléphone (SpeechRecognizer), pour dire ses coups dans « À l'aveugle ». appli.js en fait un
 * window.SpeechRecognition, comme dans un navigateur. La reconnaissance est faite par le service du téléphone
 * (souvent l'appli Google, parfois sans connexion) : l'application elle-même n'envoie rien sur Internet.
 * Le micro est demandé la première fois (permission RECORD_AUDIO).
 */
class Dictee {
    static final int DEMANDE_MICRO = 7;
    private final Activity activite;
    private final WebView web;
    private SpeechRecognizer reco;
    private String idEnCours;
    private String enAttente, langueEnAttente; // une écoute qui attend la permission du micro
    private int maxEnAttente;

    Dictee(Activity activite, WebView web) {
        this.activite = activite;
        this.web = web;
    }

    boolean possible() { return SpeechRecognizer.isRecognitionAvailable(activite); }

    /** Commence à écouter ; les phrases entendues sont envoyées à la page (window.__dictee). */
    void ecouter(String id, String langue, int max) {
        activite.runOnUiThread(() -> {
            if (activite.checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                enAttente = id; langueEnAttente = langue; maxEnAttente = max;
                activite.requestPermissions(new String[] { Manifest.permission.RECORD_AUDIO }, DEMANDE_MICRO);
                return;
            }
            demarrer(id, langue, max);
        });
    }

    /** Réponse à la demande du micro (MainActivity.onRequestPermissionsResult). */
    void permission(boolean accordee) {
        String id = enAttente;
        enAttente = null;
        if (id == null) return;
        if (accordee) demarrer(id, langueEnAttente, maxEnAttente);
        else { envoyer("erreur", id, "\"not-allowed\""); envoyer("fin", id, null); }
    }

    private void demarrer(String id, String langue, int max) {
        arreterReco();
        idEnCours = id;
        try {
            reco = SpeechRecognizer.createSpeechRecognizer(activite);
        } catch (RuntimeException e) {
            envoyer("erreur", id, "\"service-not-allowed\""); envoyer("fin", id, null);
            return;
        }
        reco.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle p) { }
            @Override public void onBeginningOfSpeech() { }
            @Override public void onRmsChanged(float db) { }
            @Override public void onBufferReceived(byte[] b) { }
            @Override public void onEndOfSpeech() { }
            @Override public void onPartialResults(Bundle p) { }
            @Override public void onEvent(int type, Bundle p) { }
            @Override public void onResults(Bundle r) {
                ArrayList<String> phrases = r.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                JSONArray a = new JSONArray();
                if (phrases != null) for (String s : phrases) a.put(s);
                envoyer("resultats", id, a.toString());
                terminer(id);
            }
            @Override public void onError(int code) {
                envoyer("erreur", id, JSONObject.quote(nomErreur(code)));
                terminer(id);
            }
        });
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, langue);
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, Math.max(1, max));
        i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
        reco.startListening(i);
    }

    private static String nomErreur(int code) {
        switch (code) {
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: return "not-allowed";
            case SpeechRecognizer.ERROR_NO_MATCH:
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: return "no-speech";
            case SpeechRecognizer.ERROR_NETWORK:
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: return "network";
            case SpeechRecognizer.ERROR_AUDIO: return "audio-capture";
            case SpeechRecognizer.ERROR_CLIENT: return "aborted";
            default: return "service-not-allowed";
        }
    }

    private void terminer(String id) {
        envoyer("fin", id, null);
        if (id.equals(idEnCours)) arreterReco();
    }

    /** Arrête l'écoute en cours (la page appelle stop()/abort()). */
    void arreter() {
        activite.runOnUiThread(() -> {
            String id = idEnCours;
            arreterReco();
            if (id != null) envoyer("fin", id, null);
        });
    }

    private void arreterReco() {
        idEnCours = null;
        if (reco != null) {
            try { reco.cancel(); reco.destroy(); } catch (RuntimeException e) { /* déjà arrêté */ }
            reco = null;
        }
    }

    void fermer() { activite.runOnUiThread(this::arreterReco); }

    private void envoyer(String quoi, String id, String valeur) {
        String js = "window.__dictee && window.__dictee(" + JSONObject.quote(quoi) + "," + JSONObject.quote(id) + "," + (valeur == null ? "null" : valeur) + ")";
        web.post(() -> web.evaluateJavascript(js, null));
    }
}
