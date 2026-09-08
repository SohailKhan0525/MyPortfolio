"use client";

import { useEffect, useRef } from "react";

const THEME_SOUND = "data:audio/wav;base64,UklGRm4oAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAATElTVEIAAABJTkZPSUNSRAsAAAAyMDE0LTEyLTIxAABJU0ZUDQAAAExhdmY2MS43LjEwMwAASVRDSAwAAABMb2dpYyBQcm8gWABkYXRhACgAAAUACAD+//7/BQACAAMAAQABAAUA/v/7/wEA/P/+//3/+P/7//7//P/7//z/+v/9//3//P///wAA/P/8////+v/7/wAA+//9/wEA/f//////AAABAP//AwAAAAQAAQABAAUA//8CAP////8CAAMAAAAAAP//AQD//wEAAwD8/wEAAgAAAPz/AgADAP///v/8////AQD//wEA///9//v//v8DAP7/AwD///z/BQAEAAEAAgD//wEABAAAAAAA/f8FAAAA+v8AAP7/AQAAAPz/AQAAAP7/AQD7//3/AAD///7/+f////z//P/5//v//P/8//r/+//8//v//P/4/////f/9//3//////wAA/v///wIAAAAAAAIABQAAAAQAAgADAAYABgAAAP7/AQACAAUAAAAAAPz//P/+//z/AgACAPn//f/+//7///8AAP7/+//+////AAAAAPz///8AAPz//f/9/wEAAwD5/wAA///+/wEA/P8AAAUAAgACAP///v8EAAIABgADAAMAAQD//wQAAQABAAIA///9/wAAAQD+//v/BAD+//z//v8DAP3//v8BAP3///8AAP/////4//z/AwD8/////f/+//3/AAD///7/AgD///7////8/wAAAwD9//7//f/6/wEA/f8BAP3//P/7//7////9//7/AAD///v/+/8AAAMA+//9////AwABAPv/BAD/////BgAAAAIABAABAAIA//8FAAMAAgADAAMABAAAAAIAAQACAP//AQABAP7///8CAP7/AQD///v/AQAAAAEA///8//z/AQD+//z/+f/8//r//f/6//r/+f/4//n/+//+//r/+f/+/wAA+v////3/AQD+//7/BAADAAMA/v8AAAUAAgACAAAAAgAGAAIA+//8/wQABQD///r/BQAGAP//+f8EAAoAAwD9//7/BAACAAAAAwD8/wEA/P8BAAEA/P/7//3/+/////3/+P/6//v/+P/9/wAA+P/7//3//f/+//r//v///wAAAQD+////AQABAAMAAwACAAEABgABAP7/BAACAAIA//8AAAEAAwD8//3/AAD9/wMA///+//3/+v/+/wIA/f8AAP3//v///wIABAD+/wMAAAADAAMABQACAAAAAwABAAIAAQAAAP//AQD//////P/6/wEABAAAAPz//P/8//3/AQAAAP///f/8//r/AQABAAEA9//7//7//v////3//v/2//j/AAD7//v//P/6//z//f/9/////P8CAAEA//8CAAAAAAAHAAUAAAAAAAYABQACAAAAAQADAAAA/P8AAAAAAQD///7//v8BAP7/AgD+//z/AwAAAPn/+v///////f/9/////f8BAAMAAgD///3/AwADAAEABwABAP3///8CAAMAAQAEAP7/AAAEAP7//v8BAAAA/v8DAP///P/+////AAACAPr//f8EAP7//v/5//z/AQD+//n//f/6//v////6//7/+f/9/wAA//8AAP3//P8BAP7/AwAAAPv//////wAAAwD+//3/AQD//wQABAD9/wEAAgAAAAIA//8CAAMA/v/+/wMAAQABAP7/BAABAAAAAAAAAAAAAgD9/wAAAQD9/wEABQACAPr////+/wIA+/8BAAAAAAD6//v//f////z/AgACAPv///8AAAMAAQD6//z/+v8AAAMA/f/6//f//v/9//r//f/9/wAA+//8/wMA+v/+////AQD//wEA/f/8/wYAAAAAAAAABAAEAAEAAgABAAQABQD9/wYA/v8BAAQA/v8BAAIAAQD//wQABgABAP7/AQAHAAAA//8BAP7/+f/4/wEAAAD2//r/9v/3//v//P/6//H/9//+//z/9P/5/wAAAAD///z///8EAAIAAAAHAAYABQD+/wUABwADAAMABwAAAAQABgD+/wUABAAGAAAA/v/9/wkAAwD3/wEA//8FAPv////5//r///8CAP//+v/8//r/+/8BAP7/9/////n//P8AAP7/+//7//z/AQAGAP//+//7/wEAAwAHAAAA/P8BAAcAAQAAAPz//P8HAAYA///6//r//P/9/wAAAAD6//b/9/////z//f/5//3/+v/+/wAA+v8DAP3/AgAGAAEABAADAAsABAAHAAEABQAIAAIACwADAP////8HAAIAAQAAAAEAAAABAP7/+v/9//z/+//+//3/9f/9//r/+v/3/////v/5//b/+v/7/wAAAAD8//3/9P8AAAQA/f/+/////v8BAAQAAwACAPz/BAABAAQABAADAAYAAgD9/wkABgD8/wYAAwABAAIABQD/////AAAAAAIA+f/7/wIA///8//r/AAD6////+v8DAP7/+v/+////AwD8/////v/8/wIAAgD///7/+v8CAAEABgD+//7///8CAAAABAADAPj/AAAAAP7/+//4//v//v/4//3//f/3//j/AAD//wEA/f/4/wIAAwACAAIAAAADAPv/AQAGAP7/AAD+/wIA/v8EAP////8EAPv//f8BAAYA/v///wAAAAD//wIAAgD///3/+/8AAAMA/v////v/+v/9//v//f///wAA+//6//7/AAABAAMA/f8CAAcAAAADAP//BwAKAAMAAQD9/wQACAAEAAIA/P8BAAEAAQD//wAA/v/9//3/+//5//r/9//9//X/8//8//j//f/0//j//P8AAAEA/P8DAAAAAgADAAkABQAAAAcABAADAAMABQAEAAQAAQACAP//AAAEAAAAAgADAP7//f8CAP///P/+//z//v/8//7/+//+/wAA+v/8//j/AAADAPv/+P/4//3//f/7//v//f/7/wIA+//8/wEAAwAFAAYAAwADAAYAAgAGAAQABAACAAAABAAAAAEABAD8//v/AAD//wMA/P/2//v/AQD6//v/+f/7//r//v8BAAEA+P/7/wMABQABAP3/AAADAAAAAAAEAP//AAADAAMAAgD/////AQD+/wQAAgD+//v/+/8CAP3//P/+//v/+P/9/wAA/P/6//X/+P/9//r/AAD4//7//P/9//3/AAAFAAMAAQABAAoACAAHAAQAAgAGAAcABwABAAYAAwD//wIA/v8FAAIA/P/3/wEABAD9//z/8//6/wIA+v/7//3/9v/9//r//P8AAP3////+//3/AQACAP3/BQD//wIA+/8BAAcACAAAAP7/AQAGAAQA/P8FAAAA/P8BAP///P///wAA//8AAPf/+//+/////f/8/wEA/v/4//v/AAD9//v/9v8BAAQA/f/9//r///8CAP7/AAACAPz//f8GAAQAAAAEAAIABQACAAEABAAGAAoAAwD8//7/AwABAP7/AQD+//n/+v/6//v//f/5//r//P/8//v/+v/9//v/+///////+v/5/wMA/f/8/wEA/f8BAAcAAgADAAkABQAKAAIABgAFAAcACQABAAUAAQAEAPr///8CAPf/8//4////9//7//L/9v/2//j/AAD3//b//P8JAAAA9P/4/wwACAACAAgAAwABAAgACAAIAAkACAAGAAQA+f8HAAwAAQD7//f/+//5/wsABADe/8D/6/9CADoA6P/P/wgANQAmAAsA7v/+/xQAJwAPANn/4v/u/woAGQDn/7n/pP+z/wcANAAcAPX/3P/Z//L/KgAwAA8ABAAaABcACwD3//n/HwAPAPr/8f/v/+3/4//+/wgADgDz/+b/9/8GAPv/4f/x/w4AIwAfAAIA+f/0//n//////woADwALAPv/9//x//T/CwAZAA8A+f/3/wEADgAZABEAAQD1//b/AwD6//H/9P/+/wsADgAKAPf/6P/v/wkADAAEAPj/9f8QAAsACQD2/+z//v8JAPP/4P/t//7/AwD2//L//v/1//n/BQACAP3/DAANAA0AGgAZAAIA9P/4/wcAGgAFAPH/+v/9/+7/7P/+/+//5P/w/+//7v/4/wUA/v/u/wMAFwAgAAcA7/8UAC0AHgAFAAQAFgASAAYA9v/u//f/BQAQAAUA4P/i/+T/5P/o/wMAIgAQAOP/0//z/wcAHgALAPP/AwAPAPb/2/8HABAAFQAZAPP/0P/v/xIAAQD1//X/AwAUAAgA1f/k/xoADgAKABEABgAAAAYAAAD4/wwA/f/r/xsAHQD0/+L/CgAWABQACgAGAAAADwAFAP//KAA7AAcA6f/U/wMAPwAGANz///8NAAAA8f8CAPb/5//3/9r/yP/f/zgAGQDn/+z/BgAhABQA9//f/wYAEwAgACEA4v/S/97/BAAMAPn/4//U/8T/1P8GAOL/5v/w/+P/AADz/9z/xP8KADQAIQD3/9D//v8vADMAAwDh/wsATQA+AAcA9P/4/yAAPAAYANL/6f8YABoA///k/87/1f8TADIA8f/G/9b/BAAbAAIA2f8FACAAAgDO/9n/2v80AIoAQADL/9f/UABQACkARADo//j/MgAhAPb/5v/x/87/GABYAOb/hf9H/57/JgBgAAUAy/+l/6L/0P8uAGIAAwD9//D/AAA4ADcACQDy/zQANAAaAOr/3f/l/xgAPwD1//3/GgD6/+z/0//F//L/GQAPABgADADp/6z/u/8GACIADgDh/+X/7v8MAOf/1v///yEAGQAIAO//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LgD//+3/IAAgAOr/5f/i//b/AAADAPX/zP/S//X/DQATAO7/5P8KACYA4/8fADsAAAD8/yAAJAD6//L/IwAXABYA3//z//f/5v/p/xIA7f/E/9L/9v8UAA0A8v/q//b/BwBUABwAuf/s/zEARQD7/+j/DQATAB4A3//g/+r/CgBCAAMA0f+9//////8KABcA3//D/w4AKQAtAPf/yv/h/xMANAAwAPD/1v/y/wsAAgAjAAEA6v8HAPj/6v8IAP3//f/k//z/AgDY//D/AwAGAAUA6f/0/wIADgANAAUAEwDd/wwAIgAHAA0A8P8FAAsAEAAAAOn/8/8OAAAA/f/m//r/AgDj////+f8BAO7/EQAEAPX/AQD4/wUADwD//xYACADi/+v/GQAQAAcABAD5/+3/AwD8////EQAGAOv/8f/6/xYA/v///xQA7f/u/+v/IAAUAAYABwDp/+r/9P8SACEA/v8DAOf/+//9/w4AGAD//93/+v8DAPn//v8DAP//9v/x/wAA+////wcA/f/4//D/AQALAAAA//8SAPn/AgAJAA0ABAD5/wEABAAFAA0AAAD3//D/BAAFAP7/BgD6/wEA/f8HAOz/9P8TAAsA+f/+////CQAJAAQA8f8AAP3/+/8UAA0A6P/a////AQABAA8A9//a//r/DgDx//H/AQD3//P/EAAHAPb/9v/5/wgAEgALAAcACwD6//r/BAADAAsADQAIAPf/9P/8/wUAAQD6//n////6/wYA///9//n/AAAPAAkA/f/9/wEABQAJAAIA+//z/+7/CwAGAPf/8f/0//T//f8BAAQA///z//n//P/+/xAAEAD///n/9/8DABcADwD7//n//v/5////CwD5////+//w//j/BQARAAQA+v/2/wQAEAAIAAwAAQD+/wAABAANAAwAAQDv/wIACwD///3/9//9//z/AwD+//T/8P/5/wcA9P8BAP3/6f/1/wAAAADz//r/+//2//7/+v////7/AQD0//3/BwACAAMA/P/3/wIABAAGAP7//P8HAAMABQD8//n/CAAHAP//AgAEAP7///8FAAcABgADAAgA//8DAAoABwD8//j//v8CAAoA/P/y//r/+f8BAP//+v/1//n/AQD6//3/+//6//v/AgAGAAEA+v///wEA/v8AAAEABQACAPj/+f/+//7/CQAFAP7/+/8DAAIABAACAP///v8DAAcAAQD5//z/9v///wMA+v/0//n//P/6/////f/6//3//v8FAAgAAwD5/wQABQABAAUAAwAGAP7/+//8//z//P8CAAIA+f/4//3/AAAGAP//+v8BAAMACAAKAAAA+v/7/wAAAwAJAAMA9f/2//b/AQAFAP7/+f/4//7//f/8//v////7//z/9v///wgA/v/7////AAAAAAoACQD///v/BQAMAAgAAgADAPz/BQALAAUA/v///wIA/P8BAP7////z//7/AAD+/////v///wMAAwD+/wEAAgADAAUA/f8DAAIA+v/5//7//P8BAP//+f/3//n/+f/9/wMA9v/6//3/+v8BAAAABAD7/wAA/v8BAAUABQACAAMABQACAP7///8AAAEAAgD+//3/+v/8//3//f/+//j/+f///wQA+//8//r///8EAAEAAwD///7/+/8HAAQA/f////f/AQAGAAAA+v8AAAEAAAD//wYABgD8/wIA/v8CAAcAAQD//wAA///7//7/+//+//z/+P/6//z/+f/5//z//v/+//3/AQD//wEAAQAGAAYAAAABAAMABwAGAAEA/f///wMACAAGAPv/+P8AAAEA///+/////P/+//z//f///wAABQD///3//P///wQAAQD//wAA+/8AAAMA+v/+//v/AgABAPv//P/6/wMAAAD//wUAAQABAAAA//8DAAIAAQD9//3//P/8//z////5//r//P/8/wEA/v/7//z///8BAAAA/f////3///8BAP///f/+/wEA//8CAAAA/f8BAAEA/////wMABQAAAP////8BAAAA//8DAAIA//8BAP3/AwADAP3//f/+/wQABAABAP///f/9////AwACAAAA/f////v///8EAPv////9/wMA/v/+////+v/+/wAAAQD5//r//v/+/////v8BAPr//f/8/////f/7//3/+v/9//3//f/9//r///8CAAIA/f8BAAAAAAADAAUAAwACAP//AQABAAMAAwADAAAAAgACAP7/AgABAAIAAAD///3//P/+/wAA/v/7//v//f/+//3/AAD+//3/BQAFAAAAAQAAAAIAAAAFAAYAAQAAAP7///8FAAAA/v///wMA/v/9/wEA/v/9//7/AQD8//3//P/9//v//v/8//3/AAD4//7/AwD7/wAAAAABAAIAAQAFAAAA//8GAAIAAQAEAAAA/f/9//3/+/8AAP7//f/5//r//v/9/wAAAgD8//7///8AAP7/AwACAP3/AAD9/wEA/v8AAP///P/9//3////7/////v/7//3//v8BAP7//f/9/wAAAgAFAAAA/f8DAAQABgAGAAIAAAAEAAcAAwAFAAAA//8EAAEAAgD///z/AAD7//r///8BAP3//v/7/wAA/P/7/wQAAQABAPn/AQABAAMAAQD+//r//v8BAP//AAD9//r/+v/8/wAA/P/8//v//v/9//3//f/+//z//P/9////AQD//////P8AAAYABQABAAEAAAADAAQAAgAFAAAAAAAAAAAAAgAAAP3//f/+//7/AQD9//7//v/+//v/+v8CAP7//v/9//z//f8AAAAAAAD//wAA/f///wEAAwABAP///v/+//7/AQABAPv//f////z/+v8BAP3//P/8//v////+/wQAAAD9//v/AAABAAIAAQD//wEA/v/+////AAAAAP7/AAACAP7/AgD+/wIAAwD//wMABgACAAIAAQD+/wIABQAGAAAA/f8AAAEAAgADAAAA+f////7///8CAP7/+v8=";

