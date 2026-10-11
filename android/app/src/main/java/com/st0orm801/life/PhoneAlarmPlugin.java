package com.st0orm801.life;

import android.content.Intent;
import android.provider.AlarmClock;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PhoneAlarm")
public class PhoneAlarmPlugin extends Plugin {
    @PluginMethod
    public void open(PluginCall call) {
        Integer hour = call.getInt("hour");
        Integer minute = call.getInt("minute");
        if (hour == null || minute == null || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
            call.reject("Choose a valid alarm time"); return;
        }
        Intent intent = new Intent(AlarmClock.ACTION_SET_ALARM)
            .putExtra(AlarmClock.EXTRA_HOUR, hour)
            .putExtra(AlarmClock.EXTRA_MINUTES, minute)
            .putExtra(AlarmClock.EXTRA_MESSAGE, "Check your LIFE deadlines")
            .putExtra(AlarmClock.EXTRA_SKIP_UI, false);
        try { getActivity().startActivity(intent); call.resolve(); }
        catch (Exception error) { call.reject("No compatible alarm app is available"); }
    }
}
