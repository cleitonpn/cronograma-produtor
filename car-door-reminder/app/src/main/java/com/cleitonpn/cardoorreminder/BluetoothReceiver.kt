package com.cleitonpn.cardoorreminder

import android.bluetooth.BluetoothDevice
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.preference.PreferenceManager

class BluetoothReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val device: BluetoothDevice = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE, BluetoothDevice::class.java)
        } else {
            @Suppress("DEPRECATION")
            intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE)
        } ?: return

        val enderecoSalvo = PreferenceManager.getDefaultSharedPreferences(context)
            .getString(KEY_CAR_ADDRESS, null) ?: return

        if (device.address != enderecoSalvo) return

        when (intent.action) {
            BluetoothDevice.ACTION_ACL_DISCONNECTED -> {
                AlertHelper.dispararAlerta(context, isSegundo = false)
                AlertHelper.agendarSegundoLembrete(context)
            }
            BluetoothDevice.ACTION_ACL_CONNECTED -> {
                // Reconectou antes dos 30s — cancela o segundo lembrete
                AlertHelper.cancelarSegundoLembrete(context)
            }
        }
    }

    companion object {
        const val KEY_CAR_ADDRESS = "car_bt_address"
        const val KEY_CAR_NAME = "car_bt_name"
    }
}
