import stream from 'stream';
import jpeg from 'jpeg-js';
import fs from 'fs';

const pure = require('pureimage');

import { RedCedarsData, StationData } from './RedCedarsData';

const fontDir = __dirname + "/../fonts";

export class RedCedarsImage {
    private redCedarsJson: any;

    private logger;

    constructor(logger: any) {
        this.logger = logger;
    }

    public setLogger(logger: any) {
        this.logger = logger;
    }

    public async getImageStream(url) {
        const title: string = `Conditions at Red Cedars`;
        
        const redCedarsData: RedCedarsData = new RedCedarsData(this.logger);

        const stationData: StationData = await  redCedarsData.getStationData(url);
        const redCedarsJson = {};

        if (redCedarsJson === undefined) {
            this.logger.warn("RedCedarsImage: Failed to get data, no image available.\n")
            return null;
        }

        const imageHeight: number = 1080; // 800;
        const imageWidth: number  = 1920; // 1280;

        const backgroundColor: string     = 'rgb(0,   0,    40)';   // Dark blue
        const textColor: string           = 'rgb(40,  200,  80)'; 
        
        const mediumFontPointSize: number = 60;
        const largeFont: string  = "90px 'OpenSans-Bold'";     // Title
        const mediumFont: string = "50px 'OpenSans-Regular";   // Other text
        const smallFont: string  = "30px 'OpenSans-Regular'";  // Note at the bottom

        const fntBold     = pure.registerFont(fontDir + '/OpenSans-Bold.ttf','OpenSans-Bold');
        const fntRegular  = pure.registerFont(fontDir + '/OpenSans-Regular.ttf','OpenSans-Regular');
        const fntRegular2 = pure.registerFont(fontDir + '/alata-regular.ttf','alata-regular');

        fntBold.loadSync();
        fntRegular.loadSync();
        fntRegular2.loadSync();

        const titleY: number            = 120; // down from the top of the image

        const photoX: number            = (imageWidth/2 + 100);
        const photoY: number            = 200; // Upper left
        const photoW: number            = (imageWidth *.4);

        const labelX: number           = 100;
        const valueX: number           = 700;

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
        const ctx = img.getContext('2d');

        // Fill the bitmap
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, imageWidth, imageHeight);

        // Draw the title
        ctx.fillStyle = textColor;
        ctx.font = largeFont;
        const textWidth: number = ctx.measureText(title).width;
        ctx.fillText(title, (imageWidth - textWidth) / 2, titleY);

        // Insert the house photo
        const photo = await pure.decodeJPEGFromStream(fs.createReadStream("./redcedars.jpg"));

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
        ctx.fillText("Daily Rain",         labelX,       dailyRainY);
        ctx.fillText("UV Index",           labelX,       uvIndexY);

        // Fill in the data values
        ctx.fillText(`${stationData.temp2f}`,                 valueX,       upstairsTempY);
        ctx.fillText(`${stationData.tempinf}`,                valueX,       insideTempY);
        ctx.fillText(`${stationData.tempf}`,                  valueX,       outsideTempY);
        ctx.fillText(`${stationData.windspdmph_avg10m} mph`,  valueX,       windSpeedY);
        ctx.fillText(`${stationData.windDirPoint}  (${stationData.winddir_avg10m} \u00B0)`,       valueX,       windDirectionY);
        ctx.fillText(`${stationData.hourlyrainin}"/hr`,       valueX,       hourlyRainY);
        ctx.fillText(`${stationData.dailyrainin}"`,           valueX,       dailyRainY);

        ctx.fillStyle = this.getDPColor(stationData.dewPoint);
        ctx.fillText(`${stationData.dewPoint} ${stationData.dpLabel}`,               valueX,       dewPointY);

        ctx.fillStyle = this.getUVColor(stationData.uv);
        ctx.fillText(`${stationData.uv} (${stationData.uvLabel})`,           valueX,       uvIndexY);

        // Add the note at the bottom with the update time
        ctx.font = smallFont;
        ctx.fillStyle = textColor;
        ctx.fillText(`Updated: ${stationData.updateTime}`, imageWidth - 350, imageHeight - 20)

        const expires: Date = new Date();
        expires.setHours(expires.getHours() + 12);

        const jpegImg = jpeg.encode(img, 50);

        const jpegStream = new stream.Readable({
            read() {
                this.push(jpegImg.data);
                this.push(null);
            }
        })
        
        return {
            jpegImg: jpegImg,
            stream:  jpegStream,
            expires: expires.toUTCString()
        }
    }

    private getDPColor(dewPoint: number) {        
        if (dewPoint < 55) return 'rgb(21,  102,  232)';  // Blue
        if (dewPoint < 60) return 'rgb(38,  232,  21)';   // Green
        if (dewPoint < 65) return 'rgb(232, 232,  21)';   // Yellow
        if (dewPoint < 70) return 'rgb(232, 130,  21)';   // Orange
        if (dewPoint < 75) return 'rgb(232, 35,   21)';   // Red
                           return 'rgb(168, 23,   13)';   // Dark Red
    }

    private getUVColor(uv: number) {        
        if (uv <= 2)  return 'rgb(38,  232,  21)';   // Green
        if (uv <= 5)  return 'rgb(232, 232,  21)';   // Yellow
        if (uv <= 7)  return 'rgb(232, 130,  21)';   // Orange
        if (uv <= 10) return 'rgb(232, 35,   21)';   // Red
                      return 'rgb(168, 23,   13)';   // Dark Red
    }
}
