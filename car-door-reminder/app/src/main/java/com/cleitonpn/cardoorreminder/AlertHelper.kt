package com.cleitonpn.cardoorreminder

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.SystemClock
import androidx.core.app.NotificationCompat

object AlertHelper {

    const val CANAL_ALERTA = "canal_alerta_bt"
    private const val NOTIF_ID_1 = 10
    private const val NOTIF_ID_2 = 11
    private const val ALARM_REQUEST_CODE = 42

    fun dispararAlerta(context: Context, isSegundo: Boolean) {
        garantirCanal(context)

        val titulo = if (isSegundo) "Ainda não travou o carro?" else "Trave as portas do carro!"
        val texto = if (isSegundo)
            "Segundo aviso — Bluetooth do carro desconectado. As portas foram travadas?"
        else
            "Bluetooth do carro desconectado. Não esqueça de travar as portas!"

        val abrirApp = PendingIntent.getActivity(
            context, 0,
            Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notif = NotificationCompat.Builder(context, CANAL_ALERTA)
            .setSmallIcon(R.drawable.ic_car_lock)
            .setContentTitle(titulo)
            .setContentText(texto)
            .setStyle(NotificationCompat.BigTextStyle().bigText(texto))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setContentIntent(abrirApp)
            .setVibrate(longArrayOf(0, 400, 150, 400, 150, 400))
            .build()

        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(if (isSegundo) NOTIF_ID_2 else NOTIF_ID_1, notif)
    }

    fun agendarSegundoLembrete(context: Context) {
        val pendingIntent = criarPendingIntentSegundoLembrete(context) ?: return
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        // setAndAllowWhileIdle dispara mesmo em Doze mode
        am.setAndAllowWhileIdle(
            AlarmManager.ELAPSED_REALTIME_WAKEUP,
            SystemClock.elapsedRealtime() + 30_000L,
            pendingIntent
        )
    }

    fun cancelarSegundoLembrete(context: Context) {
        val pendingIntent = PendingIntent.getBroadcast(
            context, ALARM_REQUEST_CODE,
            Intent(context, SecondReminderReceiver::class.java),
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        ) ?: return
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        am.cancel(pendingIntent)
    }

    private fun criarPendingIntentSegundoLembrete(context: Context) = PendingIntent.getBroadcast(
        context, ALARM_REQUEST_CODE,
        Intent(context, SecondReminderReceiver::class.java),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    private fun garantirCanal(context: Context) {
        val nm = context.getSystemService(NotificationManager::class.java)
        if (nm.getNotificationChannel(CANAL_ALERTA) != null) return

        val audioAttr = AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .setUsage(AudioAttributes.USAGE_ALARM)
            .build()

        val channel = NotificationChannel(
            CANAL_ALERTA,
            "Alerta: Trave o Carro",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Alerta sonoro ao desconectar o Bluetooth do carro"
            setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM), audioAttr)
            enableVibration(true)
            vibrationPattern = longArrayOf(0, 400, 150, 400, 150, 400)
        }
        nm.createNotificationChannel(channel)
    }
}
