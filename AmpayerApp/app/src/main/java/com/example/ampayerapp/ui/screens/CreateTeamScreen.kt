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
import com.example.ampayerapp.data.api.RetrofitInstance
import com.example.ampayerapp.data.api.Team
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateTeamScreen(token: String, navController: NavHostController) {
    var leagues by remember { mutableStateOf<List<League>>(emptyList()) }
    var teams by remember { mutableStateOf<List<Team>>(emptyList()) }

    var selectedLeague by remember { mutableStateOf<League?>(null) }
    var teamName by remember { mutableStateOf("") }
    var teamShortName by remember { mutableStateOf("") }
    var editingTeam by remember { mutableStateOf<Team?>(null) }
    var expandedLeague by remember { mutableStateOf(false) }

    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    // --- Cargar ligas y equipos ---
    LaunchedEffect(token) {
        try {
            leagues = withContext(Dispatchers.IO) { RetrofitInstance.api.getLeagues("Bearer $token") }
            teams = withContext(Dispatchers.IO) { RetrofitInstance.api.getTeams("Bearer $token") }
        } catch (e: Exception) {
            snackbarHostState.showSnackbar("Error al cargar datos: ${e.message}")
        }
    }

    val filteredTeams = selectedLeague?.let { league ->
        teams.filter { it.leagueId == league.id }
    } ?: teams
    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Gestión de Equipos") },
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
                if (selectedLeague == null || teamName.isBlank() || teamShortName.isBlank()) {
                    scope.launch { snackbarHostState.showSnackbar("Selecciona liga e ingresa todos los datos") }
                    return@FloatingActionButton
                }

                scope.launch {
                    try {
                        if (editingTeam == null) {
                            RetrofitInstance.api.createTeam(
                                "Bearer $token",
                                Team(
                                    leagueId = selectedLeague!!.id!!,
                                    name = teamName,
                                    shortName = teamShortName,
                                    id = null
                                )
                            )
                            snackbarHostState.showSnackbar("Equipo creado correctamente")
                        } else {
                            RetrofitInstance.api.updateTeam(
                                "Bearer $token",
                                editingTeam!!.id!!,
                                Team(
                                    id = editingTeam!!.id,
                                    leagueId = selectedLeague!!.id!!,
                                    name = teamName,
                                    shortName = teamShortName
                                )
                            )
                            snackbarHostState.showSnackbar("Equipo actualizado correctamente")
                            editingTeam = null
                        }

                        teamName = ""
                        teamShortName = ""
                        teams = withContext(Dispatchers.IO) {
                            RetrofitInstance.api.getTeams("Bearer $token")
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
                text = if (editingTeam == null) "Nuevo Equipo" else "Editar Equipo",
                style = MaterialTheme.typography.titleLarge
            )

            // Selector de liga
            ExposedDropdownMenuBox(
                expanded = expandedLeague,
                onExpandedChange = { expandedLeague = !expandedLeague }
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
                    expanded = expandedLeague,
                    onDismissRequest = { expandedLeague = false }
                ) {
                    leagues.forEach { league ->
                        DropdownMenuItem(
                            text = { Text(league.name) },
                            onClick = {
                                selectedLeague = league
                                expandedLeague = false
                            }
                        )
                    }
                }
            }

            OutlinedTextField(
                value = teamName,
                onValueChange = { teamName = it },
                label = { Text("Nombre del equipo") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = teamShortName,
                onValueChange = { teamShortName = it },
                label = { Text("Abreviatura") },
                modifier = Modifier.fillMaxWidth()
            )

            Divider(modifier = Modifier.padding(vertical = 8.dp))

            Text(
                text = "Equipos registrados",
                style = MaterialTheme.typography.titleMedium
            )

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(filteredTeams) { team ->
                    TeamCard(
                        team = team,
                        onEdit = {
                            editingTeam = team
                            selectedLeague = leagues.find { it.id == team.leagueId }
                            teamName = team.name
                            teamShortName = team.shortName ?: ""
                        },
                        onDelete = {
                            scope.launch {
                                try {
                                    RetrofitInstance.api.deleteTeam(
                                        "Bearer $token",
                                        team.id!!
                                    )
                                    snackbarHostState.showSnackbar("Equipo eliminado")
                                    teams = withContext(Dispatchers.IO) {
                                        RetrofitInstance.api.getTeams("Bearer $token")
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
fun TeamCard(team: Team, onEdit: () -> Unit, onDelete: () -> Unit) {
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
                Text(team.name, style = MaterialTheme.typography.titleMedium)
                if (!team.shortName.isNullOrBlank()) {
                    Text(
                        text = team.shortName!!,
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
