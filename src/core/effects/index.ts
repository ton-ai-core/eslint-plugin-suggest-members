// CHANGE: Effect-based CORE layer with mathematical guarantees
// WHY: Pure functional composition with typed effects
// PURITY: CORE
// REF: system-promt.md - Effect-TS монадическая композиция

import { Effect, pipe } from "effect";
import { compositeScore } from "../similarity/composite.js";
import type { SuggestionWithScore } from "../types/domain-types.js";
import {
	MAX_SUGGESTIONS,
	MIN_SIMILARITY_SCORE,
} from "../types/domain-types.js";

/**
 * Pure computation effect for finding similar candidates
 *
 * @param userInput - User's typed string
 * @param candidates - Available candidates
 * @returns Effect with top suggestions
 *
 * @pure true
 * @purity CORE
 * @effect Effect<SuggestionWithScore[], never, never>
 * @invariant result.length ≤ MAX_SUGGESTIONS
 * @invariant ∀i < result.length-1: result[i].score ≥ result[i+1].score
 * @invariant ∀x ∈ result: x.score ≥ MIN_SIMILARITY_SCORE
 * @complexity O(n log n) where n = |candidates|
 * @throws Never - все ошибки типизированы в Effect
 *
 * FORMAT THEOREM: ∀input,candidates: Effect.succeed(findSimilar(input, candidates))
 */
export const findSimilarCandidatesEffect = (
	userInput: string,
	candidates: readonly string[],
): Effect.Effect<readonly SuggestionWithScore[], never, never> =>
	Effect.succeed(
		pipe(
			candidates,
			// Map to scored suggestions
			(cands) =>
				cands.map((name) => ({
					name,
					score: compositeScore(userInput, name),
				})),
			// Filter by minimum score
			(scored) => scored.filter((item) => item.score >= MIN_SIMILARITY_SCORE),
			// Sort descending by score
			(filtered) => filtered.sort((a, b) => b.score - a.score),
			// Take top suggestions
			(sorted) => sorted.slice(0, MAX_SUGGESTIONS),
		),
	);

/**
 * Pure validation effect for candidate filtering
 *
 * @param candidate - Candidate name
 * @param userInput - User input
 * @returns Effect with validation result
 *
 * @pure true
 * @purity CORE
 * @effect Effect<boolean, never, never>
 * @invariant ∀c,u: isValidCandidate(c,u) ∈ {true, false}
 * @complexity O(1)
 * @throws Never
 */
export const isValidCandidateEffect = (
	candidate: string,
	userInput: string,
): Effect.Effect<boolean, never, never> =>
	Effect.succeed(
		!candidate.startsWith("_") &&
			candidate !== userInput &&
			candidate.length > 0,
	);

/**
 * Pure message formatting effect
 *
 * @param propertyName - Invalid property name
 * @param suggestions - Scored suggestions
 * @returns Effect with formatted message
 *
 * @pure true
 * @purity CORE
 * @effect Effect<string, never, never>
 * @complexity O(n) where n = |suggestions|
 * @throws Never
 */
export const formatSuggestionMessageEffect = (
	propertyName: string,
	suggestions: readonly SuggestionWithScore[],
): Effect.Effect<string, never, never> =>
	Effect.succeed(
		suggestions.length === 0
			? `Property '${propertyName}' does not exist.`
			: pipe(
					suggestions,
					(suggs) =>
						suggs
							.map((s) => `'${s.name}' (${(s.score * 100).toFixed(0)}%)`)
							.join(", "),
					(list) =>
						`Property '${propertyName}' does not exist. Did you mean: ${list}?`,
				),
	);
