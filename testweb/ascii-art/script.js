const input = document.querySelector("#textInput");
const fontSelect = document.querySelector("#fontSelect");
const output = document.querySelector("#asciiOutput");

const baseGlyphs = {
  " ": ["   ", "   ", "   ", "   ", "   "],
  "!": [" # ", " # ", " # ", "   ", " # "],
  "?": ["###", "  #", " ##", "   ", " # "],
  ".": ["   ", "   ", "   ", "   ", " # "],
  ",": ["   ", "   ", "   ", " # ", "#  "],
  "-": ["   ", "   ", "###", "   ", "   "],
  "_": ["   ", "   ", "   ", "   ", "###"],
  ":": ["   ", " # ", "   ", " # ", "   "],
  "0": ["###", "# #", "# #", "# #", "###"],
  "1": [" # ", "## ", " # ", " # ", "###"],
  "2": ["###", "  #", "###", "#  ", "###"],
  "3": ["###", "  #", " ##", "  #", "###"],
  "4": ["# #", "# #", "###", "  #", "  #"],
  "5": ["###", "#  ", "###", "  #", "###"],
  "6": ["###", "#  ", "###", "# #", "###"],
  "7": ["###", "  #", " # ", " # ", " # "],
  "8": ["###", "# #", "###", "# #", "###"],
  "9": ["###", "# #", "###", "  #", "###"],
  A: [" # ", "# #", "###", "# #", "# #"],
  B: ["## ", "# #", "## ", "# #", "## "],
  C: ["###", "#  ", "#  ", "#  ", "###"],
  D: ["## ", "# #", "# #", "# #", "## "],
  E: ["###", "#  ", "## ", "#  ", "###"],
  F: ["###", "#  ", "## ", "#  ", "#  "],
  G: ["###", "#  ", "# #", "# #", "###"],
  H: ["# #", "# #", "###", "# #", "# #"],
  I: ["###", " # ", " # ", " # ", "###"],
  J: ["###", "  #", "  #", "# #", "###"],
  K: ["# #", "# #", "## ", "# #", "# #"],
  L: ["#  ", "#  ", "#  ", "#  ", "###"],
  M: ["# #", "###", "###", "# #", "# #"],
  N: ["# #", "###", "###", "###", "# #"],
  O: ["###", "# #", "# #", "# #", "###"],
  P: ["###", "# #", "###", "#  ", "#  "],
  Q: ["###", "# #", "# #", "###", "  #"],
  R: ["###", "# #", "###", "## ", "# #"],
  S: ["###", "#  ", "###", "  #", "###"],
  T: ["###", " # ", " # ", " # ", " # "],
  U: ["# #", "# #", "# #", "# #", "###"],
  V: ["# #", "# #", "# #", "# #", " # "],
  W: ["# #", "# #", "###", "###", "# #"],
  X: ["# #", "# #", " # ", "# #", "# #"],
  Y: ["# #", "# #", " # ", " # ", " # "],
  Z: ["###", "  #", " # ", "#  ", "###"],
};

