
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import { setDoc, doc } from "firebase/firestore";

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "serwis-crist",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
    },
    storage: {
      rules: readFileSync("storage.rules", "utf8"),
    }
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.clearStorage();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("VexoNT Security Rules - Firestore", () => {
  it("Blokuje anonimowi utworzenie zgłoszenia ze zmyślonym machineId (obcy tenant)", async () => {
    const anonDb = testEnv.authenticatedContext("anon", { 
        firebase: { sign_in_provider: "anonymous" } 
    }).firestore();

    const ticketRef = doc(anonDb, "tenants", "obcy-tenant", "tickets", "t1");
    // Próba zapisu (powinno zostać odrzucone przez reguły)
    await assertFails(setDoc(ticketRef, { machineId: "nieistnieje" }));
  });

  it("Zezwala anonimowi na dodanie zgłoszenia dla manual gdy tenant istnieje", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), "tenants", "prawdziwy-tenant"), { name: "Tenant" });
    });

    const anonDb = testEnv.authenticatedContext("anon", { 
        firebase: { sign_in_provider: "anonymous" } 
    }).firestore();

    const ticketRef = doc(anonDb, "tenants", "prawdziwy-tenant", "tickets", "t1");
    await assertSucceeds(setDoc(ticketRef, { machineId: "manual" }));
  });
});

describe("VexoNT Security Rules - Storage", () => {
    it("Blokuje anonimowi odczyt/listowanie całego katalogu zgłoszeń (ochrona przed masowym wyciekiem)", async () => {
        const anonStorage = testEnv.authenticatedContext("anon", { 
            firebase: { sign_in_provider: "anonymous" } 
        }).storage();
        
        // Próba wylistowania wszystkich plików z /tenants/crist/tickets/ (powinno zablokować)
        const ticketsFolder = anonStorage.ref("tenants/crist/tickets");
        await assertFails(ticketsFolder.listAll());
    });
});

