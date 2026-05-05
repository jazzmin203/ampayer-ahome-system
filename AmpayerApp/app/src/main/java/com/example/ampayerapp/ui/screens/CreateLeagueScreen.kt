package com.example.ampayerapp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
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
import com.example.ampayerapp.data.api.RetrofitInstance
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateLeagueScreen(token: String, navController: NavHostController) {
    var leagues by remember { mutableStateOf<List<League>>(emptyList()) }
    var leagueName by remember { mutableStateOf("") }
    var leagueDescription by remember { mutableStateOf("") }
    var editingLeague by remember { mutableStateOf<League?>(null) }

    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    // --- Cargar ligas al iniciar ---
    LaunchedEffect(token) {
        loadLeagues(token, onResult = { leagues = it }, onError = {
            scope.launch { snackbarHostState.showSnackbar("Error al cargar ligas: $it") }
        })
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Gestión de Ligas") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Volver")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    if (leagueName.isBlank()) {
                        scope.launch { snackbarHostState.showSnackbar("Ingresa un nombre de liga") }
                        return@FloatingActionButton
                    }

                    scope.launch {
                        try {
                            if (editingLeague == null) {
                                RetrofitInstance.api.createLeague(
                                    "Bearer $token",
                                    League(name = leagueName, description = leagueDescription)
                                )
                                snackbarHostState.showSnackbar("Liga creada correctamente")
                            } else {
                                RetrofitInstance.api.updateLeague(
                                    "Bearer $token",
                                    editingLeague!!.id!!,
                                    League(
                                        id = editingLeague!!.id,
                                        name = leagueName,
                                        description = leagueDescription
                                    )
                                )
                                snackbarHostState.showSnackbar("Liga actualizada correctamente")
                                editingLeague = null
                            }
                            leagueName = ""
                            leagueDescription = ""
                            loadLeagues(token, onResult = { leagues = it })
                        } catch (e: Exception) {
                            snackbarHostState.showSnackbar("Error: ${e.message}")
                        }
                    }
                }
            ) {
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
                text = if (editingLeague == null) "Nueva Liga" else "Editar Liga",
                style = MaterialTheme.typography.titleLarge
            )

            OutlinedTextField(
                value = leagueName,
                onValueChange = { leagueName = it },
                label = { Text("Nombre de la liga") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = leagueDescription,
                onValueChange = { leagueDescription = it },
                label = { Text("Descripción") },
                modifier = Modifier.fillMaxWidth()
            )

            Divider(modifier = Modifier.padding(vertical = 8.dp))

            Text(
                text = "Ligas registradas",
                style = MaterialTheme.typography.titleMedium
            )

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(leagues) { league ->
                    LeagueCard(
                        league = league,
                        onEdit = {
                            editingLeague = league
                            leagueName = league.name
                            leagueDescription = league.description ?: ""
                        },
                        onDelete = {
                            scope.launch {
                                try {
                                    RetrofitInstance.api.deleteLeague(
                                        "Bearer $token",
                                        league.id!!
                                    )
                                    snackbarHostState.showSnackbar("Liga eliminada")
                                    loadLeagues(token, onResult = { leagues = it })
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
fun LeagueCard(league: League, onEdit: () -> Unit, onDelete: () -> Unit) {
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
                Text(league.name, style = MaterialTheme.typography.titleMedium)
                if (!league.description.isNullOrBlank()) {
                    Text(
                        text = league.description!!,
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

suspend fun loadLeagues(
    token: String,
    onResult: (List<League>) -> Unit,
    onError: (String) -> Unit = {}
) {
    try {
        val leagues = withContext(Dispatchers.IO) {
            RetrofitInstance.api.getLeagues("Bearer $token")
        }
        onResult(leagues)
    } catch (e: Exception) {
        onError(e.message ?: "Error desconocido")
    }
}
