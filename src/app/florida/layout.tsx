import type { ReactNode } from "react";

export default function FloridaLayout({ children }: { children: ReactNode }) {
  return <div className="florida-desktop-shell">{children}</div>;
}

