package com.cleitonpn.cardoorreminder

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            // Reinicia o monitoramento automaticamente após reiniciar o telefone
            context.startForegroundService(Intent(context, CarMonitorService::class.java))
        }
    }
}
