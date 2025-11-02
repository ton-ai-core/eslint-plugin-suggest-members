// CHANGE: Shared validation runner to eliminate duplication
// WHY: Common pattern for running Effect-based validations in ESLint rules
// PURITY: INFRASTRUCTURE
// REF: system-promt.md - DRY principle

import type { TSESTree } from "@typescript-eslint/utils";
import type { RuleContext } from "@typescript-eslint/utils/ts-eslint";
import { Effect } from "effect";

/**
 * Generic validation result handler with fallback support
 *
 * @purity SHELL
 * @effect ESLint reporting
 * @complexity O(1)
 *
 * CHANGE: Use Effect.runSync instead of Effect.runPromise
 * WHY: ESLint rules must report errors synchronously. Async validation
 *      causes context.report() to be called after ESLint finishes checking the file.
 * INVARIANT: ∀ validation: report(validation) → immediate(report)
 */
/**
 * Configuration for validation effect runner
 */
interface ValidationConfig<T extends { _tag: string }, E> {
	readonly validationEffect: Effect.Effect<T, E, never>;
	readonly context: RuleContext<string, readonly []>;
	readonly reportNode: TSESTree.Node;
	readonly messageId: string;
	readonly formatMessage: (result: T) => string;
	readonly fallbackEffect?: Effect.Effect<T, E, never>;
}

export const runValidationEffect = <T extends { _tag: string }, E>(
	config: ValidationConfig<T, E>,
): void => {
	const {
		validationEffect,
		context,
		reportNode,
		messageId,
		formatMessage,
		fallbackEffect,
	} = config;

	try {
		// CHANGE: Synchronous execution for ESLint compatibility
		// WHY: ESLint visitor methods must report errors in the same tick
		const result = Effect.runSync(validationEffect);

		if (result._tag === "Valid") {
			return;
		}

		const message = formatMessage(result);
		context.report({
			node: reportNode,
			messageId: messageId as never,
			data: { message },
		});
	} catch (_error) {
		// CHANGE: Try fallback validation if available
		// WHY: TypeScript service may fail, use filesystem as backup
		if (fallbackEffect) {
			try {
				const fallbackResult = Effect.runSync(fallbackEffect);

				if (fallbackResult._tag === "Valid") {
					return;
				}

				const message = formatMessage(fallbackResult);
				context.report({
					node: reportNode,
					messageId: messageId as never,
					data: { message },
				});
			} catch {
				// CHANGE: Silently handle fallback errors
				// WHY: Don't break linting if both methods fail
			}
		}
		// CHANGE: Silently handle errors in validation
		// WHY: Don't crash ESLint on validation failures
		// This can happen if filesystem operations fail
	}
};
