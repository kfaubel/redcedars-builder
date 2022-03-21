/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { LoggerInterface } from "./Logger";
import { KacheInterface } from "./Kache";
import { ImageWriterInterface } from "./SimpleImageWriter";
import { RedCedarsImage } from "./RedCedarsImage";

export class RedCedarsBuilder {
    private logger: LoggerInterface;
    private cache: KacheInterface | null; // generally null right now, we don't cache the data from the redcedars station
    private writer: ImageWriterInterface;

    constructor(logger: LoggerInterface, cache: KacheInterface | null, writer: ImageWriterInterface) {
        this.logger = logger;
        this.cache = cache; 
        this.writer = writer;
    }

    public async CreateImages(url: string): Promise<boolean>{
        try {
            const redCedarsImage: RedCedarsImage = new RedCedarsImage(this.logger);

            const result = await redCedarsImage.getImage(url);
            const fileName = "redcedars.jpg";

            if (result !== null && result.imageData !== null ) {                
                this.logger.info(`CreateImages: Writing: ${fileName}`);
                this.writer.saveFile(fileName, result.imageData.data);
            } else {
                this.logger.warn(`RedCedarsBuilder: Could not write: ${fileName}`);
                return false;
            }
        } catch (e: any) {
            this.logger.error(`RedCedarsBuilder: Exception: ${e}`);
            this.logger.error(e.stack);
            return false;
        }

        return true;
    }
}
