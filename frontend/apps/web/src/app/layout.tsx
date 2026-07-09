import { appConfig } from "@flarelock/config";
import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: appConfig.name,
  description: appConfig.description,
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html className={`${sans.variable} ${mono.variable}`} lang="en">
      <body>
        <Script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                if (window.__flarelockWalletRejectionPatch) {
                  return;
                }

                window.__flarelockWalletRejectionPatch = true;

                const ignoredMessages = [
                  "User rejected the request",
                  "user rejected the request",
                  "User rejected",
                  "user rejected",
                  "User denied",
                  "user denied",
                  "request rejected",
                  "rejected the request",
                  "user closed"
                ];

                const shouldIgnore = (value) => {
                  const message =
                    value instanceof Error
                      ? value.message + " " + (value.stack || "")
                      : String(value || "");

                  return ignoredMessages.some((item) => message.includes(item));
                };

                window.addEventListener(
                  "error",
                  (event) => {
                    if (shouldIgnore(event.error) || shouldIgnore(event.message)) {
                      event.preventDefault();
                      event.stopImmediatePropagation();
                    }
                  },
                  true
                );

                window.addEventListener(
                  "unhandledrejection",
                  (event) => {
                    if (shouldIgnore(event.reason)) {
                      event.preventDefault();
                      event.stopImmediatePropagation();
                    }
                  },
                  true
                );

                const patchConsoleError = () => {
                  const currentError = console.error;

                  if (currentError.__flarelockWalletPatch) {
                    return;
                  }

                  const patchedError = (...args) => {
                    if (args.some(shouldIgnore)) {
                      return;
                    }

                    currentError(...args);
                  };

                  Object.defineProperty(patchedError, "__flarelockWalletPatch", {
                    value: true
                  });

                  console.error = patchedError;
                };

                patchConsoleError();
                window.setInterval(patchConsoleError, 250);
              })();
            `,
          }}
          id="ignore-wallet-rejection-overlay"
          strategy="beforeInteractive"
        />

        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
