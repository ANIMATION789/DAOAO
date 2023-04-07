import sdk from "./1-initialize-sdk.js";
import { readFileSync } from "fs";

(async () => {
  try {
    const editionDrop = await sdk.getContract("0xE35c8346a58DcE8d2fF9471c7609ef43f8bD4eB9", "edition-drop");
    await editionDrop.createBatch([
      {
        name: " DAO ACCES KEY",
        description: "This NFT will give you access to the DAO!",
        image: readFileSync("scripts/assets/key.mp4"),
      },
    ]);
    console.log("✅ Successfully created a new NFT in the drop!");
  } catch (error) {
    console.error("failed to create the new NFT", error);
  }
})();