package com.st0orm801.life;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(PhoneAlarmPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
