package com.musickuzyy.app;

import android.os.Bundle;
import android.os.Build;
import android.app.PendingIntent;
import android.app.PictureInPictureParams;
import android.app.RemoteAction;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.drawable.Icon;
import android.util.Rational;
import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    private boolean autoPipEnabled = true;
    private boolean isCurrentlyPlaying = false;

    private static final String ACTION_PREV = "com.musickuzyy.app.PIP_PREV";
    private static final String ACTION_TOGGLE = "com.musickuzyy.app.PIP_TOGGLE";
    private static final String ACTION_NEXT = "com.musickuzyy.app.PIP_NEXT";

    private BroadcastReceiver pipReceiver;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PiPPlugin.class);
        super.onCreate(savedInstanceState);
        setupPipReceiver();
    }

    private void setupPipReceiver() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        pipReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (intent.getAction() == null || getBridge() == null || getBridge().getWebView() == null) return;

                switch (intent.getAction()) {
                    case ACTION_PREV:
                        getBridge().getWebView().evaluateJavascript(
                            "window.dispatchEvent(new Event('pip-prev'))", null);
                        break;
                    case ACTION_TOGGLE:
                        getBridge().getWebView().evaluateJavascript(
                            "window.dispatchEvent(new Event('pip-toggle'))", null);
                        break;
                    case ACTION_NEXT:
                        getBridge().getWebView().evaluateJavascript(
                            "window.dispatchEvent(new Event('pip-next'))", null);
                        break;
                }
            }
        };

        IntentFilter filter = new IntentFilter();
        filter.addAction(ACTION_PREV);
        filter.addAction(ACTION_TOGGLE);
        filter.addAction(ACTION_NEXT);

        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(pipReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(pipReceiver, filter);
        }
    }

    @Override
    public void onDestroy() {
        if (pipReceiver != null) {
            try { unregisterReceiver(pipReceiver); } catch (Exception ignored) {}
        }
        super.onDestroy();
    }

    public void setAutoPipEnabled(boolean enabled) {
        this.autoPipEnabled = enabled;
    }

    public void setPlayState(boolean playing) {
        this.isCurrentlyPlaying = playing;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                setPictureInPictureParams(buildPipParams());
            } catch (Exception ignored) {}
        }
    }

    private PictureInPictureParams buildPipParams() {
        ArrayList<RemoteAction> actions = new ArrayList<>();

        // Previous button
        actions.add(new RemoteAction(
            Icon.createWithResource(this, android.R.drawable.ic_media_previous),
            "Prev", "Previous Track",
            PendingIntent.getBroadcast(this, 0,
                new Intent(ACTION_PREV).setPackage(getPackageName()),
                PendingIntent.FLAG_IMMUTABLE)
        ));

        // Play/Pause button
        actions.add(new RemoteAction(
            Icon.createWithResource(this,
                isCurrentlyPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play),
            isCurrentlyPlaying ? "Pause" : "Play",
            isCurrentlyPlaying ? "Pause music" : "Play music",
            PendingIntent.getBroadcast(this, 1,
                new Intent(ACTION_TOGGLE).setPackage(getPackageName()),
                PendingIntent.FLAG_IMMUTABLE)
        ));

        // Next button
        actions.add(new RemoteAction(
            Icon.createWithResource(this, android.R.drawable.ic_media_next),
            "Next", "Next Track",
            PendingIntent.getBroadcast(this, 2,
                new Intent(ACTION_NEXT).setPackage(getPackageName()),
                PendingIntent.FLAG_IMMUTABLE)
        ));

        return new PictureInPictureParams.Builder()
            .setAspectRatio(new Rational(16, 9))
            .setActions(actions)
            .build();
    }

    @Override
    protected void onUserLeaveHint() {
        super.onUserLeaveHint();
        if (autoPipEnabled && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            enterPictureInPictureMode(buildPipParams());
        }
    }

    @Override
    public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode, android.content.res.Configuration newConfig) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig);
        if (getBridge() != null && getBridge().getWebView() != null) {
            String event = isInPictureInPictureMode ? "pip-enter" : "pip-exit";
            getBridge().getWebView().post(new Runnable() {
                @Override
                public void run() {
                    getBridge().getWebView().evaluateJavascript(
                        "window.dispatchEvent(new Event('" + event + "'))", null);
                }
            });
        }
    }
}
