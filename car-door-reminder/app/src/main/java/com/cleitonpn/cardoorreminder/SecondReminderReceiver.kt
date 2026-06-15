package com.cleitonpn.cardoorreminder

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class SecondReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        AlertHelper.dispararAlerta(context, isSegundo = true)
    }
}
