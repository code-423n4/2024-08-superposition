import "./globals.css";
import Web3ModalProvider from "@/context";
import { Toaster } from "@/components/ui/toaster";

/**
 * Providers which wrap the entire application
 */
export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <Web3ModalProvider>
      {children}
      <Toaster />
    </Web3ModalProvider>
  );
}
