package org.faubel.daydreamone;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.os.BatteryManager;

import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

import static android.content.Context.BATTERY_SERVICE;

public class DisplayRedCedars implements DisplayItem, DataSource {
    private static final String TAG = "DisplayTime";
    private String friendlyName;
    private String urlStr;
    private long expirationPeriodMins;
    private long displayDurationSecs;
    private final Context context;
    private final Object lock;
    private ModelRedCedars redCedarsModel;
    private ModelTime modelTime;

    DisplayRedCedars(Context context, JSONObject configData, ContentManager ContentManager) {
        this.context = context;
        try {
            this.friendlyName         = configData.getString("friendlyName");
            this.expirationPeriodMins = configData.getLong("expirationPeriodMins"); // Not used
            this.displayDurationSecs  = configData.getLong("displayDurationSecs");

            this.urlStr               = configData.getString("resource");
        } catch (JSONException e) {
            Klog.e(TAG, "constructor" + e.toString());
            e.printStackTrace();
        }

        Klog.i(TAG, "Creating: " + friendlyName);

        lock = new Object();

        redCedarsModel = new ModelRedCedars(friendlyName, urlStr, expirationPeriodMins);
        ContentManager.addModel(redCedarsModel);

        modelTime = new ModelTime("ET", expirationPeriodMins);
        modelTime = (ModelTime) ContentManager.addModel("TimeOffset", modelTime); // returns this or a previous model
    }

    @Override
    public long getDisplayDurationSecs() {
        return displayDurationSecs;
    }

    @Override
    public int size() {
        return 1;
    }

    @Override
    public String getTAG() { return TAG;}

    @Override
    public String getFriendlyName() { return friendlyName;}

    // Font info: http://stackoverflow.com/questions/19691530/valid-values-for-androidfontfamily-and-what-they-map-to
    @Override
    public Bitmap getBitmap(int index) {
        Bitmap imageBitmap = Bitmap.createBitmap(1024, 600, Bitmap.Config.RGB_565);
        Canvas canvas = new Canvas(imageBitmap);
        Paint p = new Paint();
        Rect bounds = new Rect();

        canvas.drawRGB(0, 0, 50);

        String timeStr;
        String dateStr;

        String directionStr;

        Double pressure = redCedarsModel.getPressure();
        Double previousPressure = redCedarsModel.getPreviousPressure();

        if (previousPressure.equals(0.0) || pressure.equals(previousPressure)) {
            directionStr = "-";
        } else if (pressure > previousPressure) {
            directionStr = "\u25B2"; // up arrow
        } else {
            directionStr = "\u25BC"; // down arrow
        }

        // greater than 0 is rising
        Double difference = pressure - previousPressure;

        String forecast;

        if (pressure == 0) {
            forecast = "";
        } else if (pressure >30.6) {
            forecast = "Very dry";
        } else if (pressure >= 30.0) {
            forecast = "Fair";
        } else if (pressure > 29.0) {
            forecast = "Change";
        } else if (pressure > 28.5) {
            forecast = "Rain";
        } else {
            forecast = "Stormy";
        }

        p.setColor(Color.rgb(0,200,0));
        p.setTextSize(50);
        canvas.drawText("Conditions at Red Cedars", 50, 50, p);

        p.setTextSize(40);
        canvas.drawText("Outside temp:", 50, 120, p);
        canvas.drawText("Inside temp:", 50, 180, p);
        canvas.drawText("Cellar temp:", 50, 240, p);
        canvas.drawText("Pressure:", 50, 300, p);
        canvas.drawText("Forecast:", 50, 360, p);
        canvas.drawText(redCedarsModel.getDataTime(), 50, 420, p);

        canvas.drawText(Double.toString(redCedarsModel.getOutsideTemp()), 320, 120, p);
        canvas.drawText(Double.toString(redCedarsModel.getInsideTemp()), 320, 180, p);
        canvas.drawText(Double.toString(redCedarsModel.getBasementTemp()), 320, 240, p);
        canvas.drawText(pressure + " " + directionStr, 320, 300, p);
        canvas.drawText(forecast, 320, 360, p);

        // Get the time with the current clock
        Date systemDate = new Date();
        Date now = new Date(systemDate.getTime() + modelTime.getTimeOffset());

        timeStr = new SimpleDateFormat("h:mm a", Locale.US).format(now);
        //dateStr = new SimpleDateFormat("EEEE MMMM d, yyyy").format(now);

        p.setTextSize(20);

        p.setTypeface(Typeface.create("sans-serif-black", Typeface.NORMAL));
        p.setColor(Color.rgb(0,100,200));
        canvas.drawText(timeStr, 900, 590, p);
        //canvas.drawText(dateStr, 100, 560, p);


        try {
            int drawableResource = context.getResources().getIdentifier("redcedars", "drawable", context.getPackageName());

            Bitmap pictureBitmap = BitmapFactory.decodeResource(context.getResources(), drawableResource);
            pictureBitmap = Bitmap.createScaledBitmap(pictureBitmap, 450, 300, false);
            canvas.drawBitmap(pictureBitmap,  510, 90, null);
        } catch (Exception e) {
            Klog.e(TAG, "Bitmap failure: " + e.toString());
            e.printStackTrace();
        }

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            BatteryManager bm = (BatteryManager) context.getSystemService(BATTERY_SERVICE);
            int batLevel = 0;

            try {
                batLevel = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);
            } catch (Exception e) {
                //
            }
            //boolean charging = bm.isCharging(); requires API 23

            if (batLevel > 0) {
                String battStr = "Battery: " + batLevel + "%";
                if (batLevel == 100) {
                    p.setColor(Color.GREEN);
                } else if (batLevel >= 50) {
                    p.setColor(Color.YELLOW);
                } else {
                    p.setColor(Color.RED);
                }

                p.setTextSize(16);
                canvas.drawText(battStr, 50, 590, p);
            }
        }

        return imageBitmap;
    }

    public void update() {

    }
}
