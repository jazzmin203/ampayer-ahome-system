package com.example.ampayerapp.ui.screens

import FechaHoraSelector
import android.app.DatePickerDialog
import android.app.TimePickerDialog
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.example.ampayerapp.data.api.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter




@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateGameScreen(token: String, navController: NavHostController) {

    var leagues by remember { mutableStateOf<List<League>>(emptyList()) }
    var zones by remember { mutableStateOf<List<Zone>>(emptyList()) }
    var stadiums by remember { mutableStateOf<List<Stadium>>(emptyList()) }
    var teams by remember { mutableStateOf<List<Team>>(emptyList()) }
    var games by remember { mutableStateOf<List<Game>>(emptyList()) }

    var selectedLeague by remember { mutableStateOf<League?>(null) }
    var selectedZone by remember { mutableStateOf<Zone?>(null) }
    var selectedStadium by remember { mutableStateOf<Stadium?>(null) }
    var selectedLocalTeam by remember { mutableStateOf<Team?>(null) }
    var selectedVisitorTeam by remember { mutableStateOf<Team?>(null) }
    var selectedDate by remember { mutableStateOf(LocalDate.now()) }
    var selectedTime by remember { mutableStateOf(LocalTime.now()) }

    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val scrollState = rememberScrollState()
    var filterDate by remember { mutableStateOf(LocalDate.now()) }


    // Función para cargar juegos
    suspend fun loadGames() {
        try {
            games = withContext(Dispatchers.IO) {
                RetrofitInstance.api.getGames("Bearer $token")
            }
        } catch (e: Exception) {
            snackbarHostState.showSnackbar("Error al cargar juegos: ${e.message}")
        }
    }
    suspend fun loadGamesByLeagueAndDate(leagueId: Int, date: LocalDate) {
        try {
            games = withContext(Dispatchers.IO) {
                RetrofitInstance.api.getGamesByLeagueAndDate(
                    "Bearer $token",
                    leagueId,
                    date.toString()
                )
            }
        } catch (e: Exception) {
            snackbarHostState.showSnackbar("Error al cargar juegos: ${e.message}")
        }
    }

    // Cargar datos iniciales
    LaunchedEffect(token) {
        try {
            leagues = withContext(Dispatchers.IO) { RetrofitInstance.api.getLeagues("Bearer $token") }
            teams = withContext(Dispatchers.IO) { RetrofitInstance.api.getTeams("Bearer $token") }
            // ❌ Quitar esta línea para no cargar juegos automáticamente
            // scope.launch { loadGames() }
        } catch (e: Exception) {
            snackbarHostState.showSnackbar("Error al cargar datos: ${e.message}")
        }
    }

    // Cargar zonas y estadios según liga
    LaunchedEffect(selectedLeague) {
        if (selectedLeague != null) {
            try {
                zones = withContext(Dispatchers.IO) { RetrofitInstance.api.getZones("Bearer $token") }
                stadiums = withContext(Dispatchers.IO) { RetrofitInstance.api.getStadiums("Bearer $token") }

                // Cargar los juegos del día actual para esa liga
                loadGamesByLeagueAndDate(selectedLeague!!.id!!, LocalDate.now())
                filterDate = LocalDate.now() // actualizamos el filtro también
            } catch (e: Exception) {
                snackbarHostState.showSnackbar("Error al cargar zonas/estadios: ${e.message}")
            }
        } else {
            games = emptyList() // si cambia a null, limpiamos la lista
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Crear y Ver Juegos") },
                navigationIcon = {
                    IconButton(onClick = { navController.navigate(AppDestinations.ADMIN_MENU) }) {
                        Icon(
                            imageVector = Icons.Filled.ArrowBack,
                            contentDescription = "Regresar"
                        )
                    }
                },
                actions = {
                    IconButton(onClick = {
                        if (selectedLeague != null) {
                            scope.launch { loadGamesByLeagueAndDate(selectedLeague!!.id!!, filterDate) }
                        } else {
                            scope.launch { snackbarHostState.showSnackbar("Selecciona una liga primero") }
                        }
                    }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Actualizar")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            FloatingActionButton(onClick = {
                // Validación
                if (selectedLeague == null || selectedZone == null || selectedStadium == null ||
                    selectedLocalTeam == null || selectedVisitorTeam == null
                ) {
                    scope.launch { snackbarHostState.showSnackbar("Todos los campos son obligatorios") }
                    return@FloatingActionButton
                }
                if (selectedLocalTeam == selectedVisitorTeam) {
                    scope.launch { snackbarHostState.showSnackbar("El equipo local y visitante no pueden ser el mismo") }
                    return@FloatingActionButton
                }

                // Crear juego
                scope.launch {
                    try {
                        val newGame = Game(
                            id = 0,
                            leagueId = selectedLeague!!.id!!,
                            leagueName = selectedLeague!!.name,
                            zoneId = selectedZone!!.id!!,
                            zoneName = selectedZone!!.name,
                            stadiumId = selectedStadium!!.id!!,
                            stadiumName = selectedStadium!!.name,
                            localTeamId = selectedLocalTeam!!.id!!,
                            localTeamName = selectedLocalTeam!!.name,
                            visitorTeamId = selectedVisitorTeam!!.id!!,
                            visitorTeamName = selectedVisitorTeam!!.name,
                            ampayer1Id = null,
                            ampayer1Name = null,
                            ampayer2Id = null,
                            ampayer2Name = null,
                            date = selectedDate.toString(),
                            time = selectedTime.toString(),
                            status = "pending",
                            umpireStatus = null,
                            assignments_status = emptyList()
                        )
                        RetrofitInstance.api.createGame("Bearer $token", newGame)
                        snackbarHostState.showSnackbar("Juego creado correctamente")
                        loadGamesByLeagueAndDate(selectedLeague!!.id!!, filterDate)
                        // Limpiar formulario
                        selectedZone = null
                        selectedStadium = null
                        selectedLocalTeam = null
                        selectedVisitorTeam = null
                        selectedDate = LocalDate.now()
                        selectedTime = LocalTime.now()
                    } catch (e: Exception) {
                        snackbarHostState.showSnackbar("Error al crear juego: ${e.message}")
                    }
                }
            }) {
                Icon(Icons.Default.Add, contentDescription = "Crear Juego")
            }
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .padding(padding)
                    .padding(16.dp)
                    .fillMaxSize()
                    .verticalScroll(scrollState),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {

                // FORMULARIO
                DropdownSelector(
                    label = "Liga",
                    items = leagues,
                    selected = selectedLeague,
                    onSelected = { selectedLeague = it },
                    itemLabel = { it.name }
                )

                DropdownSelector(
                    label = "Zona",
                    items = zones.filter { it.leagueId == selectedLeague?.id },
                    selected = selectedZone,
                    onSelected = { selectedZone = it },
                    itemLabel = { it.name }
                )

                DropdownSelector(
                    label = "Estadio",
                    items = stadiums.filter { it.zoneId == selectedZone?.id },
                    selected = selectedStadium,
                    onSelected = { selectedStadium = it },
                    itemLabel = { it.name }
                )

                DropdownSelector(
                    label = "Equipo Local",
                    items = teams.filter { it.leagueId == selectedLeague?.id && it != selectedVisitorTeam },
                    selected = selectedLocalTeam,
                    onSelected = { selectedLocalTeam = it },
                    itemLabel = { it.name }
                )

                DropdownSelector(
                    label = "Equipo Visitante",
                    items = teams.filter { it.leagueId == selectedLeague?.id && it != selectedLocalTeam },
                    selected = selectedVisitorTeam,
                    onSelected = { selectedVisitorTeam = it },
                    itemLabel = { it.name }
                )


                FechaHoraSelector(
                    selectedDate = selectedDate,
                    onDateChange = { selectedDate = it },
                    selectedTime = selectedTime,
                    onTimeChange = { selectedTime = it }
                )


                Divider(thickness = 2.dp)
                Text("📋 Juegos registrados", style = MaterialTheme.typography.titleMedium)

                var showFilterDatePicker by remember { mutableStateOf(false) }

                OutlinedButton(
                    onClick = { showFilterDatePicker = true },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("📅 Filtrar por fecha: ${filterDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))}")
                }

                if (showFilterDatePicker) {
                    val datePickerState = rememberDatePickerState(
                        initialSelectedDateMillis = filterDate
                            .atStartOfDay(ZoneId.systemDefault())
                            .toInstant()
                            .toEpochMilli()
                    )

                    DatePickerDialog(
                        onDismissRequest = { showFilterDatePicker = false },
                        confirmButton = {
                            TextButton(onClick = {
                                datePickerState.selectedDateMillis?.let {
                                    val selected = java.time.Instant.ofEpochMilli(it)
                                        .atZone(ZoneId.systemDefault())
                                        .toLocalDate()
                                    filterDate = selected
                                    if (selectedLeague != null) {
                                        scope.launch {
                                            loadGamesByLeagueAndDate(selectedLeague!!.id!!, filterDate)
                                        }
                                    }
                                }
                                showFilterDatePicker = false
                            }) {
                                Text("Aceptar")
                            }
                        },
                        dismissButton = {
                            TextButton(onClick = { showFilterDatePicker = false }) { Text("Cancelar") }
                        }
                    ) {
                        DatePicker(state = datePickerState)
                    }
                }

                if (games.isEmpty()) {
                    Text(
                        "No hay juegos programados para esta fecha.",
                        style = MaterialTheme.typography.bodyMedium
                    )
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 400.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        items(games) { game ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                elevation = CardDefaults.cardElevation(4.dp)
                            ) {
                                Column(Modifier.padding(12.dp)) {
                                    Text(
                                        "${game.localTeamName} vs ${game.visitorTeamName}",
                                        style = MaterialTheme.typography.titleMedium
                                    )
                                    Text("Liga: ${game.leagueName} | Zona: ${game.zoneName}")
                                    Text("Estadio: ${game.stadiumName}")
                                    Text("Fecha: ${game.date}  Hora: ${game.time}")

                                    Row(
                                        horizontalArrangement = Arrangement.End,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        IconButton(onClick = {
                                            scope.launch {
                                                try {
                                                    RetrofitInstance.api.deleteGame(
                                                        "Bearer $token",
                                                        game.id!!
                                                    )
                                                    snackbarHostState.showSnackbar("Juego eliminado")
                                                    loadGamesByLeagueAndDate(
                                                        selectedLeague!!.id!!,
                                                        filterDate
                                                    )
                                                } catch (e: Exception) {
                                                    snackbarHostState.showSnackbar("Error al eliminar: ${e.message}")
                                                }
                                            }
                                        }) {
                                            Icon(
                                                Icons.Default.Delete,
                                                contentDescription = "Eliminar"
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
