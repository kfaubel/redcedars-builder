import axios from "axios";
import { LoggerInterface } from "./Logger";

export interface StationData {
    dateutc: number;
    updateTime: string;            // localtime station last reported
    tempinf?: number;
    dewPointin?: number;
    temp2f?: number;
    dewPoint2?: number;
    temp3f?: number;
    dewPoint3?: number;
    tempf: number;
    dewPoint: number;
    dpLabel: string;              // Pleasant, ...
    hourlyrainin: number;
    dailyrainin: number;
    windspdmph_avg10m: number;
    windgustmph: number,
    winddir_avg10m: number;
    windDirPoint: string;         // N, NNE, ...
    uv: number;
    uvLabel: string;              // Low, Medium, ...
}

export class RedCedarsData {
    private logger: LoggerInterface;

    constructor(logger: LoggerInterface) {
        this.logger = logger;
    }    

    public async getStationData(url: string): Promise<StationData | null> { 
        // Return from GET call is an array of 288 StationData element.  We only need the last one.
        let rawJson: Array<StationData> = [];

        try {
            const response = await axios.get(url, {headers: {"Content-Encoding": "gzip"}});
            rawJson = response.data;
        } catch(e) {
            this.logger.error(`RedCedarsData: Error getting data: ${e}`);
            return null;
        }
        
        // We only need the newest element
        const currentStationData: StationData = rawJson[0];
        
        if (currentStationData.tempf !== undefined)      currentStationData.tempf      = Math.round(currentStationData.tempf);
        if (currentStationData.tempinf !== undefined)    currentStationData.tempinf    = Math.round(currentStationData.tempinf);
        if (currentStationData.temp2f !== undefined)     currentStationData.temp2f     = Math.round(currentStationData.temp2f);
        if (currentStationData.temp3f !== undefined)     currentStationData.temp3f     = Math.round(currentStationData.temp3f);
        if (currentStationData.dewPoint !== undefined)   currentStationData.dewPoint   = Math.round(currentStationData.dewPoint);
        if (currentStationData.dewPointin !== undefined) currentStationData.dewPointin = Math.round(currentStationData.dewPointin);
        if (currentStationData.dewPoint2 !== undefined)  currentStationData.dewPoint2  = Math.round(currentStationData.dewPoint2);
        if (currentStationData.dewPoint3 !== undefined)  currentStationData.dewPoint3  = Math.round(currentStationData.dewPoint3);
        
        const windDir: number = currentStationData.winddir_avg10m;
        

        // Calculate one of the 16 compass points based on the direction in degrees
        // 360/16 = 22
        if (windDir < 11)       {currentStationData.windDirPoint = "N";} 
        else if (windDir < 34)  {currentStationData.windDirPoint = "NNE";}
        else if (windDir < 56)  {currentStationData.windDirPoint = "NE";}
        else if (windDir < 79)  {currentStationData.windDirPoint = "ENE";}
        else if (windDir < 101) {currentStationData.windDirPoint = "E";}
        else if (windDir < 124) {currentStationData.windDirPoint = "ESE";}
        else if (windDir < 146) {currentStationData.windDirPoint = "SE";}
        else if (windDir < 169) {currentStationData.windDirPoint = "SSE";}
        else if (windDir < 191) {currentStationData.windDirPoint = "S";}
        else if (windDir < 214) {currentStationData.windDirPoint = "SSW";}
        else if (windDir < 236) {currentStationData.windDirPoint = "SW";}
        else if (windDir < 259) {currentStationData.windDirPoint = "WSW";}
        else if (windDir < 281) {currentStationData.windDirPoint = "W";}
        else if (windDir < 304) {currentStationData.windDirPoint = "WNW";}
        else if (windDir < 326) {currentStationData.windDirPoint = "NW";}
        else if (windDir < 349) {currentStationData.windDirPoint = "NNW";}
        else                    {currentStationData.windDirPoint = "N";}
        
        // Determine the dew point label
        if (currentStationData.dewPoint < 55) {
            currentStationData.dpLabel  = "Dry";  
        } else if (currentStationData.dewPoint < 60) { 
            currentStationData.dpLabel  = "Comfortable"; 
        } else if (currentStationData.dewPoint < 65) {
            currentStationData.dpLabel  = "Sticky";
        } else if (currentStationData.dewPoint < 70) {
            currentStationData.dpLabel  = "Muggy";
        } else {
            currentStationData.dpLabel = "Oppresive";
        }

        // Determine the UV label
        if (currentStationData.uv <= 2) {
            currentStationData.uvLabel  = "low";  
        } else if (currentStationData.uv <=5 ) { 
            currentStationData.uvLabel  = "Medium"; 
        } else if (currentStationData.dewPoint <= 7) {
            currentStationData.uvLabel  = "High";
        } else if (currentStationData.dewPoint <= 10) {
            currentStationData.uvLabel  = "Very High";
        } else {
            currentStationData.uvLabel  = "Danger";
        } 

        // Format the update time and add it
        const updateTime = new Date(currentStationData.dateutc);
        currentStationData.updateTime = updateTime.toLocaleTimeString();

        return currentStationData;
    }
}