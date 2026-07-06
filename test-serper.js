const fs = require('fs');

async function searchShoppingIndia(query, apiKey) {
  const response = await fetch("https://google.serper.dev/shopping", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, gl: "in" }),
  });

  if (!response.ok) {
    throw new Error(`[serper] API responded with ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function getAccountInfo(apiKey) {
  try {
     const res = await fetch("https://google.serper.dev/account", {
        method: "GET",
        headers: { "X-API-KEY": apiKey }
     });
     if (res.ok) {
       return await res.json();
     }
  } catch (e) {}
  return null;
}

async function run() {
  const apiKey = "7e1bc4c209c2b980597e5b5e3be408d07082c609";
  const queries = ["gaming laptop", "wireless earbuds", "washing machine"];
  
  for (const q of queries) {
    console.log(`\n\n--- RESULTS FOR: "${q}" ---`);
    try {
      const data = await searchShoppingIndia(q, apiKey);
      const items = data.shopping || [];
      console.log(`Total items found: ${items.length}`);
      console.log(`First 3 items raw object:`);
      console.log(JSON.stringify(items.slice(0, 3), null, 2));
    } catch (e) {
      console.error(e.message);
    }
  }

  console.log(`\n\n--- ACCOUNT INFO ---`);
  const account = await getAccountInfo(apiKey);
  console.log(JSON.stringify(account, null, 2));
}

run();
