---
'@punica/components': minor
---

Server-side rendering, experimental: `@punica/components/ssr` (`createRenderer`, `renderToString`) writes each element's shadow root into the HTML as Declarative Shadow DOM. A server-rendered page shows the elements styled before the script arrives, or without it, and nothing moves when they upgrade; what the user typed or checked before the script came is kept. It renders in Node, in a worker with happy-dom (an optional peer dependency).
