import * as React from "react";

export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1400,
};

export function useBreakpoint(breakpoint: Breakpoint) {
  const [isAboveBreakpoint, setIsAboveBreakpoint] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${breakpoints[breakpoint]}px)`);
    const onChange = () => {
      setIsAboveBreakpoint(mql.matches);
    };
    
    mql.addEventListener("change", onChange);
    setIsAboveBreakpoint(mql.matches);
    
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);

  return isAboveBreakpoint;
}

export function useBreakpoints() {
  const isXs = useBreakpoint("xs");
  const isSm = useBreakpoint("sm");
  const isMd = useBreakpoint("md");
  const isLg = useBreakpoint("lg");
  const isXl = useBreakpoint("xl");
  const is2Xl = useBreakpoint("2xl");

  return { isXs, isSm, isMd, isLg, isXl, is2Xl };
}