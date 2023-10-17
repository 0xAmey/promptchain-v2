import { FluxNodeType } from "./types";

export function adjustColor(color: string, amount: number) {
  return (
    "#" +
    color
      .replace(/^#/, "")
      .replace(/../g, (color) =>
        (
          "0" + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)
        ).substring(-2)
      )
  );
}

export function getFluxNodeTypeColor(fluxNodeType: FluxNodeType) {
  switch (fluxNodeType) {
    case FluxNodeType.User:
      return "#EEEEEE";
    case FluxNodeType.Model:
      return "#d9f3d6";
    case FluxNodeType.TweakedModel:
      return "#f7d0a1";
    case FluxNodeType.System:
      return "#C5E2F6";
  }
}

export function getFluxNodeTypeDarkColor(fluxNodeType: FluxNodeType) {
  switch (fluxNodeType) {
    case FluxNodeType.User:
      return "#A9ABAE";
    case FluxNodeType.Model:
      return "#619F83";
    case FluxNodeType.TweakedModel:
      return "#CB7937";
    case FluxNodeType.System:
      return "#5F8AF7";
  }
}
