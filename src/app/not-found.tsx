import Link from "next/link";

export default function NotFound() {
  return <main className="error-page"><span>404</span><h1>That dashboard route does not exist.</h1><Link className="primary-button primary-button--compact" href="/">Return to command centre</Link></main>;
}
