#!/usr/bin/env node

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const TARGET_PREFIX = "src/data/blog/";
const ISO_NOW = new Date().toISOString();
const DRY_RUN = process.argv.includes("--dry-run");

function getStagedFiles() {
  const output = execSync("git diff --cached --name-only --diff-filter=ACMR", {
    encoding: "utf8",
  });
  return output
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean)
    .filter(path => path.endsWith(".md") && path.startsWith(TARGET_PREFIX));
}

function updateFrontmatterModDatetime(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  if (!match) return null;

  const frontmatter = match[1];
  const hasMod = /^modDatetime:\s*.*$/m.test(frontmatter);
  const hasPub = /^pubDatetime:\s*.*$/m.test(frontmatter);

  let nextFrontmatter;
  if (hasMod) {
    nextFrontmatter = frontmatter.replace(
      /^modDatetime:\s*.*$/m,
      `modDatetime: ${ISO_NOW}`
    );
  } else if (hasPub) {
    nextFrontmatter = frontmatter.replace(
      /^(pubDatetime:\s*.*)$/m,
      `$1\nmodDatetime: ${ISO_NOW}`
    );
  } else {
    nextFrontmatter = `${frontmatter}\nmodDatetime: ${ISO_NOW}`;
  }

  const nextContent = content.replace(frontmatter, nextFrontmatter);
  return nextContent === content ? null : nextContent;
}

function main() {
  const files = getStagedFiles();
  if (files.length === 0) return;

  let changed = 0;
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    const updated = updateFrontmatterModDatetime(source);
    if (!updated) continue;

    if (!DRY_RUN) {
      writeFileSync(file, updated, "utf8");
      execSync(`git add -- "${file}"`);
    }
    changed += 1;
  }

  if (changed > 0) {
    const mode = DRY_RUN ? "[dry-run] " : "";
    console.log(`${mode}Updated modDatetime for ${changed} staged post(s).`);
  }
}

main();
