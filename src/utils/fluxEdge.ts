import { Edge } from "reactflow";

/*//////////////////////////////////////////////////////////////
                          CONSTRUCTORS
//////////////////////////////////////////////////////////////*/

export function newFluxEdge({
  source,
  target,
  animated,
  label,
}: {
  source: string;
  target: string;
  animated: boolean;
  label?: string;
}): Edge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    animated,
    label: label,
    labelShowBg: true,
  };
}

/*//////////////////////////////////////////////////////////////
                          TRANSFORMERS
//////////////////////////////////////////////////////////////*/

export function addFluxEdge(
  existingEdges: Edge[],
  {
    source,
    target,
    animated,
    label,
  }: { source: string; target: string; animated: boolean; label?: string }
): Edge[] {
  const newEdge = newFluxEdge({ source, target, animated, label });

  return [...existingEdges, newEdge];
}

export function modifyFluxEdge(
  existingEdges: Edge[],
  {
    source,
    target,
    animated,
    label,
  }: { source: string; target: string; animated: boolean; label: string | undefined }
): Edge[] {
  return existingEdges.map((edge) => {
    if (edge.id !== `${source}-${target}`) return edge;

    const copy = { ...edge };

    copy.animated = animated;

    copy.label = label;

    return copy;
  });
}
