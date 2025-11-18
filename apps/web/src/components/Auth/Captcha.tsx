/**
 * CAPTCHA Component
 * Integrates Google reCAPTCHA for bot protection
 * WCAG 2.2 AA Compliant
 */

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

interface CaptchaProps {
  onVerify: (token: string | null) => void;
  onExpired?: () => void;
  onError?: () => void;
  size?: 'compact' | 'normal';
  theme?: 'light' | 'dark';
}

export interface CaptchaRef {
  execute: () => void;
  reset: () => void;
  getValue: () => string | null;
}

const Captcha = forwardRef<CaptchaRef, CaptchaProps>(
  ({ onVerify, onExpired, onError, size = 'normal', theme = 'light' }, ref) => {
    const recaptchaRef = useRef<ReCAPTCHA>(null);
    const innerRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(ref, () => ({
      execute: () => recaptchaRef.current?.execute(),
      reset: () => recaptchaRef.current?.reset(),
      getValue: () => recaptchaRef.current?.getValue() || null,
    }));

    // Get site key from environment or use test key for development
    const siteKey =
      import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Test key

    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;

      const applyStyle = (iframe: HTMLIFrameElement) => {
        try {
          iframe.style.width = '100%';
          iframe.style.maxWidth = '100%';
          iframe.style.display = 'block';
          iframe.style.transform = 'none';
        } catch {
          // ignore cross-origin or read-only style errors
        }
      };

      const existing = el.querySelector('iframe');
      if (existing) applyStyle(existing as HTMLIFrameElement);

      const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
          for (const node of Array.from(m.addedNodes)) {
            if (node instanceof HTMLIFrameElement) applyStyle(node);
            if (node instanceof HTMLElement) {
              const child = node.querySelector('iframe');
              if (child) applyStyle(child as HTMLIFrameElement);
            }
          }
        }
      });

      observer.observe(el, { childList: true, subtree: true });
      return () => observer.disconnect();
    }, []);

    return (
      <div className="captcha-container">
        <div ref={innerRef} className="captcha-inner">
          {/* @ts-expect-error - ReCAPTCHA component typing issue with React 18 */}
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={siteKey}
            onChange={onVerify}
            onExpired={onExpired}
            onError={onError}
            size={size}
            theme={theme}
            aria-label="Complete the CAPTCHA challenge to verify you are not a robot"
          />
        </div>
      </div>
    );
  },
);

Captcha.displayName = 'Captcha';

export default Captcha;
