package com.americanlyceum.mobile;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeWebViewClient;
import com.getcapacitor.BridgeActivity;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

public class MainActivity extends BridgeActivity {
    private String nativeMobileCss = "";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadsImagesAutomatically(true);
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        webView.setOverScrollMode(View.OVER_SCROLL_IF_CONTENT_SCROLLS);
        webView.setVerticalScrollBarEnabled(false);

        nativeMobileCss = readAsset("public/mobile-app-overrides.css");
        getBridge().setWebViewClient(new NativeMobileWebViewClient());
    }

    private String readAsset(String path) {
        StringBuilder content = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
            getAssets().open(path), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                content.append(line).append('\n');
            }
        } catch (IOException ignored) {
            return "";
        }
        return content.toString();
    }

    private final class NativeMobileWebViewClient extends BridgeWebViewClient {
        NativeMobileWebViewClient() {
            super(getBridge());
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            if (!url.startsWith("https://alis.eduzeeno.com")) return;

            String script = "document.documentElement.classList.add('edu-native-app');" +
                "var old=document.getElementById('edu-native-app-styles');" +
                "if(old)old.remove();" +
                "var style=document.createElement('style');" +
                "style.id='edu-native-app-styles';" +
                "style.textContent=" + JSONObject.quote(nativeMobileCss) + ";" +
                "document.head.appendChild(style);";
            view.evaluateJavascript(script, null);
        }
    }
}
