import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/")({ component: Index });
function Index() { return <main><h1>Govinda Lamsal</h1><a href="/portfolio.html">Open portfolio</a></main>; }
