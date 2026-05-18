package com.cleitonpn.cardoorreminder

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import androidx.car.app.connection.CarConnection
import androidx.core.app.NotificationCompat
import androidx.lifecycle.LifecycleService

class CarMonitorService : LifecycleService() {

    private var wasConnected = false
    private val handler = Handler(Looper.getMainLooper())
    private var segundoLembreteRunnable: Runnable? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
        startForeground(NOTIF_ID_FOREGROUND, buildForegroundNotification())

        CarConnection(this).type.observe(this) { connectionType ->
            val isConnected = connectionType == CarConnection.CONNECTION_TYPE_PROJECTION
            if (wasConnected && !isConnected) {
                alertarTravarPortas()
            }
            if (isConnected) {
                // Reconectou — cancela o segundo lembrete pendente
                cancelarSegundoLembrete()
            }
            wasConnected = isConnected
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        super.onStartCommand(intent, flags, startId)
        return START_STICKY
    }

    // Reinicia o serviço via AlarmManager se o usuário fechar o app em ROMs agressivos (Samsung, Xiaomi...)
    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        val reiniciar = PendingIntent.getService(
            applicationContext, 1,
            Intent(applicationContext, CarMonitorService::class.java),
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )
        val alarmManager = getSystemService(Context.ALARM_SERVICE) as AlarmManager
        alarmManager.set(
            AlarmManager.ELAPSED_REALTIME_WAKEUP,
            SystemClock.elapsedRealtime() + 1000,
            reiniciar
        )
    }

    private fun alertarTravarPortas() {
        cancelarSegundoLembrete()

        // Primeiro alerta imediato
        tocarBipes()
        mostrarNotificacaoAlerta(isSegundo = false)

        // Segundo lembrete após 30 segundos
        segundoLembreteRunnable = Runnable {
            tocarBipes()
            mostrarNotificacaoAlerta(isSegundo = true)
        }.also { handler.postDelayed(it, 30_000L) }
    }

    private fun cancelarSegundoLembrete() {
        segundoLembreteRunnable?.let { handler.removeCallbacks(it) }
        segundoLembreteRunnable = null
    }

    private fun tocarBipes() {
        val tone = ToneGenerator(AudioManager.STREAM_ALARM, ToneGenerator.MAX_VOLUME)
        longArrayOf(0L, 650L, 1300L).forEach { delay ->
            handler.postDelayed({ tone.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 450) }, delay)
        }
        handler.postDelayed({ tone.release() }, 2200L)
    }

    private fun mostrarNotificacaoAlerta(isSegundo: Boolean) {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        val abrirApp = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val titulo = if (isSegundo) "Ainda não travou o carro?" else "Trave as portas do carro!"
        val texto = if (isSegundo)
            "Lembrete: você desconectou o Android Auto. As portas foram travadas?"
        else
            "Android Auto desconectado — não esqueça de travar o carro."

        val notif = NotificationCompat.Builder(this, CANAL_ALERTA)
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

        nm.notify(if (isSegundo) NOTIF_ID_ALERTA_2 else NOTIF_ID_ALERTA, notif)
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
            NotificationChannel(CANAL_MONITOR, "Monitor Android Auto", NotificationManager.IMPORTANCE_MIN).apply {
                description = "Notificação discreta que indica que o monitoramento está ativo"
            }
        )

        nm.createNotificationChannel(
            NotificationChannel(CANAL_ALERTA, "Alerta: Trave o Carro", NotificationManager.IMPORTANCE_HIGH).apply {
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
        const val NOTIF_ID_ALERTA_2 = 3
    }
}
