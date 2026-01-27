const WORDS = ["កាហ្វេ", "សួស្តី"];
const API_BASE = process.env.SHAPE_API_BASE || "http://localhost:3001";

const formatCodepoints = (text) =>
  Array.from(text || "").map((c) => `U+${c.codePointAt(0).toString(16).toUpperCase()}`).join(" ");

async function fetchShape(word) {
  const url = `${API_BASE}/api/shape?text=${encodeURIComponent(word)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch shape for ${word}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function main() {
  console.log("Inspecting shaping output from:", API_BASE);
  for (const word of WORDS) {
    const glyphs = await fetchShape(word);
    console.log(`\nWord: ${word}`);
    glyphs.forEach((glyph, index) => {
      const char = glyph.char || "";
      console.log(
        `  [${index}] char="${char}" codepoints=${formatCodepoints(char)}`
      );
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
