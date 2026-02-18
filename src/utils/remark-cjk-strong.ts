const HAS_CJK_OR_CJK_PUNCTUATION = /[\p{Script=Han}“”‘’（）【】《》「」『』]/u;
const UNPARSED_STRONG_PATTERN = /\*\*([^*\n]+?)\*\*/g;

function parseTextNode(value: string) {
  const nodes: Array<{ type: string; value?: string; children?: unknown[] }> = [];
  let lastIndex = 0;

  for (const match of value.matchAll(UNPARSED_STRONG_PATTERN)) {
    const matchText = match[0];
    const innerText = match[1];
    const start = match.index ?? 0;

    if (start > lastIndex) {
      nodes.push({ type: "text", value: value.slice(lastIndex, start) });
    }

    if (HAS_CJK_OR_CJK_PUNCTUATION.test(innerText)) {
      nodes.push({
        type: "strong",
        children: [{ type: "text", value: innerText }],
      });
    } else {
      nodes.push({ type: "text", value: matchText });
    }

    lastIndex = start + matchText.length;
  }

  if (lastIndex < value.length) {
    nodes.push({ type: "text", value: value.slice(lastIndex) });
  }

  return nodes.length ? nodes : [{ type: "text", value }];
}

function transformNode(node: any) {
  if (!node || !Array.isArray(node.children)) return;

  const nextChildren: any[] = [];

  for (const child of node.children) {
    if (child?.type === "text" && typeof child.value === "string" && child.value.includes("**")) {
      nextChildren.push(...parseTextNode(child.value));
      continue;
    }

    transformNode(child);
    nextChildren.push(child);
  }

  node.children = nextChildren;
}

export default function remarkCjkStrong() {
  return (tree: any) => {
    transformNode(tree);
  };
}
