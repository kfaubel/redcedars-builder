/* eslint-disable @typescript-eslint/no-unused-vars */
import dotenv from "dotenv";
import { Logger } from "./Logger";
import { SimpleImageWriter } from "./SimpleImageWriter";
import { Kache } from "./Kache";
import { RedCedarsBuilder } from "./RedCedarsBuilder";

async function run() {
    dotenv.config();  // Load var from .env into the environment

    const logger: Logger = new Logger("redcedars-builder", "verbose");
    //const cache: Kache = new Kache(logger, "redcedars-cache.json"); 
    const simpleImageWriter: SimpleImageWriter = new SimpleImageWriter(logger, "images");
    const redcedarsBuilder: RedCedarsBuilder = new RedCedarsBuilder(logger, null, simpleImageWriter);

    const url: string | undefined = process.env.RED_CEDARS_URL;

    if (url === undefined) {
        logger.error("No url specified in env RED_CEDARS_URL");
        process.exit(1);
    }
   
    const success: boolean = await redcedarsBuilder.CreateImages(url);

    logger.info(`test.ts: Done: ${success ? "successfully" : "failed"}`); 

    return success ? 0 : 1;
}

run();