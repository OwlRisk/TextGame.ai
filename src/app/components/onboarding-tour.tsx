"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { t } from "@/lib/i18n";
import { trackEvent } from "@/lib/analytics";

const LS_KEY = "tg_onboarding_done";

interface TourStep {
  selector: string;
  titleKey: string;
  descKey: string;
  position: "bottom" | "right" | "top";
}

const STEPS: TourStep[] = [
  { selector: '[data-tour="create-game"]', titleKey: "tour.step1_title", descKey: "tour.step1_desc", position: "bottom" },
  { selector: '[data-tour="popular-templates"]', titleKey: "tour.step2_title", descKey: "tour.step2_desc", position: "bottom" },
  { selector: '[data-tour="nav-home"]', titleKey: "tour.step3_title", descKey: "tour.step3_desc", position: "right" },
  { selector: '[data-tour="nav-discover"]', titleKey: "tour.step4_title", descKey: "tour.step4_desc", position: "right" },
];

interface OnboardingTourProps {
  onComplete?: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    try {
      if (localStorage.getItem(LS_KEY) === "1") return;
    } catch {}
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const measureTarget = useCallback(() => {
    const el = document.querySelector(STEPS[step]?.selector);
    if (el) {
      setRect(el.getBoundingClientRect());
    }
  }, [step]);

  useEffect(() => {
    if (!visible) return;
    measureTarget();
    const onResize = () => measureTarget();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      cancelAnimationFrame(rafRef.current);
    };
  }, [visible, step, measureTarget]);

  const finish = useCallback(() => {
    setVisible(false);
    try { localStorage.setItem(LS_KEY, "1"); } catch {}
    trackEvent("onboarding_complete", { step: step + 1 });
    onComplete?.();
  }, [step, onComplete]);

  const skip = useCallback(() => {
    setVisible(false);
    try { localStorage.setItem(LS_KEY, "1"); } catch {}
    trackEvent("onboarding_skip", { step: step + 1 });
    onComplete?.();
  }, [step, onComplete]);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  }, [step, finish]);

  if (!visible || !rect) return null;

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const pad = 8;

  const popoverStyle: React.CSSProperties = {};
  if (currentStep.position === "bottom") {
    popoverStyle.top = rect.bottom + pad + 4;
    popoverStyle.left = rect.left + rect.width / 2;
    popoverStyle.transform = "translateX(-50%)";
  } else if (currentStep.position === "right") {
    popoverStyle.top = rect.top + rect.height / 2;
    popoverStyle.left = rect.right + pad + 4;
    popoverStyle.transform = "translateY(-50%)";
  } else {
    popoverStyle.bottom = window.innerHeight - rect.top + pad + 4;
    popoverStyle.left = rect.left + rect.width / 2;
    popoverStyle.transform = "translateX(-50%)";
  }

  return createPortal(
    <>
      {/* Overlay with cutout */}
      <div className="fixed inset-0 z-[9998] pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={rect.left - pad}
                y={rect.top - pad}
                width={rect.width + pad * 2}
                height={rect.height + pad * 2}
                rx={12}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%" height="100%"
            fill="rgba(0,0,0,0.6)"
            mask="url(#tour-mask)"
            className="pointer-events-auto"
            onClick={skip}
          />
        </svg>
      </div>

      {/* Highlight ring */}
      <div
        className="fixed z-[9999] rounded-xl ring-2 ring-violet-500 ring-offset-2 ring-offset-transparent pointer-events-none transition-all duration-300"
        style={{
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
        }}
      />

      {/* Popover */}
      <div
        className="fixed z-[10000] w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl shadow-violet-500/20 p-4 animate-in fade-in zoom-in-95 duration-200"
        style={popoverStyle}
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-bold text-white">{t(currentStep.titleKey)}</h3>
          <button onClick={skip} className="text-zinc-500 hover:text-white transition-colors -mr-1 -mt-1 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed mb-4">{t(currentStep.descKey)}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === step ? "bg-violet-500" : i < step ? "bg-violet-700" : "bg-zinc-700"}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-white h-7 px-2 text-xs" onClick={skip}>
              {t("tour.skip")}
            </Button>
            <Button size="sm" className="bg-violet-600 hover:bg-violet-500 h-7 px-3 text-xs gap-1" onClick={next}>
              {isLast ? t("tour.start_playing") : t("tour.next")}
              {!isLast && <ChevronRight className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
