import { cli } from "./cli";

const main = async () => {
  cli(process.argv.slice(2));
};

main().catch(console.error);
