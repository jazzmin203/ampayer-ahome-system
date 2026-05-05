package com.example.ampayerapp.ui.viewmodel


import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ZoneUiState(
    val isLoading: Boolean = false,
    val zones: List<Zone> = emptyList()
)

data class Zone(
    val id: Int = 0,
    val name: String,
    val description: String? = null
)

class ZoneViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(ZoneUiState())
    val uiState = _uiState.asStateFlow()

    fun createZone(name: String, description: String?) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)

            // Simular creación local (más adelante se conectará a API o DB)
            val newZone = Zone(
                id = (_uiState.value.zones.size + 1),
                name = name,
                description = description
            )

            val updatedList = _uiState.value.zones + newZone
            _uiState.value = ZoneUiState(isLoading = false, zones = updatedList)
        }
    }
}
