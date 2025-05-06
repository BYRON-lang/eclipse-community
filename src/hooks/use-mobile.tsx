import { useBreakpoint } from "./use-breakpoint";

export function useIsMobile() {
  const isAboveMd = useBreakpoint("md");
  return isAboveMd === undefined ? undefined : !isAboveMd;
}
