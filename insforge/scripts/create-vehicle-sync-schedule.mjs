import { execSync } from "node:child_process";

const headers = JSON.stringify({
  Authorization: "Bearer ${{secrets.API_KEY}}",
});

const command = [
  "npx -y @insforge/cli schedules create",
  `--name ${JSON.stringify("Lectura stock RG Motors 09:00 Chile")}`,
  `--cron ${JSON.stringify("0 12 * * *")}`,
  `--url ${JSON.stringify("https://mnbxih89.us-east.insforge.app/functions/sync-rg-motors-vehicles")}`,
  "--method POST",
  `--headers ${JSON.stringify(headers)}`,
].join(" ");

execSync(command, { stdio: "inherit" });
