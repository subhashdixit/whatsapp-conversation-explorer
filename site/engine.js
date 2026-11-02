import { analyzeChat as aggregate, parseHeader } from "./parser.js";
export function transitionStats(text, dateOrder = "DMY") {
  const names = new Map(),
    edges = new Map();
  let previous = null,
    sessions = 0,
    outOfOrder = 0;
  for (const line of text.split(/\r?\n/)) {
    const h = parseHeader(line, dateOrder);
    if (!h || h.invalid) continue;
    const split = h.content.indexOf(": ");
    if (split < 1) continue;
    const name = h.content.slice(0, split);
    if (!names.has(name)) names.set(name, `p${names.size + 1}`);
    const id = names.get(name);
    if (!previous) {
      sessions++;
    } else {
      const gap = (h.timestamp - previous.timestamp) / 60000;
      if (gap < 0) {
        outOfOrder++;
        sessions++;
      } else if (gap > 60) {
        sessions++;
      } else if (id !== previous.id) {
        const key = previous.id + "→" + id;
        if (!edges.has(key))
          edges.set(key, { from: previous.id, to: id, gaps: [] });
        edges.get(key).gaps.push(gap);
      }
    }
    previous = { id, timestamp: h.timestamp };
  }
  return {
    sessions,
    outOfOrder,
    edges: [...edges.values()].map((e) => {
      e.gaps.sort((a, b) => a - b);
      const n = e.gaps.length;
      return {
        from: e.from,
        to: e.to,
        count: n,
        medianMinutes:
          n % 2 ? e.gaps[(n - 1) / 2] : (e.gaps[n / 2 - 1] + e.gaps[n / 2]) / 2,
      };
    }),
  };
}
export function analyzeChat(text, options = {}) {
  const result = aggregate(text, options);
  result.transitions = transitionStats(text, options.dateOrder || "DMY");
  return result;
}
