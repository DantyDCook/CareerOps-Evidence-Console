export type ReadViewState = "loading" | "error" | "empty" | "ready";

export function deriveReadViewState(
  loading: boolean,
  error: string | null,
  count: number
): ReadViewState {
  if (loading) return "loading";
  if (error) return "error";
  if (count === 0) return "empty";
  return "ready";
}
