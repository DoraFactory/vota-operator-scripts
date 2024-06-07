import { rmdirSync, existsSync } from "fs";
import * as readlineSync from "readline-sync";
import fs from "fs";

import { mkdirSync, writeFileSync } from "fs";
import { dirname } from "path";

export function deleteFolderRecursive(path: string) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file) => {
      const curPath = `${path}/${file}`;
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}

export async function InitFolder() {
  const path = process.cwd();
  const buildFolders = `${path}/build/inputs`;

  if (!existsSync(`${path}/build`)) {
    mkdirSync(buildFolders, { recursive: true });
  } else {
    const choice = readlineSync.question(
      "Build folder already exists, do you want to override? (y/n): "
    );
    if (choice === "y") {
      deleteFolderRecursive(`${path}/build`);
      mkdirSync(buildFolders, { recursive: true });
    }
  }
}
