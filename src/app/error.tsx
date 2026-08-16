"use client";

import { Icon } from "@/components/icons";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="error-page">
      <span><Icon name="warning"/></span>
      <h1>The command centre encountered an error.</h1>
      <p>Your locally stored journal has not been deleted. Retry the view to continue.</p>
      <button className="primary-button primary-button--compact" onClick={reset} type="button">Try again</button>
    </main>
  );
}
