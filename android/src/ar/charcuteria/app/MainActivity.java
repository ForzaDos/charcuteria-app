package ar.charcuteria.app;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import org.json.JSONObject;

import android.os.ParcelFileDescriptor;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {

    private static final int REQ_GUARDAR = 41;
    private static final int REQ_ABRIR = 42;

    private WebView webView;
    private WebView printView;
    private FrameLayout root;
    private String textoPendiente;
    private ClipboardManager portapapeles;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Se pide en el hilo principal: desde el puente de JS algunas versiones fallan al crearlo.
        portapapeles = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        root = new FrameLayout(this);
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(0x12, 0x0e, 0x0d));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        webView.setWebViewClient(new WebViewClient());
        // Sin WebChromeClient el WebView no muestra confirm() ni prompt().
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new PrintBridge(), "Android");
        webView.loadUrl("file:///android_asset/index.html");

        root.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);
    }

    private class PrintBridge {
        @JavascriptInterface
        public void imprimir(final String html, final String jobName) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    imprimirHtml(html, jobName);
                }
            });
        }

        // Abre el selector del sistema para guardar (teléfono, Drive, etc.).
        @JavascriptInterface
        public void guardarArchivo(final String nombre, final String mime, final String texto) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    textoPendiente = texto;
                    guardarPendiente(texto);
                    Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType(mime == null || mime.isEmpty() ? "application/octet-stream" : mime);
                    intent.putExtra(Intent.EXTRA_TITLE, nombre);
                    try {
                        startActivityForResult(intent, REQ_GUARDAR);
                    } catch (Exception e) {
                        textoPendiente = null;
                        borrarPendiente();
                        avisarJs("window.__charcuteriaArchivoGuardado && window.__charcuteriaArchivoGuardado(false)");
                    }
                }
            });
        }

        // Guarda directo en Descargas/Charcuteria, sin el selector del sistema (Android 10+).
        // Devuelve la ruta para mostrar, o "" si no se pudo (y la app usa el selector).
        @JavascriptInterface
        public String guardarEnDescargas(String nombre, String mime, String texto) {
            if (Build.VERSION.SDK_INT < 29 || texto == null || texto.isEmpty()) return "";
            ContentResolver cr = getContentResolver();
            Uri uri = null;
            try {
                byte[] bytes = texto.getBytes(StandardCharsets.UTF_8);
                ContentValues v = new ContentValues();
                v.put(MediaStore.MediaColumns.DISPLAY_NAME, nombre);
                v.put(MediaStore.MediaColumns.MIME_TYPE, mime == null || mime.isEmpty() ? "application/octet-stream" : mime);
                v.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Charcuteria");
                v.put(MediaStore.MediaColumns.IS_PENDING, 1);
                uri = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                if (uri == null) return "";
                if (!escribir(uri, "w", bytes) || tamanio(uri) != bytes.length) {
                    cr.delete(uri, null, null);
                    return "";
                }
                ContentValues listo = new ContentValues();
                listo.put(MediaStore.MediaColumns.IS_PENDING, 0);
                cr.update(uri, listo, null, null);
                String final_ = nombre;
                try (Cursor c = cr.query(uri, new String[]{MediaStore.MediaColumns.DISPLAY_NAME}, null, null, null)) {
                    if (c != null && c.moveToFirst()) final_ = c.getString(0);
                } catch (Exception e) { }
                return "Descargas/Charcuteria/" + final_;
            } catch (Exception e) {
                if (uri != null) {
                    try { cr.delete(uri, null, null); } catch (Exception e2) { }
                }
                return "";
            }
        }

        @JavascriptInterface
        public boolean copiarTexto(String texto) {
            try {
                if (portapapeles == null) return false;
                portapapeles.setPrimaryClip(ClipData.newPlainText("Respaldo Charcutería", texto));
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface
        public void abrirArchivo() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType("*/*");
                    try {
                        startActivityForResult(intent, REQ_ABRIR);
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "No hay selector de archivos", Toast.LENGTH_LONG).show();
                    }
                }
            });
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        Uri uri = (resultCode == RESULT_OK && data != null) ? data.getData() : null;
        if (requestCode == REQ_GUARDAR) {
            boolean ok = false;
            // Si Android recreó la pantalla mientras se elegía carpeta, el texto quedó en el archivo temporal.
            String texto = textoPendiente != null ? textoPendiente : leerPendiente();
            if (uri != null && texto != null && !texto.isEmpty()) {
                byte[] bytes = texto.getBytes(StandardCharsets.UTF_8);
                ok = escribir(uri, "wt", bytes) && tamanio(uri) == bytes.length;
                // Algunos proveedores (Drive) no aceptan "wt".
                if (!ok) ok = escribir(uri, "w", bytes) && tamanio(uri) == bytes.length;
            }
            textoPendiente = null;
            borrarPendiente();
            avisarJs("window.__charcuteriaArchivoGuardado && window.__charcuteriaArchivoGuardado(" + ok + ")");
        } else if (requestCode == REQ_ABRIR) {
            if (uri == null) return;
            try (InputStream in = getContentResolver().openInputStream(uri)) {
                ByteArrayOutputStream buf = new ByteArrayOutputStream();
                byte[] b = new byte[8192];
                int n;
                while (in != null && (n = in.read(b)) > 0) buf.write(b, 0, n);
                String texto = new String(buf.toByteArray(), StandardCharsets.UTF_8);
                avisarJs("window.__charcuteriaArchivoAbierto && window.__charcuteriaArchivoAbierto(" + JSONObject.quote(texto) + ")");
            } catch (Exception e) {
                Toast.makeText(this, "No se pudo leer el archivo", Toast.LENGTH_LONG).show();
            }
        }
    }

    private boolean escribir(Uri uri, String modo, byte[] bytes) {
        try (ParcelFileDescriptor pfd = getContentResolver().openFileDescriptor(uri, modo)) {
            if (pfd == null) return false;
            try (FileOutputStream out = new FileOutputStream(pfd.getFileDescriptor())) {
                out.write(bytes);
                out.flush();
                // "w" no siempre trunca: cortar lo que sobre de un archivo anterior.
                try { out.getChannel().truncate(bytes.length); } catch (Exception e) { }
                try { out.getFD().sync(); } catch (Exception e) { }
            }
            return true;
        } catch (Exception e) {
            // Proveedores sin descriptor de archivo: por stream.
            try (OutputStream out = getContentResolver().openOutputStream(uri, modo)) {
                if (out == null) return false;
                out.write(bytes);
                out.flush();
                return true;
            } catch (Exception e2) {
                return false;
            }
        }
    }

    // Relee lo escrito para confirmar que el archivo no quedó vacío o cortado.
    private long tamanio(Uri uri) {
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            if (in == null) return -1;
            long total = 0;
            byte[] b = new byte[8192];
            int n;
            while ((n = in.read(b)) > 0) total += n;
            return total;
        } catch (Exception e) {
            return -1;
        }
    }

    private File archivoPendiente() {
        return new File(getCacheDir(), "guardar-pendiente.txt");
    }

    private void guardarPendiente(String texto) {
        try (FileOutputStream out = new FileOutputStream(archivoPendiente())) {
            out.write(texto.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) { }
    }

    private String leerPendiente() {
        File f = archivoPendiente();
        if (!f.exists()) return null;
        try (FileInputStream in = new FileInputStream(f)) {
            ByteArrayOutputStream buf = new ByteArrayOutputStream();
            byte[] b = new byte[8192];
            int n;
            while ((n = in.read(b)) > 0) buf.write(b, 0, n);
            return new String(buf.toByteArray(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }

    private void borrarPendiente() {
        try { archivoPendiente().delete(); } catch (Exception e) { }
    }

    private void avisarJs(String js) {
        if (webView != null) webView.evaluateJavascript(js, null);
    }

    private void imprimirHtml(String html, String jobName) {
        final String nombre = (jobName == null || jobName.trim().isEmpty())
                ? "Charcuteria" : jobName.trim();

        if (printView != null) {
            root.removeView(printView);
            printView.destroy();
            printView = null;
        }

        printView = new WebView(this);
        printView.setBackgroundColor(Color.WHITE);
        WebSettings ps = printView.getSettings();
        ps.setJavaScriptEnabled(true);
        ps.setDomStorageEnabled(true);
        ps.setAllowFileAccess(true);

        printView.setWebViewClient(new WebViewClient() {
            private boolean printed = false;

            @Override
            public void onPageFinished(WebView view, String url) {
                if (printed) return;
                printed = true;
                view.postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        PrintManager pm = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                        if (pm == null) {
                            Toast.makeText(MainActivity.this, "No hay servicio de impresión", Toast.LENGTH_LONG).show();
                            return;
                        }
                        PrintAttributes attrs = new PrintAttributes.Builder()
                                .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                                .setResolution(new PrintAttributes.Resolution("pdf", "PDF", 300, 300))
                                .setMinMargins(new PrintAttributes.Margins(0, 0, 0, 0))
                                .build();
                        pm.print(nombre, view.createPrintDocumentAdapter(nombre), attrs);
                    }
                }, 350);
            }
        });

        root.addView(printView, new FrameLayout.LayoutParams(794, 1123));
        printView.setVisibility(View.INVISIBLE);
        printView.loadDataWithBaseURL("file:///android_asset/", html, "text/html", "UTF-8", null);
    }

    // Atrás lo maneja primero la app (cierra ventanas, vuelve a Lotes); si no lo usa, sale.
    @Override
    public void onBackPressed() {
        if (webView == null) {
            super.onBackPressed();
            return;
        }
        webView.evaluateJavascript(
                "(window.__charcuteriaAtras && window.__charcuteriaAtras()) ? 'si' : 'no'",
                new ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String value) {
                        if (!"\"si\"".equals(value)) MainActivity.super.onBackPressed();
                    }
                });
    }

    @Override
    protected void onPause() {
        // Que la app guarde lo pendiente antes de quedar en segundo plano.
        avisarJs("window.__charcuteriaGuardar && window.__charcuteriaGuardar()");
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (printView != null) {
            if (printView.getParent() != null) {
                ((ViewGroup) printView.getParent()).removeView(printView);
            }
            printView.destroy();
            printView = null;
        }
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