type Theme = "light" | "dark";
type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void) => { ready: Promise<void> } };

export default function ThemeEnhancer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const stored = localStorage.getItem("portfolio-theme");
    const initial: Theme = stored === "light" || stored === "dark"
      ? stored
      : window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    root.dataset.theme = initial;
    localStorage.setItem("portfolio-theme", initial);

    const syncButton = () => {
      const button = document.querySelector<HTMLButtonElement>(".theme-button");
      if (!button) return;
      const current = (root.dataset.theme === "light" ? "light" : "dark") as Theme;
      button.setAttribute("aria-label", current === "dark" ? "Switch to light mode" : "Switch to dark mode");
      button.setAttribute("title", current === "dark" ? "Light mode" : "Dark mode");
      button.setAttribute("aria-pressed", String(current === "dark"));
    };

    const playThemeSound = () => {
      if (localStorage.getItem("portfolio-sound") === "off") return;
      try {
        audioRef.current?.pause();
        const audio = new Audio(THEME_SOUND);
        audio.volume = 0.28;
        audio.playbackRate = 1.08;
        audioRef.current = audio;
        void audio.play().catch(() => undefined);
      } catch {}
    };

    const applyTheme = (next: Theme) => {
      root.dataset.theme = next;
      localStorage.setItem("portfolio-theme", next);
      root.style.colorScheme = next;
      syncButton();
    };

    const onThemeClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const button = target?.closest<HTMLButtonElement>(".theme-button");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const next: Theme = root.dataset.theme === "dark" ? "light" : "dark";
      playThemeSound();
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const doc = document as ViewTransitionDocument;

      if (reduceMotion || !doc.startViewTransition) {
        applyTheme(next);
        root.animate([{ opacity: .88 }, { opacity: 1 }], { duration: 180, easing: "ease-out" });
        return;
      }

      root.dataset.themeDirection = next;
      const transition = doc.startViewTransition(() => applyTheme(next));
      transition.ready.finally(() => window.setTimeout(() => delete root.dataset.themeDirection, 700));
    };

    syncButton();
    document.addEventListener("click", onThemeClick, true);
    const observer = new MutationObserver(syncButton);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      document.removeEventListener("click", onThemeClick, true);
      observer.disconnect();
      audioRef.current?.pause();
    };
  }, []);

  return null;
}
