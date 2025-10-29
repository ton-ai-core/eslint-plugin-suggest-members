// CHANGE: Shared validation runner to eliminate duplication
// WHY: Common pattern for running Effect-based validations in ESLint rules
// PURITY: INFRASTRUCTURE
// REF: system-promt.md - DRY principle

import type { TSESTree } from "@typescript-eslint/utils";
import type { RuleContext } from "@typescript-eslint/utils/ts-eslint";
import { Effect } from "effect";

/**
 * Generic validation result handler
 *
 * @purity SHELL
 * @effect ESLint reporting
 * @complexity O(1)
 */
export const runValidationEffect = <T extends { _tag: string }, E>(
	validationEffect: Effect.Effect<T, E, never>,
	context: RuleContext<string, readonly []>,
	reportNode: TSESTree.Node,
	messageId: string,
	formatMessage: (result: T) => string,
): void => {
	Effect.runPromise(validationEffect)
		.then((result) => {
			if (result._tag === "Valid") {
				return;
			}
			const message = formatMessage(result);
			context.report({
				node: reportNode,
				messageId: messageId as never,
				data: { message },
			});
		})
		.catch(() => {});
};
