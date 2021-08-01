import fs from "fs";
import { RedCedarsImage } from "./RedCedarsImage";
import { Logger } from "./Logger";
import dotenv from "dotenv";

async function run() {
    dotenv.config();  // Load var from .env into the environment

    const logger: Logger = new Logger("redcedars-builder"); 
   
    const redCedarsImage: RedCedarsImage = new RedCedarsImage(logger, __dirname);

    const url: string | undefined = process.env.RED_CEDARS_URL;

    if (url === undefined) {
        logger.error("No url specified in env RED_CEDARS_URL");
        process.exit(1);
    }
    
    const result = await redCedarsImage.getImageStream(url);
    
    // We now get result.jpegImg
    logger.info("Main: Writing: image.jpg");

    if (result !== null && result.imageData !== null ) {
        fs.writeFileSync("image.jpg", result.imageData.data);
    } else {
        logger.error("main: no jpegImg returned from weatherImage.getImageStream");
        process.exit(1);
    }
    
    logger.info("main: Done"); 
}

run();