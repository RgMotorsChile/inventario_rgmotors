"use client";

import { useEffect, useState } from "react";
import {
  INSTALL_HINT_KEY,
  detectInstallKind,
  isInAppBrowser,
  type InstallKind,
} from "@/lib/install";

type PromptEvent = Event & { prompt: () => Promise<void> };

export function InstallAccess() {
  const [kind, setKind] = useState<InstallKind | null>(null);
  const [open, setOpen] = useState(false);
  const [embedded, setEmbedded] = useState(false);
  const [androidPrompt, setAndroidPrompt] = useState<PromptEvent | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const next = detectInstallKind({
      ua,
      standalone: Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
      displayModeStandalone: window.matchMedia("(display-mode: standalone)").matches,
      macTouch: /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1,
    });
    setKind(next);
    const inApp = isInAppBrowser(ua);
    setEmbedded(inApp);
    // En /login no abrimos el diálogo solo: tapaba el formulario en el celular.
    // Dentro de WhatsApp u otra app tampoco: no se puede instalar ahí y el aviso tapaba el panel.
    const onLogin = window.location.pathname.startsWith("/login");
    if (!onLogin && !inApp && next !== "standalone" && next !== "desktop" && !localStorage.getItem(INSTALL_HINT_KEY)) {
      setOpen(true);
    }

    const reopen = () => setOpen(true);
    window.addEventListener("rg:install-help", reopen);

    const onPrompt = (event: Event) => {
      setAndroidPrompt(event as PromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    return () => {
      window.removeEventListener("rg:install-help", reopen);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  if (!kind || kind === "standalone") return null;

  const mobile = kind === "ios" || kind === "android";

  function dismiss() {
    localStorage.setItem(INSTALL_HINT_KEY, "1");
    setOpen(false);
  }

  async function installAndroid() {
    if (!androidPrompt) {
      setOpen(true);
      return;
    }
    await androidPrompt.prompt();
    setAndroidPrompt(null);
    dismiss();
  }

  return (
    <>
      {mobile ? (
        <button className="install-pill" type="button" onClick={() => (kind === "android" && androidPrompt ? installAndroid() : setOpen(true))}>
          Instalar en el celular
        </button>
      ) : null}

      {open ? (
        <div className="dialog-back" role="dialog" aria-labelledby="install-title" aria-modal="true">
          <div className="card dialog install-sheet">
            <p className="eyebrow">Acceso directo</p>
            <h2 id="install-title">{kind === "android" ? "Inventario RG en el celular" : "Inventario RG en el iPhone"}</h2>
            {kind === "ios" ? (
              <>
                <p className="lead">
                  No hace falta App Store. Queda el logo de RG Motors en la pantalla de inicio y abre este panel.
                </p>
                {embedded ? (
                  <p className="err">
                    Estás en WhatsApp, Chrome u otra app. Abre Safari y repite estos pasos ahí.
                  </p>
                ) : null}
                <ol className="install-steps">
                  <li>
                    Toca <strong>Compartir</strong>
                    <ShareGlyph />
                    en la barra de Safari.
                  </li>
                  <li>
                    Baja y toca <strong>Agregar a pantalla de inicio</strong>.
                  </li>
                  <li>
                    Confirma. El nombre será <strong>Inventario RG</strong>.
                  </li>
                </ol>
              </>
            ) : kind === "android" ? (
              <>
                <p className="lead">Puedes dejar el panel como una app, con el ícono de RG Motors.</p>
                {embedded ? (
                  <p className="err">
                    Estás dentro de WhatsApp u otra app. Toca los tres puntos (⋮) y elige «Abrir en Chrome»; ahí
                    repite estos pasos.
                  </p>
                ) : null}
                <ol className="install-steps">
                  <li>En Chrome, toca el menú (tres puntos ⋮).</li>
                  <li>
                    Elige <strong>Instalar aplicación</strong> o <strong>Agregar a pantalla de inicio</strong>.
                  </li>
                </ol>
                {androidPrompt ? (
                  <button className="btn" type="button" onClick={installAndroid}>
                    Instalar ahora
                  </button>
                ) : null}
              </>
            ) : (
              <p className="lead">En el celular, Safari o Chrome ofrecen «Agregar a pantalla de inicio».</p>
            )}
            <button className="btn ghost" type="button" onClick={dismiss}>
              Ahora no
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ShareGlyph() {
  return (
    <svg className="install-share" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 3.2 7.8 7.4l1.4 1.4 1.8-1.8V15h2V7l1.8 1.8 1.4-1.4L12 3.2ZM6 18v-5H4v6c0 .6.4 1 1 1h14c.6 0 1-.4 1-1v-6h-2v5H6Z"
      />
    </svg>
  );
}
