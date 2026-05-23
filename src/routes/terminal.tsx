import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terminal")({ component: TerminalStub });

function TerminalStub() {
	return (
		<main className="min-h-screen flex items-center justify-center px-6">
			<pre className="text-fg text-sm leading-relaxed">
				{`* deep — terminal v0.0.0 (stub)

  phase 09 lands here.
  agent banner, prompt, streaming, /exit to shell.

  for now: nothing to do. go to /?choose=1 to switch back.`}
			</pre>
		</main>
	);
}
