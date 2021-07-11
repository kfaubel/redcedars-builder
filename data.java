package org.faubel.daydreamone;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class ModelRedCedars implements DataSource {
    private static final String TAG = "ModelRedCedars";
    private final String friendlyName;
    private final String urlStr;
    private final long expirationPeriodMins;
    private Double outsideTemp;
    private Double insideTemp;
    private Double basementTemp;
    private Double pressure;
    private Double previousPressure;
    private String dataTime;
    private final UpdateScheduler updateScheduler;

    ModelRedCedars(String friendlyName, String urlStr, long expirationPeriodMins) {
        this.friendlyName = friendlyName;
        this.urlStr = urlStr;
        this.expirationPeriodMins = expirationPeriodMins;
        outsideTemp = 0.0;
        insideTemp = 0.0;
        basementTemp = 0.0;
        pressure = 0.0;
        dataTime = "";
        previousPressure = 0.0;

        updateScheduler = new UpdateScheduler(expirationPeriodMins, 0, true);
    }

    @Override
    public String getTAG() { return TAG; }

    @Override
    public String getFriendlyName() { return friendlyName; }

    public Double getOutsideTemp() {return outsideTemp;}
    public Double getInsideTemp() {return insideTemp;}
    public Double getBasementTemp() {return basementTemp;}
    public Double getPressure() {return pressure;}
    public Double getPreviousPressure() {return previousPressure;}
    public String getDataTime() {return dataTime;}

    @Override
    public void update() {
        if (!updateScheduler.shouldUpdateNow()) {
            return;
        }

        outsideTemp = 0.0;
        insideTemp = 0.0;
        basementTemp = 0.0;
        pressure = 0.0;
        dataTime = "";

        JSONObject redCedarsJSON = Utils.loadJSONFromURL(urlStr);

        if (redCedarsJSON == null) {
            Klog.e(TAG, "Unable to get data for: " + friendlyName);
            updateScheduler.updateFailed();
            return;
        }
        updateScheduler.updateSuccessful();

        try {
            JSONArray dataArray = redCedarsJSON.getJSONArray("data");

            for (int i = 0; i < dataArray.length(); i++) {
                JSONObject dataObj = dataArray.getJSONObject(i);
                switch (dataObj.getString("name")) {
                    case "outsideTemp":
                        outsideTemp = dataObj.getDouble("temperature");
                        dataTime = dataObj.getString("time");
                        break;
                    case "insideTemp":
                        insideTemp = dataObj.getDouble("temperature");
                        break;
                    case "basementTemp":
                        basementTemp = dataObj.getDouble("temperature");
                        break;
                    case "pressure":
                        previousPressure = pressure;
                        pressure = dataObj.getDouble("pressure");
                        break;
                    default:
                        Klog.w(TAG, "Unexpected result from Red Cedars: " + dataObj.toString());
                        break;
                }
            }
        } catch (JSONException e) {
            Klog.e(TAG, "data - JSON failure: " + e.toString());
            e.printStackTrace();
        }

        Klog.i(TAG, friendlyName + ": out: " + outsideTemp + ", in: " + insideTemp + ", cel: " + basementTemp + ", Pr: " + pressure + ", PPr: " + previousPressure);
    }
}
