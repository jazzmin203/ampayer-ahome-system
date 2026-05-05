package com.example.ampayerapp.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.example.ampayerapp.data.api.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AssignAmpayerScreen(token: String, navController: NavHostController) {

    var leagues by remember { mutableStateOf<List<League>>(emptyList()) }
    var games by remember { mutableStateOf<List<Game>>(emptyList()) }
    var ampayers by remember { mutableStateOf<List<UserDto>>(emptyList()) }

    var selectedLeague by remember { mutableStateOf<League?>(null) }
    var selectedDate by remember { mutableStateOf(LocalDate.now()) }

    val assignedAmpayers = remember { mutableStateMapOf<Int, Pair<UserDto?, UserDto?>>() }

    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    // --- Cargar ligas y ampayers ---
    LaunchedEffect(token) {
        if (token.isNotEmpty()) {
            try {
                leagues = withContext(Dispatchers.IO) {
                    RetrofitInstance.api.getLeagues("Bearer $token")
                }
                ampayers = withContext(Dispatchers.IO) {
                    RetrofitInstance.api.getAmpayers("Bearer $token")
                }
            } catch (e: Exception) {
                snackbarHostState.showSnackbar("Error al cargar datos: ${e.localizedMessage}")
            }
        }
    }

    // --- Cargar juegos según liga y fecha ---
    fun loadGames() {
        scope.launch {
            try {
                if (selectedLeague != null) {
                    games = withContext(Dispatchers.IO) {
                        RetrofitInstance.api.getGamesByLeagueAndDate(
                            "Bearer $token",
                            selectedLeague!!.id!!,
                            selectedDate.toString()
                        ).filter { game ->
                            val confirmedCount = game.assignments_status.count { it.status == "confirmed" }
                            confirmedCount < 2
                        }
                    }
                    // Inicializar assignedAmpayers con los asignados actuales
                    games.forEach { game ->
                        val amp1 = ampayers.find { it.id == game.ampayer1Id }
                        val amp2 = ampayers.find { it.id == game.ampayer2Id }
                        assignedAmpayers[game.id!!] = Pair(amp1, amp2)
                    }
                } else {
                    games = emptyList()
                }
            } catch (e: Exception) {
                snackbarHostState.showSnackbar("Error al cargar juegos: ${e.localizedMessage}")
            }
        }
    }

    // --- Selector de fecha funcional ---
    var showDatePicker by remember { mutableStateOf(false) }
    val selectedDateMillis = remember(selectedDate) {
        selectedDate.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli()
    }

    if (showDatePicker) {
        val datePickerState = rememberDatePickerState(initialSelectedDateMillis = selectedDateMillis)

        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    datePickerState.selectedDateMillis?.let { millis ->
                        val newDate = Instant.ofEpochMilli(millis)
                            .atZone(ZoneId.systemDefault())
                            .toLocalDate()
                        selectedDate = newDate
                        loadGames()
                    }
                    showDatePicker = false
                }) {
                    Text("Aceptar")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) {
                    Text("Cancelar")
                }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }

    // --- UI Principal ---
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Asignar Ampayers") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { innerPadding ->

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(innerPadding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {

            // --- Selector de Liga ---
            var expandedLeague by remember { mutableStateOf(false) }
            ExposedDropdownMenuBox(
                expanded = expandedLeague,
                onExpandedChange = { expandedLeague = !expandedLeague }
            ) {
                OutlinedTextField(
                    value = selectedLeague?.name ?: "Selecciona liga",
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Liga") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor(),
                    trailingIcon = {
                        ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedLeague)
                    },
                    colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors()
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
                                loadGames()
                            }
                        )
                    }
                }
            }

            // --- Selector de fecha ---
            OutlinedTextField(
                value = selectedDate.toString(),
                onValueChange = {},
                label = { Text("Fecha") },
                readOnly = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { showDatePicker = true },
                trailingIcon = {
                    Icon(Icons.Default.DateRange, contentDescription = "Seleccionar fecha")
                }
            )

            // --- Lista de Juegos ---
            if (games.isEmpty()) {
                Text("No hay juegos para esta fecha.", style = MaterialTheme.typography.bodyMedium)
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(games) { game ->
                        AdminGameCard(game, ampayers, assignedAmpayers)
                    }
                }
            }

            // --- Botón enviar ---
            Spacer(modifier = Modifier.height(16.dp))
            FloatingActionButton(
                onClick = {
                    if (games.isEmpty()) {
                        scope.launch {
                            snackbarHostState.showSnackbar("No hay juegos para asignar en esta fecha")
                        }
                        return@FloatingActionButton
                    }

                    if (assignedAmpayers.isEmpty()) {
                        scope.launch {
                            snackbarHostState.showSnackbar("Asigna al menos un ampayer antes de enviar")
                        }
                        return@FloatingActionButton
                    }

                    // Verificar conflictos de horario
                    val conflict = assignedAmpayers.any { entry ->
                        val (amp1, amp2) = entry.value
                        val game = games.find { it.id == entry.key } ?: return@any false
                        val assignedGames = assignedAmpayers.filter { it.key != game.id }
                        assignedGames.any { agEntry ->
                            val (a1, a2) = agEntry.value
                            val g = games.find { it.id == agEntry.key }!!
                            g.time == game.time && (
                                    (amp1 != null && (amp1 == a1 || amp1 == a2)) ||
                                            (amp2 != null && (amp2 == a1 || amp2 == a2))
                                    )
                        }
                    }

                    if (conflict) {
                        scope.launch {
                            snackbarHostState.showSnackbar("Un ampayer ya tiene otro juego a la misma hora")
                        }
                        return@FloatingActionButton
                    }

                    // Enviar asignaciones
                    scope.launch {
                        try {
                            val assignments = assignedAmpayers.map { (gameId, pair) ->
                                AssignmentItem(
                                    gameId = gameId,
                                    ampayer1Id = pair.first?.id,
                                    ampayer2Id = pair.second?.id
                                )
                            }
                            val request = AssignmentsRequest(assignments)
                            RetrofitInstance.api.assignAmpayersBatch(
                                "Bearer $token",
                                request
                            )
                            snackbarHostState.showSnackbar("Programación enviada correctamente")
                        } catch (e: Exception) {
                            snackbarHostState.showSnackbar("Error al enviar: ${e.localizedMessage}")
                        }
                    }
                }
            ) {
                Icon(Icons.Default.Send, contentDescription = "Enviar Programación")
            }
        }
    }
}


