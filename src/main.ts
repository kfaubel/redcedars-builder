import fs from 'fs';
import { RedCedarsImage } from './RedCedarsImage';
import { Logger } from "./Logger";

require('dotenv').config();

// Create a new express application instance
async function run() {
    const logger: Logger = new Logger("redcedars-builder"); 
   
    const redCedarsImage = new RedCedarsImage(logger);

    const url = process.env.RED_CEDARS_URL;
    
    const result = await redCedarsImage.getImageStream(url);
    
    // We now get result.jpegImg
    logger.info(`Main: Writing: image.jpg`);

    if (result !== null && result.jpegImg !== null ) {
        fs.writeFileSync('image.jpg', result.jpegImg.data);
    } else {
        logger.error("main: no jpegImg returned from weatherImage.getImageStream");
        process.exit(1);
    }
    
    logger.info("main: Done"); 
}

run();