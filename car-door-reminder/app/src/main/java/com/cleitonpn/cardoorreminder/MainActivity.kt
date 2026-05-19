package com.cleitonpn.cardoorreminder

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.view.View
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.car.app.connection.CarConnection
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    private lateinit var ivStatus: ImageView
    private lateinit var tvStatus: TextView
    private lateinit var tvInstrucao: TextView
    private lateinit var tvAvisoBateria: TextView
    private lateinit var btnToggle: Button

    private var servicoAtivo = false

    private val pedirPermissaoNotificacao = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { concedida ->
        if (concedida) {
            iniciarServico()
            pedirExclusaoBateriaComDialogo()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        ivStatus = findViewById(R.id.ivStatus)
        tvStatus = findViewById(R.id.tvStatus)
        tvInstrucao = findViewById(R.id.tvInstrucao)
        tvAvisoBateria = findViewById(R.id.tvAvisoBateria)
        btnToggle = findViewById(R.id.btnToggle)

        CarConnection(this).type.observe(this) { tipo ->
            atualizarStatusConexao(tipo)
        }

        btnToggle.setOnClickListener {
            if (servicoAtivo) pararServico() else verificarPermissaoEIniciar()
        }

        tvAvisoBateria.setOnClickListener {
            pedirExclusaoBateriaComDialogo()
        }

        verificarPermissaoEIniciar()
    }

    override fun onResume() {
        super.onResume()
        // Atualiza o aviso toda vez que o usuário volta ao app (ex: após configurar bateria)
        atualizarAvisoBateria()
    }

    private fun verificarPermissaoEIniciar() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED
        ) {
            pedirPermissaoNotificacao.launch(Manifest.permission.POST_NOTIFICATIONS)
        } else {
            iniciarServico()
            pedirExclusaoBateriaComDialogo()
        }
    }

    private fun pedirExclusaoBateriaComDialogo() {
        val pm = getSystemService(PowerManager::class.java)
        if (pm.isIgnoringBatteryOptimizations(packageName)) return

        AlertDialog.Builder(this)
            .setTitle("Rodar em segundo plano")
            .setMessage(
                "Para alertar você mesmo com o app fechado, precisamos desativar a " +
                "otimização de bateria para este app.\n\n" +
                "Na próxima tela, selecione \"Sem restrições\" ou \"Não otimizar\"."
            )
            .setPositiveButton("Configurar agora") { _, _ ->
                abrirConfiguracaoBateria()
            }
            .setNegativeButton("Depois", null)
            .show()
    }

    private fun abrirConfiguracaoBateria() {
        try {
            startActivity(
                Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:$packageName")
                }
            )
        } catch (e: Exception) {
            // Alguns fabricantes bloqueiam essa intent — abre a tela geral
            startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
        }
    }

    private fun atualizarAvisoBateria() {
        val pm = getSystemService(PowerManager::class.java)
        tvAvisoBateria.visibility = if (pm.isIgnoringBatteryOptimizations(packageName)) {
            View.GONE
        } else {
            View.VISIBLE
        }
    }

    private fun iniciarServico() {
        startForegroundService(Intent(this, CarMonitorService::class.java))
        servicoAtivo = true
        atualizarBotao()
    }

    private fun pararServico() {
        stopService(Intent(this, CarMonitorService::class.java))
        servicoAtivo = false
        atualizarBotao()
    }

    private fun atualizarStatusConexao(tipo: Int) {
        when (tipo) {
            CarConnection.CONNECTION_TYPE_PROJECTION -> {
                ivStatus.setColorFilter(ContextCompat.getColor(this, R.color.verde_conectado))
                tvStatus.text = getString(R.string.status_conectado)
                tvInstrucao.text = getString(R.string.instrucao_conectado)
            }
            else -> {
                ivStatus.setColorFilter(ContextCompat.getColor(this, R.color.cinza_desconectado))
                tvStatus.text = getString(R.string.status_desconectado)
                tvInstrucao.text = getString(R.string.instrucao_desconectado)
            }
        }
    }

    private fun atualizarBotao() {
        btnToggle.text = if (servicoAtivo) getString(R.string.btn_desativar) else getString(R.string.btn_ativar)
    }
}
