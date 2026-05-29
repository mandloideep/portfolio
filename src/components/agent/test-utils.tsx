/**
 * Test helpers for surfaces that depend on `<AgentEngineProvider>`.
 *
 * `AgentTestWrapper` wraps children in the real provider + the terminal
 * binding so block-stream assertions in existing tests keep working
 * without porting them to a different surface harness.
 */

import type { ReactNode } from "react";
import { AgentEngineProvider } from "#/components/agent/agent-engine-provider";
import { useTerminalAgentBinding } from "#/components/terminal/use-terminal-agent-binding";

export function AgentTestWrapper({ children }: { children: ReactNode }) {
	return (
		<AgentEngineProvider>
			<BindingMount>{children}</BindingMount>
		</AgentEngineProvider>
	);
}

function BindingMount({ children }: { children: ReactNode }) {
	useTerminalAgentBinding();
	return <>{children}</>;
}
