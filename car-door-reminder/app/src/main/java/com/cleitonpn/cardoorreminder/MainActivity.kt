package com.cleitonpn.cardoorreminder

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.car.app.connection.CarConnection
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    private lateinit var ivStatus: ImageView
    private lateinit var tvStatus: TextView
    private lateinit var tvInstrucao: TextView
    private lateinit var btnToggle: Button

    private var servicoAtivo = false

    private val pedirPermissaoNotificacao = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { concedida ->
        if (concedida) iniciarServico()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        ivStatus = findViewById(R.id.ivStatus)
        tvStatus = findViewById(R.id.tvStatus)
        tvInstrucao = findViewById(R.id.tvInstrucao)
        btnToggle = findViewById(R.id.btnToggle)

        CarConnection(this).type.observe(this) { tipo ->
            atualizarStatusConexao(tipo)
        }

        btnToggle.setOnClickListener {
            if (servicoAtivo) pararServico() else verificarPermissaoEIniciar()
        }

        // Liga o serviço automaticamente ao abrir o app pela primeira vez
        verificarPermissaoEIniciar()
    }

    private fun verificarPermissaoEIniciar() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED
        ) {
            pedirPermissaoNotificacao.launch(Manifest.permission.POST_NOTIFICATIONS)
        } else {
            iniciarServico()
        }
    }

    private fun iniciarServico() {
        val intent = Intent(this, CarMonitorService::class.java)
        startForegroundService(intent)
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
        btnToggle.text = if (servicoAtivo)
            getString(R.string.btn_desativar)
        else
            getString(R.string.btn_ativar)
    }
}
