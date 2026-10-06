import { randomBytes, createHash } from "node:crypto";
import { writeFileSync } from "node:fs";

const token = randomBytes(32).toString("hex");
const hash = createHash("sha256").update(token).digest("hex");

writeFileSync(
  "local-admin-setup.sql",
  `UPDATE portfolio_admin
   SET setup_hash='${hash}'
   WHERE id=1 AND password_hash IS NULL;\n`
);

writeFileSync(
  "local-admin-setup-url.txt",
  `http://localhost:8787/admin/setup/#token=${token}\n`
);

console.log("Setup link saved in local-admin-setup-url.txt");