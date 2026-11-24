package io.github.pouillonmathieu.echecs;

import android.app.Activity;
import android.os.CancellationSignal;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;

import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.credentials.exceptions.NoCredentialException;

import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import org.json.JSONObject;

import java.util.concurrent.Executor;

/**
 * « Continuer avec Google » dans l'application : la fenêtre de connexion de Google d'Android (Credential Manager), au
 * lieu d'un passage par le navigateur. Google donne un jeton d'identité, que la page du compte passe à Supabase
 * (signInWithIdToken, comme le bouton Google du site) : Google affiche « Pom'chess », pas l'adresse de Supabase.
 *
 * Le jeton est demandé pour le client OAuth « Web » du projet Google (celui que Supabase connaît). Google n'accepte que
 * l'application déclarée dans le même projet par un client OAuth « Android » : nom du paquet et empreinte SHA-1 de la
 * clé qui signe l'application (voir README.md). Si ça ne marche pas, la page revient à la connexion par le navigateur.
 */
class ConnexionGoogle {
    static final String CLIENT_WEB = "641905281731-jkffurppcggb0oup63i3j7nc25nv971l.apps.googleusercontent.com";
    private final Activity activite;
    private final WebView web;
    private final CredentialManager gestionnaire;
    private final Executor principal = new Handler(Looper.getMainLooper())::post;

    ConnexionGoogle(Activity activite, WebView web) {
        this.activite = activite;
        this.web = web;
        this.gestionnaire = CredentialManager.create(activite);
    }

    /** Ouvre la fenêtre de Google ; la réponse va à la page (window.__connexionGoogle(id, jeton, erreur)).
     *  nonceHache : le SHA-256 (hexadécimal) d'un nombre au hasard que la page donnera en clair à Supabase. */
    void connecter(String id, String nonceHache) {
        activite.runOnUiThread(() -> {
            GetSignInWithGoogleOption option = new GetSignInWithGoogleOption.Builder(CLIENT_WEB)
                    .setNonce(nonceHache)
                    .build();
            GetCredentialRequest demande = new GetCredentialRequest.Builder().addCredentialOption(option).build();
            gestionnaire.getCredentialAsync(activite, demande, new CancellationSignal(), principal,
                    new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                        @Override
                        public void onResult(GetCredentialResponse reponse) {
                            Credential c = reponse.getCredential();
                            if (c instanceof CustomCredential && GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(c.getType())) {
                                try {
                                    envoyer(id, GoogleIdTokenCredential.createFrom(c.getData()).getIdToken(), null);
                                } catch (Exception e) {
                                    envoyer(id, null, "illisible");
                                }
                            } else {
                                envoyer(id, null, "inattendu");
                            }
                        }

                        @Override
                        public void onError(GetCredentialException e) {
                            String code = e instanceof GetCredentialCancellationException ? "annule"
                                    : e instanceof NoCredentialException ? "aucun" : "erreur";
                            envoyer(id, null, code + " " + e.getType() + (e.getMessage() == null ? "" : " " + e.getMessage()));
                        }
                    });
        });
    }

    private void envoyer(String id, String jeton, String erreur) {
        String js = "window.__connexionGoogle && window.__connexionGoogle(" + JSONObject.quote(id) + ","
                + (jeton == null ? "null" : JSONObject.quote(jeton)) + ","
                + (erreur == null ? "null" : JSONObject.quote(erreur)) + ")";
        web.post(() -> web.evaluateJavascript(js, null));
    }
}
