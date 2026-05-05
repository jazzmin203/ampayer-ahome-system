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
import com.example.ampayerapp.data.api.League
import com.example.ampayerapp.data.api.Zone
import com.example.ampayerapp.data.api.RetrofitInstance
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateZoneScreen(token: String, navController: NavHostController) {
    var leagues by remember { mutableStateOf<List<League>>(emptyList()) }
    var zones by remember { mutableStateOf<List<Zone>>(emptyList()) }
    var selectedLeague by remember { mutableStateOf<League?>(null) }
    var expanded by remember { mutableStateOf(false) }
    var zoneName by remember { mutableStateOf("") }
    var editingZone by remember { mutableStateOf<Zone?>(null) }

    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    // --- Cargar datos iniciales ---
    LaunchedEffect(token) {
        try {
            leagues = withContext(Dispatchers.IO) { RetrofitInstance.api.getLeagues("Bearer $token") }
            zones = withContext(Dispatchers.IO) { RetrofitInstance.api.getZones("Bearer $token") }
        } catch (e: Exception) {
            snackbarHostState.showSnackbar("Error al cargar datos: ${e.message}")
        }
    }

    val filteredZones = selectedLeague?.let { league ->
        zones.filter { it.leagueId == league.id }
    } ?: zones




    // --- UI principal ---
    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("\"Gestión de Zonas\"") },
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
                if (selectedLeague == null || zoneName.isBlank()) {
                    scope.launch { snackbarHostState.showSnackbar("Selecciona liga e ingresa nombre") }
                    return@FloatingActionButton
                }

                scope.launch {
                    try {
                        if (editingZone == null) {
                            RetrofitInstance.api.createZone(
                                "Bearer $token",
                                Zone(leagueId = selectedLeague!!.id!!, name = zoneName)
                            )
                            snackbarHostState.showSnackbar("Zona creada correctamente")
                        } else {
                            RetrofitInstance.api.updateZone(
                                "Bearer $token",
                                editingZone!!.id!!,
                                Zone(id = editingZone!!.id, leagueId = selectedLeague!!.id!!, name = zoneName)
                            )
                            snackbarHostState.showSnackbar("Zona actualizada correctamente")
                            editingZone = null
                        }

                        zoneName = ""
                        zones = withContext(Dispatchers.IO) {
                            RetrofitInstance.api.getZones("Bearer $token")
                        }

                    } catch (e: Exception) {
                        snackbarHostState.showSnackbar("Error: ${e.message}")
                    }
                }
            }) {
                Icon(Icons.Default.Add, contentDescription = "Guardar zona")
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
                text = if (editingZone == null) "Nueva Zona" else "Editar Zona",
                style = MaterialTheme.typography.titleLarge
            )

            // --- Selector de liga ---
            ExposedDropdownMenuBox(
                expanded = expanded,
                onExpandedChange = { expanded = !expanded }
            ) {
                OutlinedTextField(
                    value = selectedLeague?.name ?: "",
                    onValueChange = {},
                    label = { Text("Liga") },
                    readOnly = true,
                    modifier = Modifier
                        .menuAnchor()
                        .fillMaxWidth()
                )
                ExposedDropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { expanded = false }
                ) {
                    leagues.forEach { league ->
                        DropdownMenuItem(
                            text = { Text(league.name) },
                            onClick = {
                                selectedLeague = league
                                expanded = false
                            }
                        )
                    }
                }
            }

            // --- Campo de nombre ---
            OutlinedTextField(
                value = zoneName,
                onValueChange = { zoneName = it },
                label = { Text("Nombre de la zona") },
                modifier = Modifier.fillMaxWidth()
            )

            Divider(modifier = Modifier.padding(vertical = 8.dp))

            Text(
                text = "Zonas registradas",
                style = MaterialTheme.typography.titleMedium
            )

            // --- Listado de zonas ---
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(filteredZones) { zone ->
                    ZoneCard(
                        zone = zone,
                        onEdit = {
                            editingZone = zone
                            selectedLeague = leagues.find { it.id == zone.leagueId }
                            zoneName = zone.name
                        },
                        onDelete = {
                            scope.launch {
                                try {
                                    RetrofitInstance.api.deleteZone("Bearer $token", zone.id!!)
                                    snackbarHostState.showSnackbar("Zona eliminada")
                                    zones = withContext(Dispatchers.IO) {
                                        RetrofitInstance.api.getZones("Bearer $token")
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
fun ZoneCard(zone: Zone, onEdit: () -> Unit, onDelete: () -> Unit) {
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
            Text(zone.name, style = MaterialTheme.typography.titleMedium)

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