@Composable
fun AdminGameCard(
    game: Game,
    ampayers: List<UserDto>,
    assignedMap: MutableMap<Int, Pair<UserDto?, UserDto?>> // ampayer1 y ampayer2 asignados
) {
    val scope = rememberCoroutineScope()
    val gameId = game.id ?: return

    // Obtener asignaciones actuales
    var (amp1, amp2) = assignedMap[gameId] ?: Pair(null, null)

    // Función para obtener estado de un ampayer
    fun getStatus(user: UserDto?): String {
        if (user == null) return "pendiente"
        val status = game.assignments_status.find { it.ampayerId == user.id }?.status
        return status?.lowercase() ?: "pendiente"
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(6.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("Estadio: ${game.stadiumName} - Zona: ${game.zoneName}")
            Text("Hora: ${game.time}")
            Text("Local: ${game.localTeamName} vs Visitante: ${game.visitorTeamName}")

            Spacer(modifier = Modifier.height(8.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                // --- Ampayer 1 ---
                var expanded1 by remember { mutableStateOf(false) }
                val status1 = getStatus(amp1)
                Box {
                    AssistChip(
                        onClick = { if (status1 != "confirmed") expanded1 = true },
                        label = { Text(amp1?.username ?: "Ampayer 1") },
                        leadingIcon = { Icon(Icons.Default.Person, contentDescription = "Ampayer 1") },
                        colors = AssistChipDefaults.assistChipColors(
                            containerColor = when (status1) {
                                "confirmed" -> Color(0xFF4CAF50)
                                "rejected" -> Color(0xFFF44336)
                                else -> Color(0xFFFFC107)
                            }
                        )
                    )
                    DropdownMenu(expanded = expanded1, onDismissRequest = { expanded1 = false }) {
                        ampayers.forEach { amp ->
                            DropdownMenuItem(
                                text = { Text(amp.username) },
                                onClick = {
                                    if (amp != amp2) {
                                        assignedMap[gameId] = Pair(amp, amp2)
                                        expanded1 = false
                                    }
                                }
                            )
                        }
                    }
                }

                // --- Ampayer 2 ---
                var expanded2 by remember { mutableStateOf(false) }
                val status2 = getStatus(amp2)
                Box {
                    AssistChip(
                        onClick = { if (status2 != "confirmed") expanded2 = true },
                        label = { Text(amp2?.username ?: "Ampayer 2") },
                        leadingIcon = { Icon(Icons.Default.Person, contentDescription = "Ampayer 2") },
                        colors = AssistChipDefaults.assistChipColors(
                            containerColor = when (status2) {
                                "confirmed" -> Color(0xFF4CAF50)
                                "rejected" -> Color(0xFFF44336)
                                else -> Color(0xFFFFC107)
                            }
                        )
                    )
                    DropdownMenu(expanded = expanded2, onDismissRequest = { expanded2 = false }) {
                        ampayers.forEach { amp ->
                            if (amp != amp1) {
                                DropdownMenuItem(
                                    text = { Text(amp.username) },
                                    onClick = {
                                        assignedMap[gameId] = Pair(amp1, amp)
                                        expanded2 = false
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
