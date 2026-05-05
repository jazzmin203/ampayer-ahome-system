package com.example.ampayerapp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.example.ampayerapp.data.api.Stadium
import com.example.ampayerapp.data.api.Zone
import com.example.ampayerapp.data.api.RetrofitInstance
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateStadiumScreen(token: String, navController: NavHostController) {
    var zones by remember { mutableStateOf<List<Zone>>(emptyList()) }
    var stadiums by remember { mutableStateOf<List<Stadium>>(emptyList()) }
    var selectedZone by remember { mutableStateOf<Zone?>(null) }
    var expanded by remember { mutableStateOf(false) }
    var stadiumName by remember { mutableStateOf("") }
    var stadiumAddress by remember { mutableStateOf("") }
    var editingStadium by remember { mutableStateOf<Stadium?>(null) }

    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    // --- Cargar zonas y estadios ---
    LaunchedEffect(token) {
        try {
            zones = withContext(Dispatchers.IO) { RetrofitInstance.api.getZones("Bearer $token") }
            stadiums = withContext(Dispatchers.IO) { RetrofitInstance.api.getStadiums("Bearer $token") }
        } catch (e: Exception) {
            snackbarHostState.showSnackbar("Error al cargar datos: ${e.message}")
        }
    }

    val filteredStadiums = selectedZone?.let { zone ->
        stadiums.filter { it.zoneId == zone.id }
    } ?: stadiums
    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Gestión de Estadios") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Volver")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            FloatingActionButton(onClick = {
                if (selectedZone == null || stadiumName.isBlank()) {
                    scope.launch { snackbarHostState.showSnackbar("Selecciona una zona e ingresa nombre") }
                    return@FloatingActionButton
                }

                scope.launch {
                    try {
                        if (editingStadium == null) {
                            RetrofitInstance.api.createStadium(
                                "Bearer $token",
                                Stadium(
                                    zoneId = selectedZone!!.id!!,
                                    name = stadiumName,
                                    address = stadiumAddress
                                )
                            )
                            snackbarHostState.showSnackbar("Estadio creado correctamente")
                        } else {
                            RetrofitInstance.api.updateStadium(
                                "Bearer $token",
                                editingStadium!!.id!!,
                                Stadium(
                                    id = editingStadium!!.id,
                                    zoneId = selectedZone!!.id!!,
                                    name = stadiumName,
                                    address = stadiumAddress
                                )
                            )
                            snackbarHostState.showSnackbar("Estadio actualizado correctamente")
                            editingStadium = null
                        }

                        stadiumName = ""
                        stadiumAddress = ""
                        stadiums = withContext(Dispatchers.IO) {
                            RetrofitInstance.api.getStadiums("Bearer $token")
                        }

                    } catch (e: Exception) {
                        snackbarHostState.showSnackbar("Error: ${e.message}")
                    }
                }
            }) {
                Icon(Icons.Default.Add, contentDescription = "Guardar")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(16.dp)
                .fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = if (editingStadium == null) "Nuevo Estadio" else "Editar Estadio",
                style = MaterialTheme.typography.titleLarge
            )

            // Selector de zona
            ExposedDropdownMenuBox(
                expanded = expanded,
                onExpandedChange = { expanded = !expanded }
            ) {
                OutlinedTextField(
                    value = selectedZone?.name ?: "",
                    onValueChange = {},
                    label = { Text("Zona") },
                    readOnly = true,
                    modifier = Modifier
                        .menuAnchor()
                        .fillMaxWidth()
                )
                ExposedDropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { expanded = false }
                ) {
                    zones.forEach { zone ->
                        DropdownMenuItem(
                            text = { Text(zone.name) },
                            onClick = {
                                selectedZone = zone
                                expanded = false
                            }
                        )
                    }
                }
            }

            OutlinedTextField(
                value = stadiumName,
                onValueChange = { stadiumName = it },
                label = { Text("Nombre del estadio") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = stadiumAddress,
                onValueChange = { stadiumAddress = it },
                label = { Text("Dirección") },
                modifier = Modifier.fillMaxWidth()
            )

            Divider(modifier = Modifier.padding(vertical = 8.dp))

            Text(
                text = "Estadios registrados",
                style = MaterialTheme.typography.titleMedium
            )

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(filteredStadiums) { stadium ->
                    StadiumCard(
                        stadium = stadium,
                        onEdit = {
                            editingStadium = stadium
                            selectedZone = zones.find { it.id == stadium.zoneId }
                            stadiumName = stadium.name
                            stadiumAddress = stadium.address ?: ""
                        },
                        onDelete = {
                            scope.launch {
                                try {
                                    RetrofitInstance.api.deleteStadium(
                                        "Bearer $token",
                                        stadium.id!!
                                    )
                                    snackbarHostState.showSnackbar("Estadio eliminado")
                                    stadiums = withContext(Dispatchers.IO) {
                                        RetrofitInstance.api.getStadiums("Bearer $token")
                                    }
                                } catch (e: Exception) {
                                    snackbarHostState.showSnackbar("Error al eliminar: ${e.message}")
                                }
                            }
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun StadiumCard(stadium: Stadium, onEdit: () -> Unit, onDelete: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(2.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(stadium.name, style = MaterialTheme.typography.titleMedium)
                if (!stadium.address.isNullOrBlank()) {
                    Text(
                        text = stadium.address!!,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Row {
                IconButton(onClick = onEdit) {
                    Icon(Icons.Default.Edit, contentDescription = "Editar")
                }
                IconButton(onClick = onDelete) {
                    Icon(Icons.Default.Delete, contentDescription = "Eliminar")
                }
            }
        }
    }
}
