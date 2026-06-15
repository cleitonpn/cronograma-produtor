package com.cleitonpn.cardoorreminder

import android.Manifest
import android.bluetooth.BluetoothManager
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.view.View
import android.widget.Button
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.preference.PreferenceManager

class MainActivity : AppCompatActivity() {

    private lateinit var tvCarroSelecionado: TextView
    private lateinit var btnSelecionarCarro: Button
    private lateinit var tvStatus: TextView
    private lateinit var tvAvisoBateria: TextView
    private lateinit var tvAvisoPermissao: TextView

    private val pedirPermissaoBluetooth = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { concedida ->
        if (concedida) abrirSeletorDispositivos()
        else tvAvisoPermissao.visibility = View.VISIBLE
    }

    private val pedirPermissaoNotificacao = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { _ -> /* a notificação é o ponto central — segue mesmo se negar */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        tvCarroSelecionado = findViewById(R.id.tvCarroSelecionado)
        btnSelecionarCarro = findViewById(R.id.btnSelecionarCarro)
        tvStatus = findViewById(R.id.tvStatus)
        tvAvisoBateria = findViewById(R.id.tvAvisoBateria)
        tvAvisoPermissao = findViewById(R.id.tvAvisoPermissao)

        btnSelecionarCarro.setOnClickListener { verificarPermissaoEAbrirSeletor() }
        tvAvisoBateria.setOnClickListener { abrirConfiguracaoBateria() }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED
        ) {
            pedirPermissaoNotificacao.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    override fun onResume() {
        super.onResume()
        atualizarUi()
    }

    private fun atualizarUi() {
        val prefs = PreferenceManager.getDefaultSharedPreferences(this)
        val nomeCarro = prefs.getString(BluetoothReceiver.KEY_CAR_NAME, null)

        if (nomeCarro != null) {
            tvCarroSelecionado.text = "Carro: $nomeCarro"
            tvStatus.text = "Monitoramento ativo — você será avisado quando o Bluetooth do carro desconectar."
        } else {
            tvCarroSelecionado.text = "Nenhum carro selecionado"
            tvStatus.text = "Selecione o dispositivo Bluetooth do seu carro para ativar o monitoramento."
        }

        val temPermissaoBt = Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
                ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED
        tvAvisoPermissao.visibility = if (temPermissaoBt) View.GONE else View.VISIBLE

        val pm = getSystemService(PowerManager::class.java)
        tvAvisoBateria.visibility = if (pm.isIgnoringBatteryOptimizations(packageName)) View.GONE else View.VISIBLE
    }

    private fun verificarPermissaoEAbrirSeletor() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT)
            != PackageManager.PERMISSION_GRANTED
        ) {
            pedirPermissaoBluetooth.launch(Manifest.permission.BLUETOOTH_CONNECT)
        } else {
            abrirSeletorDispositivos()
        }
    }

    private fun abrirSeletorDispositivos() {
        val bluetoothManager = getSystemService(BluetoothManager::class.java)
        val dispositivos = bluetoothManager.adapter?.bondedDevices?.toList() ?: emptyList()

        if (dispositivos.isEmpty()) {
            AlertDialog.Builder(this)
                .setTitle("Nenhum dispositivo pareado")
                .setMessage("Pareie o Bluetooth do seu carro com o celular primeiro, depois volte aqui para selecioná-lo.")
                .setPositiveButton("Ok", null)
                .show()
            return
        }

        val nomes = dispositivos.map { it.name ?: it.address }.toTypedArray()

        AlertDialog.Builder(this)
            .setTitle("Selecione o Bluetooth do carro")
            .setItems(nomes) { _, index ->
                val dispositivo = dispositivos[index]
                PreferenceManager.getDefaultSharedPreferences(this).edit()
                    .putString(BluetoothReceiver.KEY_CAR_ADDRESS, dispositivo.address)
                    .putString(BluetoothReceiver.KEY_CAR_NAME, dispositivo.name ?: dispositivo.address)
                    .apply()

                // Pede exclusão de bateria logo após selecionar o carro
                pedirExclusaoBateriaSeNecessario()
                atualizarUi()
            }
            .show()
    }

    private fun pedirExclusaoBateriaSeNecessario() {
        val pm = getSystemService(PowerManager::class.java)
        if (pm.isIgnoringBatteryOptimizations(packageName)) return

        AlertDialog.Builder(this)
            .setTitle("Última etapa: segundo plano")
            .setMessage(
                "Para alertar você mesmo com o app fechado, desative a otimização de bateria para este app.\n\n" +
                "Na próxima tela selecione \"Sem restrições\" ou \"Não otimizar\"."
            )
            .setPositiveButton("Configurar agora") { _, _ -> abrirConfiguracaoBateria() }
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
            startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
        }
    }
}
