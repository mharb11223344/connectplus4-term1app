import { readFileSync, writeFileSync } from "node:fs";

// Direct visits begin at the account portal. Embedding in that portal is allowed.
const outputFile = "out/index.html";
const html = readFileSync(outputFile, "utf8");
const redirect = '<script>if(window.self===window.top){window.location.replace("https://mharb11223344.github.io/mona-learning-hub/")}</script>';

if (!html.includes(redirect)) {
  if (!html.includes("<head>")) {
    throw new Error("The exported home page has no <head> tag");
  }
  writeFileSync(outputFile, html.replace("<head>", `<head>${redirect}`));
}
