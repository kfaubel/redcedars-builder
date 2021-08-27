/* eslint-disable @typescript-eslint/no-unused-vars */
import jpeg from "jpeg-js";
import fs, { stat } from "fs";
import path from "path";
import * as pure from "pureimage";
import { RedCedarsData, StationData } from "./RedCedarsData";
import { LoggerInterface } from "./Logger";

export interface ImageResult {
    imageType: string;
    imageData: jpeg.BufferRet | null;
}

export class RedCedarsImage {
    private logger: LoggerInterface;

    constructor(logger: LoggerInterface) {
        this.logger = logger;
    }

    // This optimized fillRect was derived from the pureimage source code: https://github.com/joshmarinacci/node-pureimage/tree/master/src
    // To fill a 1920x1080 image on a core i5, this saves about 1.5 seconds
    // x, y       - position of the rect
    // w, h       - size of the rect
    // iw         - width of the image being written into, needed to calculate index into the buffer
    // r, g, b, a - values to draw
    private myFillRect(image: Buffer, x: number, y: number, w: number, h: number, iw: number, r: number, g: number, b: number, a: number) {
        for(let i = y; i < y + h; i++) {                
            for(let j = x; j < x + w; j++) {   
                const index = (i * iw + j) * 4;     
                image[index + 0] = r; 
                image[index + 1] = g; 
                image[index + 2] = b; 
                image[index + 3] = a; 
            }
        }
    }

