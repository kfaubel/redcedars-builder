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
            const weatherImage: RedCedarsImage = new RedCedarsImage(this.logger);

            const result = await weatherImage.getImage(url);

            if (result !== null && result.imageData !== null ) {
                const fileName = "redcedars.jpg";
                this.logger.info(`CreateImages: Writing: ${fileName}`);
                this.writer.saveFile(fileName, result.imageData.data);
            } else {
                this.logger.error("CreateImages: No imageData returned from weatherImage.getImage");
                return false;
            }
        } catch (e) {
            this.logger.error(`CreateImages: Exception: ${e}`);
            return false;
        }

        return true;
    }
}
