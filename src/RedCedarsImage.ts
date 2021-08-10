import jpeg from "jpeg-js";
import fs from "fs";
import path from "path";
import * as pure from "pureimage";
import { RedCedarsData, StationData } from "./RedCedarsData";
import { LoggerInterface } from "./Logger";

export interface ImageResult {
    expires: string;
    imageType: string;
    imageData: jpeg.BufferRet | null;
}

export class RedCedarsImage {
    private logger: LoggerInterface;

    constructor(logger: LoggerInterface) {
        this.logger = logger;
    }

    public async getImage(url: string) : Promise<ImageResult | null> {
        const title = "Conditions at Red Cedars";
        
        const redCedarsData: RedCedarsData = new RedCedarsData(this.logger);

        const stationData: StationData | null = await  redCedarsData.getStationData(url);

        if (stationData === null) {
            this.logger.warn("RedCedarsImage: Failed to get data, no image available.\n");
            return null;
        }

        const imageHeight = 1080; 
        const imageWidth  = 1920; 

        const backgroundColor     = "rgb(0,   0,    40)";   // Dark blue
        const textColor           = "rgb(40,  200,  80)"; 
        
        const mediumFontPointSize = 60;
        const largeFont  = "90px 'OpenSans-Bold'";     // Title
        const mediumFont = "50px 'OpenSans-Regular";   // Other text
        const smallFont  = "30px 'OpenSans-Regular'";  // Note at the bottom

        // When used as an npm package, fonts need to be installed in the top level of the main project
        const fntBold     = pure.registerFont(path.join(".", "fonts", "OpenSans-Bold.ttf"),"OpenSans-Bold");
        const fntRegular  = pure.registerFont(path.join(".", "fonts", "OpenSans-Regular.ttf"),"OpenSans-Regular");
        const fntRegular2 = pure.registerFont(path.join(".", "fonts", "alata-regular.ttf"),"alata-regular");
        
        fntBold.loadSync();
        fntRegular.loadSync();
        fntRegular2.loadSync();

        const titleY                   = 120; // down from the top of the image

        const photoX: number           = (imageWidth/2 + 100);
        const photoY                   = 200; // Upper left
        const photoW: number           = (imageWidth *.4);

        const labelX                   = 100;
        const valueX                   = 600;

        const upstairsTempY: number    = 200 + mediumFontPointSize;
        const insideTempY: number      = 280 + mediumFontPointSize;
        const outsideTempY: number     = 360 + mediumFontPointSize;
        const dewPointY: number        = 440 + mediumFontPointSize;
        const windSpeedY: number       = 520 + mediumFontPointSize;
        const windDirectionY: number   = 600 + mediumFontPointSize;
        const hourlyRainY: number      = 680 + mediumFontPointSize;
        const dailyRainY: number       = 760 + mediumFontPointSize;
        const uvIndexY: number         = 840 + mediumFontPointSize;

        const img = pure.make(imageWidth, imageHeight);
        const ctx = img.getContext("2d");

        // Fill the bitmap
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, imageWidth, imageHeight);

        // Draw the title
        ctx.fillStyle = textColor;
        ctx.font = largeFont;
        const textWidth: number = ctx.measureText(title).width;
        ctx.fillText(title, (imageWidth - textWidth) / 2, titleY);

        // Insert the house photo
        const photo = await pure.decodeJPEGFromStream(fs.createReadStream(path.join(__dirname, "..", "redcedars-outside.jpg")));

        if (photo !== null && photo !== undefined) {
            // photo width is defined above as 40% of the screen width
            // scale the height to maintain the aspect ration
            const height = (photoW * photo.height) / photo.width;
            ctx.drawImage(photo,
                0, 0, photo.width, photo.height,      // source
                photoX, photoY, photoW, height);            // destination
        }
        
        // Draw the labels
        ctx.fillStyle = textColor;
        ctx.font = mediumFont;
        ctx.fillText("Upstairs Temp",      labelX,       upstairsTempY);
        ctx.fillText("Downstairs Temp",    labelX,       insideTempY);
        ctx.fillText("Outside Temp",       labelX,       outsideTempY);
        ctx.fillText("Dew Point",          labelX,       dewPointY);
        ctx.fillText("Wind Speed",         labelX,       windSpeedY);
        ctx.fillText("Wind Direction",     labelX,       windDirectionY);
        ctx.fillText("Hourly Rain (rate)", labelX,       hourlyRainY);
        ctx.fillText("Rain Today",         labelX,       dailyRainY);
        ctx.fillText("UV Index",           labelX,       uvIndexY);

        // Fill in the data values
        ctx.fillText(`${stationData.temp2f}`,                 valueX,       upstairsTempY);
        ctx.fillText(`${stationData.tempinf}`,                valueX,       insideTempY);
        ctx.fillText(`${stationData.tempf}`,                  valueX,       outsideTempY);
        ctx.fillText(`${stationData.windspdmph_avg10m} mph`,  valueX,       windSpeedY);
        ctx.fillText(`${stationData.windDirPoint}  (${stationData.winddir_avg10m}\u00B0)`,       valueX,       windDirectionY);
        ctx.fillText(`${stationData.hourlyrainin.toFixed(2)} in/hr`,       valueX,       hourlyRainY);
        ctx.fillText(`${stationData.dailyrainin.toFixed(2)} in`,           valueX,       dailyRainY);

        //ctx.fillStyle = this.getDPColor(stationData.dewPoint);
        ctx.fillText(`${stationData.dewPoint} (${stationData.dpLabel})`,               valueX,       dewPointY);

        //ctx.fillStyle = this.getUVColor(stationData.uv);
        ctx.fillText(`${stationData.uv} (${stationData.uvLabel})`,           valueX,       uvIndexY);

        // Add the note at the bottom with the update time
        ctx.font = smallFont;
        ctx.fillStyle = textColor;
        ctx.fillText(`Updated: ${stationData.updateTime}`, imageWidth - 350, imageHeight - 20);

        const expires: Date = new Date();
        expires.setHours(expires.getHours() + 12);

        const jpegImg = jpeg.encode(img, 50);
        
        return {
            imageData: jpegImg,
            imageType: "jpg",
            expires: expires.toUTCString()
        };
    }

    private getDPColor(dewPoint: number) : string {        
        if (dewPoint < 55) return "rgb(21,  102,  232)";  // Blue
        if (dewPoint < 60) return "rgb(38,  232,  21)";   // Green
        if (dewPoint < 65) return "rgb(232, 232,  21)";   // Yellow
        if (dewPoint < 70) return "rgb(232, 130,  21)";   // Orange
        if (dewPoint < 75) return "rgb(232, 35,   21)";   // Red
        return "rgb(168, 23,   13)";   // Dark Red
    }

    private getUVColor(uv: number) : string {        
        if (uv <= 2)  return "rgb(38,  232,  21)";   // Green
        if (uv <= 5)  return "rgb(232, 232,  21)";   // Yellow
        if (uv <= 7)  return "rgb(232, 130,  21)";   // Orange
        if (uv <= 10) return "rgb(232, 35,   21)";   // Red
        return "rgb(168, 23,   13)";   // Dark Red
    }
}
