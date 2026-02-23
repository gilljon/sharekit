import { createNextHandler } from "@sharekit/next";
import { shareable } from "../../../lib/shareable.js";

export const { GET, POST, DELETE } = createNextHandler(shareable);
