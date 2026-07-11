package com.musickuzyy.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PiP")
public class PiPPlugin extends Plugin {
    @PluginMethod()
    public void setAutoPipEnabled(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled", true);
        MainActivity activity = (MainActivity) getActivity();
        if (activity != null) {
            activity.setAutoPipEnabled(enabled);
        }
        call.resolve();
    }

    @PluginMethod()
    public void setPlayState(PluginCall call) {
        Boolean playing = call.getBoolean("playing", false);
        MainActivity activity = (MainActivity) getActivity();
        if (activity != null) {
            activity.setPlayState(playing);
        }
        call.resolve();
    }
}