const fonts = [
  {
    id: "tube",
    name: "Tube Bend",
    parts: { horizontal: "__", vertical: "||", topLeft: "/-", topRight: "-\\", bottomLeft: "\\_", bottomRight: "_/", junction: "[]", fill: "##", dot: "oo" },
  },
  {
    id: "blueprint",
    name: "Blueprint",
    parts: { horizontal: "--", vertical: "| ", topLeft: ".-", topRight: "-.", bottomLeft: "`-", bottomRight: "-'", junction: "+-", fill: "[]", dot: "::" },
  },
  {
    id: "chrome",
    name: "Chrome",
    parts: { horizontal: "==", vertical: "||", topLeft: "/=", topRight: "=\\", bottomLeft: "\\=", bottomRight: "=/", junction: "##", fill: "##", dot: "<>" },
  },
  {
    id: "marquee",
    name: "Marquee",
    parts: { horizontal: "**", vertical: "* ", topLeft: "o*", topRight: "*o", bottomLeft: "o*", bottomRight: "*o", junction: "oo", fill: "**", dot: "o " },
  },
  {
    id: "circuit",
    name: "Circuit",
    parts: { horizontal: "==", vertical: "::", topLeft: "o=", topRight: "=o", bottomLeft: "o=", bottomRight: "=o", junction: "[]", fill: "()", dot: "o." },
  },
  {
    id: "ribbon",
    name: "Ribbon",
    parts: { horizontal: "~~", vertical: "()", topLeft: "/~", topRight: "~\\", bottomLeft: "\\~", bottomRight: "~/", junction: "{}", fill: "()", dot: "~~" },
  },
  {
    id: "sketch",
    name: "Sketch",
    parts: { horizontal: "-.", vertical: "|:", topLeft: "/.", topRight: ".\\", bottomLeft: "\\.", bottomRight: "./", junction: "x.", fill: "#.", dot: ".." },
  },
  {
    id: "neon",
    name: "Neon",
    parts: { horizontal: "~~", vertical: "!!", topLeft: "/~", topRight: "~\\", bottomLeft: "\\_", bottomRight: "_/", junction: "@@", fill: "##", dot: "**" },
  },
  {
    id: "engraved",
    name: "Engraved",
    parts: { horizontal: "==", vertical: "][", topLeft: "[=", topRight: "=]", bottomLeft: "[_", bottomRight: "_]", junction: "[]", fill: "##", dot: "[]" },
  },
  {
    id: "pixel-serif",
    name: "Pixel Serif",
    parts: { horizontal: "==", vertical: "# ", topLeft: "<=", topRight: "=>", bottomLeft: "<_", bottomRight: "_>", junction: "##", fill: "##", dot: "<>" },
  },
];

function isFilled(glyph, row, column) {
  return glyph[row]?.[column] === "#";
}

function getStrokeType(glyph, row, column) {
  const up = isFilled(glyph, row - 1, column);
  const down = isFilled(glyph, row + 1, column);
  const left = isFilled(glyph, row, column - 1);
  const right = isFilled(glyph, row, column + 1);
  const horizontal = left || right;
  const vertical = up || down;

  if (right && down && !left && !up) {
    return "topLeft";
  }

  if (left && down && !right && !up) {
    return "topRight";
  }

  if (right && up && !left && !down) {
    return "bottomLeft";
  }

  if (left && up && !right && !down) {
    return "bottomRight";
  }

  if (horizontal && vertical) {
    return "junction";
  }

  if (horizontal) {
    return "horizontal";
  }

  if (vertical) {
    return "vertical";
  }

  return "dot";
}

function renderGlyph(glyph, font) {
  return glyph.map((row, rowIndex) => {
    return row.split("").map((cell, columnIndex) => {
      if (cell !== "#") {
        return "  ";
      }

      const strokeType = getStrokeType(glyph, rowIndex, columnIndex);
      return font.parts[strokeType] || font.parts.fill;
    }).join("");
  });
}

function getFont() {
  return fonts.find((font) => font.id === fontSelect.value) || fonts[0];
}

function renderAscii(text) {
  const font = getFont();
  const rows = Array(baseGlyphs[" "].length).fill("");
  const characters = text.toUpperCase().split("");

  characters.forEach((character) => {
    const glyph = renderGlyph(baseGlyphs[character] || baseGlyphs["?"], font);

    glyph.forEach((row, index) => {
      rows[index] += `${row}   `;
    });
  });

  return rows.join("\n");
}

function populateFonts() {
  fonts.forEach((font) => {
    const option = document.createElement("option");
    option.value = font.id;
    option.textContent = font.name;
    fontSelect.append(option);
  });
}

function updateOutput() {
  output.textContent = renderAscii(input.value || " ");
}

populateFonts();
input.addEventListener("input", updateOutput);
fontSelect.addEventListener("change", updateOutput);
updateOutput();
