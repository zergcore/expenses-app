import { getExchangeRates } from "./src/actions/rates";

async function run() {
  try {
    const rates = await getExchangeRates();
    console.log(JSON.stringify(rates, null, 2));
  } catch (err) {
    console.error(err);
  }
}
run();
