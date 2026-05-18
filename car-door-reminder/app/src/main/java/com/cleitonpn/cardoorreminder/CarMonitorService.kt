package com.cleitonpn.cardoorreminder

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Handler
import android.os.Looper
import androidx.car.app.connection.CarConnection
import androidx.core.app.NotificationCompat
import androidx.lifecycle.LifecycleService

class CarMonitorService : LifecycleService() {

    private var wasConnected = false
    private val handler = Handler(Looper.getMainLooper())

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
        startForeground(NOTIF_ID_FOREGROUND, buildForegroundNotification())

        CarConnection(this).type.observe(this) { connectionType ->
            val isConnected = connectionType == CarConnection.CONNECTION_TYPE_PROJECTION
            if (wasConnected && !isConnected) {
                alertarTravarPortas()
            }
            wasConnected = isConnected
        }
    }

    private fun alertarTravarPortas() {
        tocarBipes()
        mostrarNotificacaoAlerta()
    }

    private fun tocarBipes() {
        // 3 bipes no canal de alarme — funciona mesmo no modo silencioso do carro
        val tone = ToneGenerator(AudioManager.STREAM_ALARM, ToneGenerator.MAX_VOLUME)
        val intervalos = longArrayOf(0L, 650L, 1300L)
        intervalos.forEach { delay ->
            handler.postDelayed({
                tone.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 450)
            }, delay)
        }
        handler.postDelayed({ tone.release() }, 2200L)
    }

    private fun mostrarNotificacaoAlerta() {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        val abrirApp = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notif = NotificationCompat.Builder(this, CANAL_ALERTA)
            .setSmallIcon(R.drawable.ic_car_lock)
            .setContentTitle("Trave as portas do carro!")
            .setContentText("Android Auto desconectado — não esqueça de travar o carro.")
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText("Você acabou de desconectar o Android Auto.\n\nNao esqueça de travar as portas do carro antes de sair!")
            )
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setContentIntent(abrirApp)
            .setVibrate(longArrayOf(0, 400, 150, 400, 150, 400))
            .build()

        nm.notify(NOTIF_ID_ALERTA, notif)
    }

    private fun buildForegroundNotification() =
        NotificationCompat.Builder(this, CANAL_MONITOR)
            .setSmallIcon(R.drawable.ic_car_lock)
            .setContentTitle("Lembrete de Porta Ativo")
            .setContentText("Aguardando conexão do Android Auto...")
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .build()

    private fun createNotificationChannels() {
        val nm = getSystemService(NotificationManager::class.java)

        nm.createNotificationChannel(
            NotificationChannel(
                CANAL_MONITOR,
                "Monitor Android Auto",
                NotificationManager.IMPORTANCE_MIN
            ).apply {
                description = "Notificação discreta que indica que o monitoramento está ativo"
            }
        )

        nm.createNotificationChannel(
            NotificationChannel(
                CANAL_ALERTA,
                "Alerta: Trave o Carro",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Alerta sonoro ao desconectar o Android Auto"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 400, 150, 400, 150, 400)
            }
        )
    }

    companion object {
        const val CANAL_MONITOR = "canal_monitor"
        const val CANAL_ALERTA = "canal_alerta"
        const val NOTIF_ID_FOREGROUND = 1
        const val NOTIF_ID_ALERTA = 2
    }
}
