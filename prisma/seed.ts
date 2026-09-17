import { seedDemoData } from "../src/lib/seed";

async function main() {
  console.log("🌱 Seeding Asrii Automate database with initial developer workspace & workflows...");
  const result = await seedDemoData();
  if (result) {
    console.log(`✅ Seeded workspace: ${result.workspace.name} (${result.workspace.id})`);
    console.log(`✅ Seeded connected account: @${result.connectedAccount.igUsername}`);
    console.log(`✅ Seeded ${result.workflows.length} default workflows`);
  } else {
    console.log("⚠️ Seed completed with notice (database bypassed or uninitialized).");
  }
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  });
