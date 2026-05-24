export function formatTwoCol(rows: Array<[string, string]>): string {
	if (rows.length === 0) return "";
	const width = Math.max(...rows.map(([a]) => a.length));
	return rows.map(([a, b]) => `  ${a.padEnd(width, " ")}  ${b}`).join("\n");
}
