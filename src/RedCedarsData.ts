import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { LoggerInterface } from "./Logger";

export interface StationData {
    date: string;                  // Reading from the station
    dateutc: number;
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
    outsideReading: boolean;      // true if we have outside readings
}

export class RedCedarsData {
    private logger: LoggerInterface;

    constructor(logger: LoggerInterface) {
        this.logger = logger;
    }    

    public async getStationData(url: string): Promise<StationData | null> { 
        // Return from GET call is an array of 288 StationData element.  We only need the last one.
        let rawJson: Array<StationData> | null = null;

        const options: AxiosRequestConfig = {
            responseType: "json",
            headers: {                        
                "Content-Encoding": "gzip"
            },
            timeout: 20000
        };

        this.logger.verbose(`RedCedarsData fetching url: ${url}`);

        const startTime = new Date();
        await axios.get(url, options)
            .then((res: AxiosResponse) => {
                if (typeof process.env.TRACK_GET_TIMES !== "undefined" ) {
                    this.logger.info(`WebImageImage: GET TIME: ${new Date().getTime() - startTime.getTime()}ms`);
                }
                this.logger.verbose(`RedCedarsData: GET response: ${res.status}`);
                rawJson = res.data as Array<StationData>;
            })
            .catch((error) => {
                this.logger.warn(`RedCedarsData: Failed to get data ${error})`);
            });
        
        if (rawJson === null) {
            return null;
        }

        if (typeof rawJson[0] === "undefined") {
            this.logger.warn("RedCedarsData: Response had no telemetry data");
            return null;
        }

        // We only need the newest element
        const currentStationData: StationData = rawJson[0];

        currentStationData.outsideReading = (currentStationData.tempf !== undefined);
        
        currentStationData.tempf       = (currentStationData.tempf !== undefined)       ? Math.round(currentStationData.tempf)      : -99;
        currentStationData.tempinf     = (currentStationData.tempinf !== undefined)     ? Math.round(currentStationData.tempinf)    : -99;
        currentStationData.temp2f      = (currentStationData.temp2f !== undefined)      ? Math.round(currentStationData.temp2f)     : -99;
        currentStationData.temp3f      = (currentStationData.temp3f !== undefined)      ? Math.round(currentStationData.temp3f)     : -99;
        currentStationData.dewPoint    = (currentStationData.dewPoint !== undefined)    ? Math.round(currentStationData.dewPoint)   : -99;
        currentStationData.dewPointin  = (currentStationData.dewPointin !== undefined)  ? Math.round(currentStationData.dewPointin) : -99;
        currentStationData.dewPoint2   = (currentStationData.dewPoint2 !== undefined)   ? Math.round(currentStationData.dewPoint2)  : -99;
        currentStationData.dewPoint3   = (currentStationData.dewPoint3 !== undefined)   ? Math.round(currentStationData.dewPoint3)  : -99;
        
        currentStationData.hourlyrainin      = currentStationData.hourlyrainin      ?? -99;
        currentStationData.dailyrainin       = currentStationData.dailyrainin       ?? -99;
        currentStationData.uv                = currentStationData.uv                ?? -99;
        currentStationData.winddir_avg10m    = currentStationData.winddir_avg10m    ?? -99;
        currentStationData.windspdmph_avg10m = currentStationData.windspdmph_avg10m ?? -99;
        currentStationData.windgustmph       = currentStationData.windgustmph       ?? -99;
        
        const windDir: number = currentStationData.winddir_avg10m ;
        // Calculate one of the 16 compass points based on the direction in degrees
        // 360/16 = 22
        if (windDir === -1)     {currentStationData.windDirPoint = "";} 
        else if (windDir < 11)  {currentStationData.windDirPoint = "N";} 
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
        if (currentStationData.dewPoint === -99) {
            currentStationData.dpLabel  = "";  
        } else if (currentStationData.dewPoint < 55) {
            currentStationData.dpLabel  = "dry";  
        } else if (currentStationData.dewPoint < 60) { 
            currentStationData.dpLabel  = "comfortable"; 
        } else if (currentStationData.dewPoint < 65) {
            currentStationData.dpLabel  = "sticky";
        } else if (currentStationData.dewPoint < 70) {
            currentStationData.dpLabel  = "muggy";
        } else {
            currentStationData.dpLabel = "oppresive";
        }

        // Determine the UV label
        if (currentStationData.uv === -99) {
            currentStationData.uvLabel  = "";  
        } else if (currentStationData.uv <= 2) {
            currentStationData.uvLabel  = "low";  
        } else if (currentStationData.uv <=5 ) { 
            currentStationData.uvLabel  = "medium"; 
        } else if (currentStationData.dewPoint <= 7) {
            currentStationData.uvLabel  = "high";
        } else if (currentStationData.dewPoint <= 10) {
            currentStationData.uvLabel  = "very high";
        } else {
            currentStationData.uvLabel  = "danger";
        } 

        return currentStationData;
    }
}