import { getAllCorpusText } from "#/lib/terminal/corpus";

const TEXT = getAllCorpusText();

/**
 * SSR-rendered hidden block holding the concatenated agent corpus
 * (everything in `src/content/agent/**` except `system-prompt.md`). Gives
 * crawlers indexable content even though both `/` and `/terminal` SSR
 * mostly client-bound shells. Browser-elided via the HTML `hidden`
 * attribute; SR-skipped via `aria-hidden`.
 */
export function HiddenCorpus() {
	return (
		<div hidden aria-hidden="true" data-seo-corpus>
			{TEXT}
		</div>
	);
}