    public async getImage(url: string) : Promise<ImageResult | null> {
        const title = "Conditions at Red Cedars";
        
        const redCedarsData: RedCedarsData = new RedCedarsData(this.logger);

        const stationData: StationData | null = await  redCedarsData.getStationData(url);

        if (stationData === null) {
            this.logger.warn("RedCedarsImage: Failed to get data, no image available.\n");
            return null;
        }

        const imageHeight              = 1080; 
        const imageWidth               = 1920; 

        const backgroundColor          = "rgb(0,   0,    40)";   // Dark blue
        const titleColor               = "rgb(42,  200,  240)";  //"rgb(40,  200,  80)"; 
        const textColor                = "rgb(42,  160,  210)";  //"rgb(40,  200,  80)"; 
        const arrowColor               = "rgb(255, 0,    0)";
        const alertColor               = "rgb(200, 0,    0)";
        
        // Approximation of the height of a capital letter
        const largeFontCharHeight       = 60;
        const mediumFontCharHeight      = 40;
        const smallFontCharHeight       = 30;
        const xsmallFontCharHeight      = 22;

        const largeFont                = "90px 'OpenSans-Bold'";     // Title
        const mediumFont               = "60px 'OpenSans-Regular";   // Other text
        const smallFont                = "40px 'OpenSans-Regular'";  // Note at the bottom
        const extraSmallFont           = "30px 'OpenSans-Regular'";  // Note at the bottom

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
        const photoW: number           = (imageWidth *.35);

        // Horizontal offsets for label and value (left column)
        const labelX                   = 100;
        const valueX                   = 600;

        // Horizontal offsets for label and value (right column)
        const titleX2                  = (imageWidth/2 + 100);
        const labelX2                  = (imageWidth/2 + 150);
        const valueX2                  = (imageWidth/2 + 600);

        const outsideTempY: number     = 200 + mediumFontCharHeight;
        const dewPointY: number        = 280 + mediumFontCharHeight;
        const hourlyRainY: number      = 360 + mediumFontCharHeight;
        const dailyRainY: number       = 440 + mediumFontCharHeight;
        const uvIndexY: number         = 520 + mediumFontCharHeight;

        const insideLabelY: number     = 680 + mediumFontCharHeight;
        const upstairsTempY: number    = 760 + mediumFontCharHeight;
        const insideTempY: number      = 840 + mediumFontCharHeight;
        const cellarTempY: number      = 920 + mediumFontCharHeight;

        const img = pure.make(imageWidth, imageHeight);
        const ctx = img.getContext("2d");

        // Fill the background
        ctx.fillStyle = backgroundColor;
        //ctx.fillRect(0, 0, imageWidth, imageHeight);
        this.myFillRect(img.data, 0, 0, imageWidth, imageHeight, imageWidth, 0x00, 0x00, 0x20, 0);

        // Draw the title
        ctx.fillStyle = titleColor;
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
        ctx.fillText("Outside Temp",       labelX,       outsideTempY);
        ctx.fillText("Dew Point",          labelX,       dewPointY);
        ctx.fillText("Hourly Rain",        labelX,       hourlyRainY);
        ctx.fillText("Rain Today",         labelX,       dailyRainY);
        ctx.fillText("UV Index",           labelX,       uvIndexY);

        // Fill in the data values, some values may be undefined if the optional sensors do not respond
        const dpLabel = (stationData.dpLabel !== "") ? `(${stationData.dpLabel})` : "";
        const uvLabel = (stationData.uvLabel !== "") ? `(${stationData.uvLabel})` : "";
        ctx.fillText(`${stationData.tempf}\u00B0`,                     valueX,       outsideTempY);
        ctx.fillText(`${stationData.dewPoint} ${dpLabel}`,             valueX,       dewPointY);
        ctx.fillText(`${stationData.hourlyrainin.toFixed(2)} in/hr`,   valueX,       hourlyRainY);
        ctx.fillText(`${stationData.dailyrainin.toFixed(2)} in`,       valueX,       dailyRainY);
        ctx.fillText(`${stationData.uv} ${uvLabel}`,                   valueX,       uvIndexY);
        
        ctx.fillStyle = titleColor;
        ctx.fillText("Inside Temp:",      titleX2,       insideLabelY);
        ctx.fillStyle = textColor;
        ctx.fillText("Upstairs",          labelX2,       upstairsTempY);
        ctx.fillText("First Floor",       labelX2,       insideTempY);
        ctx.fillText("Cellar",            labelX2,       cellarTempY);

        ctx.fillText(`${stationData.temp2f === undefined ? "-" : stationData.temp2f}\u00B0`,      valueX2,       upstairsTempY);
        ctx.fillText(`${stationData.tempinf === undefined ? "-" : stationData.tempinf}\u00B0`,    valueX2,       insideTempY);
        ctx.fillText(`${stationData.temp3f === undefined ? "-" : stationData.temp3f}\u00B0`,      valueX2,       cellarTempY);
        
        // Draw the wind graphic
        const windCenterX = 500;
        const windCenterY = 830;
        const windRadius  = 150;

        ctx.strokeStyle = textColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(windCenterX, windCenterY, windRadius, 0, 2 * Math.PI); // Pure 0.3.5 warns on this
        ctx.stroke();

        const windSpeed = stationData.windspdmph_avg10m;
        const windGust = stationData.windgustmph;

        const windSpeedStr = windSpeed < 10 ? windSpeed.toFixed(1) : windSpeed.toFixed(0);
        const windGustStr  = "Gust: " + (windGust < 10  ? windGust.toFixed(1)  : windGust.toFixed(0));
        
        let width: number; // Used multiple times below
        
        ctx.font = largeFont;
        width = ctx.measureText(windSpeedStr).width; 
        ctx.fillText(windSpeedStr,  windCenterX - width/2,       windCenterY + (largeFontCharHeight/2 - 42) );

        ctx.font = extraSmallFont;
        width = ctx.measureText("mph").width;
        ctx.fillText("mph", windCenterX - width/2, windCenterY + 20);

        ctx.font = smallFont;
        width = ctx.measureText(windGustStr).width;
        ctx.fillText(windGustStr, windCenterX - width/2, windCenterY + 65 );

        ctx.font = smallFont;
        ctx.fillText("N", windCenterX - (ctx.measureText("N").width/2), windCenterY - (windRadius                       + 40));
        ctx.fillText("S", windCenterX - (ctx.measureText("S").width/2), windCenterY + (windRadius + smallFontCharHeight + 40));
        ctx.fillText("W", windCenterX - (windRadius  + (ctx.measureText("W").width) + 40), windCenterY + (smallFontCharHeight/2));
        ctx.fillText("E", windCenterX + (windRadius  +                              + 40), windCenterY + (smallFontCharHeight/2));

        ctx.save();

        // Change our reference to the center of the wind circle
        ctx.translate(windCenterX, windCenterY);
        
        // Draw the minor tick marks
        ctx.lineCap = "round";
        ctx.lineWidth = 2;
        for (let i = 0; i < 360; i += 22.5) {
            ctx.rotate(22.5 * Math.PI/180);
            ctx.beginPath();
            ctx.moveTo(windRadius - 7, 0);
            ctx.lineTo(windRadius + 7, 0);
            ctx.stroke();
        }

        // Draw the major tick marks
        ctx.lineWidth = 5;
        for (let i = 0; i < 360; i += 45) {
            ctx.rotate(45 * Math.PI/180);
            ctx.beginPath();
            ctx.moveTo(windRadius - 10, 0);
            ctx.lineTo(windRadius + 10, 0);
            ctx.stroke();
        }

        if (stationData.winddir_avg10m !== -1) {
        // Draw the wind direction arrow
            ctx.rotate((stationData.winddir_avg10m -90) * Math.PI/180);
            ctx.fillStyle = arrowColor;
            ctx.beginPath();
            ctx.moveTo(windRadius - 30, 0);
            ctx.lineTo(windRadius + 30, 20);
            ctx.lineTo(windRadius + 20, 0);
            ctx.lineTo(windRadius + 30, -20);
            ctx.lineTo(windRadius - 30, 0);
            ctx.fill();
        }
        ctx.restore();

        // Add the note at the bottom with the update time
        if (stationData.updateTime !== "") {
            const updateDate = new Date(stationData.updateTime);
            const now = new Date();
            ctx.font = extraSmallFont;
            if ((now.getTime() - updateDate.getTime()) > 60 * 60 * 1000) {
                ctx.fillStyle = alertColor;
                ctx.fillText(`Updated: ${stationData.updateTime} (old)`, imageWidth - 750, imageHeight - 20);
            } else {
                ctx.fillStyle = textColor;
                ctx.fillText(`Updated: ${stationData.updateTime}`, imageWidth - 750, imageHeight - 20);
            }
        } else {
            ctx.font = extraSmallFont;
            ctx.fillStyle = alertColor;
            ctx.fillText("No station data", imageWidth - 750, imageHeight - 20);
        }

        const jpegImg = jpeg.encode(img, 80);
        
        return {
            imageData: jpegImg,
            imageType: "jpg"
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
