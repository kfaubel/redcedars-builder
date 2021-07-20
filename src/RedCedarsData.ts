import axios from 'axios';

interface RawJson {
    stationData: Array<StationData>;
}

export interface StationData {
    dateutc: number;
    updateTime: string;            // localtime station last reported
    tempinf: number;
    dewPointin: number;
    temp2f: number;
    dewPoint2: number;
    tempf: number;
    dewPoint: number;
    dpLabel: string;              // Pleasant, ...
    hourlyrainin: number;
    dailyrainin: number;
    windspdmph_avg10m: number;
    winddir_avg10m: number;
    windDirPoint: string;         // N, NNE, ...
    uv: number;
    uvLabel: string;              // Low, Medium, ...
}

export class RedCedarsData {
    private logger;

    constructor(logger: any) {
        this.logger = logger;
    }    

    public async getStationData(url: string) { 
        let rawJson: RawJson = {stationData: []};

        await axios.get(url)
            .then((response: any) => {
                rawJson = response.data;
            })
            .catch((error: any) => {
                this.logger.error("RedCedarsData: Error getting data: " + error);
                return {};
            });

        const currentStationData: StationData = rawJson[0];
        
        currentStationData.tempf      = Math.round(currentStationData.tempf);
        currentStationData.tempinf    = Math.round(currentStationData.tempinf);
        currentStationData.temp2f     = Math.round(currentStationData.temp2f);
        currentStationData.dewPoint   = Math.round(currentStationData.dewPoint);
        currentStationData.dewPointin = Math.round(currentStationData.dewPointin);
        currentStationData.dewPoint2  = Math.round(currentStationData.dewPoint2);
        
        const windDir: number = currentStationData.winddir_avg10m;
        let windDirStr: string;

        // Calculate one of the 16 compass points based on the direction in degrees
        // 360/16 = 22
        if (windDir < 11) {windDirStr = "N";} 
        else if (windDir < 34) {windDirStr = "NNE";}
        else if (windDir < 56) {windDirStr = "NE";}
        else if (windDir < 79) {windDirStr = "ENE";}
        else if (windDir < 101) {windDirStr = "E";}
        else if (windDir < 124) {windDirStr = "ESE";}
        else if (windDir < 146) {windDirStr = "SE";}
        else if (windDir < 169) {windDirStr = "SSE";}
        else if (windDir < 191) {windDirStr = "S";}
        else if (windDir < 214) {windDirStr = "SSW";}
        else if (windDir < 236) {windDirStr = "SW";}
        else if (windDir < 259) {windDirStr = "WSW";}
        else if (windDir < 281) {windDirStr = "W";}
        else if (windDir < 304) {windDirStr = "WNW";}
        else if (windDir < 326) {windDirStr = "NW";}
        else if (windDir < 349) {windDirStr = "NNW";}
        else {windDirStr = "N";}
        currentStationData.windDirPoint = windDirStr;

        // Determine the dew point label
        let dpLabel: string = "";
        if (currentStationData.dewPoint < 55) {
            dpLabel  = "Dry";  
        } else if (currentStationData.dewPoint < 60) { 
            dpLabel  = "Comfortable"; 
        } else if (currentStationData.dewPoint < 65) {
            dpLabel  = "Sticky";
        } else if (currentStationData.dewPoint < 70) {
            dpLabel  = "Muggy";
        } else {
            dpLabel = "Oppresive";
        }
        currentStationData.dpLabel = dpLabel;

        // Determine the UV label
        let uvLabel: string = "";
        if (currentStationData.uv <= 2) {
            uvLabel  = "low";  
        } else if (currentStationData.uv <=5 ) { 
            uvLabel  = "Medium"; 
        } else if (currentStationData.dewPoint <= 7) {
            uvLabel  = "High";
        } else if (currentStationData.dewPoint <= 7) {
            uvLabel  = "Very High";
        } else {
            uvLabel  = "Danger";
        } 
        currentStationData.uvLabel = uvLabel;

        // Format the update time and add it
        const updateTime = new Date(currentStationData.dateutc);
        currentStationData.updateTime = updateTime.toLocaleTimeString();

        return currentStationData;
    }
}